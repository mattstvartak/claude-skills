# napkin

Lazy senior architect mode for Claude Code. A good architecture fits on a
napkin, so napkin pushes Claude toward the fewest components that meet the real
requirements: the existing app and database before a new service, a modular
monolith before microservices, Postgres before a specialised store. Designs are
sized for today's scale plus one order of magnitude, and written down with the
number at which to revisit them.

It's built after [ponytail](https://github.com/DietrichGebert/ponytail), which
does the same for application code, and runs alongside it.

- **Always on.** A SessionStart hook adds the ruleset to each session and a
  SubagentStart hook adds it to every subagent. The rules only apply to system
  design, data modelling, technology choices and technical plans.
- **Requirements are not negotiable.** It cuts components, not authorisation,
  data integrity, backups or compliance.
- **Levels.** `/napkin lite` names the simpler design and lets you pick,
  `/napkin` or `/napkin full` applies the rules, `/napkin ultra` also pushes
  back on the requirement itself. `/napkin off` or "stop napkin" turns it off
  for the session. `/napkin default <level>` sets the level new sessions start at.

Needs `node` on the PATH that hooks run with. State lives in
`$CLAUDE_CONFIG_DIR/.napkin/` (or `~/.claude/.napkin/`).

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install napkin@claude-skills
```
