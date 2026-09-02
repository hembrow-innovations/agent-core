import { ARCHIVE_KEYS } from "./schemaArchive.ts";
import { PLANNING_KEYS } from "./schemaPlanning.ts";
import { QUARANTINE_KEYS } from "./schemaQuarantine.ts";
import { TICKET_KEYS } from "./schemaTicket.ts";

export function namedAllowlist(name: string): ReadonlySet<string> {
  if (name === "ticket") return TICKET_KEYS;
  if (name === "planning") return PLANNING_KEYS;
  if (name === "archive") return ARCHIVE_KEYS;
  if (name === "quarantine") return QUARANTINE_KEYS;
  throw new Error(`Unknown folder schema "${name}"`);
}
