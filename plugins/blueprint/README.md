# blueprint

Project onboarding for Claude Code. You describe an app idea, or point it at an
existing codebase, and it interviews you in normal conversation until it has
everything a full statement of work needs. It then writes the SOW and hands off
to design and build.

- **A conversation, not a form.** It asks two or three questions at a time, asks
  for concrete walkthroughs instead of feature lists, and doesn't ask what the
  repo or your notes already answer.
- **A coverage tracker.** Users and roles, the main job, features with acceptance
  criteria, states, data, auth, integrations, hosting, privacy, risks. It shows
  what's covered and what's open, and picks up where the last session stopped.
- **Scope pushback.** It asks why each feature exists, proposes an MVP cut, and
  flags conflicts and expensive features. The decisions stay yours, and they're
  written down with reasons.
- **Existing apps.** It maps what the code already does (screens, data,
  integrations, roles) and then interviews you only about what's changing.

## Outputs

- `docs/SOW.md`: product definition and technical plan
- `docs/blueprint/spec.json`: the same content as structured data
- `docs/blueprint/NOTES.md` and `TRACKER.md`: answers in your words, decisions, coverage
- `docs/blueprint/BUILD-PLAN.md`: ordered tasks sized for parallel agent work
- `design/BRIEF.md`: pre-filled for the craft design skill
- `docs/blueprint/KICKOFF.md`: a prompt to start a fresh build session

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install blueprint@claude-skills
```
