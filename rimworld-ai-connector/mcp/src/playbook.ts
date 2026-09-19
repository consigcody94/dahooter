/** Locates the operator playbook (docs/PLAYBOOK.md in the repo, playbook.md when packaged). */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FALLBACK = `# RimWorld playbook (fallback)

Start with rimworld_game_status, then rimworld_state_summary. Act with the lowest control
altitude that works (orders, gizmos, designators, blueprints, zones, work priorities), verify
results, then rimworld_wait to advance time. Priorities: food, shelter, defense, mood, wealth.
The full playbook file was not found next to this package.`;

export function playbookCandidates(pkgRoot: string): string[] {
  return [resolve(pkgRoot, "playbook.md"), resolve(pkgRoot, "..", "docs", "PLAYBOOK.md")];
}

export function packageRoot(): string {
  // dist/playbook.js or src/playbook.ts -> package root
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

export function loadPlaybook(pkgRoot: string = packageRoot()): string {
  for (const p of playbookCandidates(pkgRoot)) {
    if (existsSync(p)) return readFileSync(p, "utf8");
  }
  return FALLBACK;
}
