import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { PHONE_BELOW } from '../../runtime/camera.js'
import { kitDir, openStage } from './stage.mjs'

export const MIN_TEXT_PX = 10
const EDGE = 1
const STEP = 0.25

export function defaultWidths(scene) {
  const [full] = scene.fit.size
  const min = scene.fit.minWidth ?? full
  const below = scene.cameras?.phone?.below ?? PHONE_BELOW
  const all = [min, full, below - 1, below + 1].filter((w) => w >= min && w <= full)
  return [...new Set(all)].sort((a, b) => a - b)
}

// times where the camera holds a framing: each key time, plus steps across a key-to-key hold
function holds(keys, scene) {
  const out = new Map()
  const add = (name, t) => out.set(name, [...(out.get(name) ?? []), t])
  keys.forEach(([t, name], i) => {
    if (scene.cameras.framings?.[name]?.establishing) return
    add(name, t)
    const next = keys[i + 1]
    if (next && next[1] === name && next[0] > t) {
      for (let s = t + STEP; s < next[0]; s += STEP) add(name, s)
      add(name, next[0])
    }
  })
  return out
}

// runs in the page: base text size in the focus, camera zoom and callout boxes.
// Falls back to the whole kit when the focus holds no visible text.
function probe({ focus }) {
  const sr = document.getElementById('subject').shadowRoot
  const content = sr.querySelector('.rf-content')
  const roots = focus ? focus.map((s) => content.querySelector(s)).filter(Boolean) : []
  const counts = new Map()
  const tally = (scope) => {
    for (const el of content.querySelectorAll('*')) {
      if (!scope.some((r) => r.contains(el))) continue
      if (!el.getClientRects().length) continue
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
      const px = parseFloat(cs.fontSize)
      counts.set(px, (counts.get(px) ?? 0) + 1)
    }
  }
  if (roots.length) tally(roots)
  if (!counts.size) tally([content])
  let base = null
  for (const [px, n] of counts) {
    if (base === null || n > counts.get(base) || (n === counts.get(base) && px < base)) base = px
  }
  const zoom = Number(/scale\(([-\d.e]+)\)/.exec(sr.querySelector('.rf-world').style.transform)[1])
  const box = (r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom })
  return {
    base,
    zoom,
    stage: box(sr.querySelector('.rf-stage').getBoundingClientRect()),
    callouts: [...sr.querySelectorAll('.rf-callout')]
      .filter((c) => parseFloat(c.style.opacity) > 0.01)
      .map((c) => box(c.getBoundingClientRect())),
  }
}

const inside = (b, s) => b.l >= s.l - EDGE && b.t >= s.t - EDGE && b.r <= s.r + EDGE && b.b <= s.b + EDGE

export async function fitCheck(scenePath, widths) {
  const scene = JSON.parse(await readFile(resolve(scenePath), 'utf8'))
  const list = widths ?? defaultWidths(scene)
  const kitFile = join(kitDir(scenePath, scene.kit), 'kit.json')
  const kitJson = await readFile(kitFile, 'utf8').then(JSON.parse, () => ({}))
  const below = scene.cameras?.phone?.below ?? PHONE_BELOW
  const [full] = scene.fit.size
  const stage = await openStage(scenePath, { width: list[0] })
  const results = []
  try {
    for (const width of list) {
      await stage.mount({ width })
      const track = scene.cameras.phone && width < below ? 'phone' : 'default'
      const scale = width / full
      for (const [framing, times] of holds(scene.cameras[track].keys, scene)) {
        const names = (scene.cameras.framings[framing].focus ?? []).map((f) => (typeof f === 'string' ? f : f.at))
        const focus = names.includes('@frame') ? null : names.map((n) => scene.targets?.[n]).filter(Boolean)
        let seen = null
        let calloutsInside = true
        for (const t of times) {
          await stage.seek(t)
          const p = await stage.page.evaluate(probe, { focus })
          seen ??= p
          if (!p.callouts.every((b) => inside(b, p.stage))) calloutsInside = false
        }
        const base = kitJson.baseText ?? seen.base
        const textPx = base * seen.zoom * scale
        results.push({
          width,
          framing,
          track,
          base,
          zoom: seen.zoom,
          textPx,
          zoomToPass: MIN_TEXT_PX / (base * scale),
          calloutsInside,
          ok: textPx >= MIN_TEXT_PX && calloutsInside,
        })
      }
    }
  } finally {
    await stage.close()
  }
  return { ok: results.every((r) => r.ok), results }
}
