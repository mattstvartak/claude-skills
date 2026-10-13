<p align="center">
  <img src="assets/banner.svg" alt="claude-skills: a small senior team for Claude Code" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img alt="Licence: Apache-2.0" src="https://img.shields.io/badge/licence-Apache--2.0-1f2533?style=flat-square"></a>
  <img alt="Claude Code plugins" src="https://img.shields.io/badge/Claude%20Code-plugins-e86a5a?style=flat-square">
  <img alt="Eleven plugins" src="https://img.shields.io/badge/plugins-11-f2a65a?style=flat-square">
</p>

<p align="center">
  <b>A founder, a designer, a foreman, an architect, an ops engineer, a lazy senior dev and a reviewer, each with strong opinions.</b><br>
  Matt Stvartak's Claude Code plugins for taking an app from an idea to shipped code without the usual mess.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#the-team">The team</a> ·
  <a href="#how-they-fit-together">How they fit together</a> ·
  <a href="docs/GUIDE.md">Guide</a>
</p>

---

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install kickoff@claude-skills
```

Install the rest the same way, or only the ones you want. Restart Claude Code to load them. The [guide](docs/GUIDE.md) covers each one in detail.

## The team

| | Plugin | Role | You run it |
|---|---|---|---|
| 🚦 | [**kickoff**](plugins/kickoff) | The front door. Reads the project's docs, works out the stage and runs the right skill next, pausing at the calls that are yours. | `/kickoff` |
| 🧭 | [**founder**](plugins/founder) | Turns your vision into a vision doc and one-page briefs for agent teams, collects their questions and works through every open detail with you. | `/founder` |
| 📐 | [**blueprint**](plugins/blueprint) | Interviews you until it can write a full SOW, then a build plan sized for agent batches and a kickoff prompt. | `/blueprint` |
| 🎨 | [**craft**](plugins/craft) | Designs and builds premium interfaces: brief, taste picker, OKLCH tokens, a prototype for review, production code, screenshot checks. | `/craft` |
| 🎬 | [**reel**](plugins/reel) | Turns a feature of your app into a short product film for a marketing page. The UI is rebuilt as animated HTML, so you get a live embed that follows the site's theme, plus exported video. | `/reel` |
| 🏗️ | [**foreman**](plugins/foreman) | Runs a build phase with parallel agent workers in separate worktrees, merges into one branch, sends questions to founder and closes with a review. | `/foreman` |
| ✅ | [**proof**](plugins/proof) | `/tdd` builds test-first through agreed seams, one slice at a time. `/debug` reproduces, hypothesises, proves and fixes hard bugs. | `/tdd` `/debug` |
| ✂️ | [**trim**](plugins/trim) | Lazy senior developer. The smallest complete code change, no unrequested abstractions, deletion over addition. | always on |
| 🧻 | [**napkin**](plugins/napkin) | Lazy senior architect. Fewest components that meet the real requirements, sized for today's scale. | always on |
| 📟 | [**pager**](plugins/pager) | Lazy senior DevOps. Fewest moving parts, managed over self-hosted, every change with a way back. | always on |
| 🔍 | [**nitpick**](plugins/nitpick) | Opinionated senior dev review: readable names, clean structure, no repetition, code smells, mainstream libraries, plus a second reviewer checking the change against its spec. | `/nitpick` |

**Always on** means the plugin adds its rules at the start of every session and to every subagent, and the rules only kick in when the task is in its area. trim covers application code, napkin system design and pager infrastructure. Switch each with `/<name> lite|full|ultra|off`.

## How they fit together

```mermaid
flowchart LR
  you([Your idea]) --> founder
  founder -->|vision| blueprint
  blueprint -->|SOW and build plan| craft
  craft -->|prototype you approve| foreman
  founder -->|phase briefs| foreman
  foreman -->|tasks| workers[Agent workers, test-first with proof]
  workers -->|questions| founder
  founder -->|the calls that are yours| you
  workers -->|merged branch| nitpick
  nitpick -->|fixes| foreman
  trim -.->|keeps the code small| workers
  napkin -.->|keeps the design small| workers
  pager -.->|keeps the infra small| workers
```

1. **Vision.** `/founder vision` talks the idea through and writes down where it goes, then hands off to blueprint.
2. **Scope.** blueprint interviews you, proposes an MVP cut and writes the SOW and build plan.
3. **Design.** `/craft` builds a prototype from the SOW for you to review before production code.
4. **Brief.** `/founder brief` writes a one-page brief for each phase.
5. **Build.** `/foreman` runs the phase with parallel workers, each building test-first with `/tdd`, while trim, napkin and pager keep the code, design and infrastructure lean.
6. **Questions.** Workers' questions land in founder's inbox. `/founder questions` answers what's settled and brings you the rest.
7. **Review.** foreman closes each phase with `/nitpick`, which checks standards and the spec. `/debug` is there when something breaks.

`/kickoff` runs this whole sequence for you. It reads where the project stands, starts the next step, and moves on when it's done. Each plugin also works on its own.

## Credits

trim is adapted from [ponytail](https://github.com/DietrichGebert/ponytail) by Dietrich Gebert and covers the same ground, so install one or the other. napkin and pager take the same idea to architecture and infrastructure. foreman, proof and nitpick's spec review were inspired by [Matt Pocock's skills](https://github.com/mattpocock/skills). Both projects are MIT licensed; see each plugin's `NOTICE` for what came from where.

## Adding a plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json`, then put skills in `plugins/<name>/skills/<skill>/SKILL.md` and agents in `plugins/<name>/agents/`.
2. Add the plugin to `.claude-plugin/marketplace.json` with `"source": "./plugins/<name>"`.
3. Copy `LICENSE` into the plugin folder. Installs copy only that folder. Third-party material needs its notice in the plugin's `NOTICE`.
4. Bump `version` in both `plugin.json` and the marketplace entry for every change you want installs to pick up. Claude Code caches each installed version, so a new commit under the same version reaches nobody.
5. Run `claude plugin validate .` and `claude plugin validate plugins/<name>`.

Secrets never go in this repo. Plugins read keys from the environment and document them in a `.env.example`. A pre-commit hook runs gitleaks, falling back to a pattern check when gitleaks isn't installed. In a fresh clone, turn it on with `git config core.hooksPath .githooks`.

## Licence

Apache-2.0, unless a plugin's `NOTICE` says a part of it comes from elsewhere.
