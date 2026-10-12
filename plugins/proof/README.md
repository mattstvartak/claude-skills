# proof

Two skills that make Claude show its work. Neither runs on its own. You call
them when you want the discipline.

- **`/tdd`** builds a feature or fix test-first, one vertical slice at a time.
  It agrees the test seams (the public interfaces tests live at) with you
  before writing any test. If the seam is already named in a build plan task
  (`docs/blueprint/BUILD-PLAN.md`) or a founder brief (`docs/founder/briefs/`),
  it uses that and says so. Behaviours come from the acceptance criteria in
  `docs/SOW.md` or the brief when they exist. It uses your existing test
  runner, and proposes the mainstream one for your stack if there isn't one.
- **`/debug`** works a hard bug or performance regression through gated
  phases: a check that fails on this bug, a minimal repro, written hypotheses
  that each name what would prove them wrong, instrumentation to go get that
  evidence, a root-cause fix with a regression test, and cleanup. It labels
  every diagnosis verified or suspected and never proposes a destructive step on
  an unverified theory.

```
/tdd add coupon expiry to checkout
/tdd                                  # continue the current feature test-first
/debug orders page takes 12s to load
/debug                                # debug whatever just broke
```

Inspired by [Matt Pocock's skills](https://github.com/mattpocock/skills).
See `NOTICE`.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install proof@claude-skills
```
