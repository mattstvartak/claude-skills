#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { openStage } from './lib/stage.mjs'
import { isMain, parseCli } from './lib/cli.mjs'
import { requireValidScene } from './validate.mjs'

export const stillName = (scene, theme, t) => `${scene.id}-${theme}-${t}.png`

async function main() {
  const { values, positionals } = parseCli(
    '<scene.json> --times 0,2.5,posterAt,storyboard --out <dir> [--theme light|dark|both] [--width N] [--scale 2]',
    {
      min: 1,
      required: ['times', 'out'],
      options: {
        times: { type: 'string' },
        out: { type: 'string' },
        theme: { type: 'string', default: 'light' },
        width: { type: 'string' },
        scale: { type: 'string', default: '2' },
      },
      enums: { theme: ['light', 'dark', 'both'] },
      numeric: ['width', 'scale'],
    },
  )
  const [scenePath] = positionals

  requireValidScene(scenePath)
  const scene = JSON.parse(readFileSync(scenePath, 'utf8'))
  const resolveTime = (k) => {
    if (k === 'posterAt') return [scene.posterAt ?? 0]
    if (k === 'storyboard') return scene.storyboard?.times ?? []
    const n = Number(k)
    if (!Number.isFinite(n)) throw new Error(`bad time "${k}"`)
    return [n]
  }
  const times = values.times
    .split(',')
    .map((s) => s.trim())
    .flatMap(resolveTime)
  const themes = values.theme === 'both' ? ['light', 'dark'] : [values.theme]

  const width = values.width ? Number(values.width) : undefined
  const out = resolve(values.out)
  mkdirSync(out, { recursive: true })
  const stage = await openStage(scenePath, { width, scale: Number(values.scale), theme: themes[0] })
  try {
    for (const theme of themes) {
      if (theme !== themes[0]) await stage.mount({ width, theme })
      for (const t of times) {
        const file = join(out, stillName(scene, theme, t))
        writeFileSync(file, await stage.shot(t))
        console.log(file)
      }
    }
  } finally {
    await stage.close()
  }
}

if (isMain(import.meta.url)) await main()
