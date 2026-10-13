const SCROLL_LAG = 0.16
const MAX_DT = 0.1
import { clamp, loops } from './motion.js'

export const INVIEW_THRESHOLD = 0.5

export function scrollTarget({ rect, viewport, track }) {
  if (track) return clamp(-track.top / Math.max(1, track.height - viewport.height))
  return clamp((viewport.height - rect.top) / Math.max(1, viewport.height + rect.height))
}

function advance(p, dt, duration, loop) {
  const next = p + dt / duration
  return loop ? next % 1 : Math.min(1, next)
}

// The caller keeps { progress, now } from the last call and passes it back as `prev`.
// inview pauses below INVIEW_THRESHOLD visible and resumes from the same point, it does not restart.
export function progressFor(mode, input) {
  const { prev, now, duration, reducedMotion = false, visible = 1, manual = 0 } = input
  const loop = loops(input)
  const last = prev ? clamp(prev.progress) : 0
  const dt = prev ? Math.min(MAX_DT, Math.max(0, now - prev.now)) : 0

  if (mode === 'manual') return clamp(manual)
  if (mode === 'scroll') {
    const goal = scrollTarget(input)
    if (reducedMotion || !prev) return goal
    return last + (goal - last) * (1 - Math.exp(-dt / SCROLL_LAG))
  }
  if (mode === 'autoplay' || mode === 'inview') {
    if (mode === 'inview' && visible < INVIEW_THRESHOLD) return last
    return advance(last, dt, duration, loop)
  }
  throw new Error(`unknown drive mode: ${mode}`)
}
