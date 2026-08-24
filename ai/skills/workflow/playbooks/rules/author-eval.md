---
title: Eval
impact: LOW
impactDescription: A candidate that knows it is being judged changes its behavior
tags: [author]
---

## Eval

Test how a skill, structure, or prompt change affects agent behavior before promoting it.

**Incorrect:** Put `eval`, `candidate`, or `rubric` in a path the candidate sees. Ask it which skills it applied. Run two judge passes with different prompts.

**Correct:** You own the experiment. Blind candidates. One judge. Grade from files opened and code shape, not self-report.

1. Frame the variant and the success behavior. Rubric is for the judge only.
2. Sanitized per-candidate dirs. Organic project names.
3. One organic prompt. Goal, not meta.
4. N parallel candidates via arena Phase B.
5. One blinded judge on a different model family.
6. Verify the chain from transcripts. Do not glob across workspaces.
7. Read every candidate output yourself. Synthesize against the judge.

Library: `ai/playbooks/eval.md` (dest: `playbooks/eval.md`).
