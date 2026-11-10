# human-copy

A writing skill for Claude Code. It gets Claude to write prose the way a person
would for one particular reader, and to catch the habits that mark text as
machine-written before anyone else sees it.

Word lists alone don't do this. The tells change with every model release:
"delve" faded in 2025, and models trained off em dashes fell back on commas
and full stops, which is now a tell too. So the skill works on the cause first
and filters second.

1. Pick the reader and what they already know.
2. Get the specifics. Generic prose is what's left when the facts are missing.
3. Draft it the way you'd say it.
4. Run the lint script and fix what it flags by taking the move out, not by
   swapping in a synonym.
5. Read it through for what a script can't see.

It writes new text, rewrites text you give it without changing the facts, or
reviews and reports. It won't plant typos or invent anecdotes to look human.

## What's in it

- `SKILL.md`: the steps, how people write, and the families of tells.
- `references/tells.md`: the catalogue. Staging, inflation, rhythm by rule,
  stock vocabulary by model era, Claude's own habits, formatting, chat
  leftovers, writing for the wrong reader, and fiction defaults.
- `references/human-patterns.md`: what studies found in human text that model
  text lacks, with notes for landing pages, email, PRs and commits, docs, chat
  replies and fiction.
- `references/sources.md`: what each claim rests on, and which numbers were
  read from the source directly.
- `scripts/lint.py`: flags tells by line. `fix` findings set the exit code to
  1, so it can gate a commit or a CI step. Python 3, no dependencies.

```
python3 scripts/lint.py README.md
python3 scripts/lint.py --selftest
```

The script skips code, double-quoted text and blockquotes, so you can discuss
a phrase without tripping it.

## Use it

Ask for copy, or ask Claude to humanize a draft or check it for AI tells.
`/human-copy` runs it by name.

It overlaps with [humanizer](https://github.com/blader/humanizer). humanizer
rewrites finished text; this one also covers writing it in the first place,
Claude's own habits, and the lint script. One of the two is enough.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install human-copy@claude-skills
```

Credits are in `NOTICE`.
