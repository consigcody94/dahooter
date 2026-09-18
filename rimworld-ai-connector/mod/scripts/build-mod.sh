#!/usr/bin/env bash
# Fetch the RimBridge mod (zorrobyte/rimbridge, MIT) at a pinned commit, apply any patches in
# mod/patches/, build it against the RimWorld 1.6 reference assemblies (no game install needed),
# run its unit tests, and package a ready-to-install mod folder + zip.
#
#   mod/scripts/build-mod.sh                 # -> mod/dist/RimBridge/, mod/RimBridge-<sha>.zip
#   RB_REF=<commit> mod/scripts/build-mod.sh # build a different upstream snapshot
#
# Requires: git, .NET SDK 10 (net48 target builds from Krafs.Rimworld.Ref; tests target net10.0).
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
RB_REPO=${RB_REPO:-https://github.com/zorrobyte/rimbridge.git}
RB_REF=${RB_REF:-3c1e4c7cee151104b85bf9c8372e113f91c5f08d}
WORK=${WORK:-$HERE/.work/rimbridge}
OUT=${OUT:-$HERE/dist}
SKIP_TESTS=${SKIP_TESTS:-0}
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1

command -v git >/dev/null || { echo "git is required" >&2; exit 1; }
command -v dotnet >/dev/null || { echo "dotnet not found; install .NET SDK 10: https://dotnet.microsoft.com/download" >&2; exit 1; }

echo "==> fetching $RB_REPO @ $RB_REF"
rm -rf "$WORK"; mkdir -p "$WORK"
git -C "$WORK" init -q
git -C "$WORK" remote add origin "$RB_REPO"
git -C "$WORK" fetch -q --depth 1 origin "$RB_REF"
git -C "$WORK" checkout -q --detach FETCH_HEAD
SHORT=$(git -C "$WORK" rev-parse --short HEAD)
echo "==> upstream commit: $(git -C "$WORK" log -1 --format='%h %ad %s' --date=short)"

shopt -s nullglob
for p in "$HERE"/patches/*.patch; do
    echo "==> applying $(basename "$p")"
    git -C "$WORK" apply --verbose "$p"
done

echo "==> building RimBridge.dll"
dotnet build "$WORK/Source/RimBridge.csproj" -c Release --nologo -v q

if [ "$SKIP_TESTS" != "1" ]; then
    echo "==> running upstream unit tests"
    dotnet test "$WORK/Tests/RimBridge.Tests.csproj" --nologo -v q
fi

echo "==> packaging"
rm -rf "$OUT"; mkdir -p "$OUT/RimBridge/1.6/Assemblies"
cp -r "$WORK/About" "$OUT/RimBridge/"
cp "$WORK/1.6/Assemblies/RimBridge.dll" "$WORK/1.6/Assemblies/Newtonsoft.Json.dll" "$OUT/RimBridge/1.6/Assemblies/"
cp "$WORK/LICENSE" "$OUT/RimBridge/LICENSE"
cp "$WORK/README.md" "$OUT/RimBridge/README-upstream.md"
cat > "$OUT/RimBridge/BUILD-INFO.txt" <<INFO
RimBridge (https://github.com/zorrobyte/rimbridge) built from commit $RB_REF
by rimworld-ai-connector/mod/scripts/build-mod.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
patches applied: $(ls "$HERE"/patches/*.patch 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')
Install: copy this RimBridge folder into RimWorld/Mods, enable Harmony then RimBridge.
INFO
if command -v zip >/dev/null; then
    (cd "$OUT" && rm -f "$HERE/RimBridge-$SHORT.zip" && zip -qr "$HERE/RimBridge-$SHORT.zip" RimBridge)
    echo "==> zip: $HERE/RimBridge-$SHORT.zip"
fi
echo "==> done: $OUT/RimBridge (upstream $SHORT)"
