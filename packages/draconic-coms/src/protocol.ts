import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import {
  createConnection,
  createServer,
  type Server,
  type Socket,
} from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";

const LINE_CAP_BYTES = 64 * 1024;
const DEFAULT_PROJECT = "default";
const DEFAULT_MAX_HOPS = 5;
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export type PromptEnvelope = {
  type: "prompt";
  msg_id: string;
  sender_session: string;
  sender_endpoint: string;
  sender_name: string;
  sender_cwd: string;
  hops: number;
  timestamp: string;
  prompt: string;
};

export type ResponseEnvelope = {
  type: "response";
  msg_id: string;
  sender_session: string;
  sender_endpoint: string;
  hops: number;
  timestamp: string;
  response: string;
  error?: string;
};

export type PingEnvelope = {
  type: "ping";
  msg_id: string;
  sender_session: string;
  sender_endpoint: string;
  hops: number;
  timestamp: string;
};

export type Envelope = PromptEnvelope | ResponseEnvelope | PingEnvelope;

export type AgentCard = {
  name: string;
  purpose: string;
  model: string;
  context_used_pct: number;
  queue_depth: number;
};

export type Ack = { type: "ack"; msg_id: string };
export type Nack = { type: "nack"; msg_id: string; error: string };
export type Pong = { type: "pong"; msg_id: string; agent_card: AgentCard };
export type Reply = Ack | Nack | Pong;

export type RegistryEntry = {
  session_id: string;
  name: string;
  purpose: string;
  model: string;
  pid: number;
  endpoint: string;
  cwd: string;
  started_at: string;
};

export type ListedPeer = {
  name: string;
  model: string;
  purpose: string;
  cwd: string;
  alive: boolean;
};

export type GetResult =
  | { status: "pending" }
  | { status: "complete"; response: string }
  | { status: "error"; error: string };

export type BindPeerOptions = {
  comsDir: string;
  name: string;
  purpose?: string;
  project?: string;
  model?: string;
  cwd?: string;
  sessionId?: string;
  pid?: number;
  maxHops?: number;
  onPrompt?: (env: PromptEnvelope) => void;
};

export type BoundPeer = {
  name: string;
  sessionId: string;
  endpoint: string;
  project: string;
  registryPath: string;
  list: () => Promise<ListedPeer[]>;
  send: (args: {
    target: string;
    prompt: string;
    hops?: number;
  }) => Promise<{ msg_id: string }>;
  get: (msgId: string) => GetResult;
  awaitReply: (msgId: string, timeoutMs?: number) => Promise<string>;
  lastUnfulfilledInbound: () => PromptEnvelope | undefined;
  unfulfilledInbounds: () => PromptEnvelope[];
  fulfillInbound: (args: {
    msgId: string;
    response: string;
    error?: string;
  }) => Promise<void>;
  shutdown: () => Promise<void>;
};

type Inbound = {
  env: PromptEnvelope;
  fulfilled: boolean;
};

type Pending = {
  promise: Promise<{ response: string; error?: string }>;
  resolve: (value: { response: string; error?: string }) => void;
  result?: { response: string; error?: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function defaultComsDir(): string {
  return process.env.PI_COMS_DIR || join(homedir(), ".pi", "coms");
}

export function defaultMaxHops(): number {
  const n = Number(process.env.PI_COMS_MAX_HOPS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_HOPS;
}

export function defaultTimeoutMs(): number {
  const n = Number(process.env.PI_COMS_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return randomBytes(6).toString("hex");
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

export function ensureComsDir(comsDir: string, project: string): void {
  mkdirSync(join(comsDir, "projects", project, "agents"), { recursive: true });
  mkdirSync(join(comsDir, "sockets"), { recursive: true });
  chmodSync(comsDir, 0o700);
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return !(isRecord(err) && err.code === "ESRCH");
  }
}

export function writeRegistryAtomic(args: {
  comsDir: string;
  project: string;
  entry: RegistryEntry;
}): string {
  ensureComsDir(args.comsDir, args.project);
  const finalPath = registryPath(args.comsDir, args.project, args.entry.name);
  const tmp = `${finalPath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(args.entry, null, 2)}\n`);
  renameSync(tmp, finalPath);
  return finalPath;
}

export function removeRegistryFile(
  comsDir: string,
  project: string,
  name: string,
): void {
  try {
    unlinkSync(registryPath(comsDir, project, name));
  } catch {
    // already gone
  }
}

function readRegistryFile(path: string): RegistryEntry | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!isRecord(parsed)) return undefined;
    const session_id = asString(parsed.session_id);
    const name = asString(parsed.name);
    const purpose = asString(parsed.purpose);
    const model = asString(parsed.model);
    const pid = asNumber(parsed.pid);
    const endpoint = asString(parsed.endpoint);
    const cwd = asString(parsed.cwd);
    const started_at = asString(parsed.started_at);
    if (
      !session_id ||
      !name ||
      purpose === undefined ||
      !model ||
      pid === undefined ||
      !endpoint ||
      !cwd ||
      !started_at
    ) {
      return undefined;
    }
    return { session_id, name, purpose, model, pid, endpoint, cwd, started_at };
  } catch {
    return undefined;
  }
}

export function pruneAndRead(
  comsDir: string,
  project: string,
): RegistryEntry[] {
  const dir = agentsDir(comsDir, project);
  if (!existsSync(dir)) return [];
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return [];
  }
  const live: RegistryEntry[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const path = join(dir, file);
    const entry = readRegistryFile(path);
    if (!entry) continue;
    if (isProcessAlive(entry.pid)) {
      live.push(entry);
      continue;
    }
    try {
      unlinkSync(path);
    } catch {
      // already gone
    }
  }
  return live;
}

export function resolveUniqueName(
  comsDir: string,
  project: string,
  desired: string,
): string {
  const live = new Set(
    pruneAndRead(comsDir, project).map((entry) => entry.name),
  );
  if (!live.has(desired)) return desired;
  let n = 2;
  while (live.has(`${desired}${n}`)) n += 1;
  return `${desired}${n}`;
}

function parseEnvelope(value: unknown): Envelope | undefined {
  if (!isRecord(value)) return undefined;
  const msg_id = asString(value.msg_id);
  const sender_session = asString(value.sender_session);
  const sender_endpoint = asString(value.sender_endpoint);
  const hops = asNumber(value.hops);
  const timestamp = asString(value.timestamp);
  const type = asString(value.type);
  if (
    !msg_id ||
    !sender_session ||
    !sender_endpoint ||
    hops === undefined ||
    !timestamp ||
    !type
  ) {
    return undefined;
  }
  if (type === "prompt") {
    const prompt = asString(value.prompt);
    const sender_name = asString(value.sender_name);
    const sender_cwd = asString(value.sender_cwd);
    if (prompt === undefined || !sender_name || sender_cwd === undefined)
      return undefined;
    return {
      type,
      msg_id,
      sender_session,
      sender_endpoint,
      sender_name,
      sender_cwd,
      hops,
      timestamp,
      prompt,
    };
  }
  if (type === "response") {
    const response =
      typeof value.response === "string"
        ? value.response
        : JSON.stringify(value.response ?? "");
    const error = asString(value.error);
    return {
      type,
      msg_id,
      sender_session,
      sender_endpoint,
      hops,
      timestamp,
      response,
      ...(error === undefined ? {} : { error }),
    };
  }
  if (type === "ping") {
    return { type, msg_id, sender_session, sender_endpoint, hops, timestamp };
  }
  return undefined;
}

function parseReply(value: unknown): Reply | undefined {
  if (!isRecord(value)) return undefined;
  const type = asString(value.type);
  const msg_id = asString(value.msg_id);
  if (!type || msg_id === undefined) return undefined;
  if (type === "ack") return { type, msg_id };
  if (type === "nack") {
    return { type, msg_id, error: asString(value.error) ?? "nack" };
  }
  if (type === "pong") {
    if (!isRecord(value.agent_card)) return undefined;
    const name = asString(value.agent_card.name);
    const purpose = asString(value.agent_card.purpose);
    const model = asString(value.agent_card.model);
    const context_used_pct = asNumber(value.agent_card.context_used_pct);
    const queue_depth = asNumber(value.agent_card.queue_depth);
    if (
      !name ||
      purpose === undefined ||
      !model ||
      context_used_pct === undefined ||
      queue_depth === undefined
    ) {
      return undefined;
    }
    return {
      type,
      msg_id,
      agent_card: { name, purpose, model, context_used_pct, queue_depth },
    };
  }
  return undefined;
}

function writeLine(socket: Socket, value: Reply): void {
  try {
    socket.write(`${JSON.stringify(value)}\n`);
  } catch {
    // drop
  }
  try {
    socket.end();
  } catch {
    // drop
  }
}

function ackOk(socket: Socket, msgId: string): void {
  writeLine(socket, { type: "ack", msg_id: msgId } satisfies Ack);
}

function nack(socket: Socket, msgId: string, error: string): void {
  writeLine(socket, { type: "nack", msg_id: msgId, error } satisfies Nack);
}

function readOneLine(socket: Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = "";
    let settled = false;
    const finish = (err: Error | undefined, line?: string) => {
      if (settled) return;
      settled = true;
      socket.off("data", onData);
      if (err) reject(err);
      else resolve(line ?? "");
    };
    const onData = (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      if (buf.length > LINE_CAP_BYTES) {
        finish(new Error("line too large"));
        return;
      }
      const nl = buf.indexOf("\n");
      if (nl >= 0) finish(undefined, buf.slice(0, nl));
    };
    socket.on("data", onData);
    socket.once("error", (err) => finish(err));
    socket.once("close", () =>
      finish(new Error("connection closed before line received")),
    );
  });
}

export async function sendEnvelope(
  endpoint: string,
  envelope: Envelope,
): Promise<Reply> {
  return await new Promise((resolve, reject) => {
    const sock = createConnection({ path: endpoint });
    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      try {
        sock.destroy();
      } catch {
        // drop
      }
      reject(err);
    };
    sock.once("error", (err) => fail(err));
    sock.once("connect", () => {
      void (async () => {
        try {
          sock.write(`${JSON.stringify(envelope)}\n`);
          const line = await readOneLine(sock);
          const parsed: unknown = JSON.parse(line);
          const reply = parseReply(parsed);
          try {
            sock.end();
          } catch {
            // drop
          }
          if (settled) return;
          settled = true;
          if (!reply) {
            reject(new Error("malformed reply"));
            return;
          }
          if (reply.type === "nack") {
            reject(new Error(reply.error));
            return;
          }
          resolve(reply);
        } catch (err) {
          fail(err instanceof Error ? err : new Error(String(err)));
        }
      })();
    });
  });
}

function probeStaleSocket(endpoint: string): Promise<"in_use" | "stale"> {
  return new Promise((resolve) => {
    const sock = createConnection({ path: endpoint });
    let settled = false;
    const finish = (verdict: "in_use" | "stale") => {
      if (settled) return;
      settled = true;
      try {
        sock.destroy();
      } catch {
        // drop
      }
      resolve(verdict);
    };
    const timer = setTimeout(() => finish("stale"), 250);
    sock.once("connect", () => {
      clearTimeout(timer);
      finish("in_use");
    });
    sock.once("error", () => {
      clearTimeout(timer);
      finish("stale");
    });
  });
}

async function listen(
  endpoint: string,
  handler: (socket: Socket) => void,
): Promise<Server> {
  if (existsSync(endpoint)) {
    const verdict = await probeStaleSocket(endpoint);
    if (verdict === "in_use") {
      throw new Error(`coms: endpoint already in use (${endpoint})`);
    }
    try {
      unlinkSync(endpoint);
    } catch {
      // drop
    }
  }
  return await new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.once("error", reject);
    server.listen(endpoint, () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}

export async function bindPeer(opts: BindPeerOptions): Promise<BoundPeer> {
  const project = opts.project || DEFAULT_PROJECT;
  const maxHops = opts.maxHops ?? defaultMaxHops();
  const sessionId = opts.sessionId ?? newId();
  const name = resolveUniqueName(opts.comsDir, project, opts.name);
  const purpose = opts.purpose ?? "";
  const model = opts.model ?? "unknown";
  const cwd = opts.cwd ?? process.cwd();
  const pid = opts.pid ?? process.pid;
  const endpoint = socketPath(opts.comsDir, sessionId);
  const inbound = new Map<string, Inbound>();
  const pending = new Map<string, Pending>();
  let currentInbound: Inbound | undefined;
  let closed = false;
  let server: Server | undefined;

  const identity = (): RegistryEntry => ({
    session_id: sessionId,
    name,
    purpose,
    model,
    pid,
    endpoint,
    cwd,
    started_at: nowIso(),
  });

  const card = (): AgentCard => ({
    name,
    purpose,
    model,
    context_used_pct: 0,
    queue_depth: inbound.size,
  });

  const handlePrompt = (socket: Socket, env: PromptEnvelope) => {
    if (env.hops >= maxHops) {
      nack(socket, env.msg_id, "hops exceeded");
      return;
    }
    const item: Inbound = { env, fulfilled: false };
    inbound.set(env.msg_id, item);
    currentInbound = item;
    ackOk(socket, env.msg_id);
    try {
      opts.onPrompt?.(env);
    } catch {
      // receiver already acked
    }
  };

  const handleResponse = (socket: Socket, env: ResponseEnvelope) => {
    const wait = pending.get(env.msg_id);
    if (wait && !wait.result) {
      wait.result = env.error
        ? { response: env.response, error: env.error }
        : { response: env.response };
      wait.resolve(wait.result);
    }
    ackOk(socket, env.msg_id);
  };

  const handlePing = (socket: Socket, env: PingEnvelope) => {
    writeLine(socket, {
      type: "pong",
      msg_id: env.msg_id,
      agent_card: card(),
    } satisfies Pong);
  };

  const connHandler = (socket: Socket) => {
    let buf = "";
    let handled = false;
    const onData = (chunk: Buffer) => {
      if (handled) return;
      buf += chunk.toString("utf8");
      if (buf.length > LINE_CAP_BYTES) {
        handled = true;
        socket.off("data", onData);
        nack(socket, "", "malformed envelope");
        return;
      }
      const nl = buf.indexOf("\n");
      if (nl < 0) return;
      handled = true;
      socket.off("data", onData);
      let parsed: unknown;
      try {
        parsed = JSON.parse(buf.slice(0, nl));
      } catch {
        nack(socket, "", "malformed envelope");
        return;
      }
      const env = parseEnvelope(parsed);
      if (!env) {
        const mid = isRecord(parsed) ? (asString(parsed.msg_id) ?? "") : "";
        nack(socket, mid, "malformed envelope");
        return;
      }
      if (env.type === "prompt") handlePrompt(socket, env);
      else if (env.type === "response") handleResponse(socket, env);
      else handlePing(socket, env);
    };
    socket.on("data", onData);
    socket.once("error", () => {
      try {
        socket.destroy();
      } catch {
        // drop
      }
    });
  };

  ensureComsDir(opts.comsDir, project);
  server = await listen(endpoint, connHandler);
  const file = writeRegistryAtomic({
    comsDir: opts.comsDir,
    project,
    entry: identity(),
  });

  const pingAlive = async (peerEndpoint: string): Promise<boolean> => {
    const env: PingEnvelope = {
      type: "ping",
      msg_id: newId(),
      sender_session: sessionId,
      sender_endpoint: endpoint,
      hops: 0,
      timestamp: nowIso(),
    };
    try {
      const reply = await sendEnvelope(peerEndpoint, env);
      return reply.type === "pong";
    } catch {
      return false;
    }
  };

  const list = async (): Promise<ListedPeer[]> => {
    const entries = pruneAndRead(opts.comsDir, project).filter(
      (entry) => entry.session_id !== sessionId,
    );
    const out: ListedPeer[] = [];
    for (const entry of entries) {
      out.push({
        name: entry.name,
        model: entry.model,
        purpose: entry.purpose,
        cwd: entry.cwd,
        alive: await pingAlive(entry.endpoint),
      });
    }
    return out;
  };

  const send = async (args: {
    target: string;
    prompt: string;
    hops?: number;
  }): Promise<{ msg_id: string }> => {
    const target = pruneAndRead(opts.comsDir, project).find(
      (entry) => entry.name === args.target,
    );
    if (!target)
      throw new Error(`coms: no live agent matching "${args.target}"`);
    const hops =
      args.hops ?? (currentInbound ? currentInbound.env.hops + 1 : 0);
    const msg_id = newId();
    const env: PromptEnvelope = {
      type: "prompt",
      msg_id,
      sender_session: sessionId,
      sender_endpoint: endpoint,
      sender_name: name,
      sender_cwd: cwd,
      hops,
      timestamp: nowIso(),
      prompt: args.prompt,
    };
    await sendEnvelope(target.endpoint, env);
    let resolve!: (value: { response: string; error?: string }) => void;
    const promise = new Promise<{ response: string; error?: string }>((res) => {
      resolve = res;
    });
    pending.set(msg_id, { promise, resolve });
    return { msg_id };
  };

  const get = (msgId: string): GetResult => {
    const wait = pending.get(msgId);
    if (!wait) return { status: "error", error: "unknown msg_id" };
    if (!wait.result) return { status: "pending" };
    if (wait.result.error) return { status: "error", error: wait.result.error };
    return { status: "complete", response: wait.result.response };
  };

  const awaitReply = async (
    msgId: string,
    timeoutMs = defaultTimeoutMs(),
  ): Promise<string> => {
    const wait = pending.get(msgId);
    if (!wait) throw new Error(`unknown msg_id ${msgId}`);
    if (wait.result) {
      if (wait.result.error) throw new Error(wait.result.error);
      return wait.result.response;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timed = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      timer.unref?.();
    });
    try {
      const result = await Promise.race([wait.promise, timed]);
      if (result.error) throw new Error(result.error);
      return result.response;
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const unfulfilledInbounds = (): PromptEnvelope[] => {
    return [...inbound.values()].flatMap((item) =>
      item.fulfilled ? [] : [item.env],
    );
  };

  const lastUnfulfilledInbound = (): PromptEnvelope | undefined => {
    return unfulfilledInbounds().at(-1);
  };

  const fulfillInbound = async (args: {
    msgId: string;
    response: string;
    error?: string;
  }): Promise<void> => {
    const item = inbound.get(args.msgId);
    if (!item || item.fulfilled) return;
    const env: ResponseEnvelope = {
      type: "response",
      msg_id: item.env.msg_id,
      sender_session: sessionId,
      sender_endpoint: endpoint,
      hops: 0,
      timestamp: nowIso(),
      response: args.response,
      ...(args.error === undefined ? {} : { error: args.error }),
    };
    await sendEnvelope(item.env.sender_endpoint, env);
    item.fulfilled = true;
    inbound.delete(item.env.msg_id);
    if (currentInbound?.env.msg_id === item.env.msg_id)
      currentInbound = undefined;
  };

  const shutdown = async (): Promise<void> => {
    if (closed) return;
    closed = true;
    if (server) {
      await new Promise<void>((resolve) => {
        server?.close(() => resolve());
      });
      server = undefined;
    }
    try {
      unlinkSync(endpoint);
    } catch {
      // already gone
    }
    removeRegistryFile(opts.comsDir, project, name);
  };

  return {
    name,
    sessionId,
    endpoint,
    project,
    registryPath: file,
    list,
    send,
    get,
    awaitReply,
    lastUnfulfilledInbound,
    unfulfilledInbounds,
    fulfillInbound,
    shutdown,
  };
}
