#!/usr/bin/env bash
# Run the standalone server in a restart loop without systemd or Docker.
#   server/run.sh [dir]     default dir: server/dist/Linux
# The server exits on purpose after the bootstrap upload, so it is restarted automatically.
# Ctrl+C stops both the server and the loop.
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
DIR=${1:-$HERE/dist/Linux}
[ -f "$DIR/Server.dll" ] || { echo "no Server.dll in $DIR (run scripts/build-server.sh first)" >&2; exit 1; }
trap 'echo; echo "[run.sh] stopping"; exit 0' INT TERM
while true; do
    echo "[run.sh] starting server from $DIR at $(date -Is)"
    (cd "$DIR" && dotnet Server.dll)
    code=$?
    echo "[run.sh] server exited with code $code; restarting in 3s (Ctrl+C to quit)"
    sleep 3
done
