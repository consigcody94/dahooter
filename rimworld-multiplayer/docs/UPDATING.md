# Updating and pinning versions

## The one rule

Server and every client must speak the same protocol number
(`MpVersion.Protocol` in `Source/Common/Version.cs`; 56 at the pinned commit). Mod
version strings are only informational. Update everyone at once.

## Pinned upstream commit

`e760d3018495589ded3ecb21901705c47deb4a2c` on `rwmt/Multiplayer` `dev`
(2026-08-04, "Add missing SetContext Map for Gravship launch (#966)", mod 0.11.5).
It is referenced in:

- `server/Dockerfile` (`ARG MP_REF`)
- `server/docker-compose.yml` (`build.args.MP_REF` and the image tag)
- `scripts/build-server.sh` (`MP_REF` default)

The upstream `continuous` release zips were generated from this same push, so
`Multiplayer-beta.zip` from https://github.com/rwmt/Multiplayer/releases/tag/continuous is
the matching client, as long as upstream has not pushed to `dev` since. When they push,
the `continuous` zips move on and a new client will not match the old server.

## Moving to a newer upstream snapshot

1. Pick the commit: `git ls-remote https://github.com/rwmt/Multiplayer.git dev`.
2. Update the three places above.
3. `scripts/build-server.sh` and `scripts/smoke-test.sh`. If the patch no longer
   applies, re-create it against the new `Source/Server/Server.cs` (the change is the
   console loop at the end of the file).
4. Rebuild the image (`docker compose up -d --build`) or re-run
   `scripts/install-linux.sh`.
5. Give every player the client zip built from the same commit
   (`scripts/fetch-release.sh` right after the push, or the `Multiplayer-beta`
   artifact of the upstream "Build beta" workflow run for that commit).

## Staying on the Workshop release instead

If your players prefer the Steam Workshop build (0.11.5, protocol as of the `v0.11.5`
tag), build the server from that tag: `MP_REF=v0.11.5 scripts/build-server.sh`. Check
that `git apply` still succeeds (the 0.11.5 server code is older; the loop at the end
of `Server.cs` is the same, so it should) and that the smoke test passes. The Workshop
mod auto-updates, so re-pin when upstream tags a new release.

## RimWorld updates

A RimWorld patch changes def hashes and often breaks Harmony patches. When Steam
updates the game, hold the multiplayer group on the previous build (Steam Betas tab
keeps older versions) until upstream publishes a compatible mod build, then update all
clients and, if the protocol changed, the server.

## Version string of the patched build

Upstream's CI builds from a clean checkout, so its binaries carry the mod version
`0.11.5+e760d30`. Applying the headless patch makes the working tree "dirty" and
MSBuildGitHash would append `-dirty`. `scripts/build-server.sh` and the Dockerfile pass
`-p:MSBuildGitHashCommand="git describe --long --always --exclude=* --abbrev=7"` so the
server reports the same `0.11.5+e760d30` as the matching client. (The client does not
reject a differing mod version string, only a differing protocol number, but the join
data window shows it.)

## Toolchain

- Building the server needs .NET SDK 10 or newer (upstream's source generator targets
  Roslyn 5.3). SDK 8 and 9 fail with `CS9057` followed by `CS8795`.
- Running the server needs only the .NET 8 runtime (`Server.runtimeconfig.json`).
- The Docker image pins `mcr.microsoft.com/dotnet/sdk:10.0` and
  `mcr.microsoft.com/dotnet/runtime:8.0`.
