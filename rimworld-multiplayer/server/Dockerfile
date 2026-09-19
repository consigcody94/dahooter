# syntax=docker/dockerfile:1.7
# RimWorld Multiplayer standalone (dedicated) server.
#
# Builds the server from the upstream rwmt/Multiplayer source at a pinned commit and applies
# patches/0001-headless-stdin.patch so it runs without a TTY (the upstream binary crashes on
# Console.KeyAvailable when stdin is not a terminal). Build context is the rimworld-multiplayer/
# folder; see docker-compose.yml.
#
#   docker compose -f server/docker-compose.yml up -d --build

ARG MP_REPO=https://github.com/rwmt/Multiplayer.git
ARG MP_REF=e760d3018495589ded3ecb21901705c47deb4a2c

# ---- build: needs .NET SDK 10 (the upstream source generator targets Roslyn 5.x) ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG MP_REPO
ARG MP_REF
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN git init -q \
 && git remote add origin "$MP_REPO" \
 && git fetch -q --depth 1 origin "$MP_REF" \
 && git checkout -q --detach FETCH_HEAD
COPY patches/0001-headless-stdin.patch /tmp/headless.patch
RUN git apply --verbose /tmp/headless.patch
# MSBuildGitHashCommand without --dirty: the patched tree still reports the upstream commit hash,
# so the mod version string matches the client build made from the same commit.
RUN dotnet publish Source/Server/Server.csproj -c Release -r linux-x64 --self-contained false \
      -p:UseAppHost=false "-p:MSBuildGitHashCommand=git describe --long --always --exclude=* --abbrev=7" -o /out

# ---- runtime: the server targets net8.0 ----
FROM mcr.microsoft.com/dotnet/runtime:8.0
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 \
    MP_PORT=30502 MP_DATA_DIR=/data
RUN apt-get update \
 && apt-get install -y --no-install-recommends gosu \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 10001 rimworld \
 && useradd --system --uid 10001 --gid rimworld --home-dir /data --no-create-home rimworld
COPY --from=build /out /opt/rimworld-mp/
COPY --chmod=755 server/entrypoint.sh /usr/local/bin/entrypoint.sh
VOLUME /data
EXPOSE 30502/udp
# The only observable is the UDP socket; /proc/net/udp lists ports in hex.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD sh -c 'grep -qi ":$(printf %04X "$MP_PORT") " /proc/net/udp'
WORKDIR /data
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
