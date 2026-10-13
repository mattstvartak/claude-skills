import { ease, clamp, span, keyIndex } from './motion.js'

export const PHONE_BELOW = 600
const lerp = (a, b, k) => a + (b - a) * k

const within = (c, view, lo, size) => (view < size ? Math.min(lo + size - view / 2, Math.max(lo + view / 2, c)) : c)

export function fitRect(rect, { w: W, h: H }, bounds) {
  const z = Math.min(W / rect.w, H / rect.h)
  let cx = rect.x + rect.w / 2,
    cy = rect.y + rect.h / 2
  if (bounds) {
    cx = within(cx, W / z, bounds.x, bounds.w)
    cy = within(cy, H / z, bounds.y, bounds.h)
  }
  return { cx, cy, z }
}

function resolveTrack(track, framings, rects, stage, bounds) {
  const fits = {}
  for (const [, name] of track.keys) fits[name] ??= fitRect(rects[name], stage, bounds)
  const zs = (establishing) =>
    Object.entries(fits)
      .filter(([n]) => !!framings?.[n]?.establishing === establishing)
      .map(([, f]) => f.z)
  const lo = Math.min(...(zs(true).length ? zs(true) : zs(false)))
  const hi = zs(false).length ? Math.min(...zs(false)) : lo
  return { ...track, fits, lo, hi }
}

// Fits and the depth range are computed once per scene, not per frame.
export function resolveCameras(cameras, rects, stage, bounds) {
  const out = { default: resolveTrack(cameras.default, cameras.framings, rects, stage, bounds) }
  if (cameras.phone)
    out.phone = {
      ...resolveTrack(cameras.phone, cameras.framings, rects, stage, bounds),
      below: cameras.phone.below ?? PHONE_BELOW,
    }
  return out
}

export function cameraAt(cameras, t, viewportWidth) {
  const phone = cameras.phone && viewportWidth < cameras.phone.below
  const { keys, fits, lo, hi } = phone ? cameras.phone : cameras.default

  const i = keyIndex(keys, t)
  const a = keys[i],
    b = keys[Math.min(i + 1, keys.length - 1)]
  const A = fits[a[1]],
    B = fits[b[1]]
  let c = A
  const moving = t > a[0] && a[1] !== b[1]
  if (moving) {
    const k = ease(a[2] ?? 'camera', span(t, a[0], b[0]))
    c = { cx: lerp(A.cx, B.cx, k), cy: lerp(A.cy, B.cy, k), z: Math.exp(lerp(Math.log(A.z), Math.log(B.z), k)) }
  }
  const depth = hi > lo ? clamp((c.z - lo) / (hi - lo)) : 0
  return { cx: c.cx, cy: c.cy, z: c.z, depth, framing: a[1], moving, track: phone ? 'phone' : 'default' }
}
