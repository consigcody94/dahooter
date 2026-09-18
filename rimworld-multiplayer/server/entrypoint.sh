#!/bin/sh
# Entry point for the RimWorld Multiplayer standalone server container.
#
# The server keeps settings.toml, save.zip and Saved/ next to Server.dll (it uses
# AppContext.BaseDirectory for everything), so the binaries are refreshed into the /data
# volume on every start and the server runs from there. PUID/PGID remap the service user
# so a bind-mounted ./data stays readable and writable from the host.
set -eu

DATA=${MP_DATA_DIR:-/data}
BIN=/opt/rimworld-mp
PUID=${PUID:-10001}
PGID=${PGID:-10001}

mkdir -p "$DATA"

if [ "$(id -u)" = "0" ]; then
    if [ "$(id -g rimworld)" != "$PGID" ]; then groupmod -o -g "$PGID" rimworld; fi
    if [ "$(id -u rimworld)" != "$PUID" ]; then usermod -o -u "$PUID" rimworld; fi
    cp -f "$BIN"/* "$DATA"/
    chown -R rimworld:rimworld "$DATA"
    cd "$DATA"
    echo "[entrypoint] starting RimWorld Multiplayer server as uid=$PUID gid=$PGID in $DATA"
    exec gosu rimworld dotnet Server.dll "$@"
else
    cp -f "$BIN"/* "$DATA"/
    cd "$DATA"
    echo "[entrypoint] starting RimWorld Multiplayer server as uid=$(id -u) in $DATA"
    exec dotnet Server.dll "$@"
fi
