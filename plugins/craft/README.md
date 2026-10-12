# craft

A Claude Code plugin for designing and building premium web and app
interfaces: marketing sites, web apps, mobile apps and desktop UI.

Left alone, a coding model tends to produce the same interface every time. A
default component kit, one sans-serif, an accent on everything, a centred hero
over three cards, no pressed or empty states, a dark mode that's an inversion.
craft gives Claude a process and a bar to work to, then makes it check the
rendered result instead of trusting the source.

## What it does

1. **Brief.** A short interview covering who it's for, the one action that
   matters, the brand assets that already exist, personality, how expressive
   to be, and whether Claude writes the real copy.
2. **Taste.** Claude finds 8 to 12 real sites or apps that fit the request and
   screenshots them. You mark what you like and dislike in a local picker page,
   and the recurring qualities go into the brief.
3. **Tokens.** An OKLCH colour system taken from the brand, with light and dark
   both designed and checked with APCA contrast, plus a type scale, spacing,
   radii, elevation and motion.
4. **Prototype.** The key screens in the real stack with mock data and every
   state, for you to review before any production wiring.
5. **Build.** Next.js + Tailwind (shadcn and Radix, restyled) or Expo/React
   Native, following surface guides for marketing, web apps, mobile and desktop.
6. **Verify.** Headless screenshots in every theme and viewport, with lint for
   contrast, invisible focus, off-scale spacing, overflow, tap targets and more.
   Then an interaction pass in your browser and a critic agent review.

It also includes a scroll mode for landing pages told through scrolling:
layered heroes, scroll-scrubbed video, and imagery generated through kie.ai.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install craft@claude-skills
```

Then ask for a design, or invoke the skill directly.

## Requirements

- Node 20 or later and npm. The scripts install Playwright and colorjs.io into
  `~/.cache/craft-tools` the first time they run, so your project's
  dependencies stay untouched. You can change that location with
  `CRAFT_TOOLS_DIR`.
- For generated imagery and video, a kie.ai API key in `KIE_AI_API_KEY`. Put
  it in your shell environment or in a `.env` file your project ignores. See
  `.env.example`.
- For scroll-scrubbed video, a full ffmpeg build.

`node plugins/craft/skills/craft/scripts/doctor.mjs` shows what's installed.

## Licence

Apache-2.0. The scroll module is adapted from
[scroll-craft](https://github.com/nateherkai/scroll-craft) by Nate Herk
(MIT). See `NOTICE` and `licenses/`.
