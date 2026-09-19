# RimWorld Multiplayer kit

Everything needed to run Zetrith's Multiplayer mod for RimWorld 1.6 with an always-on
dedicated server. Start with `HANDOFF.md` for the current state, `PLAN.md` for the plan.

Quick paths:

- **Host a server with Docker:** `docs/SERVER-SETUP.md`, section A
  (`cd server && docker compose up -d --build`).
- **Host on a Linux VM/LXC without Docker:** `scripts/build-server.sh` on a machine
  with .NET SDK 10, then `sudo scripts/install-linux.sh` on the host.
- **Set up the game clients:** `docs/CLIENT-SETUP.md` and `client/modlist.md`.
- **Something broke:** `docs/TROUBLESHOOTING.md`.
- **Update or pin versions:** `docs/UPDATING.md`.
- **Keys, ports, IDs, protocol:** `docs/REFERENCE.md`.

Verify a server build without a game client: `scripts/smoke-test.sh`.
