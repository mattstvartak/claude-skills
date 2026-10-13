#!/usr/bin/env node
import { fitCheck, MIN_TEXT_PX } from './lib/fitcheck.mjs'
import { isMain, parseCli } from './lib/cli.mjs'
import { requireValidScene } from './validate.mjs'

if (isMain(import.meta.url)) {
  const { positionals } = parseCli('<scene.json> [width ...]', {
    min: 1,
    max: Infinity,
    check: (_, [, ...widths]) => widths.find((w) => !(Number(w) > 0)) && 'widths are positive numbers, in px',
  })
  const [scenePath, ...widths] = positionals
  requireValidScene(scenePath)
  const { ok, results } = await fitCheck(scenePath, widths.length ? widths.map(Number) : undefined)
  if (!results.length) console.log('nothing to check: no framing in this scene holds the camera')
  for (const r of results) {
    const note = []
    if (r.textPx < MIN_TEXT_PX)
      note.push(`text ${r.textPx.toFixed(1)}px, needs zoom ${r.zoomToPass.toFixed(2)} (has ${r.zoom.toFixed(2)})`)
    if (!r.calloutsInside) note.push('callout outside the stage')
    console.log(
      `${r.ok ? 'ok  ' : 'FAIL'} ${String(r.width).padStart(5)}px ${r.track.padEnd(7)} ${r.framing.padEnd(12)} ${r.textPx.toFixed(1)}px${note.length ? '  ' + note.join('; ') : ''}`,
    )
  }
  process.exit(ok ? 0 : 1)
}
