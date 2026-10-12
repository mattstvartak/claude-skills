# foreman

Runs the build. blueprint writes a plan of small tasks with dependencies;
foreman builds a phase of it with a team of agents and tells you honestly what
got done.

- **Parallel where it can be.** It reads each task's "Blocked by" and runs every
  task whose blockers are merged at the same time, each Sonnet worker in its own
  git worktree so they can't trip over each other.
- **One integration branch.** Finished tasks merge into `build/<phase>` (or
  your feature branch) and the project's checks run after every merge. Merge
  conflicts and failing checks go to an Opus integrator that keeps both tasks'
  intent and never weakens a test to get to green.
- **Test-first.** Tasks with a seam are built through it with `/tdd` from the
  [proof](../proof) plugin when it's installed.
- **Questions go to you, not into the code.** A worker that hits a product
  decision finishes what it can and reports the question. foreman adds it to
  founder's inbox and keeps the rest of the phase moving.
- **Reviewed before it's done.** The phase closes with a [nitpick](../nitpick)
  review against the plan and brief, one fix pass, and a report with the check
  results, assumptions to confirm and token spend.
- **It doesn't ship.** No pushes, pull requests, trunk merges or deploys.

```
/foreman             # the next unfinished phase
/foreman 2           # a specific phase
/foreman 2 --max 5   # up to 5 workers at once (default 3)
```

Progress is kept in `docs/foreman/PROGRESS.md`, so a stopped run picks up where
it left off.

Works best with [blueprint](../blueprint) (the plan), [founder](../founder)
(briefs and the question inbox), [proof](../proof) and [nitpick](../nitpick).
It needs a build plan in blueprint's format; the others are optional.

The approach was inspired by `implement-spec` in
[Matt Pocock's skills](https://github.com/mattpocock/skills). See `NOTICE`.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install foreman@claude-skills
```
