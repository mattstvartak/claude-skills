#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { isMain, parseCli } from './lib/cli.mjs'
import { openStage } from './lib/stage.mjs'
import { requireValidScene } from './validate.mjs'
import { encodeStream, FORMATS, FPS } from './lib/encode.mjs'
import { loopSeam, typicalDelta } from './lib/loopcheck.mjs'

const even = (n) => Math.floor(n / 2) * 2
const SAMPLE_PAIRS = 30

export async function render(scenePath, { out, formats = FORMATS, theme = 'light', scale = 2 } = {}) {
  if (!out) throw new Error('render needs an out dir')
  const started = Date.now()
  const outDir = resolve(out)
  mkdirSync(outDir, { recursive: true })
  const stage = await openStage(scenePath, { theme, scale })
  try {
    const { scene } = stage
    const loop = !!scene.loop
    const count = Math.round(scene.duration * FPS) + (loop ? 0 : 1)
    const posterFrame = Math.min(count - 1, Math.round((scene.posterAt ?? 0) * FPS))
    // ~30 evenly spaced consecutive pairs across the render give the typical frame-to-frame change
    const starts = new Set(
      Array.from({ length: Math.min(SAMPLE_PAIRS, count - 1) }, (_, k) =>
        Math.floor((k * (count - 2)) / Math.max(1, SAMPLE_PAIRS - 1)),
      ),
    )
    const keep = new Map()
    let size

    async function* frames() {
      for (let n = 0; n < count; n++) {
        const png = await stage.shot(n / FPS)
        if (n === 0) size = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
        if (loop && (n === 0 || n === count - 1 || starts.has(n) || starts.has(n - 1))) keep.set(n, png)
        if ((n + 1) % FPS === 0) console.error(`reel: frame ${n + 1}/${count}`)
        yield png
      }
    }

    const files = await encodeStream(frames(), outDir, formats, { posterFrame })

    let seam = null
    // a poster-only render stops reading frames early, so there is nothing to compare
    if (loop && count >= 2 && keep.has(count - 1)) {
      const pairs = [...starts].filter((n) => n + 1 < count).map((n) => [keep.get(n), keep.get(n + 1)])
      const typical = typicalDelta(pairs)
      seam = loopSeam(keep.get(count - 1), keep.get(0), typical)
    }

    const report = {
      scene: scene.id,
      theme,
      fps: FPS,
      scale,
      frames: count,
      duration: scene.duration,
      loop,
      posterFrame,
      cssSize: scene.fit.size,
      pixelSize: [even(size.width), even(size.height)],
      formats,
      files,
      seam,
      elapsedMs: Date.now() - started,
    }
    return report
  } finally {
    await stage.close()
  }
}

if (isMain(import.meta.url)) {
  const { values, positionals } = parseCli(
    '<scene.json> --out <dir> [--formats mp4,webm,gif,poster,scrub] [--theme light|dark] [--scale 2]',
    {
      min: 1,
      required: ['out'],
      options: {
        out: { type: 'string' },
        formats: { type: 'string', default: FORMATS.join(',') },
        theme: { type: 'string', default: 'light' },
        scale: { type: 'string', default: '2' },
      },
      enums: { formats: FORMATS, theme: ['light', 'dark'] },
      numeric: ['scale'],
    },
  )
  const [scenePath] = positionals
  requireValidScene(scenePath)
  const report = await render(scenePath, {
    out: values.out,
    formats: values.formats.split(',').map((s) => s.trim()),
    theme: values.theme,
    scale: Number(values.scale),
  })
  writeFileSync(join(resolve(values.out), 'render-report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
  if (report.seam && !report.seam.ok) {
    console.error(`reel: ${report.seam.message}`)
    process.exit(1)
  }
}
