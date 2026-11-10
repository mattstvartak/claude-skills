# How people write

The positive half of the skill. The first part is what the research says human text has that model text lacks. The second is notes for each kind of writing.

## What the studies found

### Grammar

Reinhart et al. (PNAS 2025) compared human text with GPT-4o and Llama 3 output on the same prompts, using Biber's 66 grammatical features. Instruction-tuned models, against humans:

- present participial clauses at 2 to 5 times the rate (GPT-4o: 5.3)
- nominalizations at 1.5 to 2 times (GPT-4o: 2.1)
- "that" clauses as subject at 2.6 times, phrasal coordination at 1.9 times (GPT-4o)
- agentless passives at about half the human rate (GPT-4o)
- GPT-4o avoids clausal coordination, meaning two full clauses joined by and, but or so

The authors call the result "informationally dense, noun-heavy". Base models, before instruction tuning, write much closer to people. The paper also repeats an earlier finding that model text has fewer human subjects and fewer epistemic stance markers such as "I think" and "probably".

What to do with that:

- Put the action in a verb. "We decided", not "the decision was made" and not "our decision-making process".
- Give sentences a person or a named thing as their subject.
- Join clauses with and, but, so, because. Don't hang a participle off the end.
- Don't purge the passive. People use it about twice as often as GPT-4o does. "The server was restarted at 3am" is fine when nobody cares who did it.

Herbold et al. (2023) found the same direction in student essays: ChatGPT's had more nominalizations and fewer discourse and epistemic markers than the students'. (Read from the abstract only.)

### Sentence length and vocabulary

Muñoz-Ortiz et al. (2024) compared New York Times lead paragraphs with six open models. Human sentence lengths were more scattered and included long sentences more often, while the models clustered between 10 and 30 tokens. Human text had the richer vocabulary on both measures they used. Human text also carried more fear and anger and less joy. These were 2023 base models, so treat the direction as the finding and not the numbers.

Wikipedia's editors report that models from mid 2026 write shorter sentences in a tight 8 to 20 word band.

What to do with that:

- Let length follow the thought. Some sentences need 35 words.
- Keep a short sentence for something new.
- Say the bad news plainly. A piece with no complaint, cost or doubt in it reads as generated.

### What experienced readers notice

Russell, Karpinska and Iyyer (ACL 2025) had five people who use LLMs daily judge 300 articles. Their majority vote got 299 right. The clue categories they cited, by share of explanations: vocabulary 53 percent, sentence structure 36, grammar and punctuation 25, originality 24, quotes 22, clarity 20, formatting 15, conclusions 13, formality 12, names and titles 12, tone 9. (Percentages come from a summary of the paper's table, not the table itself.)

What they read as human:

- small grammatical slips and writing that doesn't follow "proper" conventions
- contractions, slang, "just" and "actually"
- specific detail, and a visible reason for the piece to exist
- quotes that are short and sound like speech, with "says" where a model writes "notes" or "explains"
- varied formatting
- surprise and humour

What survived paraphrasing and humanizer tools: the vocabulary, formulaic sentence structure, and "cheerful summary conclusions". One annotator who leaned on informality cues alone was fooled by a model told to use them, which is why this skill doesn't sprinkle them in.

### Signs of human writing on Wikipedia

Across 25 years of articles, these are more common in human text than in model text:

- simple is and has phrases: "there is a", "it has a"
- the plain word over the stiff one: wrote for "authored", moved for "relocated", used for "utilized", tried for "attempted", died for "passed away"
- superlative and definite statements: "one of the best", "is the only", "was the first"
- qualifiers and intensifiers: very, perhaps, tends to
- the odd wordy construction: as a result of, in order to, all of the, the fact that

The last two are worth noticing. A text scrubbed of every "very" and every "in order to" is cleaner than people write.

Wikipedia also lists what does not indicate a model: perfect grammar, formal or academic prose, a mix of casual and technical registers, and transition words on their own.

### What readers do with it

- Nielsen (1997): 79 percent of test users scanned a web page and 16 percent read word by word. Against a promotional control, a concise version scored 58 percent better on measured usability, a scannable layout 47 percent, objective language 27 percent, and all three together 124 percent. Users "detested" boastful claims, and credibility dropped when they saw exaggeration.
- Oppenheimer (2006): across three experiments, readers judged the authors of needlessly complex text to be less intelligent. (From secondary coverage.)
- Graham, "Write Like You Talk" (2015): written language is more complex and more distant than speech, which makes it harder to read and gives the writer "the false impression that you're saying more than you actually are." His test is to read the draft and ask whether you'd say it to a friend.

## Craft conventions

Long-standing advice from Orwell, Strunk and White, Williams and Zinsser, quoted from memory and not re-read for this skill:

- If you can cut a word, cut it. Prefer the short word.
- One topic to a paragraph, and its first sentence says what it's about. Someone reading only first sentences should follow the piece.
- Old information at the start of a sentence, new information at the end. That is what makes paragraphs flow without connectives.
- Make each point once.
- Read it aloud. Where you stumble or run out of breath, rewrite.

## By surface

### Landing pages and marketing copy

- One reader, addressed as "you". One thing you want them to do.
- The headline says what the product does or what the reader gets, in words they'd use themselves. If it could sit on a competitor's site unchanged, it isn't specific enough.
- Numbers and names over adjectives: "exports 10,000 rows in four seconds", "used by the billing team at Acme". Only real ones.
- Features as plain statements of fact. People will supply their own excitement.
- No questions the reader is meant to answer yes to. No "Ready to transform your workflow?"
- People scan, so use short paragraphs and real subheadings, and put the point in the first few words of each line. That is layout for scanning. It doesn't mean a bold label on every bullet.
- Stop when the offer is clear. One call to action, as a verb and an object: "Start a trial", "Book a call".

### Email

- The subject line says what the email is about or asks for.
- The ask or the news is in the first two lines.
- The greeting and sign-off are the ones the sender uses.
- A reply answers the question before anything else.

### PR descriptions, commits, ticket and review comments

- Lead with what changed and why. Then what the reviewer needs to check or decide.
- Commit subject: short lowercase imperative after any ticket prefix. The body, if there is one, gives the reason.
- No inventory of files touched; the diff shows that. No account of the investigation unless it changes what the reader should do.
- A review comment names the line, the problem and the fix. No softening preamble and no praise sandwich.
- Posted under someone's name it is short. A few sentences usually does it.

### Docs and READMEs

- Start with what the thing is and the shortest command that makes it work.
- Second person, present tense, imperative for steps.
- Headings are sentence case and say what's in the section. No emoji.
- A table only for things with two dimensions. A list only for things that are parallel.
- Say what doesn't work.

### Chat replies

- The answer first, in a sentence. Then what supports it.
- Match the length of the question.
- No headings or bullets for a few sentences.
- Don't restate the question, praise it, or offer three follow-ups.
- Say what you don't know once, where it applies.

### Slack write-ups

- Slack mrkdwn: `*bold*` for the few headings, bullets, triple backticks for code. No hard-wrapped lines.
- The outcome in the first line, because that is all most people read in a channel.

### Fiction and narrative

- Names, places and jobs from a real time and place, checked against the setting. Not Elias in a lighthouse.
- Detail that only this scene would have.
- Dialogue with the grammar of speech: interruptions, half-answers, people not saying what they mean.
- Leave the theme unstated and something unresolved.
- More than one thing happening. Time that doesn't run in a straight line when the story needs it.
