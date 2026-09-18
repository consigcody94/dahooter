#!/usr/bin/env bash
# Start the built server headless in a throwaway directory, run the protocol smoke client
# against it, stop the server. Exit 0 on PASS.
#
#   scripts/smoke-test.sh                 # uses server/dist/Linux and port 30502
#   SERVER_DIR=... PORT=30777 scripts/smoke-test.sh
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
SERVER_DIR=${SERVER_DIR:-$HERE/server/dist/Linux}
PORT=${PORT:-30502}
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1
[ -f "$SERVER_DIR/Server.dll" ] || { echo "no server at $SERVER_DIR; run scripts/build-server.sh first" >&2; exit 1; }

TMP=$(mktemp -d)
SPID=
cleanup() { [ -n "$SPID" ] && kill -TERM "$SPID" 2>/dev/null && wait "$SPID" 2>/dev/null || true; rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/server"
cp -r "$SERVER_DIR"/. "$TMP/server/"
rm -f "$TMP/server/settings.toml" "$TMP/server/save.zip"; rm -rf "$TMP/server/Saved"
# pre-seed only the listener so the port is configurable; the world is still missing => bootstrap mode
printf 'directAddress = "127.0.0.1:%s"\ndirect = true\nlan = false\n' "$PORT" > "$TMP/server/settings.toml"

echo "==> building smoke client"
dotnet build "$HERE/tools/smoke-client" -c Release -p:ServerDir="$SERVER_DIR" -o "$TMP/smoke" -nologo -v q

echo "==> starting server headless (stdin=/dev/null) on 127.0.0.1:$PORT"
( cd "$TMP/server" && exec dotnet Server.dll </dev/null >"$TMP/server.log" 2>&1 ) &
SPID=$!
sleep 2
if ! kill -0 "$SPID" 2>/dev/null; then echo "server died:"; cat "$TMP/server.log"; exit 1; fi

echo "==> running smoke client"
set +e
dotnet "$TMP/smoke/SmokeClient.dll" 127.0.0.1 "$PORT" 10
RC=$?
set -e
sleep 1
echo "==> server log"
cat "$TMP/server.log"
exit $RC
