# RimWorld Multiplayer: plan

Goal: get Zetrith's Multiplayer mod (rwmt/Multiplayer) working end to end for a
group of players, including an always-on dedicated (standalone) server that
runs without a copy of the game, plus repeatable client setup.

Everything in this folder is self-contained. Nothing else in the `dahooter`
repo is touched.

## Target state

- RimWorld 1.6 (the mod requires 1.6.4491 or newer) on every player's machine.
- Every player runs the same Multiplayer build, Prepatcher, and the same mod
  list, load order, and mod settings.
- A headless standalone server runs on a Linux box (Docker or bare metal),
  reachable on UDP 30502, survives restarts, and keeps the world in `Saved/`.
- The first player bootstraps the server from inside the game (settings +
  world upload). Everyone else joins with Direct connect.
- A written runbook covers install, hosting, joining, troubleshooting, and
  updating.

## Phases

| # | Phase | Deliverable | Status |
|---|-------|-------------|--------|
| 1 | Research | Versions, server capability, docs, IDs recorded in HANDOFF.md | done |
| 2 | Server build | Standalone server built from upstream `dev`, headless crash fixed | done |
| 3 | Packaging | Dockerfile, compose file, systemd unit, run scripts, Windows script | written; image build verified by CI (no Docker daemon in the build sandbox) |
| 4 | Client kit | Mod list, load order, `ModsConfig.xml` template, connect steps | done |
| 5 | Verification | Server runs headless, protocol smoke test passes | done in sandbox; bootstrap + join with real game clients still to run |
| 6 | Handoff | HANDOFF.md kept current, PR opened | ongoing |

## Decisions

- **Standalone server, not an in-game host.** The dedicated server exists
  upstream since 0.11.5 (`Source/Server`). It needs no game install, no
  Steam, no arbiter.
- **Build from the `dev` branch.** The `continuous` release (Server-beta.zip)
  is built from `dev`, and `master` is only bumped on tagged releases. Clients
  on the continuous build must talk to a server from the same protocol
  version (protocol 56 today), so server and client come from the same
  snapshot.
- **Patch the console loop.** Upstream `Server.cs` polls `Console.KeyAvailable`,
  which throws when stdin is not a TTY. That kills the server under Docker
  without `-it`, under systemd, and under `nohup`. `patches/0001-headless-stdin.patch`
  fixes it; the Dockerfile applies it at build time.
- **Direct connect only.** Steam relay and LAN discovery are not supported by
  the standalone server. Players use Direct connect to `host:30502`.
- **Restart policy is mandatory.** After the bootstrap upload the server
  stops itself on purpose. Docker `restart: unless-stopped` or the systemd
  unit brings it back with the uploaded world.

## Out of scope

- The Arbiter (headless game instance used for desync arbitration). Not
  supported by the standalone server.
- Steam-relayed connections.
- Mod compatibility patches beyond pointing at Multiplayer Compatibility.

## Acceptance criteria

1. `docker compose up -d` (or `scripts/install-linux.sh`) leaves a server
   listening on UDP 30502 with no TTY attached and no crash in the log.
2. A scripted client completes the LiteNetLib connect handshake and gets a
   `ServerProtocolOk` reply with `isStandaloneServer = true`.
3. A player following `docs/CLIENT-SETUP.md` can bootstrap the server and a
   second player can join.
4. HANDOFF.md states exactly what was verified here versus what needs a real
   game client.
