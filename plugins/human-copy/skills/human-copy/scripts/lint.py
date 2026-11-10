#!/usr/bin/env python3
"""Flag AI writing tells in prose.

usage: lint.py FILE [FILE...]   lint.py -   (stdin)   lint.py --selftest

"fix" findings always get fixed and make the exit code 1. "check" findings are
judgement calls: one is fine, a cluster is not. Code, double-quoted text,
blockquotes and YAML frontmatter are skipped. The sentence-length thresholds are
heuristics, not figures from a study.
"""
import re
import statistics
import sys

FIX, CHECK = "fix", "check"

# (rule, severity, pattern, what to do). Patterns are case-insensitive.
RULES = [
    ("dash", FIX, r"—|\s–\s|\w\s--\s\w",
     "use a comma, colon, parentheses or a new sentence"),

    ("negative-parallel", FIX,
     r"\bnot (?:just|only|merely|simply)\b[^.?!\n]{0,80}?\b(?:but|it'?s|it is|they'?re)\b"
     r"|\b(?:isn't|aren't|wasn't|weren't|is not|are not|was not|it's not|that's not|this isn't|they're not)\b"
     r"[^.?!\n]{1,60}[.;,:]\s*(?:it'?s|it is|they'?re|they are|that'?s|this is)\b"
     r"|\bnot because\b[^.?!\n]{1,80}\bbut because\b"
     r"|\bno [\w-]+[.,;] no [\w-]+[.,;] (?:just|only)\b"
     r"|(?:^|[.!?]\s+)not [^.?!\n]{1,40}\. not [^.?!\n]{1,40}\."
     r"|\bthe (?:question|point|problem|issue|goal|real \w+) (?:isn't|is not)\b",
     "say the positive claim; drop the thing nobody claimed"),
    ("rather-than", CHECK, r"\brather than\b",
     "fine once; as a habit it is the same contrast reversed"),

    ("question-fragment", FIX,
     r"\b(?:the|that|this|and the|but the) [\w' -]{1,30}\? [A-Z]"
     r"|\b(?:result|catch|kicker|upside|downside|twist|solution|best part|worst part|bottom line)\?",
     "make it a statement"),

    ("staging", FIX,
     r"\bhere'?s (?:the (?:thing|kicker|deal|catch|part)|where|what (?:most|you need))"
     r"|\blet'?s (?:dive|break|unpack|explore|take a (?:closer )?look|be (?:honest|clear|real))"
     r"|\b(?:it'?s|it is|it bears) (?:worth|important|crucial) (?:to )?(?:noting|note|mentioning|mention|remember)"
     r"|\bworth (?:noting|flagging|calling out|mentioning|pointing out|highlighting|a look|considering"
     r"|exploring|examining|asking|sitting with|talking about)\b"
     r"|\b(?:in conclusion|in summary|to sum up|to summarize|in short|simply put|long story short)\b"
     r"|\b(?:at its core|at the end of the day|when it comes to|in today'?s|in the world of|in an era)\b"
     r"|\b(?:the (?:reality|truth|fact) is|make no mistake|let that sink in|read that again|full stop"
     r"|the bottom line|the takeaway|short version|the real (?:story|question|win|issue)|what really matters"
     r"|the part (?:that|nobody)|that'?s the whole|the whole (?:game|point|story))\b"
     r"|\b(?:think of it (?:as|like)|imagine a world|picture this|without further ado|buckle up)\b"
     r"|\b(?:i keep coming back to|i can'?t stop thinking about|where i landed|what struck me)\b",
     "cut the run-up and state the point"),

    ("chat-residue", FIX,
     r"\b(?:i hope this helps|great question|good question|you'?re (?:absolutely|totally) right|of course!|certainly!"
     r"|absolutely!|happy to help|feel free to|let me know if|would you like me to|want me to|is there anything else"
     r"|as an ai|i don'?t have access to|as of my (?:last|knowledge))\b",
     "text meant for the chat, not the reader; delete"),

    ("disclaimer", FIX,
     r"\b(?:based on (?:the )?available information|while specific details|not (?:widely|publicly) (?:available|documented)"
     r"|should be (?:treated|understood|presented) as|does not by itself (?:establish|prove)"
     r"|it is important to (?:note|remember|recognize))\b",
     "say what is known, or cut"),

    ("copula-dodge", FIX,
     r"\b(?:serves?|stands?|functions?|acts?) as (?:a|an|the)\b|\bboasts?\b"
     r"|\bplays? an? (?:key|crucial|pivotal|vital|significant|central|important|major) role\b"
     r"|\b(?:is|stands as) a testament to\b",
     "use is, are or has"),

    ("ing-tail", FIX,
     r",\s+(?:highlighting|underscoring|emphasizing|reflecting|showcasing|ensuring|fostering|symbolizing"
     r"|demonstrating|illustrating|cementing|solidifying|signaling|contributing to|paving the way"
     r"|marking (?:a|an|the)|making it (?:easier|ideal|perfect|a|an))\b",
     "a bolted-on -ing phrase; cut it, or give the fact its own sentence"),

    ("formula", FIX,
     r"\bdespite (?:these|its|their|the|such) (?:challenges|setbacks|obstacles|limitations)\b"
     r"|\b(?:rich|vibrant) (?:tapestry|history|heritage|culture)\b|\bever-(?:evolving|changing)\b"
     r"|\b(?:evolving|changing|shifting) landscape\b|\bnestled (?:in|among|between)\b|\bin the heart of\b",
     "stock formula; state the specific thing"),
    ("vague-authority", CHECK,
     r"\b(?:experts|observers|critics|analysts|researchers|industry reports|studies|many people|most people)"
     r" (?:say|argue|suggest|note|believe|agree|show|have (?:noted|argued|cited|shown|suggested))\b",
     "name the source or drop the claim"),
    ("invented-label", CHECK,
     r"\bthe [a-z]+ (?:paradox|trap|tax|creep|divide|vacuum|inversion|flywheel)\b",
     "a coined label standing in for an argument"),

    ("vocab", FIX,
     r"\b(?:delv(?:e|es|ed|ing)|underscor(?:e|es|ed|ing)|showcas(?:e|es|ed|ing)|foster(?:s|ed|ing)?"
     r"|garner(?:s|ed|ing)?|bolster(?:s|ed|ing)?|leverag(?:e|es|ed|ing)|harness(?:es|ed|ing)?"
     r"|utiliz(?:e|es|ed|ing)|streamlin(?:e|es|ed|ing)|empower(?:s|ed|ing)?|unleash(?:es|ed|ing)?"
     r"|supercharg(?:e|es|ed|ing)|revolutioniz(?:e|es|ed|ing)|spearhead(?:s|ed|ing)?|embark(?:s|ed|ing)?"
     r"|crucial|pivotal|intricate|intricacies|meticulous(?:ly)?|vibrant|seamless(?:ly)?|holistic"
     r"|multifaceted|transformative|groundbreaking|cutting-edge|game-chang(?:er|ers|ing)|renowned"
     r"|unparalleled|unwavering|invaluable|palpable|tapestry|testament|interplay|synergy|synergies"
     r"|paradigm|camaraderie|cacophony|linchpin|throughline|substrate|north star|deep dive|realm"
     r"|load-bearing|smoking gun|footgun|earns? its keep|doing the (?:heavy )?(?:work|lifting)"
     r"|leans? into|leaning into|sits? with|sitting with|double-click on"
     r"|honest (?:caveat|take|answer|version|truth|assessment)|to be honest|genuinely|quietly"
     r"|truly|incredibly|remarkably|undoubtedly|undeniably|arguably)\b",
     "stock word; use the plain one or cut the sentence"),
    ("vocab", CHECK,
     r"\b(?:landscape|ecosystem|journey|robust|comprehensive|nuanced|compelling|dynamic|enhanc(?:e|es|ed|ing)"
     r"|navigat(?:e|es|ed|ing)|unlock(?:s|ed|ing)?|elevat(?:e|es|ed|ing)|resonat(?:e|es|ed|ing)"
     r"|align(?:s|ed|ing)? with|prioritiz(?:e|es|ed|ing)|surfac(?:e|es|ed|ing)|the shape of|the tell"
     r"|outright|precisely|honestly|fundamentally|essentially|ultimately|deeply|dependable|universally"
     r"|wedg(?:e|es|ed|ing)|a real)\b",
     "often a tell, sometimes literal; keep it only if it is the plain word for the thing"),
    ("opener", CHECK,
     r"(?:^|[.!?]\s+)(?:additionally|moreover|furthermore|consequently|notably|importantly|interestingly"
     r"|crucially|overall|that said|in essence|indeed),",
     "formal connective opening a sentence; usually the sentence stands without it"),
]
RULES = [(r, s, re.compile(p, re.I), m) for r, s, p, m in RULES]

# Checked on the raw line, before quotes and code are masked.
FORMAT = [
    ("bold-label", FIX, re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+\*\*[^*]+(?:\*\*\s*[:.–—-]|[:.]\*\*)"),
     "bold label on a list item; write a sentence, or a plain list"),
    ("emoji", FIX, re.compile("[\U0001F300-\U0001FAFF☀-➿⭐⬆✅]"), "remove"),
    ("arrow", CHECK, re.compile(r"[→⇒➜]"), "write the relation in words unless this is a diagram"),
    ("curly-quote", CHECK, re.compile(r"[“”‘’]"), "straight quotes unless the destination curls them"),
    ("rule", CHECK, re.compile(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$"), "horizontal rule as a section divider"),
]
SMALL = {"a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "with"}
MASK = re.compile(r"`[^`\n]*`|\"[^\"\n]*\"|“[^”\n]*”|https?://\S+")
EXPANDED = re.compile(r"\b(?:it is|that is|there is|do not|does not|did not|cannot|can not|will not|is not|are not"
                      r"|was not|you are|we are|they are|i am|i have|we have|you will|it will)\b", re.I)
CONTRACTED = re.compile(r"\b\w+(?:n't|'s|'re|'ve|'ll|'d|'m)\b", re.I)
TRIAD = re.compile(r"((?:(?:[\w'-]+\s){0,2}[\w'-]+,\s+)+)(?:[\w'-]+\s){0,2}[\w'-]+,?\s+(?:and|or)\s+[\w'-]+")
ING_TAIL = re.compile(r",\s+\w+ing\b")
SENTENCE_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z(\[])")


def prose_lines(text):
    """Yield (line number, raw line, masked line) for lines that are prose."""
    fenced = frontmatter = False
    for n, raw in enumerate(text.splitlines(), 1):
        if n == 1 and raw.strip() == "---":
            frontmatter = True
            continue
        if frontmatter:
            frontmatter = raw.strip() != "---"
            continue
        if raw.lstrip().startswith(("```", "~~~")):
            fenced = not fenced
            continue
        if fenced or raw.lstrip().startswith(">"):
            continue
        yield n, raw, MASK.sub(lambda m: " " * len(m.group()), raw)


def lint(text):
    findings, body, paragraphs, para = [], [], [], []
    for n, raw, line in prose_lines(text):
        for rule, sev, pat, msg in FORMAT:
            m = pat.search(raw)
            if m:
                findings.append((n, sev, rule, m.group().strip()[:60], msg))
        heading = re.match(r"\s*#{1,6}\s+(.*)", line)
        if heading:
            words = [w for w in re.findall(r"[A-Za-z][\w'-]*", heading.group(1)) if w.lower() not in SMALL]
            if len(words) >= 3 and all(w[0].isupper() for w in words):
                findings.append((n, CHECK, "title-case", heading.group(1).strip()[:60], "sentence case for headings"))
            continue
        for rule, sev, pat, msg in RULES:
            for m in pat.finditer(line):
                findings.append((n, sev, rule, m.group().strip()[:60], msg))
        if line.strip() and not line.lstrip().startswith("|"):
            para.append(re.sub(r"^\s*(?:[-*+]|\d+[.)])\s+", "", line.strip()))
            body.append(line)
        elif para:
            paragraphs.append(" ".join(para))
            para = []
    if para:
        paragraphs.append(" ".join(para))

    prose = " ".join(body)
    words = len(re.findall(r"[\w'-]+", prose))
    lengths = [len(s.split()) for p in paragraphs for s in SENTENCE_END.split(p) if s.strip()]
    stats = {"words": words, "sentences": len(lengths)}
    notes = []
    if len(lengths) >= 8:
        mean, sd = statistics.mean(lengths), statistics.pstdev(lengths)
        band = sum(8 <= n <= 20 for n in lengths) / len(lengths)
        stats.update(mean=round(mean, 1), sd=round(sd, 1), cv=round(sd / mean, 2),
                     band=round(band, 2), longest=max(lengths))
        if sd / mean < 0.40:
            notes.append("sentences are all about the same length; let some run long and keep short ones for new facts")
        if band > 0.75:
            notes.append("over three quarters of sentences sit in the 8 to 20 word band")
        if words >= 150 and max(lengths) < 25:
            notes.append("no sentence over 25 words; people write some")
    run = best = 0
    for n in lengths:
        run = run + 1 if n <= 5 else 0
        best = max(best, run)
    if best >= 4:
        notes.append(f"{best} very short sentences in a row; staccato for effect")
    triads = sum(m.group(1).count(",") == 1 for m in TRIAD.finditer(prose))  # exactly three items
    if triads >= 2 and triads > words / 120:
        notes.append(f"{triads} lists of three; check each really has three members")
    tails = len(ING_TAIL.findall(prose))
    if lengths and tails >= 3 and tails / len(lengths) > 0.2:
        notes.append(f"{tails} clauses ending in a trailing -ing phrase; join with and, but, so or because")
    expanded, contracted = len(EXPANDED.findall(prose)), len(CONTRACTED.findall(prose))
    if expanded >= 3 and expanded > contracted:
        notes.append(f"{expanded} uncontracted forms and {contracted} contractions; contract unless the register is formal")
    return findings, stats, notes


def report(name, text):
    findings, stats, notes = lint(text)
    for n, sev, rule, hit, msg in sorted(findings):
        print(f"{name}:{n}  {sev:5}  {rule:17}  {hit!r}  -> {msg}")
    print(f"{name}: " + ", ".join(f"{k} {v}" for k, v in stats.items()))
    for note in notes:
        print(f"{name}:    {CHECK:5}  {'rhythm':17}  {note}")
    fixes = sum(sev == FIX for _, sev, *_ in findings)
    print(f"{name}: {fixes} fix, {len(findings) - fixes + len(notes)} check")
    return fixes


def selftest():
    bad = (
        "## Why This Matters Today\n\n"
        "In today's fast-moving world, speed isn't a luxury, it's a necessity. The result? Chaos.\n"
        "Our platform serves as a hub for teams, fostering collaboration — and it shows.\n"
        "It's worth noting that the tool is robust, seamless, and scalable, highlighting our commitment to quality.\n"
        "- **Fast:** it is quick.\n\nI hope this helps! \U0001F680\n"
    )
    found = {rule for _, sev, rule, *_ in lint(bad)[0] if sev == FIX}
    expected = {"staging", "negative-parallel", "question-fragment", "copula-dodge", "dash", "vocab",
                "ing-tail", "bold-label", "chat-residue", "emoji"}
    assert expected <= found, f"missed: {expected - found}"
    good = (
        "We moved the nightly export from cron to the queue on Tuesday. It used to take forty minutes and\n"
        "block the reports page while it ran; now it takes six, and nobody notices.\n\n"
        'A quoted phrase like "delve into the tapestry" is left alone, and so is `leverage()` in code.\n'
        "```\nserves as a testament\n```\n"
    )
    left = [f for f in lint(good)[0] if f[1] == FIX]
    assert not left, f"false positives: {left}"
    print("selftest ok")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args == ["--selftest"]:
        selftest()
    elif not args:
        sys.exit(__doc__)
    else:
        total = sum(report(a, sys.stdin.read() if a == "-" else open(a, encoding="utf-8").read()) for a in args)
        sys.exit(1 if total else 0)
