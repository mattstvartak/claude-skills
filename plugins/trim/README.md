# trim

Lazy senior developer mode for Claude Code. Every line of code has to be read,
tested and fixed later, so trim pushes Claude toward the smallest complete
change: reuse what the codebase already has, then the language or platform,
then an installed dependency, and only then new code. Anything it skips on
purpose gets a `shortcut: <the limit>, <when to upgrade>` comment, so the
deferral is written down.

It's adapted from [ponytail](https://github.com/DietrichGebert/ponytail) by
Dietrich Gebert (MIT, see `NOTICE`) and replaces it. Install one or the other,
not both.

- **Always on.** A SessionStart hook adds the ruleset to each session and a
  SubagentStart hook adds it to every subagent. The rules only apply when
  writing, fixing, refactoring or reviewing application code. System design is
  napkin's job and infrastructure is pager's.
- **Complete, not careless.** It cuts extras, not callers, tests, validation at
  trust boundaries, error handling that prevents data loss, or security.
- **Levels.** `/trim lite` names the smaller option and lets you pick,
  `/trim` or `/trim full` applies the rules, `/trim ultra` also pushes back on
  the request itself. `/trim off` or "stop trim" turns it off for the session.
  `/trim default <level>` sets the level new sessions start at.
- **`/trim-debt`.** Lists every `shortcut:` comment in the repo as a ledger,
  grouped by file, with the limit and the upgrade trigger. Changes nothing.
- **`/trim-audit`.** Audits the whole repo for bugs, security holes, what
  breaks under load, risky code without tests, slow paths, and code to delete,
  merge or split. Ranked, in plain English, with file and line. Changes nothing.

Needs `node` on the PATH that hooks run with. State lives in
`$CLAUDE_CONFIG_DIR/.trim/` (or `~/.claude/.trim/`).

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install trim@claude-skills
```
