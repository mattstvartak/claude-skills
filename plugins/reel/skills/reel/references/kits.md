# Kits

A kit is a small, framework-free copy of an app's UI at `reel/kits/<app>/`. Scenes drive it with state; it holds no animation of its own. The examples are a toy notes app's kit and a desktop photo editor's.

```
reel/kits/<app>/
  kit.js        default export: html, components, viewport, version
  kit.css       the app's tokens and the component styles
  kit.json      provenance: where it came from, what it contains, whether it is locked
  fonts.css     @font-face rules (only if the app ships fonts)
  fonts/        the font files
```

## kit.js

A kit is an ES module whose default export is this object. This is the toy kit, shortened:

```js
export default {
  name: 'toy',
  version: 1,
  viewport: [1100, 720],
  styles: ['kit.css'],
  html: '<div class="t-app"><div class="t-shell"><aside class="t-side">...<div class="t-list">...</div></aside><main class="t-main"><div class="t-editor">...</div></main></div></div>',
  components: {
    notes: {
      el: '.t-list',
      apply(el, { order, selected, drag, dragY = 0 }, tweens) {
        // set classes, text and transforms from the props
      },
    },
    editor: {
      el: '.t-editor',
      apply(el, { typed = 0 }) {
        // write the typed text and show or hide the caret
      },
    },
  },
};
```

- `name` is the folder name. `version` is an integer; scenes record the version they were written against as `kitVersion`.
- `viewport` is the app's natural size in CSS pixels. The scene's frame wraps it. A scene can override it with its own `viewport`.
- `styles` lists CSS files relative to `kit.js`. Add `fonts: ['fonts.css']` for `@font-face` sheets. These load into the page's document, because a shadow root ignores `@font-face`.
- `html` is the whole static markup. The runtime writes it into the frame once. Never rebuild it per frame.
- `components` maps a name to `{ el, apply }`. `el` is a selector for the component's root inside `html`. A state track `notes.order` in a scene reaches `apply` of the `notes` component as the prop `order`.
- `apply(el, props, tweens)` sets the DOM from `props`. `tweens` holds a `{ from, to, k }` entry for a prop (name without the component prefix) while a stepped value is inside its `over` window, `k` running 0 to 1. The notes component uses it to slide rows from their old place to the new one.

Rules for components:

- State in, DOM out. A component is a function of its props and tweens. It never reads the clock, `Math.random`, `Date`, scroll position or anything else that changes between calls.
- Apply is idempotent. The runtime skips `apply` when props and tweens have not changed, and an `apply` that throws is retried next frame. Defaults for missing props go in the signature (`typed = 0`).
- Write only what you need. Toggle classes and set `transform` and `textContent`. Do not restyle the whole subtree each call.
- No timers, no event listeners, no network, no frameworks.
- Transitions and animations are disabled. The runtime marks the kit root and a reset sheet turns off CSS `transition` and `animation` inside it, including any copied from the app's CSS. If something in the app animates, give it a prop and tween it from state.

## kit.json

```json
{
  "app": "photo-editor",
  "kind": "desktop",
  "version": 2,
  "locked": false,
  "eyeballed": false,
  "builtFrom": { "source": "../../../../../photo-editor", "commit": "9101989", "date": "2026-10-13" },
  "tokenSources": ["app/renderer/src/design/tokens/tokens.css", "app/renderer/src/design/tokens/themes.css"],
  "fonts": [{ "file": "fonts/Geist-*.woff2", "source": "app/renderer/src/design/fonts", "licence": "OFL-1.1" }],
  "icons": { "source": "app/renderer/src/design/icons/{ui,tools,panels}.ts", "licence": "the app's own work, used with the author's permission" },
  "components": ["layers", "canvas"],
  "themes": ["dark", "light"],
  "baseText": 12
}
```

That is the photo editor's file as it was while its first storyboard waited for approval. Approval set `locked` to true.

| Field | Meaning |
|---|---|
| `app` | The app's name. |
| `kind` | `web`, `desktop`, `android` or `other`. |
| `version` | Matches `version` in `kit.js`. |
| `locked` | True after the author approves the first storyboard. |
| `eyeballed` | True when the colours and sizes were sampled from screenshots instead of read from token files. |
| `builtFrom` | `{ source, commit, date }`: the app checkout, the commit the kit was copied from and the date. |
| `tokenSources` | The files the tokens came from (CSS, Tailwind config, TS or JSON, Android resources). |
| `fonts` | `[{ file, source, licence }]`. Every font file has a licence. |
| `icons` | `{ source, licence }`. |
| `components` | The components the kit has, matching `kit.js`. |
| `themes` | The themes the kit supports. |
| `baseText` | The app's base UI text size in CSS px. The fit check holds it to the 10 px rule. Without it, the fit check measures the text it finds. |

The toy kit's file is the minimum: `{ "app": "toy-notes", "kind": "web", "version": 1, "eyeballed": true, "fonts": [] }`. A kit built from a real app fills every field.

## Fonts and licences

Use the app's real fonts, copied into `fonts/` with an `@font-face` sheet in `fonts.css`. Record each in `kit.json` with its licence. If a font's licence does not allow redistribution, the kit cannot ship it: substitute the nearest licensed font, write the substitution in `kit.json`, and tell the author. The runtime waits for fonts before measuring, so the kit does not need to preload or hide text. A kit with no custom fonts uses the system stack, as the toy kit does.

## Icons

Copy the app's real icons: inline SVG in `html`, or a small sprite. Record the source and licence in `kit.json`. Draw an icon by hand only when the camera never gets near it, and say so in the storyboard.

## Tokens

Copy the app's real token values into `kit.css`, scoped under the kit's root class so they cannot leak:

```css
.t-app {
  --paper: oklch(0.972 0.012 88);
  --ink: oklch(0.28 0.02 70);
  --line: oklch(0.88 0.015 85);
  --sage: oklch(0.52 0.07 150);
  container-type: size;
  width: 100%;
  height: 100%;
  background: var(--paper);
  color: var(--ink);
}
[data-theme='dark'] .t-app {
  --paper: oklch(0.22 0.012 75);
  --ink: oklch(0.93 0.015 85);
  --line: oklch(0.33 0.015 75);
  --sage: oklch(0.78 0.08 150);
}
```

Keep the app's own names where it has them, so a later diff against the app is easy. Read tokens from the app's files; `survey.md` covers where they live for web, desktop and Android apps and what to do when they cannot be read (sample from reference shots and set `eyeballed: true`). Do not invent a palette that looks close.

## Building a kit from an app

1. Survey the app (`survey.md`): token files, fonts, icons, and headless reference shots of the surfaces the first scene needs. Store shots in `reel/references/<app>/`. They are never copied to public.
2. Decide the surfaces the scene will show and where the camera will look. Build only those components.
3. Write `html`: the app's real structure, class names where practical, with data-id attributes on anything a scene will target or reorder. Use realistic content, not lorem ipsum.
4. Write `kit.css`: tokens first, then component styles, copied from the app's CSS where possible.
5. Write the component `apply` functions. List every prop a scene may drive, with defaults.
6. Render each component next to its reference shot and fix the differences (the side-by-side view in the preview). Check both themes.
7. Write `kit.json`.

Faithful where the camera looks. Spend effort on the surfaces and details the camera will frame tightly: exact spacing, type, icons, states. A dock the camera only sees in the wide shot can be simplified markup with the right colours and shapes. A later scene that needs a new surface adds that component and shows it beside its reference before using it.

## Both themes

Every kit supports the themes the app supports. The runtime sets `data-theme` on the kit root (`light` or `dark`, from the element's `theme` attribute, the page's `data-theme` or `prefers-color-scheme`), so theme rules are selectors on `[data-theme='dark']`, as in the example above. Check both with the side-by-side view. A kit that only works in one theme makes every page that embeds it look wrong half the time.

Most apps switch themes some other way: `.dark` on `html`, `[data-mode]`, or several levels like the photo editor's `[data-brightness='dark' | 'medium-dark' | 'medium-light' | 'light']`. Copy the app's theme blocks and rewrite only the selector, keeping the token names and values: Photo's `[data-brightness='dark']` block becomes `[data-theme='dark'] .kit-photo`. When the app has more than two levels, map its darkest default onto `dark` and its lightest onto `light`, and say in `kit.json` `themes` which app themes they are. A component that reads the app's own attribute (a `[data-brightness]` selector copied from the app's CSS) can set it in `apply` from the theme instead.

## Phone layout

The kit shows its phone layout through a container query, not a viewport media query, because the kit is rendered inside a frame at a set size. Make the kit root a size container and write the narrow rules inside `@container`:

```css
.t-app { container-type: size; width: 100%; height: 100%; }

@container (max-width: 600px) {
  .t-shell { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .t-side { border-right: 0; border-bottom: 1px solid var(--line); }
  .t-main { padding: 24px 16px; }
}
```

A scene with `frame: "phone"` and a `viewport` of `[390, 780]` triggers it. A kit that does not need a phone layout (a desktop-only tool) may skip it, but then no scene can use a phone viewport.

## Film tokens

The film layer around the kit (backdrop, window shadow, callouts, browser and phone chrome) has neutral defaults. A kit can set `--reel-*` custom properties in `kit.css` to match the app's look. Custom properties pass into the shadow root, so set them on `:host` or `.rf-stage`. Dark values use the plain name, light values add a `-light` suffix.

- `--reel-backdrop`, `--reel-backdrop-deep`, `--reel-glow`: the backdrop gradient (outer, deep edge, centre glow).
- `--reel-window-shadow`: the frame's full `box-shadow`.
- `--reel-callout-bg`, `--reel-callout-fg`, `--reel-callout-line`: the callout pill and its lead line.
- `--reel-chrome-bg`, `--reel-chrome-line`, `--reel-chrome-fg`, `--reel-chrome-field`, `--reel-chrome-body`: browser bar and phone body.
- `--reel-callout-font` (default `system-ui, sans-serif`) and `--reel-host-radius`.

Set a few: a brand-tinted backdrop and the callout font are usually enough. Keep chroma low in the backdrop so the UI stays the subject.

## Versioning and the lock

`version` in `kit.js` and `kit.json` is an integer, starting at 1.

- The first scene for an app is storyboarded: 3 to 5 stills with draft callout copy, each next to its reference shot. When the author approves, set `locked: true` in `kit.json`. That locks the kit at its current version, usually 1, and later scenes skip the storyboard. Photo's kit starts at 2 because its version 1 was the hand-built prototype.
- Adding a component to a locked kit does not change the version. Show it beside its reference shot first.
- Changing a locked component bumps `version` in `kit.js` and `kit.json`. Then re-check every scene on the kit, update each scene's `kitVersion` and re-render, so a scene is never silently shown on a kit it was not written for.
- Never edit a locked component to suit one scene without the bump.

## Checklist before storyboarding

- [ ] `kit.js` default export has `name`, `version`, `viewport`, `styles`, `html` and `components`; `fonts` if the app has any.
- [ ] Every component is a pure function of its props and tweens: no clock, no random, no timers.
- [ ] Every prop has a default, and `apply` with no props renders a sensible state.
- [ ] No reliance on CSS transitions or animations.
- [ ] Tokens are the app's real values (or `eyeballed: true` and the storyboard says so).
- [ ] Fonts are copied with a licence recorded; icons have a source and licence.
- [ ] Both themes render and match the reference shots.
- [ ] The phone layout works at the narrowest viewport a scene will use.
- [ ] Every surface the camera will frame tightly matches its reference shot side by side.
- [ ] `kit.json` is complete: `builtFrom` has the commit, `tokenSources` are listed, `components` and `themes` match the kit.
- [ ] Targets the scene needs have stable selectors (ids or `data-id` on rows, not positional selectors).
