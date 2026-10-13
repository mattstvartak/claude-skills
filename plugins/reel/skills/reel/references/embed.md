# Embedding a scene

How a page uses an exported scene. Read this when the user asks how to put a film on a site, or which drive mode fits a section.

## What export gives you

`export.mjs` copies the runtime, the kit and the scene into the app's `publicDir` and prints a snippet. Static files only. Nothing goes in the site's `package.json`, and there is no build step or install.

Layout under `publicDir` (default `public/reel/`, served at `/reel/`):

- `runtime/` holds `reel.js`, `reel-react.js`, `film.css` and the other runtime modules.
- `kits/<kit>/` holds the kit's code and CSS.
- `scenes/<id>/` holds `scene.json`, `poster.jpg`, `manifest.json` and any media.

Any other `publicDir` is served from its own path, and the snippet already uses the right URLs. Paste it as printed.

Export prints this shape (ids and sizes come from the scene):

```html
<script type="module" src="/reel/runtime/reel.js"></script>

<reel-scene src="/reel/scenes/toy-reorder/scene.json" style="max-width: 960px">
  <img src="/reel/scenes/toy-reorder/poster.jpg" width="960" height="600" alt="Dragging a note to the top of the list">
</reel-scene>
```

The script tag goes once per page. `max-width` is the scene's `fit.size` width, the largest size it was designed and checked for. Leave it unless the scene's `fit.size` changes. If the scene has no `alt`, export prints `TODO: describe what this animation shows`. Set `alt` in scene.json and export again.

## Drive modes

Set `drive` on the element. The default is `autoplay`.

### autoplay

For a hero loop. The scene starts on its own and loops. It pauses offscreen. Under reduced motion it stays on the poster frame.

From demo/autoplay.html:

```html
<reel-scene src="/demo/reel/scenes/toy-reorder/scene.json" drive="autoplay" style="aspect-ratio: 960 / 600">
  <img src="/demo/assets/toy-reorder-poster.jpg" width="960" height="600" alt="A notes app with a list and an editor">
</reel-scene>
```

### inview

For a scene lower on the page. It plays while at least half of it is on screen and pauses in place when scrolled away. Reduced motion behaves as in autoplay.

From demo/inview.html:

```html
<reel-scene src="/demo/reel/scenes/toy-reorder/scene.json" drive="inview" style="aspect-ratio: 960 / 600">
  <img src="/demo/assets/toy-reorder-poster.jpg" width="960" height="600" alt="A notes app with a list and an editor">
</reel-scene>
```

### scroll

For a scene the reader scrubs by scrolling. Scene time eases toward the scroll position (about half a second to catch up) and reel only reads the position. It never takes over scrolling. Under reduced motion the scene follows the scroll exactly, with no easing.

Without `track`, progress runs from the element entering the viewport to leaving it.

From demo/scroll.html:

```html
<reel-scene id="plain" src="/demo/reel/scenes/toy-reorder/scene.json" drive="scroll" style="aspect-ratio: 960 / 600">
  <img src="/demo/assets/toy-reorder-poster.jpg" width="960" height="600" alt="A notes app with a list and an editor">
</reel-scene>
```

For a pinned, scroll-told section, add `track`: a selector for a taller container, with the player sticky inside it. The container's pass maps to progress. The page does the pinning with plain CSS. Reel adds no scroll handling of its own.

From demo/scroll.html:

```html
<section id="track" class="track">
  <reel-scene src="/demo/reel/scenes/toy-reorder/scene.json" drive="scroll" track="#track" style="aspect-ratio: 960 / 600">
    <img src="/demo/assets/toy-reorder-poster.jpg" width="960" height="600" alt="A notes app with a list and an editor">
  </reel-scene>
</section>
```

From demo/assets/demo.css, the CSS that pins it:

```css
.track { height: 380vh; }
.track reel-scene { position: sticky; top: 10vh; }
```

Pick the container height for the pace you want. Taller is slower.

### manual

For when the page already owns time. The scene never plays itself. Set `progress` (0 to 1) or call `seek(t)` in seconds. Use it with GSAP, ScrollTrigger, a slider, or any other source of time. `duration` is read-only. Reduced motion changes nothing here, because the page is in control.

## GSAP and ScrollTrigger

Reel never bundles GSAP. It would blow the scene weight budget, and GSAP's licence is not open source, so reel keeps it off every site that uses reel. The page loads GSAP itself, only where it needs it.

From demo/manual-gsap.html:

```html
<section id="track" class="track">
  <reel-scene src="/demo/reel/scenes/toy-reorder/scene.json" drive="manual" style="aspect-ratio: 960 / 600">
    <img src="/demo/assets/toy-reorder-poster.jpg" width="960" height="600" alt="A notes app with a list and an editor">
  </reel-scene>
</section>
```

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" integrity="sha384-g4NTh/Iv5PPU4xPyhEWqPcwtNXOvdaDI8LLnyYfyNZOjKJeYQyjzQ9X5275eBjpt" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" integrity="sha384-Z3REaz79l2IaAZqJsSABtTbhjgOUYyV3p90XNnAPCSHg3EMTz1fouunq9WZRtj3d" crossorigin="anonymous"></script>
<script>
  gsap.registerPlugin(ScrollTrigger)
  const scene = document.querySelector('reel-scene')
  const proxy = { p: 0 }
  gsap.to(proxy, {
    p: 1,
    ease: 'none',
    onUpdate: () => (scene.progress = proxy.p),
    scrollTrigger: { trigger: '#track', start: 'top top', end: 'bottom bottom', scrub: true },
  })
</script>
```

The tween runs on a plain object and `onUpdate` copies the value across. The `.track` CSS from the scroll section applies here too. If the page already ships GSAP, keep its version and drop the two script tags. A page with no other use for GSAP should use `drive="scroll"` instead.

## React and Next.js

The wrapper is `reel-react.js` in the same `runtime/` folder. It uses no JSX and works with React 18 and 19.

- The file starts with `'use client'`. In the Next.js app router, import it from a client component.
- It is safe to import during server rendering. It loads `reel.js` in an effect, so nothing touches `window` on the server.
- Props: `runtime`, `src`, `drive`, `theme`, `track`, `poster`, `alt`, `width`, `height`, `progress`, `className`, `style`. A ref gives the element, for `seek(t)`.
- In a bundled site (Next.js, Vite), copy `reel-react.js` into the site's own components and pass `runtime`, the public URL of `reel.js`. The runtime itself stays in `public/` and is never bundled: the wrapper loads it with an import the bundler is told to skip, because the runtime finds `film.css` and kits relative to its own URL. Without `runtime`, the wrapper looks for `reel.js` beside itself, which is right for unbundled pages like the demo.
- Tested in a scratch Next.js 16.4 app router site with React 19.3: `next build` with Turbopack and with webpack, then `next start`, and `next dev`. The copied wrapper and the printed snippet loaded the scene in all three with no console errors or bundler warnings.
- Prefer the wrapper over pasting the HTML snippet into a Next.js page. The HTML snippet works through `next/script` with `type="module"`, but Next preloads the script without `crossorigin` and logs a credentials-mode warning.

From demo/react.html:

```js
import { createElement as h, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ReelScene } from '/plugin/skills/reel/runtime/reel-react.js'

function Demo() {
  const [progress, setProgress] = useState(0.4)
  return h('div', null,
    h(ReelScene, {
      src: '/demo/reel/scenes/toy-reorder/scene.json',
      drive: 'manual',
      progress,
      poster: '/demo/assets/toy-reorder-poster.jpg',
      width: 960,
      height: 600,
      alt: 'A notes app with a list and an editor',
      style: { aspectRatio: '960 / 600' },
    }),
    h('input', {
      type: 'range', min: 0, max: 1, step: 0.001, value: progress,
      'aria-label': 'Scene progress', style: { width: '100%', marginTop: '1rem' },
      onChange: (e) => setProgress(Number(e.target.value)),
    }))
}
createRoot(document.getElementById('root')).render(h(Demo))
```

Export prints the bundled-site form too:

```jsx
// copy public/reel/runtime/reel-react.js into your components
import { ReelScene } from './reel-react.js'

<ReelScene runtime="/reel/runtime/reel.js" src="/reel/scenes/toy-reorder/scene.json" poster="/reel/scenes/toy-reorder/poster.jpg" width={960} height={600} alt={"Dragging a note to the top of the list"} style={{ maxWidth: 960 }} />
```

Use it inside a `'use client'` component. Add `drive` and the other props as needed.

## Fit and the poster

- Reserve the shape. The `<img>` child carries `width` and `height` from the scene's `fit.size`, so the page doesn't jump when the scene loads, and it holds its shape with scripts off. The demos also set `style="aspect-ratio: 960 / 600"` on the element. The element has no `poster` attribute. The React wrapper's `poster` prop fills the same `<img>`.
- Write a real `alt`. It says what the film shows ("Dragging a note to the top of the list"), not "animation" or "screenshot".
- The poster shows before load, on a load failure, and under reduced motion for autoplay and inview. Once the scene is ready it sits over the stage until the first frame is drawn.
- Below the width set in the scene (`phone.below`, 600px if unset) the element switches to the phone camera track.

## Theme

`theme` is `auto`, `light` or `dark`. The default, `auto`, follows the page's `data-theme` attribute or `prefers-color-scheme`. Set `theme="dark"` or `theme="light"` on the element to pin it.

## Film tokens

The film layer around the kit (backdrop, window shadow, callouts, browser and phone chrome) is styled by custom properties with neutral defaults. Set them on the `<reel-scene>` element or on a parent. They inherit into the shadow root. Dark values use the plain name, light values add a `-light` suffix.

- `--reel-backdrop`, `--reel-backdrop-deep`, `--reel-glow`: the backdrop gradient.
- `--reel-window-shadow`: the frame's full `box-shadow`.
- `--reel-callout-bg`, `--reel-callout-fg`, `--reel-callout-line`: callout pill and lead line.
- `--reel-chrome-bg`, `--reel-chrome-line`, `--reel-chrome-fg`, `--reel-chrome-field`, `--reel-chrome-body`: browser bar and phone body.
- `--reel-callout-font` (default `system-ui, sans-serif`) and `--reel-host-radius` (the element's corner radius).

The page's own CSS does not reach the kit, which lives in a shadow root, and the kit's tokens don't leak out.

## Styling states

- `data-loaded` is set once the scene is ready.
- `data-error` is set with the reason when loading fails. The poster stays.

A missing scene, kit, film.css or kit stylesheet is a failure. A missing font sheet only warns.

## Gotchas

- `src` is read once, when the element connects. Changing it later does nothing. Replace the element to swap scenes.
- `seek(t)` and `progress` set before the scene is ready are kept and applied when it loads. A `progress` set before the element is defined, for example by a framework, is picked up too. Await `el.ready` to know the scene is up.
- One runtime serves the whole page. Every `<reel-scene>` shares it, so the script tag appears once and a page can hold any number of scenes.
- `drive` is observed. Changing it restarts or stops the loop.
