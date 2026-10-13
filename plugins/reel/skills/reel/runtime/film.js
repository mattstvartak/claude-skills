// Film layer: stage, backdrop, frame chrome, world, cursor and callouts. Draws what filmState says and nothing else.
const CURSOR_SVG = `<svg viewBox="0 0 24 24"><defs><filter id="rfcs" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>
  <path d="M3 2.2 L3 19.4 L7.4 15.4 L10.2 21.6 L13.3 20.2 L10.6 14.2 L16.6 14.2 Z" fill="oklch(0 0 0 / 0.45)" transform="translate(0.6 1.4)" filter="url(#rfcs)"/>
  <path d="M3 2.2 L3 19.4 L7.4 15.4 L10.2 21.6 L13.3 20.2 L10.6 14.2 L16.6 14.2 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`
const BROWSER_BAR = 44
const PHONE_BEZEL = 12 // film.css phone frame radius 46 minus content radius 34
const MAX_TILT = 4
const PERSPECTIVE = 2600
const BACKDROP_PAN = 0.06
const BACKDROP_ZOOM = 0.04
const HOTSPOT = { x: 3, y: 2.2 }
const CURSOR_SCALE = 1.08
const PRESS_SHRINK = 0.14
const CALLOUT_FONT = 15
const LEAD_LENGTH = 30
const PHONE_MARGIN = 18
const el = (cls, parent) => {
  const n = document.createElement('div')
  n.className = cls
  if (parent) parent.appendChild(n)
  return n
}

export function mountFilm(host, { frame = 'window', stage: size, theme, viewport, callouts = [] }) {
  const kind = typeof frame === 'string' ? frame : frame.kind
  const [vw, vh] = viewport
  const top = kind === 'browser' ? BROWSER_BAR : 0
  const inset = kind === 'phone' ? PHONE_BEZEL : 0
  const rect = { x: 0, y: 0, w: vw + 2 * inset, h: vh + top + 2 * inset }

  host.classList.add('rf-host')
  host.style.aspectRatio = `${size.w} / ${size.h}`
  const stage = el('rf-stage', host)
  stage.style.width = `${size.w}px`
  stage.style.height = `${size.h}px`
  stage.dataset.theme = theme

  const backdrop = kind === 'none' ? null : el('rf-backdrop', stage)
  if (backdrop) el('rf-grain', backdrop)
  const world = el('rf-world', stage)
  const tilt = el('rf-tilt', world)
  tilt.style.transformOrigin = `${rect.w / 2}px ${rect.h / 2}px`
  const win = el(`rf-frame rf-frame--${kind}`, tilt)
  win.style.width = `${rect.w}px`
  win.style.height = `${rect.h}px`
  if (kind === 'browser') {
    const bar = el('rf-bar', win)
    bar.style.height = `${BROWSER_BAR}px`
    el('rf-bar__dots', bar).innerHTML = '<i></i><i></i><i></i>'
    el('rf-bar__url', bar).textContent = frame.url || ''
  }
  const content = el('rf-content', win)
  content.style.left = `${inset}px`
  content.style.top = `${top + inset}px`
  content.style.width = `${vw}px`
  content.style.height = `${vh}px`

  const cursor = el('rf-cursor', stage)
  cursor.innerHTML = CURSOR_SVG
  cursor.style.opacity = 0
  const film = {
    host,
    stage,
    content,
    kind,
    size,
    rect,
    backdrop,
    world,
    tilt,
    cursor,
    callouts: new Map(),
    boxes: new Map(),
    contentRect: { x: inset, y: top + inset, w: vw, h: vh },
  }
  for (const { id, text } of callouts) calloutEl(film, id).text.textContent = text
  return film
}

export function onFontsChange(film, cb) {
  const fn = () => {
    film.boxes.clear()
    for (const c of film.callouts.values()) c.key = ''
    cb()
  }
  document.fonts.addEventListener('loadingdone', fn)
  return () => document.fonts.removeEventListener('loadingdone', fn)
}

function calloutEl(film, id) {
  let c = film.callouts.get(id)
  if (!c) {
    const root = el('rf-callout', film.stage)
    root.style.opacity = 0
    c = { root, text: el('rf-callout__text', root), lead: el('rf-callout__lead', root), shown: '', key: '' }
    film.callouts.set(id, c)
  }
  return c
}

export function renderFilm(film, { theme, scale, camera, cursor, callouts = [], phoneLayout = false, moving = false }) {
  const {
    stage,
    size: { w: W, h: H },
  } = film
  const { cx, cy, z, depth } = camera
  const u = 1 / scale
  if (stage.dataset.theme !== theme) stage.dataset.theme = theme
  stage.toggleAttribute('data-moving', moving)
  stage.style.transform = `scale(${scale})`
  film.world.style.transform = `translate(${W / 2 - cx * z}px, ${H / 2 - cy * z}px) scale(${z})`
  if (film.kind !== 'none') {
    film.tilt.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${(MAX_TILT * (1 - depth)).toFixed(3)}deg)`
    const px = (cx - film.rect.w / 2) * -BACKDROP_PAN,
      py = (cy - film.rect.h / 2) * -BACKDROP_PAN
    film.backdrop.style.transform = `translate(${px}px, ${py}px) scale(${1 + depth * BACKDROP_ZOOM})`
  }

  const sx = (x) => (x - cx) * z + W / 2,
    sy = (y) => (y - cy) * z + H / 2
  film.cursor.style.opacity = cursor.opacity
  film.cursor.style.transform = `translate(${sx(cursor.x) - HOTSPOT.x * u}px, ${sy(cursor.y) - HOTSPOT.y * u}px) scale(${u * CURSOR_SCALE * (1 - PRESS_SHRINK * cursor.press)})`

  const live = new Set()
  for (const co of callouts) {
    live.add(co.id)
    const c = calloutEl(film, co.id)
    const side = phoneLayout ? 'below' : co.side || 'left'
    const key = `${co.text}|${side}|${scale}`
    if (c.key !== key) {
      c.key = key
      if (c.shown !== co.text) c.text.textContent = c.shown = co.text
      c.root.dataset.side = side
      c.text.style.fontSize = `${CALLOUT_FONT * u}px`
      const vertical = side === 'top' || side === 'bottom'
      c.lead.style.width = vertical ? `${Math.max(1, u)}px` : `${LEAD_LENGTH * u}px`
      c.lead.style.height = vertical ? `${LEAD_LENGTH * u}px` : `${Math.max(1, u)}px`
      if (!film.boxes.has(key)) film.boxes.set(key, { w: c.root.offsetWidth, h: c.root.offsetHeight })
    }
    const { w: bw, h: bh } = film.boxes.get(key)
    let x, y
    if (phoneLayout) {
      x = W / 2 - bw / 2
      y = H - bh - PHONE_MARGIN * u
    } else if (side === 'left') {
      x = sx(co.x) - bw
      y = sy(co.y) - bh / 2
    } else if (side === 'right') {
      x = sx(co.x)
      y = sy(co.y) - bh / 2
    } else if (side === 'top') {
      x = sx(co.x) - bw / 2
      y = sy(co.y) - bh
    } else {
      x = sx(co.x) - bw / 2
      y = sy(co.y)
    }
    c.root.style.opacity = co.opacity
    c.root.style.transform = `translate(${x}px, ${y + co.rise * u}px)`
  }
  for (const [id, c] of film.callouts) if (!live.has(id)) c.root.style.opacity = 0
}
