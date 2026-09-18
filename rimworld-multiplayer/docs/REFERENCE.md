# Reference

## Versions and IDs

| Item | Value |
|------|-------|
| Mod | rwmt/Multiplayer, mod version 0.11.5, protocol 56 |
| Pinned commit | `e760d3018495589ded3ecb21901705c47deb4a2c` (`dev`, 2026-08-04) |
| Latest tag | `v0.11.5` (2026-04-29) |
| RimWorld | 1.6, minimum 1.6.4491 (reference assemblies 1.6.4850 at the pinned commit) |
| Multiplayer Workshop | 2606448745 (`rwmt.Multiplayer`) |
| Prepatcher Workshop | 2934420800 (`zetrith.prepatcher`) |
| Harmony Workshop | 2009463077 (`brrainz.harmony`) |
| Multiplayer Compatibility Workshop | 1629973374 (`rwmt.MultiplayerCompatibility`) |
| Direct connect port | UDP 30502 |
| LAN broadcast port | UDP 5100 (in-game host only, not the standalone server) |
| Max players default | 8 (`maxPlayers = 0` removes the limit) |
| Username rules | 3-15 chars, `[a-zA-Z0-9_]` |

## settings.toml keys

Generated from `ServerSettings.ExposeData()`; `server/settings.example.toml` has the
defaults with comments.

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| gameName | string | "Multiplayer Server" | |
| directAddress | string | "0.0.0.0:30502" | `ip:port`, several joined by `&`; IPv6 in brackets |
| direct | bool | true (standalone) | |
| lan, lanAddress | bool, string | false, "127.0.0.1" | unsupported on standalone |
| steam | bool | false | unsupported on standalone |
| arbiter | bool | false | unsupported on standalone |
| maxPlayers | int | 8 | |
| autosaveInterval | float | 1.0 | |
| autosaveUnit | enum | Days | Days, Minutes |
| asyncTime | bool | false | |
| multifaction | bool | false | |
| debugMode | bool | false | detail + verbose logging |
| desyncTraces | bool | true | |
| syncConfigs | bool | true | push configurator's mod configs to joiners |
| autoJoinPoint | flags | "Join, Desync" | Join, Desync, Autosave |
| devModeScope | enum | HostOnly | HostOnly, Everyone |
| hasPassword, password | bool, string | false, "" | |
| pauseOnLetter | enum | AnyThreat | Never, MajorThreat, AnyThreat, AnyLetter |
| pauseOnJoin | bool | true | |
| pauseOnDesync | bool | true | |
| timeControl | enum | EveryoneControls | EveryoneControls, LowestWins, HostOnly |

## Server start-up decision tree (`Source/Server/Server.cs`)

1. `settings.toml` present? No: bootstrap mode, wait for a configurator to upload it.
2. `Saved/world.dat` present? Yes: load world from `Saved/`.
3. Else `save.zip` present? Yes: seed `Saved/` from it, load.
4. Else: bootstrap mode, wait for a world upload.
5. Start LiteNetLib on every endpoint in `directAddress`; LAN if enabled.
6. Console loop (patched: works with redirected stdin, stops on SIGTERM/SIGINT).

## Join handshake (what the smoke test exercises)

```
client -> Client_Protocol(protocolVersion)
server -> Server_ProtocolOk(hasPassword, isStandaloneServer, autosave...)
server -> Server_Bootstrap(bootstrap, settingsMissing, saveMissing)   [bootstrap mode only]
client -> Client_Username(username, password?)
server -> Server_InitDataRequest(syncConfigs)                         [first joiner: needs mod list + def hashes]
client -> Client_InitData(...)                                        [real game client only]
server -> Server_UsernameOk
client -> Client_JoinData(defs, round modes)
server -> Server_JoinData(defStatus...) then bootstrap state, or world download (Server_WorldData)
```

Protocol mismatch: server sends `Server_Disconnect(Protocol, serverVersion, serverProtocol)`.

## Standalone-server specifics in the code

- `IsStandaloneServer = true`: any playing client may upload world data, trigger join
  points and standalone map/world snapshots; the first non-arbiter joiner is treated as
  the primary player and gets the host faction.
- `StandalonePersistence` writes `Saved/` atomically (`.tmp` then rename) on every join
  point and accepted snapshot; leftover `.tmp` files are removed at start.
- After a completed bootstrap upload the server sends `BootstrapCompleted` to all
  players and sets `running = false` (exits).
- Chat commands from the console (`IChatSource` that is not a player) bypass the
  host-only check.

## Files in this folder

```
rimworld-multiplayer/
  PLAN.md, HANDOFF.md, README.md
  docs/         SERVER-SETUP, CLIENT-SETUP, TROUBLESHOOTING, UPDATING, REFERENCE
  server/       Dockerfile, entrypoint.sh, docker-compose.yml, rimworld-mp.service,
                run.sh, run.ps1, settings.example.toml   (dist/ and data/ are generated)
  patches/      0001-headless-stdin.patch
  scripts/      build-server.sh, fetch-release.sh, install-linux.sh, smoke-test.sh
  client/       ModsConfig.example.xml, modlist.md   (dist/ is generated)
  tools/        smoke-client/ (SmokeClient.csproj, Program.cs)
```

## Sources

- https://github.com/rwmt/Multiplayer (README, `Source/`, `.github/workflows/build-beta.yml`, `alpha-notes.md`)
- https://github.com/rwmt/Multiplayer/releases (`continuous`, `v0.11.5`)
- https://hackmd.io/@rimworldmultiplayer/docs/ , `/play`, `/faq`, known issues and setup pages
- https://github.com/rwmt/Multiplayer-Compatibility
- https://github.com/Zetrith/Prepatcher
- https://github.com/pardeike/HarmonyRimWorld
