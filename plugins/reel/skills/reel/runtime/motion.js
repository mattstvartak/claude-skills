export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const span = (t, a, b) => (b > a ? clamp((t - a) / (b - a)) : t >= b ? 1 : 0)
export const loops = (o) => o.loop ?? true

export function keyIndex(keys, t) {
  let i = 0
  while (i < keys.length - 1 && keys[i + 1][0] <= t) i++
  return i
}

export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1,
    bx = 3 * (x2 - x1) - cx,
    ax = 1 - cx - bx
  const cy = 3 * y1,
    by = 3 * (y2 - y1) - cy,
    ay = 1 - cy - by
  const sx = (u) => ((ax * u + bx) * u + cx) * u,
    sy = (u) => ((ay * u + by) * u + cy) * u,
    dx = (u) => (3 * ax * u + 2 * bx) * u + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let u = x
    for (let i = 0; i < 6; i++) {
      const e = sx(u) - x,
        d = dx(u)
      if (Math.abs(e) < 1e-6) return sy(u)
      if (Math.abs(d) < 1e-6) break
      u -= e / d
    }
    let lo = 0,
      hi = 1
    u = x
    for (let i = 0; i < 30; i++) {
      const v = sx(u)
      if (Math.abs(v - x) < 1e-6) break
      if (v < x) lo = u
      else hi = u
      u = (lo + hi) / 2
    }
    return sy(u)
  }
}

const EASE = {
  linear: (x) => clamp(x),
  camera: bezier(0.55, 0, 0.12, 1),
  move: bezier(0.42, 0, 0.2, 1),
  drag: bezier(0.5, 0, 0.25, 1),
  out: bezier(0.2, 0.8, 0.2, 1),
  soft: bezier(0.4, 0, 0.6, 1),
}
const custom = new Map()

export function ease(name, x) {
  if (Array.isArray(name)) {
    const key = name.join(',')
    if (!custom.has(key)) custom.set(key, bezier(...name))
    return custom.get(key)(x)
  }
  const f = EASE[name]
  if (!f) throw new Error(`unknown ease "${name}"`)
  return f(x)
}

export function arc(p, q, k, bend = 0.12) {
  if (k <= 0) return { x: p.x, y: p.y }
  if (k >= 1) return { x: q.x, y: q.y }
  const mx = (p.x + q.x) / 2 - (q.y - p.y) * bend,
    my = (p.y + q.y) / 2 + (q.x - p.x) * bend
  const u = 1 - k
  return { x: u * u * p.x + 2 * u * k * mx + k * k * q.x, y: u * u * p.y + 2 * u * k * my + k * k * q.y }
}

const PRESS_IN = 0.08,
  RELEASE_OUT = 0.12,
  DRIFT_PERIOD = 1.3,
  DRIFT_SETTLE = 0.25

function hash(seed, n) {
  let h = (Math.imul(n | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (((h ^ (h >>> 16)) >>> 0) / 4294967295) * 2 - 1
}

// Lattice wraps at n so drift is continuous across the loop seam.
function noise(seed, x, n) {
  const i = Math.floor(x),
    f = x - i,
    s = f * f * (3 - 2 * f)
  return hash(seed, i % n) * (1 - s) + hash(seed, (i + 1) % n) * s
}

export function prepareCursor(track, duration) {
  const events = track.path
    .filter((s) => s.press !== undefined || s.release !== undefined)
    .map((s) => (s.press !== undefined ? { t: s.press, down: true } : { t: s.release, down: false }))
    .sort((a, b) => a.t - b.t)
  const cells = Math.max(1, Math.round(duration / DRIFT_PERIOD))
  return { ...track, moves: track.path.filter((s) => s.to), events, cells, duration }
}

export function cursorAt(track, t) {
  const { moves, events } = track
  let pt = track.from,
    from = track.from,
    still = Infinity
  for (const m of moves) {
    const [a, b] = m.at
    still = Math.min(still, t < a ? a - t : t > b ? t - b : 0)
    if (t < a) break
    pt = t < b ? arc(from, m.to, ease(m.ease || 'move', span(t, a, b)), m.bend) : m.to
    from = m.to
  }

  if (track.drift) {
    const w = clamp(still / DRIFT_SETTLE)
    const seed = track.seed || 0,
      u = (t / track.duration) * track.cells
    pt = {
      x: pt.x + noise(seed * 2, u, track.cells) * track.drift * w,
      y: pt.y + noise(seed * 2 + 1, u, track.cells) * track.drift * w,
    }
  }

  let opacity = track.show ? span(t, ...track.show) : 1
  if (track.hide) opacity *= 1 - span(t, ...track.hide)

  let press = 0
  for (const e of events) {
    if (e.t > t) break
    press = e.down ? Math.min(span(t, e.t, e.t + PRESS_IN), 1) : 1 - span(t, e.t, e.t + RELEASE_OUT)
  }
  return { x: pt.x, y: pt.y, opacity, press }
}
