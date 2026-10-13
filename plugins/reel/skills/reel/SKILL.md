---
name: reel
description: >
  Make short, film-quality product animations of an app for its marketing page.
  Rebuilds the app's UI as animated HTML from its real tokens, fonts and icons,
  directs it like a product film (backdrop, eased camera, cursor, callouts),
  and exports a live embed plus MP4, WebM, GIF and poster. Use for "/reel",
  "make a product animation", "show reordering layers in <app>", "animate this
  feature for the landing page", "hero loop of the app", "re-export the scene",
  "scroll-driven app demo". Works on any website or app by reading its source,
  never by recording the screen.
---

# reel

reel does not record the screen. It surveys the app's source, builds a small
kit of the surfaces a scene needs (the app's real values), writes the scene as
a timeline on that kit, and renders it. One scene plays live on the page and
renders frame-exact to files. Script paths below are relative to this skill's
folder: run `node <skill-dir>/scripts/<name>.mjs` with the site repo as the
working directory.

## Rules that never bend

- **No takeover.** Everything runs headless. Never open a window, browser,
  file dialog or portal on the user's display, never capture input, never
  touch the clipboard. Web apps: headless Chromium. Electron apps: the app's
  own screenshot mode under a private Xvfb with the `env -i` recipe in
  [survey.md](references/survey.md). Android: the emulator with `-no-window`.
  Do not launch a browser to show the user anything.
- **No per-app code in the plugin.** App knowledge lives in the kit, in the
  site repo.
- **Reference screenshots never reach an export.** They stay in
  `reel/references/`.
- **Secrets stay out of files and output.** The kie.ai key is read from the
  environment only.
- **Real marks and names.** The kit uses the app's real mark and the name it
  shows on screen, as found at survey time. Official marks are copied from
  the app or its design system, never redrawn or recoloured.
- **Two gates, and you stop at each.** Say what you need, then wait.
  1. Storyboard: locks the kit. No animation before the user approves it.
  2. Motion review: the live scene in the preview. No export before approval.

## Commands

The user types `/reel` and a sentence. There are no other subcommands, so read
intent from the sentence.

| The user says | You run |
|---|---|
| `/reel show reordering layers in the photo editor` (a new scene) | Flow 1 or 2 |
| `/reel fix the callout timing in photo-layers` (a revision) | Flow 3 |
| `/reel re-export photo-layers` | Flow 3, export steps only |
| `/reel check my setup` | `node scripts/doctor.mjs` |

Scripts, with their exact lines:

```sh
node scripts/doctor.mjs [siteDir] [--json] [--init [--app <id> --source <path>]]
node scripts/validate.mjs <scene.json>
node scripts/stills.mjs <scene.json> --times 0,2.5,posterAt,storyboard --out <dir> [--theme light|dark|both] [--width N] [--scale 2]
node scripts/preview.mjs <scene.json> --out <file.html> [--stills <dir>] [--report <file.json>]
node scripts/fitcheck.mjs <scene.json> [width ...]
node scripts/render.mjs <scene.json> --out <dir> [--formats mp4,webm,gif,poster,scrub] [--theme light|dark] [--scale 2]
node scripts/export.mjs <scene.json> [--site <dir>] [--formats mp4,webm,gif,poster,scrub] [--skip-video] [--force] [--scale 2] [--report <file.json>]
node scripts/media.mjs add <file|url> --author A --licence L [--url U] [--source supplied|stock]
node scripts/media.mjs check [siteDir]
node scripts/media.mjs estimate [--calls N] [--credits-per-call C] [--usd-per-credit R]
node scripts/media.mjs generate "<prompt>" <name.png> --confirm <credits> --credits-per-call C [--calls N] [--ar 16:9]
```

`--times storyboard` in `stills.mjs` uses the scene's `storyboard.times`.
`export.mjs` runs the fit check, loop check and budget report itself and
prints the snippet to paste. `render.mjs` is for drafts and one-off files.

## Flow 1: first scene for a new app

1. Read the request. Run `node scripts/doctor.mjs`. Fix what it names, or tell
   the user the fix line and stop if it needs their install.
2. If doctor reports `reel.json` as not set up, ask for the app's source
   path, then run the fix line doctor printed:
   `node scripts/doctor.mjs <siteDir> --init --app <id> --source <path>`.
   It updates a `reel.json` found at or above `siteDir`. Otherwise it writes
   one in `siteDir`, or at the nearest site root above the current folder
   when `siteDir` is left out, with `dir` (`reel/`) and
   `publicDir` (`public/reel/`) and never overwrites existing keys. Nothing
   goes in the site's package.json.
3. Survey the app and get reference shots headlessly:
   [survey.md](references/survey.md). Tokens, fonts, icons, surfaces, the app
   commit, and the name and mark the shots show. No readable tokens: the
   `eyeballed` fallback in the same file, and say so in the storyboard.
4. Build only the kit components the scene needs, and write `kit.json`:
   [kits.md](references/kits.md). Media: [media.md](references/media.md).
5. Write `scene.json`: [scene-format.md](references/scene-format.md), with
   direction from [film.md](references/film.md). Set `storyboard.times` to 3
   to 5 beats, and `storyboard.beats` with a title, caption and reference
   shot for each. Run `node scripts/validate.mjs <scene.json>` and fix every
   error it prints. stills, render, fitcheck and export refuse an invalid
   scene anyway.
6. Render the keyframe stills, each beside its reference shot, with draft
   callout copy:
   `node scripts/stills.mjs <scene.json> --times storyboard --out <dir> --theme both`
7. Build the preview with `--stills <dir>` from step 6 and publish it (see
   Preview). It shows the storyboard and the side by side. **Gate 1: stop and wait.** The user approves, or comments and
   you redo steps 4 to 7.
8. On approval, set `storyboard.approvedAt` in `scene.json` and `locked: true`
   in `kit.json`, which locks the kit at its current version:
   [kits.md](references/kits.md), Versioning and the lock.
9. Animate the full scene and add the phone camera track:
   [scene-format.md](references/scene-format.md), [film.md](references/film.md).
   Run `node scripts/fitcheck.mjs <scene.json>` and fix failures (it names the
   framing, width and zoom that would pass).
10. Republish the preview with the live player. **Gate 2: stop and wait.** The
    user reviews in motion on desktop and phone, and approves or comments.
11. Export: `node scripts/export.mjs <scene.json> --site <siteDir> --report <file.json>`,
    with the report file outside the site's public folder (export refuses
    one inside it). Read the report: sizes against the 100 KB budget, fit
    results, loop check. Republish the preview with `--report` so the user
    sees it too. Fix and
    rerun on a failure. Print the snippet and point to
    [embed.md](references/embed.md) for drive modes, React and the GSAP recipe.
    A failed export leaves the last good one in place.

## Flow 2: another scene for an app with a kit

1. Read the request. Read the kit's `kit.json`. If `builtFrom.commit` is far
   behind the app's current commit, say how many commits apart and suggest a
   fresh reference shot before the user approves anything.
2. Write the scene on the locked kit. If it needs a surface the kit lacks,
   build that component, render it beside its reference shot, publish the
   preview and stop for a yes first. Adding a component keeps the version.
   Changing a locked component bumps the version and means re-checking every
   scene on the kit: [kits.md](references/kits.md).
3. No storyboard. Go to Flow 1 steps 9 to 11, gates included.

## Flow 3: revise a scene, or export only

1. Read `scene.json`. Make the edit. Direction changes: [film.md](references/film.md).
   Field questions: [scene-format.md](references/scene-format.md).
2. Run `node scripts/fitcheck.mjs <scene.json>`, rebuild and republish the
   preview. **Gate 2: stop and wait** if the motion changed.
3. Export-only (for example after a kit fix): rerun
   `node scripts/export.mjs <scene.json> --site <siteDir>`. It re-renders every
   file and reruns the checks. If ffmpeg lacks a filter, doctor names it and
   how to get a full build.

## Preview

Build one self-contained page:

```sh
node scripts/preview.mjs <scene.json> --out <file.html> [--stills <dir>] [--report <file.json>]
```

`--stills` fills the storyboard and side by side (from `stills.mjs --times
storyboard --theme both`), and `--report` fills the export report. Sections
without data are hidden.

It holds the player, scrubber, theme, drive and phone toggles, the scene at
`fit.minWidth` beside `fit.size`, the storyboard and side by side, and the
export report. If the Artifact tool exists, publish it as a private Artifact
and republish to the same URL on every revision. Upload videos as assets; the
page limit is 16 MB. If the tool does not exist, leave the file on disk and
give the user its absolute path to open. Do not open it for them.

## Media

Supplied files, then free-licence stock, recorded with
`node scripts/media.mjs add`. kie.ai only when the user asks: show the cost with
`estimate`, get a yes, then `generate` with `--confirm`. Never generate on your
own initiative. Run `node scripts/media.mjs check` before export. Detail:
[media.md](references/media.md).

## References

| Need | File |
|---|---|
| Survey, token sources, headless reference shots, eyeballed fallback | [survey.md](references/survey.md) |
| Building and versioning a kit | [kits.md](references/kits.md) |
| Every `scene.json` field with an example | [scene-format.md](references/scene-format.md) |
| Camera, cursor, callouts, pacing, storyboard | [film.md](references/film.md) |
| Dropping the scene on a page | [embed.md](references/embed.md) |
| Stock, kie.ai, `licences.json` | [media.md](references/media.md) |
