# kickoff

The front door to the rest of the team. Run `/kickoff` at the start of a
project, or any time you've lost track of where one is, and it runs the right
skill for what comes next.

It reads the project's docs (vision, SOW status, design decisions, build plan,
question inbox, briefs, build progress) to work out the stage, shows you where
things stand, and hands off to [founder](../founder), [blueprint](../blueprint),
[craft](../craft) or [foreman](../foreman). When a stage finishes it reads the
docs again and moves on. It stops for the calls that are yours: agreeing the
SOW, approving the prototype, and starting a build.

It doesn't do any stage itself, so it keeps no state of its own. The other
skills' files are the state, which means `/kickoff` picks up wherever the last
session stopped. The one thing it writes is a "prototype approved" decision in
blueprint's NOTES, so later runs know design is done.

```
/kickoff                          # where things stand, then the next stage
/kickoff a booking app for vets   # start a new project from an idea
/kickoff design                   # jump to a stage: vision, scope, design, plan, questions, brief, build
```

It checks which plugins are installed and tells you how to add the missing
ones. Only blueprint is required. Without founder there's no vision or briefs,
without craft no design stage, and without foreman it ends at blueprint's
kickoff prompt.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install kickoff@claude-skills
/plugin install blueprint@claude-skills
```

Add founder, craft, foreman, proof, nitpick, trim, napkin and pager for the full run.
