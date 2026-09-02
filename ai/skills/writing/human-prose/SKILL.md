---
name: human-prose
description: Humanizer for fiction. Use when drafting or lining narrative, killing machine cadence, or when another skill needs a line pass.
---

# Humanizer

Make the page sound like a person wrote it. Not a committee. Not a model.

Load this skill before any narrative sentence hits disk. The **lining** pass is this skill. Draft may call it after the scene exists. Critique names tells. Revise repairs them.

Read [`rules/tells.md`](rules/tells.md) before lining. Run the checker after.

## Steps

1. Read the passage and the project's voice file if it exists (`50 Book/54 Voice/voice.md` in the world dest). Completion: you can name the POV, the job they are doing, and one thing they would notice that a tourist would not.
2. Line locally. Repair the smallest failing unit. Keep the movement that already belongs. Completion: every tell in `rules/tells.md` that appears in this passage is gone or justified as a character's actual speech.
3. Run the checker on the file:

```
node .pi/skills/human-prose/scripts/prose-check.mjs "<chapter-file>"
```

Completion: stdout contains `PROSE CLEAN`.

## Lining

Write as if the POV is busy. Attention is a budget. They notice tools, bodies, weather, and other people's tells. They do not notice theme.

Prefer:

- **burstiness**: a two-word sentence next to a long one. Fragments when the body would fragment.
- **subtext**: the line that is not said. The job the dialogue is actually doing.
- **said**: tags stay out of the way. Action beats carry the rest.
- **specifics**: a named instrument, a stale coffee, a scuffed bulkhead code. Not "the vastness of space."
- **breaks**: commas, periods, colons, parentheses. Clause joins a human would speak.

Hard guardrail, paired with the break rule above: the Unicode em dash and en dash do not appear in narration. If a character would swear or trail off, use a period, a comma, or an ellipsis.

Dialogue is messy. Interruptions. Wrong words. People who do not finish. Each voice has a different size of sentence.

Do not show then tell. If the body already did the feeling, stop.

End on an image or a cost. Not a summary breath. Not a thematic bow.

## Soul check

After the checker is clean, read the first page aloud in your head. If every sentence could live in any competent SF novel, it is still machine cadence. Put one wrong-in-an-interesting-way observation back in. The lining is not done until a stranger could guess which person is looking.
