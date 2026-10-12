# founder

A founder for your agent teams. You bring the vision; the founder puts it on
paper the teams can build from, then runs the loop back: it collects the
teams' questions, answers what's already settled, and works through the rest
with you until every detail the app needs is decided.

The founder thinks big and expects a lot from the team. It writes down where
the product goes after launch so the MVP doesn't block it, briefs each phase
with a high bar and clear room to make calls, and brings you only the questions
that are yours: product, money, data, privacy, anything irreversible. Each one
comes with options and a recommendation.

It builds on [blueprint](../blueprint) instead of replacing it. Blueprint
writes the SOW, spec, decision notes and build plan. Founder adds a vision doc,
phase briefs and a question inbox next to them, and keeps one decision log
(blueprint's NOTES).

```
/founder                  # where things stand and the next step
/founder vision           # talk through the vision, write VISION.md, then blueprint the details
/founder brief phase-2    # write a one-page brief for a build phase
/founder questions        # work through the teams' questions with you
```

Files it keeps: `docs/founder/VISION.md`, `docs/founder/QUESTIONS.md` and
`docs/founder/briefs/`.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install blueprint@claude-skills
/plugin install founder@claude-skills
```
