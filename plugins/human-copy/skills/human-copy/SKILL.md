---
name: human-copy
description: >-
  Write and rewrite prose so it reads like a person wrote it for a specific reader.
  Use when drafting or editing anything a person will read under someone's name:
  marketing and landing page copy, emails, posts, docs, READMEs, PR descriptions,
  commit messages, ticket and review comments, Slack write-ups and chat replies.
  Also use when asked to humanize, de-AI or unslop text, to "make this sound human",
  when a draft "sounds like AI", or to check text for AI tells. Covers the current
  tells (staging, inflation, rhythm by rule, stock vocabulary, Claude's own habits,
  formatting, chat leftovers, fiction defaults), the habits of human prose, and
  ships a lint script that flags tells by line.
---

# Human copy

A model writes the likeliest next word, which is the choice that suits every reader and every subject at once. A person writes for one reader about one thing, so their choices are uneven and specific. Nearly every AI tell is that default showing through: the sentence that signals importance without adding a fact, the list that comes in threes whether or not there are three things, the word that sounds considered and says nothing.

Two findings set the order of work.

Banning words is not enough. Tells move with each model release. "Delve" faded during 2025. Models told to stop using em dashes fell back on commas and full stops, and the flat punctuation became a tell of its own. Swap a flagged word for its synonym and you have made next year's tell. Take out the move the word was making.

Humanizing afterwards is not enough either. In Russell et al. (2025), people who use LLMs heavily still caught paraphrased and "humanized" articles by their vocabulary, their formulaic structure and their cheerful endings. So write for a real reader first, and filter second.

## Modes

- Write: new text. Do all five steps.
- Rewrite: text is supplied. Keep every fact and the writer's meaning. Do steps 1, 4 and 5, and use step 2 to find what is missing.
- Review: report findings with line numbers and a fix for each. Change nothing.

Inside another task (a PR description, a commit message, a Slack write-up) return only the finished text.

## Steps

### 1. Pick the reader

Before writing, know who reads this, what they already know, what they should know or do afterwards, and how the writer would say it to them in person. A reply in a thread has a reader who knows the background, so the answer goes first. A landing page has a reader who knows nothing and is deciding whether to keep reading, so what the thing does for them goes first.

If the text goes out under a person's name and samples of their writing are to hand, read two or three. Match their sentence length, contractions, punctuation and sign-off. Their habits override the defaults in this skill.

### 2. Get the specifics

Collect what the piece rests on: numbers, names, dates, what happened, what it costs, what it replaced. Generic prose is what is left when the specifics are missing, and a paragraph that won't come right is usually short of a fact. If you don't have it, ask, or say less. Never invent a detail, a quote, a customer or an anecdote to fill the gap.

### 3. Draft it the way you'd say it

Write it as you would say it to that reader across a table, then tidy. "How people write" below is the checklist.

### 4. Lint

```
python3 <skill-dir>/scripts/lint.py draft.md     # or pipe text to: lint.py -
```

`<skill-dir>` is this skill's folder. It prints findings by line. A `fix` finding always gets fixed. A `check` finding is a judgement call: one is fine, a cluster is not. Code, double-quoted text and blockquotes are skipped.

Fix by taking out the move. A flagged word usually marks a sentence that is doing no work, so try deleting the sentence before rewording it. If you reword, use the plain word (is, has, use, help, important) and not a neighbour of the flagged one. Run it again until no `fix` findings are left.

### 5. Read it through

The script can't see these.

- Every sentence adds a fact, a reason or an instruction. Cut the ones that only add weight.
- The first sentence is the point. No run-up, no restating the question.
- The ending stops when the content does: no summary of what was just said, no moral, no upbeat send-off, no offer of more.
- Nothing describes the document itself, how it was put together, or what an earlier draft said. Changelogs and release notes are the exception.
- No absolute the reader can disprove from their own experience ("nobody does this", "the only thing that matters").
- Paragraphs differ in length and shape. If each one is claim, elaboration, punchy closer, break the pattern.
- One metaphor, used once. If the same image keeps coming back, cut all but the first.
- In a reply, the reader is not told things they wrote themselves.

## How people write

Evidence and per-surface notes (landing pages, email, PRs and commits, docs, chat replies, fiction) are in `references/human-patterns.md`. Read the section for what you are writing.

- Plain verbs: is, has, used, wrote, tried, got, said. People write "is" where a model writes "serves as".
- People as subjects and actions as verbs. "We measured the latency", not "latency measurement was carried out". Instruction-tuned models use nominalizations at 1.5 to 2 times the human rate.
- Clauses joined with and, but, so and because. Models attach a trailing -ing phrase instead, at 2 to 5 times the human rate.
- Contractions wherever speech has them.
- Uneven sentences. Some run past 25 words because the thought needs the room. A short one is there because it carries something new.
- The whole punctuation set: colons, semicolons, parentheses, question marks. Commas and full stops alone read as flat as dashes everywhere did.
- Commitment. "The first", "the only", "the best" when it is true. "I think", "probably", "about" when it isn't certain, once, on the claim that is uncertain.
- A stance. People say what is slow, broken or annoying. Model text skews positive and ends well.
- A number, a name or an example where an adjective would go.
- The same noun for the same thing every time. Rotating synonyms to avoid repeating a word is a tell.
- Loose ends left in: a sentence that starts with And or But, "a lot of", "in order to", a thought in brackets.
- Quotes that sound spoken, introduced with "says".

## What to take out

The full catalogue with examples and fixes is `references/tells.md`. The families:

- Staging. The sentence announces that something matters instead of saying it: the not-X-but-Y contrast in all its forms, the question you ask yourself and answer, the one-line closer, "here's the thing", "worth noting", "the real story".
- Inflation. Ordinary facts given a legacy, a turning point or an unnamed expert. Stakes raised past what the facts support.
- Rhythm by rule. Lists of three, repeated sentence openings, stacked short fragments, every sentence between 8 and 20 words, a dash or a colon doing the same job in every paragraph.
- Stock vocabulary. The words that cluster in model text. They change by model and year, so the list lives in `scripts/lint.py`.
- Claude's own habits. Borrowed-weight metaphors ("load-bearing", "the shape of", "sits with", "lives in", "lands"), self-certifying words ("honest", "genuinely", "real"), crowning one item ("the one that"), compressed noun-stack jargon, and writing a revision as a diff against the draft the reader never saw.
- Formatting by rule. Bold labels on list items, headings on a short answer, title case, emoji, arrows, horizontal rules, a table for things that are not a table.
- Leftovers. Greetings, praise, offers and sign-offs from the chat. Disclaimers about sources and what "should be treated as" what.
- Wrong reader. Background the reader already has, placed ahead of the decision.
- Fiction defaults. Elias, Elara and Mara; lighthouses and keepers; themes explained aloud; one tidy plot line that resolves.

## Don't fake it

Looking human is not the goal; being worth reading is. Do not plant typos, add "um" or "honestly" for texture, drop in slang the writer wouldn't use, or invent first-person experience ("when I first tried this"), customers, quotes or statistics. A fabricated detail is worse than a generic sentence, and readers who know model text still catch the structure underneath. If a draft has nothing specific to say, tell the person what facts would fix it.

Do not change what the text claims. If a rewrite needs a fact you don't have, leave a visible question for the writer instead of guessing.

## Defaults

The user's own rules (CLAUDE.md, a style guide, samples of their writing) override these.

- No em dashes, and no en dashes as punctuation. Use a comma, a colon, a semicolon, parentheses or a new sentence, and vary which.
- Contractions.
- Text posted under a person's name (tickets, review comments, PRs, commits) is short: the outcome, what the reader must act on, the ask. No headings, no tables, no inventory of everything checked.
- No praise or agreement filler in chat replies.

## When to leave text alone

- Quotations, titles, proper names, code, and a passage that discusses a phrase instead of using it.
- A person's own habit. If their samples show em dashes or lists of three, that is their voice.
- Letter conventions. Salutations and sign-offs are older than chatbots.
- Register. Legal, regulatory and academic text keeps its formal connectives and its uncontracted forms.
- One instance. Any single pattern here is something a person might write on purpose. Density and co-occurrence are the signal.

Do not accuse anyone of using AI on the strength of this list. People who judge by feel do about as well as chance, and people's own writing has drifted toward model habits since 2023.

## Sources

`references/sources.md` lists what each claim rests on and which numbers were read from the source directly. The tells drift, so re-read Wikipedia's "Signs of AI writing" every few months and update `scripts/lint.py` and `references/tells.md`.
