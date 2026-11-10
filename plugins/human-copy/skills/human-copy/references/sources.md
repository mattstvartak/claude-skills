# Sources

Researched 2026-11-10. "Read directly" means the page text was read in full for this skill. "Via summary" means a fetch tool or search result summarised it, so check the original before quoting a number elsewhere.

## Tells

- Wikipedia, "Signs of AI writing" (WikiProject AI Cleanup). https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing. Read directly (raw wikitext, 2026-11-10). Source for the vocabulary eras, negative parallelism and the "rather than" form, significance and notability inflation, copula avoidance, hedging disclaimers by year, the em dash becoming a historical indicator, the signs of human writing, and the ineffective indicators. This page changes monthly and is the one to re-read.
- tropes.fyi by Ossama Chaib, tropes.md. https://tropes.fyi and https://gist.github.com/ossa-ma/f3baa9d25154c33095e22272c631f5a1. Read directly. CC BY 4.0. Source for the trope names in sections A and C of tells.md: self-posed questions, "not X, not Y, just Z", listicle in disguise, false ranges, invented concept labels, fractal summaries, dead metaphor, one-point dilution.
- claudisms.ai, "a living banlist of AI-writing tells". https://claudisms.ai/. Read directly. One person's list, not research. Source for most of section E.
- Werner Robitza, "The One Thing I Hate About Claude" (2026-06-22). https://slhck.info/software/2026/06/22/claudish.html. Via summary. Source for compressed jargon and writing the diff.
- Werner Robitza, "Writing Simply in the Age of AI" (2026-06-29). https://slhck.info/miscellaneous/2026/06/29/writing-simple.html. Read directly.
- Hacker News, "How to stop Claude from saying load-bearing" and "The load-bearing vocabulary of Claude". https://news.ycombinator.com/item?id=48905248 and https://news.ycombinator.com/item?id=49461817. Via search summary. Anecdotal.
- blader/humanizer 3.1.0 (MIT), a Claude plugin based on the same Wikipedia page. https://github.com/blader/humanizer. Read for coverage. Its "wrong reader" section is the origin of section H.

## Studies

- Reinhart et al., "Do LLMs write like humans? Variation in grammatical and rhetorical styles", PNAS 2025. https://arxiv.org/abs/2410.16107. Via summary of the main text; the supplementary tables with all 66 features were not read. Source for the participial clause, nominalization and passive ratios and the overused-word table.
- Russell, Karpinska and Iyyer, "People who frequently use ChatGPT for writing tasks are accurate and robust detectors of AI-generated text", ACL 2025. https://arxiv.org/abs/2501.15654. Via summary, partly unverified: the category percentages come from a model summary of Table 3. The headline result (expert majority vote wrong on 1 of 300) and the quote about what survives paraphrasing were read verbatim.
- Muñoz-Ortiz, Gómez-Rodríguez and Vilares, "Contrasting Linguistic Patterns in Human and LLM-Generated News Text", Artificial Intelligence Review 2024. https://pmc.ncbi.nlm.nih.gov/articles/PMC11422446/. Abstract read verbatim, tables via summary. Six 2023 base models, none instruction-tuned.
- Herbold et al., "AI, write an essay for me" (2023). https://arxiv.org/abs/2304.14276. Abstract only, via search.
- Kobak et al., "Delving into LLM-assisted writing in biomedical publications through excess vocabulary", Science Advances 2025. https://arxiv.org/abs/2406.07016. Via search summary and Wikipedia's citation. Background for the vocabulary lists.
- Hamilton and Mimno, "Elias in the Lighthouse, Again? Diagnosing Low Diversity in LLM Stories", EMNLP 2026. arXiv 2605.26492. Via TechXplore's write-up, read directly: https://techxplore.com/news/2026-10-elias-lighthouse-keeper-ai-fiction.html. Only five of the eleven recurring words are named there.
- University of Maryland and Google DeepMind preprint on 50,000 model-written stories (the "StoryScope" tool). Via the visible part of a paywalled 404 Media article: https://www.404media.co/ai-fiction-is-easy-to-detect-because-its-stupid-and-bad-research-finds/. The per-model findings are quoted there from the paper; the paper itself was not found.
- Washington Post analysis of 328,744 ChatGPT messages (2025-11-13). Via the Boston Globe reprint in search results: https://www.bostonglobe.com/2025/11/13/business/chatgpt-writing-style-clues/. About 70 percent of messages had an emoji by July 2025 and over half had an em dash. The figure that 6 percent contained a not-just-X construction appears only on claudisms.ai and is unverified, so the skill doesn't use it.

## Human writing

- Jakob Nielsen, "How Users Read on the Web" (1997). https://www.nngroup.com/articles/how-users-read-on-the-web/. Read directly.
- Paul Graham, "Write Like You Talk" (2015). https://paulgraham.com/talk.html. Read directly.
- Oppenheimer, "Consequences of erudite vernacular utilized irrespective of necessity", Applied Cognitive Psychology 2006. Via search summary.
- Orwell, Strunk and White, Williams, Zinsser. From memory, not fetched. Marked as craft conventions in human-patterns.md.

## Left out on purpose

- Hansen and Wänke (2010), concrete wording judged more true. Two preregistered replications in 2019 found a much smaller effect, so the skill argues for specifics on other grounds.
- GOV.UK's 25-word sentence limit. The only source found was a 2014 blog post that says it may be out of date.
- Listicle sites ranking "signs of AI writing". Mostly derived from the Wikipedia page.
- The lint script's thresholds (coefficient of variation under 0.40, over 75 percent of sentences in the 8 to 20 band, one triad per 120 words). These are my heuristics, set by hand. No study gives them.

## Keeping it current

The vocabulary and punctuation tells have changed with every model generation since 2023. When output from a new model starts to sound the same, re-read the Wikipedia page's "High density of AI vocabulary words" and "Historical indicators" sections, then update `scripts/lint.py` first and `tells.md` second.
