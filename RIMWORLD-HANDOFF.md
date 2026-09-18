# RimWorld projects: master handoff

Two efforts live in this repo (the rest of the repo is the unrelated DaHooter softphone).
Order of work, set by the owner on 2026-09-18: **A. AI connector first, B. multiplayer after.**

| Effort | Folder | Detailed handoff | State |
|--------|--------|------------------|-------|
| A. AI plays RimWorld (RimBridge mod + MCP server for Claude) | `rimworld-ai-connector/` | `rimworld-ai-connector/HANDOFF.md` | in progress |
| B. Multiplayer dedicated server kit (rwmt/Multiplayer) | `rimworld-multiplayer/` | `rimworld-multiplayer/HANDOFF.md` | built and sandbox-verified; parked until A is validated |

Both are on branch `claude/rimworld-multiplayer-setup-qgbabo`, PR #1.

## Log

- 2026-09-18: multiplayer kit built, verified headless, PR opened. Then the owner asked for
  the AI connector first ("connector that AI can play RimWorld, once that's done then the
  mod for multiplayer"), mentioning rwmt/Multiplayer and RimWorld-Together as references for
  the multiplayer side. AI connector work started the same day.
