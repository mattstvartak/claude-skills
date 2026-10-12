---
name: kickoff
description: >
  One command to start or resume a project with the whole claude-skills team.
  Checks which of founder, blueprint, craft, foreman, proof, nitpick, trim,
  napkin and pager are installed, reads the project's docs to work out where it
  stands, and runs the right skill for the next stage: vision, scope, design,
  build plan, questions, phase brief, build. Pauses at the calls that are the
  user's: agreeing the SOW, approving the prototype, starting a build. Use for
  "kickoff", "kick off this project", "start a new project", "where are we",
  "what's next on this project", or "run the whole process".
argument-hint: "[app idea, or a stage: vision | scope | design | plan | questions | brief | build]"
license: Apache-2.0
---

# Kickoff

You are the front door to the team. You don't do the stages yourself: each one belongs to another skill, and those skills own their files and their conversations. Your job is to check the team is installed, read the project's docs, run the skill for the next stage, and when it's done, read the docs again and move on. Every run of `/kickoff` starts from the files, so it picks up wherever the last session stopped.

## 1. Check the team

Look at the skills available in this session.

| Skill | Plugin | If missing |
|---|---|---|
| blueprint | blueprint | Stop. Nothing after scope works without its SOW and build plan. |
| foreman | foreman | The build stage ends with blueprint's kickoff prompt instead. |
| founder | founder | No vision doc, briefs or inbox. Open questions stay in blueprint's NOTES. |
| craft | craft | No design stage. |
| tdd, debug | proof | Workers build without the test-first loop. |
| nitpick | nitpick | foreman skips its closing review. |
| trim, napkin, pager | trim, napkin, pager | Always-on modes. Check for their "MODE ACTIVE" context at the top of the session. |

For anything missing, print one block the user can paste, then carry on with what's there:

```
/plugin marketplace add OneNomad-LLC/claude-skills
/plugin install <plugin>@claude-skills
```

Plugins load at session start, so new installs need a restart. Say so.

Then check the repo. If it isn't a git repo, offer `git init`; foreman needs one for its worktrees. Note whether the tree is clean, and whether there's existing app code or only docs.

## 2. Work out the stage

Read what exists: `docs/founder/VISION.md`, `docs/SOW.md` (its `Status:` line), `docs/blueprint/TRACKER.md`, the Decisions in `docs/blueprint/NOTES.md`, `design/`, `docs/blueprint/BUILD-PLAN.md`, `docs/founder/QUESTIONS.md`, `docs/founder/briefs/` and `docs/foreman/PROGRESS.md`. The first row that matches is the stage. An argument naming a stage overrides this.

| Stage | When | Run |
|---|---|---|
| Vision | No VISION.md and no SOW, founder installed, and this is a new product. For an existing codebase, ask once whether the change is big enough to need a vision; default to skipping it. | `founder vision`, with the user's idea if they gave one. It hands on to blueprint itself. |
| Scope | No SOW, or `Status: draft` | `blueprint`. It resumes from its tracker. |
| Vision check | SOW agreed, VISION.md exists, no build plan yet | `founder vision` and tell it the SOW is agreed, so it reads the SOW against the vision. Skip if founder already did this in the session. |
| Design | The SOW has screens, craft is installed, and NOTES has no "prototype approved" decision | `craft`. It reads `design/BRIEF.md` and the SOW. Tell it to stop after the prototype review (its phases 1 to 4); production screens come from the build plan. |
| Build plan | No BUILD-PLAN.md | `blueprint` for its build plan handoff. If the prototype exists, the plan's screen tasks build on it. |
| Questions | Open blocking questions in QUESTIONS.md that touch the next phase | `founder questions` |
| Brief | The next unfinished phase has no brief, founder installed | `founder brief <phase>` |
| Build | Otherwise, while a phase is unfinished | `foreman <phase>` |
| Done | Every phase done in PROGRESS.md | Report it. Suggest `/trim-audit` for a whole-repo pass. Pushing, PRs and deploys are the user's. |

The next unfinished phase is the first in BUILD-PLAN.md that PROGRESS.md doesn't show as fully done.

## 3. Show where it stands

Before running anything, show one compact line per stage: done, next, later, or skipped (with why, such as "craft not installed" or "no UI"). Then name the stage you're about to run and the skill that runs it. Keep it under ten lines.

## 4. Run it, then keep going

Invoke the stage's skill with the Skill tool (plugin skills can be named `<plugin>:<skill>`, such as `founder:founder`) and pass the argument shown in the table. Let it run its own conversation. Don't repeat its questions or rewrite its files.

When it finishes, read the docs again, work out the new stage and carry on. Stop and wait for the user at these gates:

- **SOW agreed.** blueprint shows the summary and the user agrees it. Make sure the SOW says `Status: agreed` before moving on.
- **Prototype approved.** craft stops for review. When the user approves, add a dated "prototype approved" entry under Decisions in `docs/blueprint/NOTES.md`, with the render folder and the direction chosen. That entry is how later runs know design is done.
- **Before a build.** foreman launches parallel agents and spends real tokens. Say which phase, how many tasks and the worker cap, check the tree is clean, and wait for a yes.

Also stop when the user says to. Don't loop a stage that just ended without progress; say what's stuck instead.

## 5. Hand back

When you stop, give the user the stage you reached, what changed on disk, what's waiting on them, and the command that resumes (`/kickoff`). Commit the docs if the project is a git repo and the skills you ran haven't already.
