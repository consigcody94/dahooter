#!/usr/bin/env bash
# Download the upstream release zips (client mod + unpatched server) and unpack the client mod.
#
#   scripts/fetch-release.sh              # "continuous" build: Multiplayer-beta.zip + Server-beta.zip
#   scripts/fetch-release.sh v0.11.5      # a tagged release: Multiplayer-v0.11.5.zip (no server zip)
#
# Output: downloads/<tag>/*.zip (+ .sha256) and client/dist/Multiplayer (drop into RimWorld/Mods).
# Note: Server-beta.zip is the UNPATCHED server; it needs a TTY (see docs/SERVER-SETUP.md).
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
TAG=${1:-continuous}
BASE=https://github.com/rwmt/Multiplayer/releases/download/$TAG
DL=$HERE/downloads/$TAG
mkdir -p "$DL" "$HERE/client/dist"

if [ "$TAG" = "continuous" ]; then
    ASSETS="Multiplayer-beta.zip Server-beta.zip"; CLIENT_ZIP=Multiplayer-beta.zip
else
    ASSETS="Multiplayer-$TAG.zip"; CLIENT_ZIP=Multiplayer-$TAG.zip
fi

for a in $ASSETS; do
    echo "==> $BASE/$a"
    curl -fSL --retry 3 -o "$DL/$a" "$BASE/$a"
    (cd "$DL" && sha256sum "$a" | tee "$a.sha256")
done

rm -rf "$HERE/client/dist/Multiplayer"
unzip -q -o "$DL/$CLIENT_ZIP" -d "$HERE/client/dist"
echo "==> client mod unpacked to client/dist/Multiplayer"
grep -o '<name>[^<]*</name>\|<li>1\.[0-9]</li>' "$HERE/client/dist/Multiplayer/About/About.xml" | tr '\n' ' '; echo
