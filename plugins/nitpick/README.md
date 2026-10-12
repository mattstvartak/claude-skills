# nitpick

A code reviewer for Claude Code that acts like an opinionated senior developer
who nitpicks everything. Run `/nitpick` and it reviews your changes in a fresh
subagent, then hands back a verdict and a ranked list of findings, each with a
`file:line` and the concrete fix.

What it holds the code to:

- **Readable.** Names that say what things are, no clever one-liners or nested
  ternaries, early returns over nesting, named constants, comments that explain
  why.
- **Organized.** Small single-purpose functions and files, no dead code or debug
  leftovers, real types, errors handled the way the codebase handles them.
- **Not repetitive.** Duplicated logic becomes a function, repeated markup a
  component, and reimplementing a helper the codebase already has is a
  must-fix. It won't force an abstraction onto code that's only alike by
  accident.
- **Mainstream libraries.** It checks every new dependency's release history,
  downloads and types, flags niche or abandoned packages, and names the popular
  alternative.
- **Consistent.** The codebase's own conventions win over the reviewer's taste.

A second reviewer runs at the same time and checks the change against its
spec. It finds the spec on its own (a `--spec` path, ticket references in the
commits, the build plan task and founder brief, a spec file, or the SOW's
acceptance criteria) and lists each requirement as met, partly met, missing,
added beyond the spec, or contradicted, with `file:line` evidence.

The standards reviewer also checks for the classic smells from Martin Fowler's
*Refactoring*: feature envy, data clumps, primitive obsession, shotgun surgery,
speculative generality and the rest.

It reviews only. Fixes happen after you say so.

```
/nitpick                 # uncommitted changes plus the branch against its base
/nitpick feature/foo     # a branch
/nitpick main..HEAD      # a ref range
/nitpick 123             # a GitHub PR
/nitpick src/lib/date.ts # whole files
/nitpick --spec docs/specs/checkout.md   # name the spec yourself
```

Both reviewer agents run on Sonnet. Change `model` in `agents/nitpick.md` and
`agents/nitpick-spec.md` if you want heavier reviewers.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install nitpick@claude-skills
```
