# Tells

What to take out, grouped by what the writing is doing wrong. Each entry has the forms to watch for, why it reads as machine text, and the fix. Examples are in double quotes so the lint script skips them.

The word lists here are examples. The list the script enforces is in `scripts/lint.py`, and that is the one to update.

Any single item can be something a person wrote on purpose. Two or three together in a short text is the signal.

## A. Staging

The sentence signals that something matters instead of saying the thing.

### Not X but Y

Forms: "It's not just X, it's Y." "Not only X but Y." "This isn't about X. It's about Y." "Not because X, but because Y." "No X. No Y. Just Z." "Not a bug. Not a feature. A design flaw." "The question isn't X. The question is Y." The reversed form, common in 2026 output: "Y rather than X", "X instead of a replacement for Y".

Why: the negative half names something nobody claimed, so the positive half sounds bigger. It is the most cited tell in every source. The reversed "rather than" form took over as models were trained off the first.

Fix: say the positive claim. Keep a contrast only when someone really holds the other view, and then say who.

> Before: "This isn't just a faster build tool. It's a new way of thinking about builds."
> After: "Builds that took four minutes take forty seconds."

### The question you ask yourself

Forms: "The result? Chaos." "The catch? It only works on Linux." "The worst part? Nobody noticed." "So what does this mean? It means..."

Fix: make it a statement. "It only works on Linux."

### The one-line closer

Forms: a one-sentence paragraph that restates the paragraph above. "That's the real win." "And that matters." "That distinction is everything." "Read that again." "Let that sink in." "Simple as that."

Fix: delete it. If the paragraph doesn't land without it, the paragraph is missing a fact.

### The run-up

Forms: "Here's the thing." "Here's the kicker." "Here's where it gets interesting." "Here's what most people miss." "Let's dive in." "Let's break this down." "Let's unpack that." "It's worth noting that." "Importantly," "Interestingly," "Notably," "When it comes to X," "At its core," "In today's fast-moving world," "The truth is," "The reality is simpler," "Make no mistake," "Simply put," "Short version:" "The takeaway:" "The reframe:"

Also the whole "worth" family: "worth noting", "worth flagging", "worth a look", "worth sitting with", "worth asking".

Fix: start at the point. If the sentence after the run-up can stand alone, the run-up goes.

### Sounding deep

Forms: "the real question is", "what really matters", "the deeper issue", "fundamentally", "X is the Y of Z", "the part nobody talks about", "the failure nobody plans for", "what everyone does and nobody says".

Why: an ordinary point dressed as a hidden truth. The everyone-and-nobody version claims a universal the reader can disprove from their own experience.

Fix: state the specific claim and who it is true of.

### Arguing with no one

Forms: "To be clear," "I'm not saying," "Don't get me wrong," "This is not to say," "Some might say X, but," "A tempting approach would be," "This is not a rant; it's a diagnosis."

Fix: remove the defence. If the objection is real, give it a sentence with its owner.

### Staged candor and staged discovery

Forms: "Honestly," "To be honest," "Honest caveat:" "I'll be upfront," "And yes, I'm biased," "I didn't set out to X, but," "The thing I didn't expect," "What surprised me most," "I keep coming back to," "I can't stop thinking about," "Here's where I landed."

Why: a small story about the writer reaching the point, standing in for the point. Marking one statement as honest implies the others weren't.

Fix: cut the framing, keep the claim.

### Teaching voice

Forms: "Think of it as a highway for data." "Think of it like a Swiss Army knife." "Imagine a world where." "Picture this."

Why: the analogy is often less clear than the thing, and it assumes the reader needs one.

Fix: describe the thing. Keep an analogy only if it explains something the plain description can't.

## B. Inflation

### Significance and legacy

Forms: "stands as a testament", "a pivotal moment", "plays a crucial role", "marks a shift", "setting the stage for", "reflects a broader trend", "an indelible mark", "deeply rooted", "evolving landscape", "will define the next era", "fundamentally reshape", "this distinction matters because".

Why: a model smooths the specific fact into the generic important-sounding one. The subject gets less specific and more exaggerated at once.

Fix: say what happened and let the reader weigh it.

> Before: "The 2019 redesign marked a pivotal moment in the company's evolution."
> After: "The 2019 redesign cut the checkout from five screens to two."

### The -ing rider

Forms: a comma, then "highlighting", "underscoring", "emphasizing", "reflecting", "showcasing", "ensuring", "fostering", "contributing to", "symbolizing", "making it ideal for", "paving the way for".

Why: shallow analysis bolted to a fact. Instruction-tuned models use present participial clauses at 2 to 5 times the human rate (Reinhart et al. 2025).

Fix: cut the rider. If it holds a real second fact, give it its own sentence with its own subject.

### Avoiding is and has

Forms: "serves as", "stands as", "functions as", "acts as", "represents", "marks", "boasts", "features", "offers", "holds the distinction of being".

Fix: is, are, has.

### Vague connection

Forms: "associated with", "connected to", "linked to", "tied to", "in connection with".

Fix: say what the connection is. "She ran the lab from 2014 to 2019."

### Borrowed authority

Forms: "Experts argue", "Observers have noted", "Industry reports suggest", "Studies show" with no study, "several publications" meaning two, "featured in" followed by a list of outlets, "her profile identifies her as", "maintains an active social media presence".

Fix: name the source and what it said, or drop the claim.

### Sales adjectives

Forms: "rich", "vibrant", "nestled", "in the heart of", "groundbreaking", "renowned", "seamless", "robust", "world-class", "cutting-edge", "a diverse array".

Why: Nielsen's 1997 tests found promotional wording measurably hurt usability, and rewriting it in objective language improved it by 27 percent.

Fix: the fact the adjective was standing in for. "Loads in under a second", not "blazing fast".

### Invented labels

Forms: a domain word plus "paradox", "trap", "tax", "creep", "divide", "vacuum", "inversion": "the supervision paradox", "workload creep".

Why: a coined term used as if it were established. It names a thing and skips the argument.

Fix: make the argument in a sentence.

### Hedges and disclaimers

Forms from 2023 to 2024: "It's important to note that", "It is crucial to remember". From 2024 to 2025: "While specific details are limited", "not widely documented", "maintains a low profile", then a guess. From mid 2026: "should be treated as X rather than Y", "does not by itself establish", "should not be confused with".

Also stacked qualifiers: "could potentially", "might arguably", "in some cases it may".

Fix: say what is known and stop. One hedge, on the uncertain claim.

### Overstatement

Forms: "nobody", "always", "never", "the only thing that matters", "the whole game", "the entire point", verbs like "wrecks", "destroys", "shatters" for a small effect, and crowned superlatives: "the one that surprised me most", "the single most important", "the best thing you can do".

Fix: match the word to the size of the effect. If one item really comes first, give the reason.

## C. Rhythm by rule

### Lists of three

Forms: "fast, simple, and reliable"; three parallel clauses; three bullet points; three back-to-back triads. Extended to four or five the effect is the same.

Fix: count what is really there. Two things get two items. One strong item often beats three.

### Repeated openings

Forms: "They assume... They assume... They assume..." Several sentences starting with the same pronoun. "They have built engines, but not vehicles. They have built power, but not leverage."

Fix: merge, or vary the subject.

### Staccato

Forms: "He published this. Openly. In a book." Four or more short declaratives in a row. A fragment as its own paragraph for emphasis.

Fix: a short sentence works when longer ones surround it and it carries something new. Join the rest.

### The 8 to 20 word band

Newer models write shorter sentences with little spread, most of them between 8 and 20 words. Human sentence lengths scatter more and include long ones (Muñoz-Ortiz et al. 2024).

Fix: let a sentence that needs 35 words have them. Do not pad short ones to fake variety.

### One punctuation mark doing everything

Through 2025 it was the em dash, usually with spaces around it and used to punch up a clause. Models released from late 2026 avoid it and use only commas and full stops, which reads as flat. Either way one mark is doing every job.

Fix: no em dashes, by default. Use colons, semicolons, parentheses and question marks where they fit.

### Listicle in disguise

Forms: "The first wall is... The second wall is... The third wall is..." Paragraphs that are bullets with the bullets taken off.

Fix: a real list, or an argument where each paragraph depends on the last.

### The same paragraph every time

Forms: claim, elaboration, punchy closer, repeated. Every section the same length. A summary at the end of each section and again at the end of the piece.

Fix: let the content set the shape. Make each point once.

## D. Stock vocabulary

Words that turn up in model text far more than in human text, usually in groups. Use them only in their literal sense.

They shift by model and year (Wikipedia's list, as read in November 2026):

- 2023 to mid 2024: additionally, boasts, bolstered, crucial, delve, emphasizing, enduring, garner, intricate, interplay, key, landscape, meticulously, pivotal, underscore, tapestry, testament, valuable, vibrant
- mid 2024 to mid 2025: align with, bolstered, crucial, emphasizing, enhance, enduring, fostering, highlighting, pivotal, showcasing, underscore, vibrant
- mid 2025 to mid 2026: emphasizing, enhance, highlighting, showcasing, plus the notability phrases under Borrowed authority
- mid 2026 on: challenge, clearer, dependable, echoed, foster, leverage, matters, multifaceted, practical, prioritize, quietly, steady, universally

Elsewhere: utilize, harness, streamline, empower, unlock, elevate, navigate, embark, robust, seamless, comprehensive, holistic, nuanced, transformative, realm, paradigm, synergy, ecosystem, journey, deep dive. In GPT-4o fiction and essays: camaraderie, tapestry, palpable, intricate, unspoken, amidst, solace, fleeting, unravel, each at 80 to 160 times the human rate (Reinhart et al. 2025).

A word being on the list does not put its synonyms on the list. Replacing "crucial" with "vital" changes nothing. Use the plain word (important, big, needed) or cut the sentence.

Adverbs that add weight and no information: truly, really, deeply, incredibly, remarkably, fundamentally, essentially, ultimately, arguably, quietly.

Formal connectives at the start of a sentence: Additionally, Moreover, Furthermore, Consequently, Notably. Weak on their own, since essays have always used them. A piece where most paragraphs open with one is the signal.

## E. Claude's own habits

These are mine, so they are the ones I'm least likely to notice. Sources: claudisms.ai, Robitza's "Claudish" post, and Hacker News threads from 2026.

### Borrowed-weight metaphors

Forms: "load-bearing", "the shape of", "sits with", "lives in", "lands", "holds", "carries", "moves", "points to", "turns on", "names" (as a verb), "surfaces", "the engine", "substrate", "the physics of", "compounds", "rides along", "earns its keep", "doing the work", "doing the heavy lifting", "leans into", "the tell", "wedge", "footgun", "smoking gun".

Why: a physical or engineering image gives an abstract point a feeling of weight. Each is fine once in a lifetime; as a set they are a signature.

Fix: the plain verb. "depends on", "is", "shows", "comes with", "says".

### Self-certifying words

Forms: "honest", "honestly", "genuinely", "real" as in "a real constraint", "actually", "precisely", "exactly the".

Fix: delete. If the sentence needs the word to be believed, it needs evidence.

### Crowning

Forms: "the one that matters", "the one thing you need", "this is the one that", "the single most important".

Fix: say the thing without ranking it, or give the reason it ranks first.

### Telling the reader what to value

Forms: "this matters", "the useful part", "the interesting thing", "the right question", "what I want you to see".

Fix: state it and let the reader decide.

### Compressed jargon

Forms: half-sentences with nouns stacked as adjectives and coined labels the reader was never given: "Cap the study-lifecycle handlers so a hung study can't wedge the deep-link." Arrows and symbols standing in for sentences. Dropped articles and connectives.

Why: it happens after long work, when my own working labels feel like shared vocabulary.

Fix: full sentences. Define a term or replace it with what it stands for. Write for someone arriving cold.

### Writing the diff

Forms: a revised document that describes how it differs from the last draft. Titles like "X is real, but the cause was misstated". Sections marked "Revised" or "Retracted". "What changed in v3" up front. "The corrections matter because". "It does not survive contact with the data". Body text that refutes something the reader never saw.

Why: the reasoning leaks into the output. The reader of v2 has not read v1.

Fix: write the current state as if it were the first draft. History goes in a changelog.

### Process narration

Forms: "I've carefully reviewed", "I preserved the original structure", "I avoided changing", "to ensure accuracy", a list of everything checked.

Fix: the result, then anything the reader must act on.

## F. Formatting by rule

- A bold label and a colon on every list item. Write a sentence, or a plain list.
- Headings on an answer of a few paragraphs.
- Title Case Headings. Use sentence case.
- Emoji on headings and bullets, and the check mark, rocket and brain in running text.
- Arrows between words in prose.
- Horizontal rules between sections.
- Bold scattered through paragraphs for emphasis.
- Curly quotes where the destination uses straight ones.
- A table for content with one dimension.
- Bullets that fragment an argument that needed connecting words.
- "Key takeaways" or a summary box at the end.
- Section titles of the form "X and Y": "Challenges and Opportunities", "Awards and Recognition".

## G. Leftovers

### From the chat

Forms: "Great question!" "Certainly!" "You're absolutely right." "I hope this helps." "Let me know if you'd like me to." "Would you like a more detailed breakdown?" "Here is a draft:" "Feel free to adjust."

Fix: delete. This is the surest tell there is and the cheapest to remove.

### From the draft

Forms: "In conclusion," "In summary," "Overall," a heading followed by a sentence that restates the heading, placeholders like "[Your Name]" and "INSERT DATE", "As of my last update".

### About the document

Forms: "This section covers", "The table below compares", "compiled from", "anything unconfirmed is flagged", "as mentioned above".

Fix: keep a source credit the reader can follow and a caveat that changes what they should do. Cut the account of how the text was made.

### The customer-service register

Forms: "I understand your concern", "I apologize for any inconvenience this may have caused", "If there are specific issues, please point them out and I will address them", "Thank you for your patience".

Fix: say what you'll do and when.

## H. Wrong reader

A short reply that restates the problem, walks through the diagnosis and lays out the evidence before reaching the decision. Each sentence reads fine alone, so sentence-level cleanup doesn't catch it.

Fix: lead with the decision. Keep the one fact the reader lacks and the link they need. The rest goes in a ticket or a doc.

## I. Fiction and narrative

- Names: Elias, Elara, Mara, Kael; Sarah and Emily in mock journalism; "Dr." and "Prof." on every quoted expert. Nearly 90 percent of 20,000 model-written stories contained at least one of 11 recurring words, and over half had a lighthouse (Hamilton and Mimno 2026).
- Settings and jobs: the lighthouse, the workshop, the keeper, the baker, the mayor.
- Phrases: "barely above a whisper", "a testament to", "couldn't help but", "the smell of ozone", "the soft hum of", "something shifted", "a quiet" anything, ghosts and echoes as metaphors.
- Structure: themes stated aloud by the narrator or a character, one plot line, a conflict resolved by the protagonist's choice, a tidy and hopeful ending. A study of over 50,000 model stories found flat escalation in Claude's, dream sequences in GPT's and external character description in Gemini's.
- Quotes that match the surrounding prose in register and sit at the end of each paragraph.

Fix: pick names from a real place and period. Leave the theme unstated. Let something stay unresolved. Give dialogue the grammar of speech.
