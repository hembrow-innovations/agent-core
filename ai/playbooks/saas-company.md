---
title: SaaS company
when: "A lead in tmux staffs living teammates to take a SaaS from idea to market. Distinct from Orchestrate, which drives nicobailon children, and from Autonomous run, which drives one predicate inside one session."
---

### SaaS company

**You own the roster, never the product code.** Staff living tmux teammates. Claimable units. Files are the handoff. For "run this as a software company", "staff a team to ship a SaaS", or taking a product from idea to launch with named panes the human can type into.

The human is CEO. This lead is coordinator. Teammates are department heads. Short jobs inside a pane stay subagents. Do not mix those two. Cap at four teammate panes. Restaff when the phase changes. Shutdown the previous set. Nested teams, RPC peers, and a second mailbox are out.

Lead flags, inside tmux, trusted folder:

```bash
pi --project <slug> --cname team-lead
```

`team_create` uses that same slug unless `--project` already names it. Spawn names match dest `.pi/agents/` stems. If this process has no `--project` / `--cname`, stop. Spawned panes will not hear you.

#### Rosters

- **Discover.** researcher, product, spec. Planner as a fourth pane only if the tree is wide.
- **Shape.** architect, designer. Keep spec only if acceptance is still moving.
- **Build.** coder, tester, reviewer. Spawn debugger or devops for a bug or a pipeline, then shut them down.
- **Launch.** growth, documenter, devops. Keep product if pricing or scope is still moving.

Do not leave discover panes open through build.

#### Claim loop

1. `task_create` each unit. `description` is what done looks like. Blockers in `blockedBy`.
2. `coms_send` the job. Tell them to `task_claim`, write the artifact, `task_complete`, reply, stay.
3. `coms_await`. `idle: <name> settled` means they are free.
4. `team_shutdown` when the phase ends. A missing pane is a no-op.

One writer per cwd. Handoff is a file, not chat memory.

#### Sequence

1. Discover. researcher findings, then product brief, then spec for the paid wedge only. No coder yet.
2. Shape. designer prototype that settles layout or flow. architect data shape and boundaries.
3. Plan. planner slices the spec into team units with blockers.
4. Build. coder / tester loop per slice. reviewer gates the diff. debugger only on a real failure. Verify on the real surface. Feature, Prototype, and Opening a PR stay the build playbooks. This one only restaffs.
5. Launch. devops deploys the real surface. documenter writes what a stranger needs. growth does landing, one channel, a way to see if anyone cares.
6. Stop. Next paid slice repeats from spec, not from a new org chart.

If one agent could finish inside this session's budget, do not staff a team. Route to Autonomous run or Feature.

**Reply:** which roster is live, which units are claimed, artifact paths, which panes you shut down, what the next phase needs.
