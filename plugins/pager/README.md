# pager

Lazy senior DevOps mode for Claude Code. Everything you run can page you at
3am, so pager pushes Claude toward the fewest moving parts that fully solve the
infrastructure task: the platform's built-in feature before a new tool, managed
before self-hosted, one deploy path, one place for config. Every change comes
with how to verify it and how to undo it.

It's built after [ponytail](https://github.com/DietrichGebert/ponytail), which
does the same for application code, and runs alongside it.

- **Always on.** A SessionStart hook adds the ruleset to each session and a
  SubagentStart hook adds it to every subagent. The rules only apply when the
  task touches infrastructure, CI/CD, deploys, hosting or operations.
- **Live systems are gated.** No deploy, destroy, migration, DNS change or data
  deletion without an explicit go-ahead, and plan or dry-run first.
- **Levels.** `/pager lite` names the simpler setup and lets you pick, `/pager`
  or `/pager full` applies the rules, `/pager ultra` also questions whether the
  infrastructure needs to exist. `/pager off` or "stop pager" turns it off for
  the session. `/pager default <level>` sets the level new sessions start at.

Needs `node` on the PATH that hooks run with. State lives in
`$CLAUDE_CONFIG_DIR/.pager/` (or `~/.claude/.pager/`).

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install pager@claude-skills
```
