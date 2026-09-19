#!/usr/bin/env bash
# Verify every string-named Harmony target / AccessTools lookup in the pinned RimBridge source
# against the RimWorld reference assemblies the build resolved (Krafs.Rimworld.Ref).
#   mod/scripts/check-harmony-targets.sh        (run after mod/scripts/build-mod.sh)
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
WORK=${WORK:-$HERE/.work/rimbridge}
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1
[ -f "$WORK/Source/obj/project.assets.json" ] || { echo "no build found at $WORK; run mod/scripts/build-mod.sh first" >&2; exit 1; }
VER=$(grep -oE '"Krafs.Rimworld.Ref/[^"]+"' "$WORK/Source/obj/project.assets.json" | head -1 | cut -d/ -f2 | tr -d '"')
NUGET=${NUGET_PACKAGES:-$HOME/.nuget/packages}
REF="$NUGET/krafs.rimworld.ref/$VER/ref/net472"
[ -f "$REF/Assembly-CSharp.dll" ] || { echo "reference assemblies not found at $REF" >&2; exit 1; }
echo "==> reference assemblies: Krafs.Rimworld.Ref $VER"
dotnet run --project "$HERE/tools/harmonycheck" -c Release -- "$REF" "$WORK/Source"
