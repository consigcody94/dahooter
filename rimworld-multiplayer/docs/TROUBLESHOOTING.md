# Troubleshooting

## Server side

**`Unhandled exception. System.InvalidOperationException: Cannot see if a key has been pressed when either application does not have a console or when console input has been redirected`**
The upstream (unpatched) server binary was started without a terminal: Docker without
`-t`, systemd, `nohup`, a scheduler. Fix: use the patched build from
`scripts/build-server.sh` or the Docker image in this folder. Workarounds for the
upstream binary: Docker `tty: true` + `stdin_open: true`; systemd
`ExecStart=/usr/bin/script -qfec "/usr/bin/dotnet /opt/rimworld-mp/Server.dll" /dev/null`;
Windows: run it in a real console window.

**`Failed to start net manager`**
UDP 30502 (or the port in `directAddress`) is already bound, or the address in
`directAddress` is not local. `ss -lunp | grep 30502` to see who has it.

**Server exits right after "Bootstrap: wrote save.zip. Configuration complete; stopping server."**
That is by design. Whatever runs the server must restart it (Compose `restart:`,
systemd `Restart=always`, `run.sh`, `run.ps1`).

**Server starts in bootstrap mode again after it already had a world**
It could not find `Saved/world.dat` or `save.zip` next to `Server.dll`. In Docker the
data volume was not mounted or `PUID/PGID` are wrong (check `ls -la server/data`);
on bare metal check `/opt/rimworld-mp` ownership. Restore `Saved/` from backup.

**`Multifaction is enabled but the save doesn't contain spectator faction id`**
The world was created with multifaction off and `settings.toml` later switched it on.
Either turn multifaction off again or bootstrap a fresh world with it on.

**Nobody can connect from the internet, LAN works**
Forward UDP 30502 on the router to the server host, open it on the host firewall
(`ufw allow 30502/udp`, Windows Defender inbound UDP rule), and make sure the host
has a public or CGNAT-free address. With CGNAT use a VPN (Tailscale, ZeroTier) and
connect to the VPN address.

**Health check red in Docker**
The health check looks for the UDP socket in `/proc/net/udp`. If you changed the port
in `settings.toml`, set `MP_PORT` in the compose file to the same value.

## Client side

**"Version mismatch" / disconnected with protocol reason at connect**
Client and server come from different upstream snapshots (protocol number differs).
Everyone installs the same build the server was built from. `docs/UPDATING.md`.

**Join rejected because of defs (Not_Found / Count_Diff / Hash_Diff)**
Mod lists or mod settings differ. Compare `ModsConfig.xml` line by line, including
order and DLC. A local copy of a mod next to a Workshop copy of the same mod causes
this; remove one. HugsLib and mods that generate defs from settings are common
offenders; share the host's `Config` folder.

**"Server is full"**
`maxPlayers` in `settings.toml`. Edit and restart the server.

**Wrong password**
`hasPassword`/`password` in `settings.toml`.

**Username rejected**
3 to 15 characters, letters, digits and underscore only; must be unique on the server.
The Multiplayer username is set in the mod's settings menu.

**Desyncs**
Symptoms: "Desynced" banner, the server pauses (`pauseOnDesync = true`), a resync
happens. Common causes, in order of likelihood:
1. Mod list or mod settings not identical.
2. A mod that is not multiplayer-safe (unsynced RNG, per-client state). Check the
   compatibility list in Multiplayer Compatibility and the mod's Workshop page; try
   without it.
3. Corrupt game files: Steam "Verify integrity of game files", and delete stale
   `Mods/` leftovers.
4. Large FPS differences or G-Sync/FreeSync quirks on one machine; cap the framerate.
5. Async time with quests that touch several maps (known upstream issue).
Recovery: the server creates a join point and the desynced client reloads. If it
repeats, `/joinpoint` from the host or `resync <user>` from the console, or have the
client rejoin. Desync reports with traces are written by the client under the mod's
`Multiplayer/DesyncReports` folder when `desyncTraces = true`; upstream asks for
those in their Discord `#mod-check`/support channels.

**Slow joins**
The whole compressed world is sent to a joining player. Big colonies with many maps
take minutes on slow uplinks. Keep the number of maps down and the host upload decent.

**Configurator window never appears**
The client is not the continuous build (Workshop 0.11.5 predates standalone bootstrap),
or the server is not in bootstrap mode (it already has a world). Check the server log
first lines.

**Player behind, "Simulation paused because some players are too far behind"**
That player's machine cannot keep up. Lower game speed, reduce colony size, or that
player leaves. The server throttles for them automatically up to a point.

## Getting logs

- Docker: `docker compose logs -f`, or `docker compose logs --since 1h > server.log`.
- systemd: `journalctl -u rimworld-mp -f`.
- Client: RimWorld `Player.log` (Windows: `%USERPROFILE%\AppData\LocalLow\Ludeon Studios\RimWorld by Ludeon Studios\Player.log`).
- Turn on `debugMode = true` in `settings.toml` for detail/verbose server logging.

## Getting help upstream

- Docs: https://hackmd.io/@rimworldmultiplayer/docs/
- Issues: https://github.com/rwmt/Multiplayer/issues
- Discord: https://discord.gg/S4bxXpv (the server binary is marked "for testing"; the
  maintainers will want the log and the mod list)
