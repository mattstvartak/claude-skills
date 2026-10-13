# Media

Photos and other images inside a scene (a picture in a photo editor's canvas, a hero shot). Everything goes through `scripts/media.mjs`, which copies the file into the scene's own folder, `<dir>/scenes/<id>/media/`, and records where it came from in `<dir>/media/licences.json`. Media stays inside the scene folder because validate rejects paths outside it and export ships only that folder. In `scene.json`, point at `media/<file>`.

## Where to look, in order

1. Files the user supplied. Ask first. Record `source: supplied`, the author and the licence they hold the file under ("own work", "client-owned").
2. Free-licence stock. Record the page URL, the author and the licence line.
   - Openverse (openverse.org): each result carries its own licence, often CC0 or CC BY. CC BY needs the author credited. Skip any NC or ND result.
   - Unsplash: the Unsplash licence allows commercial use without credit, but you may not resell the photo on its own or build a competing photo library.
   - Pexels: the Pexels licence allows commercial use without credit, with the same limit on reselling unmodified files.
   Run `node scripts/media.mjs add <file-or-url> --scene <id> --author "Name" --licence "CC0" --url <page url> [--name <file>]`. A URL is downloaded and recorded as stock. The extension comes from the URL path or the content type; `--name` sets the file name. An add is refused when a file of that name exists with different bytes. Stock needs author, licence and url or the command refuses.
3. kie.ai generation, only when the user asks for it. Stills only, no video.

## Generating

Never generate on your own initiative. Money is spent.

1. Run `node scripts/media.mjs estimate --calls N --credits-per-call C [--usd-per-credit R]` and show the user the model, the number of calls and the cost.
2. The per-image price is not looked up for you. It was not verified from kie.ai's pricing page when this was written, so the estimate says "cost: unknown" unless you pass the rate. Read the current rate from https://kie.ai/pricing or the model's page and tell the user where the number came from. Do not guess one.
3. Wait for a yes.
4. Run `node scripts/media.mjs generate "<prompt>" <name.png> --scene <id> --calls N --credits-per-call C --confirm <credits>`. It refuses, before any call, when `--confirm` is below the estimate, the account holds fewer credits than the estimate, or a file of that name is already in the scene's media. After the run it records the real cost (the credit balance before minus after) in `costIfGenerated` and reports it.

The key is `KIE_AI_API_KEY`, read from the environment only. There is no `.env` lookup. It is never printed, logged or written to a file.

## licences.json

An array in `<dir>/media/licences.json`, one entry per file. `file` is the path relative to the reel dir:

```json
{ "file": "scenes/harbour/media/harbour.jpg", "source": "stock", "author": "Jane Doe", "licence": "CC0", "url": "https://openverse.org/image/...", "costIfGenerated": null }
```

`source` is `supplied`, `stock` or `generated`. `costIfGenerated` is credits and only set for generated files. Adding the same file again replaces its entry. Each generated image is recorded as it lands.

## Check before export

`node scripts/media.mjs check [siteDir]` lists every file in each scene's `media[]` that is missing on disk or has no entry, and any licence that blocks a public marketing page: NC and ND variants, "all rights reserved" and "unknown". Fix those before exporting.

## Reference screenshots are not media

Reference shots of the user's app live in `reel/references/<app>/` (see `survey.md`) and are for building and checking the kit. They never go in `media[]` and are never exported: export copies only `runtime/`, the kit folder and the scene folder, and skips any `references/` folder inside a kit.
