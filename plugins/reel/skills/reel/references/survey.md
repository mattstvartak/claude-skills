# Survey

How reel learns an app from its own source. Nothing here is per-app: the plugin holds the method, the kit holds the app. The output is the first half of a kit (`kits.md` covers building it): a list of surfaces, the token, font and icon sources, reference shots, and the provenance fields in `kit.json`.

Read the app, don't guess it. Every value the kit uses should trace to a file or a shot.

## 1. Find the kind and the surfaces

Look at the app root (the `source` in `reel.json`).

| Signal | Kind |
|---|---|
| `package.json` with `electron`, `electron-vite` or `electron-builder` | desktop |
| `package.json` with `next`, `vite`, `astro` and no Electron, or just an HTML entry | web |
| `build.gradle(.kts)`, `AndroidManifest.xml`, `res/values/` | android |
| Anything else (Tauri, Flutter, native macOS) | other: survey what you can, ask for shots |

Write `kind` into `kit.json`. Then list the surfaces a scene could show: the routes or screens (web), the windows, panels and dialogs (desktop), the activities or Compose screens (android). Take them from the router, the top-level layout component and any existing screenshot or story files. One line each, with the file that renders it. The scene picks from this list, and the kit builds only the ones it picks.

Record the app's current commit now (`git -C <source> rev-parse --short HEAD`) and note whether the tree is dirty. A dirty tree means the shots and the files may disagree.

## 2. Token sources

Find every place the app defines colour, spacing, radius, type and shadow, read the real values, and list the files in `kit.json` `tokenSources`. Read the semantic layer (the names components use), not just the raw palette. Keep the app's own token names in `kit.css`.

**CSS custom properties.** Search for `--` declarations in `*.css`, `*.scss` and the global style entry. Read them in context:
- `:root` is the base. `[data-theme='dark']`, `.dark`, `[data-mode]`, `[data-brightness]` and `@media (prefers-color-scheme: dark)` blocks redefine the same names for other themes. Collect each theme as its own set and list it in `themes`. `light-dark(a, b)` holds both values in one declaration.
- Apps name their theme switch however they like. Write down the attribute or class and its values: the kit maps them onto the runtime's `data-theme` (`kits.md`, Both themes).
- Resolve `var(--x)` chains to the end. A semantic token that points at a primitive needs the primitive copied too.
- Keep the colour space the app uses (`oklch`, `hsl`, hex). Don't convert.

**Tailwind.** Find the version first (`package.json`, and whether a `tailwind.config.*` exists).
- v3: `tailwind.config.js|ts`, with `theme.extend.colors`, `spacing`, `borderRadius`, `fontFamily`. Values often reference CSS variables (`'hsl(var(--primary))'`), so read the CSS file those variables live in too. `darkMode: 'class'` or `'media'` says how themes switch.
- v4: no config file by default. Tokens live in an `@theme { --color-*: ...; --font-*: ...; --radius-*: ... }` block in the main CSS file, with dark values in `.dark { }` or `@media` blocks. `@import 'tailwindcss'` is the entry.
- Utility classes in markup (`bg-zinc-900`, `rounded-lg`) resolve through these. Copy the resolved values, not the class names.

**TS and JSON token files.** `tokens.ts`, `theme.ts`, `design-tokens.json`, `tokens.json` (Style Dictionary, Figma exports), `colors.ts`. Read the object and follow any references. If the same names also exist in CSS, the file is usually the source and the CSS is generated, so list the file.

**Android.** In `res/values/` read `colors.xml`, `themes.xml`, `styles.xml` and `dimens.xml`. Night variants are in `res/values-night/`. For Compose, search `ui/theme/` for `Color.kt`, `Theme.kt`, `Type.kt` and `Shape.kt`: `lightColorScheme(...)`, `darkColorScheme(...)`, `Color(0xFFRRGGBB)` (ARGB, alpha first), `Typography(...)`, `RoundedCornerShape(n.dp)`. `dp` and `sp` map to CSS px at 1:1 for a kit. Dynamic colour (`dynamicLightColorScheme`) comes from the wallpaper and can't be read from source: use the static fallback scheme and say so.

Sizes, radii and shadows are tokens too. If a value is only in a component's CSS, note the file and copy it with the component.

If none of these yields colours, go to section 6.

## 3. Fonts

Find the files, not just the family names.
- Web and Electron: `@font-face` rules and the `src:` URL they point at; `public/fonts/`, `assets/fonts/`; `next/font` or `@fontsource/*` packages (files are in `node_modules/@fontsource/<name>/files/`).
- Android: `res/font/*.ttf|otf`, or `GoogleFont` provider references in Compose (no file in the repo).
- Find the licence next to the font (`OFL.txt`, `LICENSE`, the package's `license` field). If there is none, check the foundry page for the family. If that doesn't settle it, ask the author.

For each font record `{ file, source, licence }` in `kit.json` `fonts`.
- OFL, Apache-2.0 and similar: web-embeddable. Convert to `woff2` if it isn't, copy to the kit's `fonts/`, write `fonts.css`.
- Commercial, "desktop use only", or no licence found: not redistributable. Don't copy the file. Pick the nearest licensed font, record the substitution in `kit.json`, and tell the author in the storyboard.
- System fonts (`system-ui`, `-apple-system`, Roboto on Android) need no file. Record the stack.
- A variable font is one file for all weights. Check which weights the app uses.

## 4. Icons

Find where the icons come from: an `icons/` or `assets/` folder of SVG, a TS or JS module that exports path data, an icon package (`lucide-react`, `@tabler/icons`, `material-icons`), or Android `res/drawable/*.xml` vector drawables.

- Copy the app's own SVG and path data. Record `{ source, licence }` in `kit.json` `icons`.
- A package's licence is in its `package.json` (lucide is ISC, Material Icons is Apache-2.0, Tabler is MIT). The app's own icons carry the app's licence, and the record says so. If the app has no licence file, ask the author before the kit ships them, and record the answer.
- Android vector drawables convert by hand: `pathData` is the SVG `d`, and `viewportWidth` and `viewportHeight` give the `viewBox`.
- An app mark or logo is a separate asset. Copy it from where the app keeps it. Don't redraw or recolour it, and follow the repo's rule for official marks if it has one.

## 5. Reference screenshots

Reference shots are what the kit is checked against, and what the storyboard shows beside each keyframe. Get them without opening anything on the author's display. Nothing in this section may put a window on screen.

Store them in `reel/references/<app>/` (the `referenceShots` path in `reel.json`). Next to them write a `shots.json` or `README.md`: the app commit, the date, how each was taken (the command, or "supplied by author"), the viewport, the theme and the surface. Reference shots can show unreleased UI. They never go into `public/reel/` or an export.

Take one shot per surface the scene needs, per theme the app supports, at the size the scene will use.

**Web (a URL).** Headless Chromium through Playwright, which doctor already checks for:

```js
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'reel/references/<app>/home-dark.png' });
```

Use `colorScheme` for `prefers-color-scheme` apps, or set the `data-theme` attribute for toggle apps. For a phone shot use a 390 x 844 viewport with `deviceScaleFactor: 2` and `isMobile: true`. A dev server needs starting first and stopping after. Pages behind a login need a test account the author supplies: ask, don't create one.

**Desktop, the app has its own screenshot mode.** Look for `--ui-shots`, `--screenshot`, `--capture`, a `tools/*shots*` script, or a test that writes PNGs. This is the best option: it uses the app's own renderer and fixture data. Read the script first for its arguments, its output folder and its exit codes.
- Run it in a throwaway worktree, not the author's checkout: `git -C <source> worktree add <tmp> HEAD`. Copy the build outputs git ignores that the harness needs (native `.node` modules, test data), then install dependencies offline from the lockfile (`pnpm install --offline --frozen-lockfile`). Remove the worktree when done. If you can't run git in the app's repo, ask the session or person who can to set up the worktree.
- Run the harness itself under the headless recipe below, writing to a scratch folder: `env -i ... nice -n 19 node <harness> <scratch>`. `PATH` must include node and the package manager. The harness launches Electron, so `--ozone-platform` can't be passed: dropping `WAYLAND_DISPLAY` (which `env -i` does) is what keeps it on X11, and `ELECTRON_OZONE_PLATFORM_HINT=x11` covers Electron versions that read it.
- Copy the shots the scene needs into `reel/references/<app>/` with clear names, and record the harness's own name for each in `shots.json`.
- Xvfb has no GPU, so WebGL is usually unavailable and a canvas comes out blank. That's fine for the kit: canvas content in a scene is kit-drawn media. Say so in `shots.json`.

**Desktop, no screenshot mode.** Launch Electron headless and capture the window yourself.
- Linux: a private Xvfb plus the `env -i` recipe below. Then drive the page through the app's debug port (`--remote-debugging-port`) with Playwright's `connectOverCDP`, or call `webContents.capturePage()` from a small harness. Never `xvfb-run` or `DISPLAY=:99` alone.
- macOS: create the window hidden (`show: false`) or use offscreen rendering (`webPreferences: { offscreen: true }`) and call `webContents.capturePage()`. No window may appear.
- Don't edit the app to add a screenshot mode. If the harness needs a patch, work in a throwaway copy or ask the author for shots.

The Linux recipe, and why. On a Wayland desktop `WAYLAND_DISPLAY` is set, so Electron picks the Wayland backend and the window lands on the real screen even when `DISPLAY` points at Xvfb. Native Open and Save dialogs go through xdg-desktop-portal, and even a private D-Bus session auto-activates a portal that talks to the real compositor. The reliable fix is to give the process nothing from the desktop:

```sh
Xvfb :99 -screen 0 1600x1000x24 -nolisten tcp &
export PRIV=$(mktemp -d); chmod 700 $PRIV
env -i HOME="$HOME" PATH="$PATH" USER="$USER" LANG="$LANG" DISPLAY=:99 \
  XDG_RUNTIME_DIR=$PRIV XDG_SESSION_TYPE=x11 GDK_BACKEND=x11 QT_QPA_PLATFORM=xcb \
  DBUS_SESSION_BUS_ADDRESS=disabled: NO_AT_BRIDGE=1 \
  nice -n 19 electron . --ozone-platform=x11 <args>
```

Pick a display number nothing else uses. Before driving it, check that `DISPLAY=:99 xdotool search --name <app>` finds the window and that `busctl --user tree org.freedesktop.portal.Desktop | grep request` is empty, and check it again after. Stop Xvfb and delete `$PRIV` afterwards.

**Android.** Start the emulator without a window and take frames over adb:

```sh
emulator -avd <name> -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect &
adb wait-for-device shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'
adb install -r app-debug.apk && adb shell am start -n <pkg>/<activity>
adb exec-out screencap -p > reel/references/<app>/home.png
```

`adb shell cmd uimode night yes` switches the theme. `adb shell wm size 1080x2400` sets the size. Stop the emulator after (`adb emu kill`). With no AVD or APK, don't build one unasked.

**The name on screen.** Take the app's name and mark from the shots, not from plans or docs. If the shots disagree with what the author calls the app, ask which one the film shows.

**Ask the author.** If the app can't run headlessly (needs hardware, a login, a licence), or any step above fails, say what failed and ask for shots. A storyboard can't start without a reference for each surface, so this is a stop, not a skip.

## 6. The eyeballed fallback

When no token files are readable (a compiled app, minified inline styles, an app the author only has shots of):
- Sample colours from the reference shots: background, surfaces, text, accent, border. Take them from flat areas, not antialiased edges or gradients. Get sizes and radii by measuring a shot at a known viewport.
- Name tokens by job (`--surface`, `--text`, `--accent`).
- Set `eyeballed: true` in `kit.json` and leave `tokenSources` empty.
- Say so in the storyboard: "colours sampled from screenshots, not read from the app's tokens". The author should know the fidelity floor before approving.
- A dark and a light shot give both themes. With one shot, the kit has one theme.

## 7. Provenance

Write this into `kit.json` before building components:

```json
"builtFrom": { "source": "../../../../<app>", "commit": "<short sha>", "date": "<YYYY-MM-DD>" }
```

`source` is the path to the app checkout relative to the kit, or the URL for a web app with no checkout. `commit` is the app commit the files and shots were read at (`"live"` for a URL). Later, if the app has moved on, reel counts the commits between the two and suggests a fresh shot before the author approves.

## Worked example: a desktop photo editor

1. Kind: `electron-vite` in `package.json`, so `desktop`. Surfaces from the renderer's layout: window, appbar, options bar, tools, document tabs, canvas, status bar, the dock's icon strip (`DockIconStrip`), and the three dock groups the shots show: Color, Properties and Layers. `app/renderer/src/panels/` has folders only for color, history, layers, navigator and swatches. The rest, Properties included, render as `LaterPanel` placeholders from `panels/registry.ts`, so the shots are the source for what's on screen.
2. Tokens: `app/renderer/src/design/tokens/tokens.css` (primitives and semantic names) and `themes.css`. Themes switch on `[data-brightness='dark' | 'medium-dark' | 'medium-light' | 'light']`, plus `[data-canvas='white']` for the canvas backdrop. The kit maps `dark` and `light` onto the runtime's `data-theme`. Both files go in `tokenSources`.
3. Fonts: Geist and Geist Mono in `app/renderer/src/design/fonts`, OFL-1.1, already woff2. Copy to `fonts/`, record the licence.
4. Icons: `app/renderer/src/design/icons/{ui,tools,panels}.ts` are the app's own path data. The repo has no licence file, so the author confirms the kit may use them. The app's official icon is meant to be shown at 32 px or larger, so it has no place in the 16 px app bar.
5. Shots: the app has `tools/ui-shots.mjs`, which builds, runs `electron . --ui-shots <outDir>`, writes PNGs and a `report.json`, and exits 0 clean, 1 findings, 2 harness failure. Run it in a throwaway worktree under the `env -i` recipe on a private Xvfb, then copy `document.png` and `panel-layers-light-100.png` to `reel/references/photo-editor/` as `document-dark.png` and `document-light.png`. The canvas is blank in both (no WebGL on Xvfb). `shots.json` records the commit, the command and the fixture (layers Sky, Sun, Field, Hidden and Group 1 at 1280 x 900).
6. The name: the product plans and the window title disagreed, and neither was on screen: the window is frameless and the app bar shows a 16 px accent square. The kit copies that square and shows no name. Take the on-screen name from the shots, not the plans. `kit.json` `app` follows the repo name.

## Worked example: a plain web app at a URL

A notes site at `https://notes.example.com`, no checkout, no screenshot mode.

1. Kind: `web`. Surfaces from the site's navigation: note list, editor, settings. Ask the author whether the source is available. Without it, read what the browser serves.
2. Tokens: fetch the page, find the linked stylesheet, and read the `:root` and `[data-theme='dark']` custom properties. They are served as plain CSS, so they count as readable: list the stylesheet URL in `tokenSources` and leave `eyeballed: false`. If the CSS is hashed utility classes with no custom properties, go to section 6.
3. Fonts: the `@font-face` URLs in the stylesheet. Check each licence on the foundry page. A paid font is replaced with a licensed one and the swap is written down.
4. Icons: inline SVG in the page markup, copied from the DOM. An unknown licence means asking the author before shipping.
5. Shots: Playwright at 1280 x 800, once per theme per surface, saved to `reel/references/notes/` with a `shots.json` (`commit: "live"`, the date, the viewport, `colorScheme`).
6. `builtFrom`: `{ "source": "https://notes.example.com", "commit": "live", "date": "<today>" }`.
