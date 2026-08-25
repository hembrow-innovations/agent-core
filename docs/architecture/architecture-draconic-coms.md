---
id: "architecture-draconic-coms"
title: "Draconic coms"
kind: architecture
description: "One mailbox: bind a named peer, stamp identity, and send prompts over unix sockets."
domain: pack
area: coms
tags: [architecture, coms]
created_at: "2026-08-26"
updated_at: "2026-08-26"
---

# Draconic coms

## Overview

`@agentic-core/draconic-coms` is the living-session mailbox. A Pi process binds a name on a project, listens on a unix socket, and talks to other bound peers on the same machine.

Protocol code lives in the same package, `packages/draconic-coms/src/protocol.ts`. There is no `draconic-coms-protocol` product. There is no second mailbox.

Identity flags are `--cname`, `--purpose`, and `--project`. They are not `PI_*` env vars and not `pi --name`. Teams reads those flags. Teams must not register them. See [[spec-tmux-agent-teams]] and [[spec-pi-agent-system]].

## Context

A team of TUI sessions needs a way to find each other and push a prompt that starts a turn. Subagents already cover swarm and arena. Coms is only for peers that are already running.

Pi rejects two extensions owning the same flag. `getFlag` only sees flags that extension registered. Coms therefore owns `--project` and `--cname`. Teams falls back to `process.argv` when `getFlag` is empty.

## Design

### Flags

`index.ts` registers three flags on load.

```ts
// packages/draconic-coms/src/index.ts — default export
pi.registerFlag("cname", {
  description:
    "Coms agent name. Distinct from pi --name, which the harness owns.",
  type: "string",
  default: undefined,
});
pi.registerFlag("purpose", {
  description: "What this living session is for",
  type: "string",
  default: undefined,
});
pi.registerFlag("project", {
  description: "Project namespace for peer discovery",
  type: "string",
  default: "default",
});
```

`packages/draconic-teams/src/index.test.ts` test `teams does not re-register coms identity flags` asserts the two factories share no flag names.

### Bind

`session_start` calls `bindPeer`. The desired name is `--cname`, or `agent-` plus the last six hex chars of a fresh `newId()`. The project is `--project`, or `default`.

```ts
// packages/draconic-coms/src/index.ts — session_start
const sessionId = newId();
const desired = flagString(pi, "cname") || `agent-${sessionId.slice(-6)}`;
const project = flagString(pi, "project") || "default";
peer = await bindPeer({
  comsDir: defaultComsDir(),
  name: desired,
  purpose: flagString(pi, "purpose") ?? "",
  project,
  model: ctx.model?.id ?? "unknown",
  cwd: ctx.cwd,
  sessionId,
  onPrompt: (env) => {
    pi.sendMessage(
      {
        customType: "coms-inbound",
        content: `[from ${env.sender_name}]\n\n${env.prompt}`,
        display: true,
      },
      { deliverAs: "followUp", triggerTurn: true },
    );
  },
});
```

`bindPeer` in `protocol.ts` picks a unique name with `resolveUniqueName`, listens on `socketPath`, and writes the registry card with `writeRegistryAtomic`. A live name collision becomes `planner2`, then `planner3`. Bind failure notifies and leaves `peer` unset.

`onPrompt` is how a received prompt wakes the TUI. The inbound is a follow-up turn, not a second inbox file.

### Mailbox files

`defaultComsDir` is `$PI_COMS_DIR` or `~/.pi/coms`. That env var is the mailbox root. It is not project or cname.

```ts
// packages/draconic-coms/src/protocol.ts — paths
export function defaultComsDir(): string {
  return process.env.PI_COMS_DIR || join(homedir(), ".pi", "coms");
}

export function agentsDir(comsDir: string, project: string): string {
  return join(comsDir, "projects", project, "agents");
}

export function registryPath(
  comsDir: string,
  project: string,
  name: string,
): string {
  return join(agentsDir(comsDir, project), `${name}.json`);
}

export function socketPath(comsDir: string, sessionId: string): string {
  return join(comsDir, "sockets", `${sessionId}.sock`);
}
```

`ensureComsDir` creates `projects/<project>/agents` and `sockets`, then `chmod 700` on the root. Each live peer is one JSON card plus one socket. `pruneAndRead` drops cards whose `pid` is dead. `list` pings the rest.

### Prompt stamp

`before_agent_start` appends one line. Bound sessions get the peer name and project. Unbound sessions, including a turn before `session_start` finishes, get the failure line.

```ts
// packages/draconic-coms/src/index.ts — before_agent_start
const identity = peer
  ? `You are coms peer ${peer.name} on project ${peer.project}.`
  : "coms is not bound.";
return {
  systemPrompt: `${event.systemPrompt}\n\n${identity}`,
};
```

`extension.test.ts` checks both strings.

### Send, get, await

The public tools wrap `BoundPeer`.

- **coms_list.** Prepends this session's card and marks it `this-session` through `formatPeer`. Then `peer.list()` for the others.
- **coms_send.** `peer.send({ target, prompt })`. Returns `msg_id` after the receiver acks.
- **coms_get.** Non-blocking `peer.get(msg_id)`. Status is `pending`, `complete`, or `error`.
- **coms_await.** `peer.awaitReply(msg_id, timeoutMs)`. Default timeout is `defaultTimeoutMs()`, 30 minutes or `$PI_COMS_TIMEOUT_MS`.

```ts
// packages/draconic-coms/src/index.ts — coms_list
const others = await peer.list();
const peers = [selfCard, ...others];
const lines = peers.map((item, index) => formatPeer(item, index === 0));
```

`sendEnvelope` writes one JSON line to the target socket and reads one `ack`, `nack`, or `pong`. `bindPeer` accepts `prompt`, `response`, and `ping`. Hops over `defaultMaxHops()` (`$PI_COMS_MAX_HOPS` or 5) nack with `hops exceeded`.

`agent_end` calls `fulfillInbound` for every `unfulfilledInbounds()` entry, using `lastAssistantText` of the current branch. Two inbound prompts in one turn both complete. `session_shutdown` calls `peer.shutdown()`, which closes the socket and removes the registry file.

## Trade-offs

The design keeps one mailbox on the local machine. Discovery is a directory of pid-checked cards. Delivery is a unix socket, not a file the model reads.

It sacrifices cross-machine peers and a durable transcript of messages. A dead pid is pruned. A stale socket is probed and unlinked. There is no retry queue.

Teams can read `--project` and `--cname` without owning them. That split is required because Pi will not let two extensions register the same flag.

## Consequences

A new process without flags binds as `agent-<id>` on project `default`. Resume without the flags does the same. The model learns the bind from the prompt stamp, `coms_list`, and later `team_status`. The TUI chip is `name@project` via `setComsStatus`.

Vendor dest is `.pi/vendor/@agentic-core/draconic-coms`. Pack layout is [[architecture-pack-and-packages]]. Terms are [[glossary]].
