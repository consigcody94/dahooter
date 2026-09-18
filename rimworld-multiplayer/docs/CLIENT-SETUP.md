# Client setup (every player)

## 1. Requirements

- RimWorld 1.6, version 1.6.4491 or newer, on Steam or DRM-free. Everyone on the
  same game version. Check the bottom-left of the main menu.
- Everyone owns and enables the same DLC. A player without a DLC the host has cannot
  join.
- Identical mod list, load order, and mod settings on every machine. The server
  compares def hashes at join time and rejects mismatches.

## 2. Install the mods

Steam Workshop (easiest for Prepatcher, Harmony, Multiplayer Compatibility):

| Mod | Workshop ID |
|-----|-------------|
| Prepatcher | 2934420800 |
| Harmony | 2009463077 |
| Multiplayer (0.11.5 release build) | 2606448745 |
| Multiplayer Compatibility | 1629973374 |

For the standalone server in this repo, use the **continuous** Multiplayer build instead
of the Workshop build. It is what the server was built from. Run
`scripts/fetch-release.sh` (or download `Multiplayer-beta.zip` from
https://github.com/rwmt/Multiplayer/releases/tag/continuous) and extract it so you have
`Mods/Multiplayer/About/About.xml`. Unsubscribe from the Workshop Multiplayer to avoid
two copies. If you would rather stay on the Workshop build, rebuild the server from the
`v0.11.5` tag (see `docs/UPDATING.md`).

Mods folder:

- Windows: `C:\Program Files (x86)\Steam\steamapps\common\RimWorld\Mods`
- macOS: `~/Library/Application Support/Steam/steamapps/common/RimWorld/RimWorldMac.app/Mods`
- Linux: `~/.steam/steam/steamapps/common/RimWorld/Mods`

## 3. Load order

Use `client/ModsConfig.example.xml` as the reference. Order:

1. Prepatcher
2. Harmony
3. Core, then the DLCs
4. Multiplayer
5. Multiplayer Compatibility
6. Everything else, identical on every machine

The in-game mod manager warns if Multiplayer is not directly below the DLCs.

The simplest way to keep everyone identical: one person finalizes the list, then
shares their `ModsConfig.xml` and the whole `Config` folder (it holds mod settings).
Config folder locations:

- Windows: `%USERPROFILE%\AppData\LocalLow\Ludeon Studios\RimWorld by Ludeon Studios\Config`
- macOS: `~/Library/Application Support/RimWorld/Config`
- Linux: `~/.config/unity3d/Ludeon Studios/RimWorld by Ludeon Studios/Config`

With `syncConfigs = true` (the default) the server also pushes the configurator's mod
configs to joiners.

## 4. First connection: bootstrap the server

Done once, by the player who will own the main colony faction.

1. Start RimWorld with the mods enabled. On the main menu open **Multiplayer**.
2. **Direct** tab, enter `server-ip:30502`, connect.
3. The server is in bootstrap mode, so a **configurator window** opens. Fill in the
   game name, max players, password, autosave, async time, multifaction and the other
   settings. Upload. The server writes `settings.toml`.
4. Click **Create game and upload save**. The normal scenario, storyteller and
   world-generation pages appear. Play through them to the map. Once colonists have
   spawned the mod pauses, hosts a local session, saves it as a replay, returns to the
   main menu, reconnects, and uploads `save.zip` (there is a progress bar).
5. The server logs `Configuration complete; stopping server.` and exits. Docker,
   systemd or `run.sh` restart it within seconds with the world loaded.
6. Reconnect with Direct. You are in.

The user who generated the map owns the main faction. Other players join that faction,
or, with multifaction enabled, get the spectator/new faction flow.

## 5. Joining afterwards

Main menu, **Multiplayer**, **Direct**, `server-ip:30502`, connect. The server sends
the current world (a few MB), the client loads it, and you take control. Players
already in the game see "Creating a join point" while the world snapshot is taken.

## 6. Ownership and control

- Anyone can pause, change speed, and issue orders to the shared faction.
- Time control mode (`EveryoneControls`, `LowestWins`, `HostOnly`) is set in the
  bootstrap settings.
- Chat with Enter. Commands start with `/` (for example `/players`, `/joinpoint`).
- Dev mode is limited by `devModeScope`.

## 7. Saving

The server persists the world at every join point (joins, autosaves per
`autosaveInterval`, `/joinpoint`). Players do not need to save locally. To export a
local copy, use the in-game Multiplayer menu's save/replay options; replays end up in
`RimWorld/Multiplayer/Replays` under your save data folder.
