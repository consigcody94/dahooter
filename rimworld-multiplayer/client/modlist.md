# Required mods (RimWorld 1.6)

| Order | Mod | packageId | Steam Workshop | Source / manual download |
|------:|-----|-----------|----------------|--------------------------|
| 1 | Prepatcher | `zetrith.prepatcher` | [2934420800](https://steamcommunity.com/sharedfiles/filedetails/?id=2934420800) | https://github.com/Zetrith/Prepatcher/releases/latest |
| 2 | Harmony | `brrainz.harmony` | [2009463077](https://steamcommunity.com/sharedfiles/filedetails/?id=2009463077) | https://github.com/pardeike/HarmonyRimWorld/releases/latest |
| 3 | Core + owned DLC | `ludeon.rimworld`, `ludeon.rimworld.*` | built in | |
| 4 | Multiplayer | `rwmt.multiplayer` | [2606448745](https://steamcommunity.com/sharedfiles/filedetails/?id=2606448745) | https://github.com/rwmt/Multiplayer/releases (`continuous` -> Multiplayer-beta.zip) |
| 5 | Multiplayer Compatibility | `rwmt.multiplayercompatibility` | [1629973374](https://steamcommunity.com/sharedfiles/filedetails/?id=1629973374) | https://github.com/rwmt/Multiplayer-Compatibility/releases |

Notes

- Prepatcher first. It also satisfies mods that depend on Harmony, and running both is fine.
- Multiplayer must sit right below Core and the DLC (its About.xml says so) and before HugsLib
  and Vanilla Expanded Framework.
- Multiplayer Compatibility loads after Multiplayer and before HugsLib / VE Framework.
- The standalone server in this folder is built from upstream `dev` (protocol 56). Players must
  run the matching client: the `continuous` release zip, not the Workshop 0.11.5 build, unless
  you rebuild the server from the `v0.11.5` tag (see docs/UPDATING.md). A protocol mismatch is
  rejected at connect time with a version message.
