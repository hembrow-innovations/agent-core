# Panel

The counterpart is a **panel**, not the user. Each frontier is one **round**. The session directory is the notebook.

Load **management** before any write under `.heio/`. Load **pi-subagents** before any spawn.

## Personas

- **architect** — types, signatures, module boundaries
- **product** — customer, wedge, scope to cut
- **coder** — cost, testability, reversibility

`subagent({ action: "list" })` first. Use a dest agent only when that name is executable. Otherwise `oracle` with `context: "fresh"` and the persona in the task.

**round-orchestrator** may spawn. Panelists and **judge** do not.

## Notebook

Session: `.heio/planning/arena/<arena-name>/`

Rounds: `.heio/planning/arena/<arena-name>/rounds/round-<N>/`

`<arena-name>` is a kebab-case slug. A name the user gives wins.

Search `.heio/planning/arena/` and `closed/` for an existing session on this topic. Update that session if you find one.

## Round

Read [round-contracts.md](round-contracts.md) before spawning **round-orchestrator**.

If that name is not executable with write and `subagent`, the parent runs the contracts itself.

Wait for the round to return before the next frontier.

Done when every round directory matches the contracts, the frontier is empty, and the user has confirmed a shared understanding. Then return to Persist on the parent skill.

On persist, copy the management plan template from the selected answers. The session directory stays the interview.
