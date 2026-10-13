import { ease, cursorAt, prepareCursor, clamp, span, keyIndex, loops } from './motion.js'
import { cameraAt, resolveCameras } from './camera.js'

const isNum = (v) => typeof v === 'number'
const isNums = (v) => Array.isArray(v) && v.every(isNum)
const sameNums = (a, b) => isNums(a) && isNums(b) && a.length === b.length

function rectOf(rects, name) {
  const r = rects[name]
  if (!r) throw new Error(`unknown target "${name}"`)
  return r
}

function pointOf(p, rects) {
  const r = rectOf(rects, p.at)
  return { x: r.x + (p.x ?? 0.5) * r.w + (p.dx ?? 0), y: r.y + (p.y ?? 0.5) * r.h + (p.dy ?? 0) }
}

function focusRect(item, rects) {
  if (typeof item === 'string') return rectOf(rects, item)
  const c = pointOf(item, rects)
  return { x: c.x - item.w / 2, y: c.y - item.h / 2, w: item.w, h: item.h }
}

function framingRect(f, rects) {
  const rs = f.focus.map((item) => focusRect(item, rects))
  const x0 = Math.min(...rs.map((r) => r.x)),
    y0 = Math.min(...rs.map((r) => r.y))
  const x1 = Math.max(...rs.map((r) => r.x + r.w)),
    y1 = Math.max(...rs.map((r) => r.y + r.h))
  const pad = f.pad ?? 0
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 }
}

export function resolveScene(scene, rects) {
  const out = structuredClone(scene)
  const { cursor, callouts } = out.tracks ?? {}
  if (cursor) {
    cursor.seed = scene.seed ?? 0
    cursor.from = pointOf(cursor.from, rects)
    for (const s of cursor.path) if (s.to) s.to = pointOf(s.to, rects)
    out.tracks.cursor = prepareCursor(cursor, scene.duration)
  }
  for (const c of callouts ?? []) c.anchor = pointOf(c.anchor, rects)
  if (out.cameras) {
    const framed = {}
    for (const [name, f] of Object.entries(out.cameras.framings)) framed[name] = framingRect(f, rects)
    const [w, h] = scene.fit.size
    out.cameras = resolveCameras(out.cameras, framed, { w, h }, rects['@frame'])
  }
  out.resolved = true
  return out
}

function trackAt(track, t) {
  const keys = track.keys
  const i = keyIndex(keys, t)
  const [ta, a] = keys[i]
  const next = keys[i + 1]
  const e = track.ease ?? 'linear'
  const b = next?.[1]
  if (next && t > ta && ((isNum(a) && isNum(b)) || sameNums(a, b))) {
    const k = ease(e, span(t, ta, next[0]))
    return { value: isNum(a) ? a + (b - a) * k : a.map((v, j) => v + (b[j] - v) * k) }
  }
  if (!track.over || i === 0 || isNum(a) || isNums(a)) return { value: a }
  const elapsed = t - ta
  if (elapsed >= track.over) return { value: a }
  return { value: a, tween: { from: keys[i - 1][1], to: a, k: ease(e, elapsed / track.over) } }
}

export function stateAt(scene, t, env = {}) {
  const D = scene.duration
  const wrap = loops(scene) && (t < 0 || t > D)
  const time = wrap ? ((t % D) + D) % D : clamp(t, 0, D)

  const kit = {},
    tweens = {}
  for (const [key, track] of Object.entries(scene.tracks?.state ?? {})) {
    const { value, tween } = trackAt(track, time)
    const dot = key.indexOf('.')
    ;(kit[key.slice(0, dot)] ??= {})[key.slice(dot + 1)] = value
    if (tween) tweens[key] = tween
  }

  const callouts = []
  ;(scene.tracks?.callouts ?? []).forEach((c, i) => {
    const k = ease('out', span(time, ...c.in))
    const opacity = k * (1 - ease('soft', span(time, ...c.out)))
    if (opacity <= 0) return
    callouts.push({
      id: `${c.copy}-${i}`,
      text: scene.copy?.[c.copy] ?? c.copy,
      x: scene.resolved ? c.anchor.x : null,
      y: scene.resolved ? c.anchor.y : null,
      side: c.side,
      opacity,
      rise: (1 - opacity) * 10,
    })
  })

  let camera = null,
    cursor = null
  if (scene.resolved) {
    if (scene.cameras) camera = cameraAt(scene.cameras, time, env.viewportWidth)
    if (scene.tracks?.cursor) cursor = cursorAt(scene.tracks.cursor, time)
  }
  return { t: time, kit, tweens, camera, cursor, callouts }
}
