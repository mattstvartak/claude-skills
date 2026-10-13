# How to use claude-skills

This guide covers installing the plugins, what each one does day to day, and how to run a project through all of them. For a quick overview, see the [README](../README.md).

- [Install](#install)
- [kickoff](#kickoff)
- [founder](#founder)
- [blueprint](#blueprint)
- [craft](#craft)
- [reel](#reel)
- [foreman](#foreman)
- [proof](#proof)
- [trim, napkin and pager](#trim-napkin-and-pager)
- [nitpick](#nitpick)
- [A full project, start to finish](#a-full-project-start-to-finish)
- [Updating and removing](#updating-and-removing)
- [Troubleshooting](#troubleshooting)

## Install

In Claude Code:

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install kickoff@claude-skills
/plugin install founder@claude-skills
/plugin install blueprint@claude-skills
/plugin install craft@claude-skills
/plugin install reel@claude-skills
/plugin install foreman@claude-skills
/plugin install proof@claude-skills
/plugin install trim@claude-skills
/plugin install napkin@claude-skills
/plugin install pager@claude-skills
/plugin install nitpick@claude-skills
```

Or from a terminal, with `claude plugin marketplace add` and `claude plugin install` and the same arguments. Restart Claude Code afterwards.

Install only what you'll use. kickoff, founder and foreman need blueprint, because they work from its SOW and build plan. The others stand alone. trim replaces [ponytail](https://github.com/DietrichGebert/ponytail), so don't install both.

**Requirements.** trim, napkin and pager run small Node hooks, so `node` must be on the PATH Claude Code uses for hooks. craft needs Node 20 or later. Its scripts install Playwright into `~/.cache/craft-tools` the first time they run. reel needs Node 20 or later and a full ffmpeg build. It uses craft's Playwright when that's already installed, and otherwise installs its own into `~/.cache/reel-tools`.

**More than one Claude account on a machine.** Each config directory has its own plugins. If you run a second account with `CLAUDE_CONFIG_DIR=~/.claude-work`, install there too:

```
CLAUDE_CONFIG_DIR=~/.claude-work claude plugin marketplace add mattstvartak/claude-skills
CLAUDE_CONFIG_DIR=~/.claude-work claude plugin install founder@claude-skills
```

**Working on the plugins themselves.** Point the marketplace at your clone instead of GitHub, so changes show up after a version bump without a push:

```
claude plugin marketplace add ~/path/to/claude-skills
```

## kickoff

kickoff runs the other skills in order so you don't have to remember which comes next. Run `/kickoff` to start a project, or `/kickoff <your idea>` to start with the idea, and run it again whenever you come back.

It first checks which plugins are installed and prints the install commands for any that are missing. Only blueprint is required. Then it reads the project's docs and picks the stage:

| Stage | When | Runs |
|---|---|---|
| Vision | New product, no vision or SOW yet | `/founder vision` |
| Scope | No SOW, or the SOW is still a draft | `/blueprint` |
| Vision check | SOW agreed, no build plan yet | `/founder vision` against the SOW |
| Design | The SOW has screens and no prototype is approved | `/craft`, up to the prototype review |
| Build plan | No build plan | blueprint's build plan |
| Questions | Blocking questions open for the next phase | `/founder questions` |
| Brief | The next phase has no brief | `/founder brief <phase>` |
| Build | A phase is unfinished | `/foreman <phase>` |

When a stage finishes it reads the docs again and moves on. It stops for you to agree the SOW, approve the prototype and say yes before foreman starts a build. Name a stage to jump to it: `/kickoff design`.

kickoff keeps no state of its own. The only thing it writes is a dated "prototype approved" entry under Decisions in `docs/blueprint/NOTES.md`, which is how later runs know design is done.

## founder

The founder turns your vision into paper the agent teams can build from, then runs the loop back to you. It thinks big, expects a lot from the team, and never quietly decides something that's yours to decide.

| Command | What happens |
|---|---|
| `/founder` | Reads the project docs and tells you where things stand: vision, SOW, open questions by urgency, the next phase to brief. |
| `/founder vision` | Talks the idea through with you and writes `docs/founder/VISION.md`, then hands off to blueprint for the details. Once the SOW is agreed, it checks the SOW against the vision. |
| `/founder brief phase-2` | Writes a one-page brief in `docs/founder/briefs/` for a build phase: why it matters, what great looks like, what done means, what the team may decide alone, and when to stop and ask. |
| `/founder questions` | Works through `docs/founder/QUESTIONS.md`. It answers what the docs already settle, makes small reversible calls itself and lists them so you can overrule, and brings you the rest a few at a time with a recommendation for each. |

**The question loop.** Every brief tells the build agents how to ask. When a team hits a choice that changes the product, costs money, touches personal data or can't be undone, it adds an entry to the inbox:

```markdown
## Q-3: No-show deposits
- From: phase 2 / booking API
- Blocking: yes
- Question: Do we keep the deposit when a guest doesn't show up?
- Assumed meanwhile: stopped
- Status: open
```

Non-blocking questions carry the assumption the team went ahead with, so the build doesn't stall. When you run `/founder questions`, answers go back into the inbox, decisions into `docs/blueprint/NOTES.md`, and scope changes into the SOW. You get a short update to paste into the build session.

## blueprint

blueprint interviews you in normal conversation until it can write a complete statement of work. It asks two or three questions at a time, keeps a coverage tracker, pushes back on scope and proposes an MVP cut. For an existing codebase it maps what's there first and asks only about what's changing.

Start it with `/blueprint`, or just describe an app idea. It pauses and resumes across sessions.

If founder already wrote `docs/founder/VISION.md`, blueprint reads it first and confirms the purpose, success and main users from it instead of asking again. Its MVP cut stays clear of the vision's "Must not block" list. Once you agree the SOW, any questions still open move to founder's inbox, so there's one list to work from during the build.

What it writes:

| File | Contents |
|---|---|
| `docs/SOW.md` | Product definition and technical plan. The source of truth. |
| `docs/blueprint/spec.json` | The same content as structured data |
| `docs/blueprint/NOTES.md` | Answers in your words, decisions with reasons, open questions |
| `docs/blueprint/TRACKER.md` | Coverage by topic |
| `docs/blueprint/BUILD-PLAN.md` | Ordered tasks, each about 15 to 20 minutes of agent work, in phases that end in something runnable. Each task lists what blocks it and the seam its tests go through, which foreman and `/tdd` use. |
| `design/BRIEF.md` | A head start for craft |
| `docs/blueprint/KICKOFF.md` | A prompt to start a fresh build session |

## craft

craft designs and builds interfaces that don't look like every other generated app. Start it with `/craft`, or ask for a landing page, a dashboard, app screens or a redesign.

1. **Brief.** A short interview: who it's for, the one action that matters, brand assets, personality. If blueprint wrote `design/BRIEF.md`, craft skips what's answered.
2. **Taste.** It finds 8 to 12 real sites that fit, and you mark likes and dislikes in a local picker page.
3. **Tokens.** An OKLCH colour system with designed light and dark themes, a type scale, spacing, radii and motion.
4. **Prototype.** The key screens in the real stack with mock data and every state. You review it before any production wiring.
5. **Build.** Next.js and Tailwind, or Expo for mobile.
6. **Verify.** Screenshots in every theme and viewport, lint for contrast, focus, spacing and tap targets, then a critic agent's review.

For a landing page told through scrolling, ask for a scroll or cinematic landing page. Generated imagery in that mode needs a `KIE_AI_API_KEY` in your environment (see `plugins/craft/.env.example`).

## reel

reel turns a feature of your app into a short product film for a marketing page. It doesn't record the screen. It reads the app's source and screenshots, rebuilds the screens it needs as animated HTML, and directs a camera, cursor and callouts over them. One scene gives you a live embed that stays sharp and follows the site's light and dark theme, plus MP4, WebM, GIF and a poster. Start it with `/reel` and a sentence, like `/reel show reordering layers in the photo editor`.

1. **Setup.** `doctor` checks Node, Chromium and ffmpeg, and writes `reel.json` in your site repo with where the app's source lives.
2. **Survey.** reel runs the app headlessly, takes reference shots and reads its colours, fonts and icons. Nothing opens on your screen.
3. **Kit.** It builds only the pieces of the app's UI the scene needs, from the app's real values.
4. **Storyboard.** For an app's first scene, you approve 3 to 5 stills, each beside its reference shot. Approval locks the kit, so later scenes reuse it.
5. **Motion.** reel animates the scene and publishes a private preview page with a player, desktop and phone framing, and both themes. You approve it on desktop and on a phone.
6. **Export.** Writes the embed and video files into your site, checks the weight budget (100 KB gzipped), that text stays readable down to the scene's smallest width, and that the loop has no seam. Then it prints the HTML and React snippets.

Kits and scenes live in your site's repo, next to the pages that use them. Reference shots never leave `reel/references/`. Images inside a scene come from you or a stock library first. Generating one with kie.ai happens only when you ask, after reel shows the cost, and needs `KIE_AI_API_KEY` in your environment (see `plugins/reel/.env.example`). Scenes can autoplay, play when in view, follow the scroll, or be driven by your own code, GSAP included. `plugins/reel/skills/reel/references/embed.md` has each mode.

Version 0.1.0 is verified on Linux with one real desktop app, plus a small toy kit. macOS, web apps and Android apps should work but haven't been tested yet.

## proof

Two on-demand skills for proving code works.

**`/tdd`** builds a feature or fix test-first, one behaviour at a time. It takes the behaviours from the SOW or the phase brief, agrees the test seams with you (or uses the seam from the build plan task), and uses the project's own test runner. Each slice is a failing test, then the least code that passes. Tests go through public interfaces, so they survive refactors. Mocks only at system boundaries like payment providers or the clock.

**`/debug`** works a hard bug or performance regression through gated phases:
1. A check that fails on this exact bug.
2. Minimise the failing case.
3. Three to five hypotheses, each with the observation that would prove it wrong.
4. Instrument and get that observation.
5. Fix the verified cause and turn the repro into a regression test.
6. Remove every temporary probe.

It says whether each diagnosis is verified or suspected and never suggests a destructive step on a guess.

## trim, napkin and pager

Three always-on modes. trim is a lazy senior developer, napkin a lazy senior architect and pager a lazy senior DevOps engineer. All three push Claude toward the fewest moving parts that fully solve the task. When more than one is active, they end each reply with a single combined note on what was skipped and any risk.

They load at the start of every session and into every subagent, but each one's rules apply only in its area:

- **trim**: application code. Reuse what the codebase, the platform and installed dependencies already do before writing anything, no abstractions or options nobody asked for, the shortest diff that finishes the job, and a small test for any non-trivial logic. `/trim-debt` lists every `shortcut:` comment in the repo, from all three modes, with its limit and upgrade trigger. `/trim-audit` audits the whole repo for bugs, security holes, load problems, untested risk, slow paths and code to delete.
- **napkin**: system design, service boundaries, data models, datastore and framework choices, technical plans. It prefers the existing app and database, one deployable, and today's scale plus one order of magnitude. It writes down the number at which to revisit.
- **pager**: CI/CD, Dockerfiles, deploy scripts, hosting and env config, IaC, DNS, cron, monitoring. It prefers the platform's built-in features and managed services. Every change comes with how to verify it and how to undo it. It won't deploy, destroy, migrate or change DNS on a live system without your go-ahead.

**Levels.** Type these as a prompt:

| Command | Effect |
|---|---|
| `/napkin lite` | Builds what you asked, names the simpler option in one line, and lets you pick |
| `/napkin` or `/napkin full` | The full rules. The default. |
| `/napkin ultra` | Also pushes back on the requirement itself |
| `/napkin off` or `stop napkin` | Off for the rest of this session |
| `/napkin default lite` | Sets the level new sessions start at |

trim and pager work the same way with `/trim` and `/pager`. The level is per session. State lives in `~/.claude/.trim/`, `~/.claude/.napkin/` and `~/.claude/.pager/`, or under `CLAUDE_CONFIG_DIR` if you set it.

## nitpick

A code review from an opinionated senior developer who nitpicks everything. It runs in a fresh subagent, so it judges the code without the reasoning that produced it.

```
/nitpick                 # uncommitted changes plus the branch against its base
/nitpick feature/foo     # a branch
/nitpick main..HEAD      # a ref range
/nitpick 123             # a GitHub PR
/nitpick src/lib/date.ts # whole files
/nitpick --spec docs/specs/checkout.md   # name the spec yourself
```

Two reviewers run in parallel, each in a fresh subagent.

**Standards.** It checks naming and readability, function and file size, nesting, magic values, dead code, types, error handling, repetition, whether a helper already exists in the codebase, and whether new dependencies are mainstream and maintained. It looks up each new package's release history and downloads rather than guessing. It also flags the classic smells from Fowler's *Refactoring* (feature envy, data clumps, primitive obsession, shotgun surgery, speculative generality and the rest) as judgement calls, unless the repo's own conventions endorse the pattern.

**Spec.** It finds what the change was supposed to do: a `--spec` path, ticket references in the commits, the build plan rows and founder brief for the files touched, a spec file named after the branch, or the SOW's acceptance criteria. It asks if it finds nothing, and skips this review if there's no spec. Every requirement comes back as met, partly met, missing, extra (added beyond the spec) or contradicted, with `file:line` evidence.

You get a verdict (Request changes, Approve with nits, or Approve) and findings ranked must, should and nit. Each has a `file:line` and the fix. Problems in code the diff didn't touch go in a separate, non-blocking list. It never edits files. Ask Claude to apply the findings when you want them fixed.

Both reviewers run on Sonnet. Change `model` in `plugins/nitpick/agents/` for a heavier review.

## foreman

foreman builds a phase of blueprint's plan with a team of agents. Run it in your main session.

```
/foreman             # the next unfinished phase
/foreman 2           # a specific phase
/foreman 2 --max 5   # up to 5 workers at once (default 3, fewer when memory is low)
```

Before it starts, it checks the tree is clean, the plan is runnable (every task has a "Blocked by", and tasks that can run together don't edit the same file) and finds the project's typecheck, lint and test commands. It works on your feature branch, or creates `build/<phase>` if you're on a trunk.

Then it loops. Every task whose blockers are merged goes to a Sonnet worker in its own git worktree. The worker builds the task test-first through its seam, runs the checks, commits on `foreman/<task>` and reports. foreman merges each finished branch, runs the checks again, and hands any conflict or failure to an Opus integrator that keeps both tasks' intent and never weakens a test. A worker that hits a product decision finishes what it can and reports the question; foreman puts it in founder's inbox and the rest of the phase carries on.

The phase ends with nitpick against the plan and brief, one fix pass, and a report: what's done, blocked or failed, the commits, the check results, assumptions to confirm, questions for you, and token spend. Progress is saved in `docs/foreman/PROGRESS.md`, so `/foreman` picks up a stopped run.

foreman never pushes, opens a pull request, merges into a trunk or deploys.

## A full project, start to finish

`/kickoff` walks you through these steps and resumes from wherever you left off. To run them by hand:

1. **`/founder vision`**. Describe the idea. The founder asks who it's for, what makes it remarkable and where it goes, and writes `VISION.md`.
2. **blueprint takes over**. The interview fills in users, flows, data, integrations and hosting. Agree the SOW and the MVP cut.
3. **`/craft`**. Pick a direction in the taste picker, review the prototype, iterate until it's right.
4. **`/founder brief 1`**. A one-page brief for the phase.
5. **`/foreman 1`**. Workers build the phase in parallel, test-first, with trim, napkin and pager active. Product questions land in `docs/founder/QUESTIONS.md` while the rest keeps moving.
6. **`/founder questions`**. Answer what's yours. Unblocked tasks go into the next `/foreman` run.
7. **Review the report.** foreman has already run nitpick and one fix pass. Read what's left, the assumptions and the check results, then push and open the PR yourself.
8. Repeat 4 to 7 for each phase. Use `/debug` whenever something breaks in a way that isn't obvious.

## Updating and removing

```
/plugin marketplace update claude-skills
/plugin update <plugin>@claude-skills
/plugin remove <plugin>
```

Removing trim, napkin or pager leaves its small state folder (`~/.claude/.trim/` and so on). Delete it if you like.

## Troubleshooting

- **A command doesn't exist after install.** Restart Claude Code. Plugins load at session start.
- **trim, napkin or pager seems inactive.** Check that `node` runs from a non-interactive shell (`bash -c 'command -v node'`), and that you haven't turned it off this session. Run `/trim`, `/napkin` or `/pager` to switch it back on.
- **An update didn't arrive.** Installs are cached by version. Run `/plugin marketplace update claude-skills`, then update the plugin.
- **founder or foreman says blueprint is missing.** Install it: `/plugin install blueprint@claude-skills`.
