#!/usr/bin/env bash
# Bare-metal installer for the standalone server on Debian/Ubuntu (run as root).
#
#   sudo scripts/install-linux.sh
#
# What it does:
#   1. installs curl/unzip and the .NET 8 runtime to /usr/share/dotnet (+ /usr/bin/dotnet symlink)
#   2. creates the `rimworld` system user and /opt/rimworld-mp
#   3. copies the headless-patched server from server/dist/Linux (build it first with
#      scripts/build-server.sh on any machine with .NET SDK 10, then copy this folder over)
#   4. installs and starts the rimworld-mp systemd unit, opens UDP 30502 in ufw if present
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
SRC=${SRC:-$HERE/server/dist/Linux}
DEST=/opt/rimworld-mp
PORT=${PORT:-30502}

[ "$(id -u)" = "0" ] || { echo "run as root (sudo)" >&2; exit 1; }
[ -f "$SRC/Server.dll" ] || { echo "no server build at $SRC; run scripts/build-server.sh first" >&2; exit 1; }
if ! grep -q "Console.IsInputRedirected" "$SRC/Server.dll" 2>/dev/null; then
    echo "warning: $SRC/Server.dll does not look like the headless-patched build; it will crash under systemd" >&2
fi

echo "==> packages"
apt-get update -qq
apt-get install -y -qq curl unzip ca-certificates libicu-dev >/dev/null

if ! command -v dotnet >/dev/null || ! dotnet --list-runtimes 2>/dev/null | grep -q 'Microsoft.NETCore.App 8\.'; then
    echo "==> installing .NET 8 runtime"
    curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
    bash /tmp/dotnet-install.sh --runtime dotnet --channel 8.0 --install-dir /usr/share/dotnet
    ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet
fi
dotnet --list-runtimes

echo "==> user + files"
id rimworld >/dev/null 2>&1 || useradd --system --home-dir "$DEST" --shell /usr/sbin/nologin rimworld
mkdir -p "$DEST"
# keep world state; refresh binaries only
cp -f "$SRC"/* "$DEST"/
chown -R rimworld:rimworld "$DEST"

echo "==> systemd"
install -m 644 "$HERE/server/rimworld-mp.service" /etc/systemd/system/rimworld-mp.service
systemctl daemon-reload
systemctl enable --now rimworld-mp
sleep 2
systemctl --no-pager --lines=5 status rimworld-mp || true

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
    echo "==> ufw allow $PORT/udp"
    ufw allow "$PORT"/udp
fi
echo "==> installed. Logs: journalctl -u rimworld-mp -f   World data: $DEST/Saved"
