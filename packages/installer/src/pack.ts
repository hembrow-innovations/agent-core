import { join } from "node:path";

export const PACK_DIR = "ai";

export function packRoot(srcRoot: string): string {
  return join(srcRoot, PACK_DIR);
}
