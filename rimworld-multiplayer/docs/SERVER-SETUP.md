# Server setup (standalone / dedicated)

The standalone server is a small .NET console program from the upstream mod
(`Source/Server`). It needs no RimWorld install, no Steam, and no GPU. It relays
commands between players, keeps the world state, and hands the world to anyone who
joins. One of the players still has to create the world once (the bootstrap step).

Pick one of three ways to run it. All three use the same data layout, so you can
move between them by copying the data directory.

| Method | Best for | Needs |
|--------|----------|-------|
| A. Docker Compose | any Linux host with Docker (NAS, VPS, Proxmox VM/LXC with nesting) | Docker 24+ with compose |
| B. Bare-metal Linux + systemd | a dedicated Linux VM/LXC without Docker | .NET 8 runtime (installer handles it) |
| C. Windows / manual | quick tests, hosting from a Windows PC | .NET 8 runtime |

Bootstrap requires the Multiplayer **client** with standalone-server support, which is
the `continuous` build (see `docs/CLIENT-SETUP.md`). Server and client must come from
the same upstream snapshot (protocol 56 at the pinned commit).

## A. Docker Compose

```bash
cd rimworld-multiplayer/server
mkdir -p data
# set PUID/PGID in docker-compose.yml to your user (id -u / id -g) so ./data stays writable
docker compose up -d --build
docker compose logs -f
```

You should see:

```
Bootstrap mode: 'settings.toml' not found. Waiting for a client to upload it.
Bootstrap mode: neither Saved/ directory nor 'save.zip' found.
Waiting for a client to upload world data.
Console input is redirected; running headless. Send commands on stdin or use SIGTERM to stop.
```

Open UDP 30502 on the host firewall and forward UDP 30502 on your router to the host.
Then do the bootstrap from a game client (`docs/CLIENT-SETUP.md`, "First connection").
When the upload finishes the server logs `Configuration complete; stopping server.`
and exits; Compose restarts it and the next start logs `Seeding Saved/ directory from
save.zip` and `Loaded state from Saved/ directory`. From then on everyone joins normally.

Console commands: `docker attach --sig-proxy=false rimworld-mp`, type `status`,
`players`, `help` and so on, leave with Ctrl+C. The in-game chat accepts the same
commands prefixed with `/` (for example `/players`).

What the image does: a multi-stage build fetches upstream at the pinned commit, applies
`patches/0001-headless-stdin.patch`, publishes the server, and runs it as an unprivileged
user from `/data` on the .NET 8 runtime image. Details are in `server/Dockerfile` and
`server/entrypoint.sh`.

## B. Bare-metal Linux with systemd

1. On any machine with .NET SDK 10 (or in this repo's CI), build the patched server:
   `scripts/build-server.sh` produces `server/dist/Linux` and `server/dist/Windows`.
2. Copy the `rimworld-multiplayer` folder to the Linux host.
3. `sudo scripts/install-linux.sh` installs the .NET 8 runtime, creates the `rimworld`
   user, copies the server to `/opt/rimworld-mp`, installs `rimworld-mp.service`,
   enables it, and opens UDP 30502 in ufw if ufw is active.
4. `journalctl -u rimworld-mp -f` to watch the bootstrap.

State lives in `/opt/rimworld-mp` (`settings.toml`, `save.zip`, `Saved/`).
Re-running the installer refreshes binaries and keeps the world.

Console commands are not available through systemd (stdin is `null`). Use the in-game
`/command` form, or run the server interactively with `server/run.sh` instead.

## C. Windows or manual run

- Patched build: `scripts/build-server.sh` (needs WSL/Git Bash or run the two
  `dotnet publish` lines by hand) then `powershell -ExecutionPolicy Bypass -File server\run.ps1`.
- Upstream zip: download `Server-beta.zip` from the `continuous` release
  (`scripts/fetch-release.sh` does this), extract, run `Server\Windows\Server.exe`
  in a normal console window. The upstream binary needs an interactive console; it
  crashes when started with redirected input (Task Scheduler, NSSM without a console,
  `nohup`, Docker without `-t`). Use `run.ps1` / `run.sh` or the patched build for
  anything unattended.

Both `run.sh` and `run.ps1` restart the server automatically, which the bootstrap
step relies on.

## Ports and networking

| Port | Protocol | Purpose |
|------|----------|---------|
| 30502 | UDP | Direct connect (LiteNetLib). The only port the standalone server uses. |

- Change the port in `settings.toml` (`directAddress = "0.0.0.0:PORT"`) and in the
  compose `ports:` line plus `MP_PORT`.
- IPv6: add a second endpoint, `directAddress = "0.0.0.0:30502&[::]:30502"`.
- No LAN broadcast and no Steam relay on the standalone server. Players use the
  "Direct" tab with `your.public.ip:30502` (or a VPN/Tailscale address).
- If two players are behind the same NAT as the server, connect with the LAN IP.

## Data layout (next to Server.dll)

| Path | Written by | Contents |
|------|-----------|----------|
| `settings.toml` | bootstrap upload (or you, from `settings.example.toml`) | server settings |
| `save.zip` | bootstrap upload | the replay-format world the configurator created |
| `Saved/` | server | live world: `world.dat`, `session.dat`, `world_cmds.dat`, `maps/<id>.dat`, `info.xml`, `state.bin`. Rewritten atomically at every join point (join, autosave, `/joinpoint`). |

Back up `Saved/` (and `settings.toml`) while the server is stopped. To start over,
stop the server, delete `save.zip` and `Saved/`, start it, and bootstrap again. To
change only settings, edit `settings.toml` and restart.

## Server console commands

`help`, `status`, `players` (`list`), `whois <user>`, `mods [page] [amount]`,
`pause`, `unpause`, `speed <1-4>`, `announce <msg>`, `kick <user>`,
`resync <user>`, `joinpoint`, `stop`. Commands marked "requires host" are allowed from
the console and from the in-game host.

## Sizing

The server does no simulation; CPU use is negligible and memory is roughly the
compressed world size times a small factor (tens of MB for a typical colony). Bandwidth
scales with player count: the whole world is sent to each joining player once, then
only commands flow. Upstream recommends no more than 8 players.
