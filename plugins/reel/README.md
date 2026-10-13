# reel

A Claude Code plugin that turns a feature of your app into a short product film
for a marketing page. It isn't a screen recording. Claude surveys the app,
rebuilds the screens as animated HTML, and you get a live embed plus exported
video.

## What it does

Type `/reel` and a sentence, like "show reordering layers in the photo editor". Claude
looks at the running app, builds only the UI pieces the scene needs, writes a
storyboard for you to approve, animates it, and exports it. The result stays
sharp at any size, follows the site's light and dark theme, and loads far
lighter than a video.

## Status

Version 0.1.0 is verified on Linux, with one real app (a desktop photo editor
built on Electron) and a toy notes app. macOS and other kinds of app (web,
Android) are expected to work but haven't been tested yet.

## Requirements

- Linux. macOS should work but is untested.
- Node 20 or later.
- A full ffmpeg build (with scale, fps and palettegen). `doctor` checks.
- Chromium for headless rendering. `doctor` bootstraps Playwright's Chromium
  into a user cache the first time, so your site's package.json stays untouched.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install reel@claude-skills
```

## First run

1. Run `/reel` with a sentence about the feature.
2. `doctor` checks Node, Chromium and ffmpeg, and `doctor --init` writes
   `reel.json` with your app's source path and where the reel folder lives.
3. Claude surveys the app headlessly and builds the kit: the app's own colours,
   fonts and components.
4. Claude writes a storyboard. Nothing is animated until you approve it.
5. Claude animates the scene.
6. You review it in a private preview page, in desktop and phone framing.
7. Export writes the embed and files, runs the fit, loop and weight checks, and
   prints the snippet to paste.

## What lands in your site

- `reel.json` at the site root: where your apps and the reel folder live.
- `reel/kits/<app>/`: the app's look and components, committed.
- `reel/scenes/<scene>/`: the scene and its storyboard, committed.
- `publicDir` (default `public/reel/`): the built embed, MP4, WebM, GIF,
  posters and scrub video.

## Embed

```html
<script type="module" src="/reel/runtime/reel.js"></script>

<reel-scene src="/reel/scenes/reorder/scene.json" drive="inview" style="max-width: 960px">
  <img src="/reel/scenes/reorder/poster.jpg" width="960" height="600" alt="Reordering layers in a photo editor">
</reel-scene>
```

`drive` takes `autoplay`, `inview`, `scroll` or `manual`. See
[the embed reference](skills/reel/references/embed.md) for each mode, React and
driving a scene from GSAP.

## Privacy

- Everything runs headless. Nothing opens on your display.
- Reference screenshots stay in `reel/references/` and are never exported.
- Previews are private to you.
- kie.ai image generation (stills only) is opt-in. The cost is shown and confirmed first,
  and the key is read from `KIE_AI_API_KEY` and never logged.
- No telemetry in the plugin or the embed.

## Licence

Apache-2.0. See `LICENSE` and `NOTICE`.
