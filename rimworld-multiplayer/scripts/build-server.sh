#!/usr/bin/env bash
# Build the standalone server (Linux + Windows) from the upstream rwmt/Multiplayer source at a
# pinned commit and apply patches/0001-headless-stdin.patch.
#
#   scripts/build-server.sh
#   MP_REF=<commit or branch> scripts/build-server.sh     # build a different upstream snapshot
#
# Requires: git, and .NET SDK 10 or newer (the upstream source generator needs Roslyn 5.x;
# SDK 8/9 fail with CS9057 + CS8795). Output: server/dist/Linux, server/dist/Windows,
# server/Server-headless.zip.
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
MP_REPO=${MP_REPO:-https://github.com/rwmt/Multiplayer.git}
MP_REF=${MP_REF:-e760d3018495589ded3ecb21901705c47deb4a2c}
WORK=${WORK:-$HERE/.work/Multiplayer}
OUT=${OUT:-$HERE/server/dist}
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1

command -v git >/dev/null || { echo "git is required" >&2; exit 1; }
command -v dotnet >/dev/null || { echo "dotnet not found; install .NET SDK 10: https://dotnet.microsoft.com/download" >&2; exit 1; }
if ! dotnet --list-sdks | grep -qE '^[1-9][0-9]\.'; then
    echo ".NET SDK 10 or newer is required (found: $(dotnet --list-sdks | awk '{print $1}' | tr '\n' ' '))" >&2
    exit 1
fi

echo "==> fetching $MP_REPO @ $MP_REF"
rm -rf "$WORK"; mkdir -p "$WORK"
git -C "$WORK" init -q
git -C "$WORK" remote add origin "$MP_REPO"
git -C "$WORK" fetch -q --depth 1 origin "$MP_REF"
git -C "$WORK" checkout -q --detach FETCH_HEAD
echo "==> upstream commit: $(git -C "$WORK" log -1 --format='%h %ad %s' --date=short)"

echo "==> applying headless patch"
git -C "$WORK" apply --verbose "$HERE/patches/0001-headless-stdin.patch"

echo "==> publishing"
rm -rf "$OUT"; mkdir -p "$OUT"
# The patch makes the tree "dirty"; report the plain commit hash like upstream's CI does, so the
# server's mod version string (0.11.5+e760d30) is identical to the matching client build.
GITHASH_CMD='git describe --long --always --exclude=* --abbrev=7'
dotnet publish "$WORK/Source/Server/Server.csproj" -c Release -r linux-x64 --self-contained false -p:UseAppHost=true "-p:MSBuildGitHashCommand=$GITHASH_CMD" -o "$OUT/Linux" -nologo -v m
dotnet publish "$WORK/Source/Server/Server.csproj" -c Release -r win-x64   --self-contained false -p:UseAppHost=true "-p:MSBuildGitHashCommand=$GITHASH_CMD" -o "$OUT/Windows" -nologo -v m

cat > "$OUT/Linux/Server.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec dotnet "$SCRIPT_DIR/Server.dll" "$@"
SH
chmod +x "$OUT/Linux/Server.sh" "$OUT/Linux/Server"

if command -v zip >/dev/null; then
    (cd "$OUT" && rm -f ../Server-headless.zip && zip -qr ../Server-headless.zip Linux Windows)
    echo "==> zip: $HERE/server/Server-headless.zip"
fi
echo "==> done: $OUT/Linux and $OUT/Windows (upstream $MP_REF + headless patch)"
