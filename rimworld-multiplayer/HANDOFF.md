# HANDOFF: RimWorld Multiplayer

Living handoff for this effort. Newest entry first in the log at the bottom; the sections
above it always describe the current state. Update it whenever something changes.

- Repo: `consigcody94/dahooter`, branch `claude/rimworld-multiplayer-setup-qgbabo`,
  folder `rimworld-multiplayer/` (the rest of the repo is an unrelated softphone app).
- Plan: `PLAN.md`. Docs: `docs/`. Everything runnable is under `server/`, `scripts/`,
  `tools/`, `client/`.

## Current state (2026-09-18)

**Done and verified in the build sandbox**

- Upstream research complete. rwmt/Multiplayer targets RimWorld 1.6 only; latest tag
  `v0.11.5` (2026-04-29); the `continuous` release (2026-08-03/04) is built from `dev`
  commit `e760d30` and ships a standalone server (`Server-beta.zip`) plus the matching
  client (`Multiplayer-beta.zip`). Protocol 56. Standalone server needs no game
  install; first player bootstraps it from in-game (settings + world upload).
- Found and fixed a blocker: the upstream server crashes when stdin is not a TTY
  (`Console.KeyAvailable` throws). That means Docker without `-t`, systemd, `nohup`
  all fail. `patches/0001-headless-stdin.patch` fixes it and adds SIGTERM/SIGINT
  handling. Applies cleanly to `e760d30`.
- `scripts/build-server.sh` builds Linux + Windows server binaries from a fresh
  pinned clone with the patch (needs .NET SDK 10; SDK 8/9 cannot compile upstream's
  source generator). Verified: build takes about 6 s after restore.
- `scripts/smoke-test.sh` + `tools/smoke-client`: starts the server headless, connects
  over UDP with LiteNetLib, gets `Server_ProtocolOk(isStandaloneServer=true)`,
  `Server_Bootstrap`, `Server_InitDataRequest`, disconnects cleanly. PASS on 30502 and
  on a custom port. Server log shows the connection and a clean SIGTERM stop.
- Headless behaviour verified three ways: stdin from `/dev/null`, stdin from a pipe
  with `status`/`help`/`stop` typed in, stdin closed + SIGTERM.
- Built server reports mod version `0.11.5+e760d30`, identical to the upstream client
  build (git-hash command overridden so the patch does not add `-dirty`).
- Packaging written: `server/Dockerfile` (multi-stage, pinned commit, patch applied,
  unprivileged user, PUID/PGID, health check on the UDP socket),
  `server/docker-compose.yml`, `server/entrypoint.sh` (dry-run tested),
  `server/rimworld-mp.service`, `server/run.sh`, `server/run.ps1`,
  `server/settings.example.toml` (generated from the real defaults),
  `scripts/install-linux.sh`, `scripts/fetch-release.sh`.
- Client kit: `client/modlist.md` (Workshop IDs, order rules),
  `client/ModsConfig.example.xml`.
- Docs: `docs/SERVER-SETUP.md`, `docs/CLIENT-SETUP.md`, `docs/TROUBLESHOOTING.md`,
  `docs/UPDATING.md`, `docs/REFERENCE.md`.
- CI: `.github/workflows/rimworld-mp-server.yml` builds the server, runs the smoke
  test, builds the Docker image, runs a container without a TTY, smoke-tests it,
  waits for the health check, and stops it with SIGTERM. Uploads `Server-headless`
  artifacts so nobody needs a local SDK.

**Not verified here (needs things the sandbox does not have)**

- The Docker image build and container run: no Docker daemon in the sandbox. The CI
  `docker` job covers exactly this; check its result on the PR.
- A real bootstrap and a second-player join with actual RimWorld clients. The smoke
  test stops where the server asks for the mod list, which only the game can answer.
- `scripts/install-linux.sh` on a real systemd host (no systemd in the sandbox). The
  script was syntax-checked and mirrors commands that were run by hand.
- The Windows build (`server/dist/Windows/Server.exe`) was produced but not executed.

## Key facts

| Fact | Value |
|------|-------|
| Pinned upstream | `rwmt/Multiplayer` `dev` @ `e760d3018495589ded3ecb21901705c47deb4a2c` (2026-08-04) |
| Mod / protocol | 0.11.5 / 56 |
| RimWorld | 1.6, min 1.6.4491 |
| Server runtime | .NET 8 (`Server.runtimeconfig.json`), build needs .NET SDK 10 |
| Port | UDP 30502 (Direct connect only; no LAN/Steam on standalone) |
| Client build to use | `Multiplayer-beta.zip` from the `continuous` release (same commit) |
| Workshop IDs | Multiplayer 2606448745, Prepatcher 2934420800, Harmony 2009463077, MP Compatibility 1629973374 |

## Decisions

1. Standalone server from upstream `dev`, not the Workshop 0.11.5 build: the
   bootstrap flow and standalone persistence exist only in `dev`/`continuous`.
2. Patch the console loop instead of documenting `tty: true` as the only fix: systemd
   and most hosting panels cannot give the process a TTY. The patch is 60 lines and
   is a candidate for an upstream PR.
3. Build from source in Docker instead of unpacking `Server-beta.zip`: the zip is
   unpatched and its URL moves whenever upstream pushes to `dev`; the pinned commit
   is reproducible.
4. Data directory equals binary directory (`/data` in the container): the server
   resolves everything from `AppContext.BaseDirectory`; the entrypoint refreshes the
   binaries into the volume on each start.
5. Work lives in a subfolder of this repo because the session was opened on it; it
   can be moved to its own repo unchanged.

## Gotchas

- The server exits on purpose after the bootstrap upload. Without a restart policy it
  looks like a crash.
- Upstream `Server-beta.zip` moves with every `dev` push. Pin by commit, not by URL.
- `SendRaw() called with invalid connection state ... Disconnected` in the server log
  when a client leaves is harmless.
- Two copies of a mod (local + Workshop) or different mod settings are the usual cause
  of join rejections and desyncs, not the server.
- Multifaction cannot be turned on for a world created with it off.

## How to resume

```bash
# toolchain (Linux)
curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0 --install-dir "$HOME/.dotnet"
curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 8.0 --install-dir "$HOME/.dotnet"
export PATH="$HOME/.dotnet:$PATH"

cd rimworld-multiplayer
scripts/build-server.sh      # server/dist/{Linux,Windows}
scripts/smoke-test.sh        # PASS expected
cd server && docker compose up -d --build   # on a host with Docker
```

Upstream clone used during the session lives outside the repo; the build script
re-fetches the pinned commit into `.work/` (git-ignored).

## Next steps

1. Watch the CI run on the PR; fix anything the `docker` job reports.
2. Deploy: pick Docker (section A) or bare metal (section B) in
   `docs/SERVER-SETUP.md`, open UDP 30502, start it.
3. One player installs the `continuous` client + Prepatcher + Harmony + MP
   Compatibility, connects with Direct, runs the bootstrap (`docs/CLIENT-SETUP.md`
   section 4). Record in this file: did the configurator window appear, did the
   upload finish, did the server come back with the world.
4. Second player joins. Record join time and any def mismatch.
5. Freeze the group's mod list in `client/ModsConfig.example.xml` and share the
   Config folder.
6. Optional: open an upstream PR to `rwmt/Multiplayer` `dev` with
   `patches/0001-headless-stdin.patch`.

## Log

- **2026-09-18, session 1 (this session).** Researched upstream, cloned and built the
  server, found the no-TTY crash, wrote and verified the patch, wrote the smoke client
  and confirmed the handshake, wrote Docker/systemd/script packaging, client kit,
  docs, CI workflow, plan and this handoff. Opened the draft PR.
  Evidence kept in this file: smoke test output below.

```
[22:34:37.220] UDP connection accepted by 127.0.0.1:30502
[22:34:37.245] sent Client_Protocol (protocol 56, mod 0.11.5+e760d30)
[22:34:37.280] recv Server_ProtocolOk: standalone=True password=False autosave=1 Days
[22:34:37.281] sent Client_Username 'smoketest'
[22:34:37.281] recv Server_Bootstrap: bootstrap=True settingsMissing=True saveMissing=True
[22:34:37.311] recv Server_InitDataRequest: server wants the mod list + def hashes.
[22:34:37.328] disconnected: DisconnectPeerCalled
PASS
```
