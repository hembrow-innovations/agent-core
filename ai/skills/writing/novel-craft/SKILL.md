---
name: novel-craft
description: Novel craft for scenes and chapters. Use when writing a chapter, building a scene, outlining beats, revising story architecture, or elevating a draft.
---

# Novel craft

Fiction on the page. The **brief** decides. The **scene** happens. The **elevate** pass raises a chapter that already exists.

Load **human-prose** before any sentence. Load **world-vault** before any fact.

Read [`rules/scene.md`](rules/scene.md) when entering or leaving a scene. Read [`rules/sf.md`](rules/sf.md) when technology, scale, or aliens touch the page.

## Separate the jobs

Keep four piles. Do not dump them into one prompt in your head.

- **Voice**: how this book notices. `50 Book/54 Voice/voice.md`
- **Canon**: facts that cannot drift. Lore notes in `10 Core/`, `20 Atlas/`, `30 Characters/`
- **Ledger**: what accepted scenes already changed. `50 Book/55 Ledger/`
- **Brief**: what must happen now. The slice Done, plus the chapter file's opening notes

Generate without the review rubric in the room. Evaluate after prose exists.

## Branch: brief

Used by Plan.

1. Name POV (one person), want, who can impose a cost, and the choice left after capability is spent. Completion: those four sentences exist on the slice.
2. List beats as turns, not summaries. Each beat changes knowledge, leverage, or the body. Completion: a stranger could act the chapter from the list.
3. Write oracles on the slice. `CHECK:` is the prose checker on the chapter path. `EXPECT: PROSE CLEAN`. Completion: oracles parse.

Do not invent lore. If the brief needs a fact the vault does not have, pick a brief the vault can support. Unattended lanes never wait.

## Branch: draft

Used by Draft.

1. Read voice, canon notes linked from the brief, ledger, previous chapter ending, and the brief. Completion: you can say what must not repeat.
2. Write one chapter to `50 Book/52 Chapters/ch-NN.md`. Close third. One POV. Past tense. Completion: the file exists, the want is pursued, something costs.
3. Do not line yet. Do not score. Leave `pass: 0` in chapter front matter.

Stay inside the brief. Unattended lanes never escalate. Cut the scene to what the vault already holds.

## Branch: elevate

Used by Critique and Revise.

Critique names the smallest failing unit and why a reader would leave. It does not rewrite the chapter.

Revise repairs that unit. Preserve voice and movement that already belong. Reconstruction is last.

Pass cap is 3 lining cycles on one chapter. After 3, release for Review even if the chapter is only good, not great. Improve can mint a later elevate ticket.

## Form

- One POV per chapter. No mid-scene hops.
- Scene = want, friction, turn. If nothing turns, it is not a scene.
- Trust the reader. Withhold.
- Chapter end: a hook that is a fact, not a promise.
