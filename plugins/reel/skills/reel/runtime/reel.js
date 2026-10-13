import { progressFor, INVIEW_THRESHOLD } from './drive.js'
import { mountKit, applyState } from './kit.js'
import { resolveScene, stateAt } from './timeline.js'
import { mountFilm, renderFilm, onFontsChange } from './film.js'
import { PHONE_BELOW } from './camera.js'

const STYLE = `:host{display:block;position:relative;overflow:hidden}
:host([data-loaded]) ::slotted(img){position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}`
const IDLE_CURSOR = { x: 0, y: 0, opacity: 0, press: 0 }
const fontSheets = new Set()

const loadStylesheet = (href, parent, required = true) =>
  new Promise((ok, fail) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href
    l.onload = ok
    l.onerror = () => {
      if (required) return fail(new Error(`stylesheet ${href} failed to load`))
      console.warn(`<reel-scene> font stylesheet ${href} failed to load`)
      ok()
    }
    parent.appendChild(l)
  })

function offsetIn(el, root) {
  let x = 0,
    y = 0
  for (let n = el; n && n !== root; n = n.offsetParent) {
    x += n.offsetLeft
    y += n.offsetTop
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

export class ReelScene extends HTMLElement {
  static observedAttributes = ['theme', 'drive']

  #scene
  #resolved
  #film
  #stage
  #t = 0
  #manual = 0
  #prev = null
  #raf = 0
  #pending = null
  #trackEl
  #drawnT = -1
  #slot
  #isIntersecting = false
  #visibleRatio = 0
  #loaded = false
  #cleanups = []
  #dark = matchMedia('(prefers-color-scheme: dark)')
  #motion = matchMedia('(prefers-reduced-motion: reduce)')
  #ready = Promise.withResolvers()

  constructor() {
    super()
    // reel-react sets progress before this class is defined, which leaves an own property shadowing the accessor
    if (Object.hasOwn(this, 'progress')) {
      const v = this.progress
      delete this.progress
      this.progress = v
    }
    this.#ready.promise.catch(() => {})
    this.attachShadow({ mode: 'open' }).innerHTML = `<style>${STYLE}</style><slot></slot>`
  }

  get ready() {
    return this.#ready.promise
  }
  get duration() {
    return this.#scene?.duration ?? 0
  }
  get progress() {
    if (!this.#resolved) return this.#pending?.p ?? 0
    return Math.min(1, this.#t / this.duration)
  }
  set progress(v) {
    const p = Math.min(1, Math.max(0, v))
    if (this.#resolved) this.seek(p * this.duration)
    else this.#pending = { p }
  }

  seek(t) {
    if (!this.#resolved) {
      this.#pending = { t }
      return
    }
    this.#manual = t / this.duration
    this.#prev = { progress: this.#manual, now: performance.now() / 1000 }
    this.#draw(t)
  }

  connectedCallback() {
    const redraw = () => {
      if (this.#resolved) {
        this.#frame(performance.now() / 1000, true)
        this.#kick()
      }
    }
    const io = new IntersectionObserver(
      (es) => {
        const e = es.at(-1)
        this.#isIntersecting = e.isIntersecting
        this.#visibleRatio = e.intersectionRatio
        this.#kick()
      },
      { threshold: [0, 0.25, INVIEW_THRESHOLD, 0.75, 1] },
    )
    const ro = new ResizeObserver(() => this.#resolved && this.#draw(this.#t))
    const mo = new MutationObserver(redraw)
    io.observe(this)
    ro.observe(this)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    this.#dark.addEventListener('change', redraw)
    this.#motion.addEventListener('change', redraw)
    this.#cleanups.push(() => {
      io.disconnect()
      ro.disconnect()
      mo.disconnect()
      this.#dark.removeEventListener('change', redraw)
      this.#motion.removeEventListener('change', redraw)
    })
    if (this.#film) this.#watchFonts()
    if (this.#loaded) return
    this.#loaded = true
    this.#load().then(this.#ready.resolve, (err) => {
      this.dataset.error = err.message
      console.error(`<reel-scene> ${this.getAttribute('src')}: ${err.message}`)
      this.#ready.reject(err)
    })
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#raf)
    this.#raf = 0
    this.#cleanups.splice(0).forEach((f) => f())
  }

  attributeChangedCallback() {
    if (!this.#resolved) return
    this.#trackEl = undefined
    this.#frame(performance.now() / 1000, true)
    this.#kick()
  }

  async #load() {
    const src = new URL(this.getAttribute('src'), document.baseURI)
    const inline = this.inline
    let scene = inline?.scene
    if (!scene) {
      const res = await fetch(src)
      if (!res.ok) throw new Error(`scene.json ${res.status}`)
      scene = await res.json()
    }
    this.#scene = scene
    const [W, H] = scene.fit.size
    this.style.aspectRatio = `${W} / ${H}`

    const kitUrl = inline?.kit ? src : new URL(`../../kits/${scene.kit}/kit.js`, src)
    const kit = inline?.kit ?? (await import(kitUrl.href)).default
    if (scene.kitVersion !== kit.version) {
      console.warn(
        `<reel-scene> ${scene.id} was made for ${scene.kit} kit v${scene.kitVersion}, loaded v${kit.version}`,
      )
    }
    for (const f of kit.fonts ?? []) {
      const href = new URL(f, kitUrl).href
      if (!fontSheets.has(href)) {
        fontSheets.add(href)
        await loadStylesheet(href, document.head, false)
      }
    }

    const wrap = document.createElement('div')
    this.shadowRoot.prepend(wrap)
    if (inline?.css) {
      for (const text of inline.css)
        this.shadowRoot.append(Object.assign(document.createElement('style'), { textContent: text }))
    } else {
      const sheets = [
        new URL('./film.css', import.meta.url).href,
        ...(kit.styles ?? []).map((s) => new URL(s, kitUrl).href),
      ]
      await Promise.all(sheets.map((s) => loadStylesheet(s, this.shadowRoot)))
    }
    const film = (this.#film = mountFilm(wrap, {
      frame: scene.frame,
      stage: { w: W, h: H },
      theme: this.#theme(),
      viewport: scene.viewport ?? kit.viewport,
      callouts: (scene.tracks?.callouts ?? []).map((c, i) => ({
        id: c.id ?? `${c.copy}-${i}`,
        text: scene.copy?.[c.copy] ?? c.copy,
      })),
    }))
    this.#watchFonts()
    mountKit(film.content, kit)
    applyState(film.content, { ...stateAt(scene, 0), theme: this.#theme() })
    film.content.offsetWidth
    await document.fonts.ready

    const rects = { '@frame': film.rect }
    for (const [name, sel] of Object.entries(scene.targets ?? {})) {
      const el = film.content.querySelector(sel)
      if (!el) throw new Error(`target "${name}" (${sel}) matched nothing`)
      const r = offsetIn(el, film.content)
      rects[name] = { ...r, x: r.x + film.contentRect.x, y: r.y + film.contentRect.y }
    }
    this.#resolved = resolveScene(scene, rects)
    this.#stage = { w: W, h: H }
    const now = performance.now() / 1000
    if (this.#pending) {
      this.#manual = this.#pending.p ?? this.#pending.t / this.duration
      this.#prev = { progress: this.#manual, now }
      this.#pending = null
    }
    this.#frame(now)
    this.setAttribute('data-loaded', '')
    this.#kick()
  }

  #watchFonts() {
    this.#cleanups.push(onFontsChange(this.#film, () => this.#resolved && this.#draw(this.#t)))
  }

  #theme() {
    const pick = (v) => (v === 'light' || v === 'dark' ? v : null)
    return (
      pick(this.getAttribute('theme')) ??
      pick(document.documentElement.dataset.theme) ??
      (this.#dark.matches ? 'dark' : 'light')
    )
  }

  #mode() {
    return this.getAttribute('drive') ?? 'autoplay'
  }
  #still() {
    const m = this.#mode()
    return this.#motion.matches && m !== 'scroll' && m !== 'manual'
  }

  #draw(t, moving = false) {
    this.#t = t
    const width = this.clientWidth
    if (!width) return
    this.#drawnT = t
    const W = this.#stage.w
    const theme = this.#theme()
    const s = stateAt(this.#resolved, t, { viewportWidth: width })
    this.#t = s.t
    applyState(this.#film.content, { kit: s.kit, tweens: s.tweens, theme })
    renderFilm(this.#film, {
      theme,
      scale: width / W,
      camera: s.camera,
      cursor: s.cursor ?? IDLE_CURSOR,
      callouts: s.callouts,
      phoneLayout: width < (this.#resolved.cameras.phone?.below ?? PHONE_BELOW),
      moving: moving && !!s.camera?.moving,
    })
  }

  #frame(now, force = false) {
    const D = this.duration
    const still = this.#still()
    const mode = this.#mode()
    let p
    if (still) p = (this.#scene.posterAt ?? 0) / D
    else {
      const sel = this.getAttribute('track')
      if (sel && !this.#trackEl?.isConnected) this.#trackEl = document.querySelector(sel)
      const scroll = mode === 'scroll'
      p = progressFor(mode, {
        rect: scroll ? this.getBoundingClientRect() : undefined,
        viewport: { height: innerHeight },
        track: scroll && sel ? this.#trackEl?.getBoundingClientRect() : undefined,
        now,
        prev: this.#prev,
        duration: D,
        loop: this.#scene.loop,
        reducedMotion: this.#motion.matches,
        visible: this.#visibleRatio,
        manual: this.#manual,
      })
    }
    this.#prev = { progress: p, now }
    if (force || p * D !== this.#drawnT) this.#draw(p * D, !still)
    if (!still) {
      this.#slot ??= this.shadowRoot.querySelector('slot')
      this.#slot?.remove()
    }
  }

  #kick() {
    const want =
      this.#resolved && this.isConnected && this.#isIntersecting && this.#mode() !== 'manual' && !this.#still()
    if (!want) {
      cancelAnimationFrame(this.#raf)
      this.#raf = 0
      return
    }
    if (this.#raf) return
    if (this.#prev) this.#prev.now = performance.now() / 1000
    const tick = (ms) => {
      this.#frame(ms / 1000)
      this.#raf = requestAnimationFrame(tick)
    }
    this.#raf = requestAnimationFrame(tick)
  }
}

if (!customElements.get('reel-scene')) customElements.define('reel-scene', ReelScene)
