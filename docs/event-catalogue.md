# Historical resource catalogue

[English](event-catalogue.md) · [Español](event-catalogue.es.md) · [Documentation](README.md)

## Included content

The installation ships 16 packages from 2012, 307 room variants and 76 companion-resource references. The manifest references 381 unique SWF files, approximately 63 MiB. Town has 13 historical variants in addition to its original design.

The files are included in the repository. Operators do not need to upload them or fetch them at startup.

| Packages |
| --- |
| Underwater Expedition |
| Fashion Show |
| Rockhopper's Quest |
| Puffle Party |
| April Fools' Party |
| Easter Egg Hunt |
| Earth Day |
| Medieval Party |
| Marvel Super Hero Takeover |
| Ultimate Jam |
| Adventure Party: Temple of Fruit |
| The Fair |
| Halloween |
| 7th Anniversary |
| Operation: Blackout |
| Holiday Party |

## Use the library

Open **Rooms & events** to select a room and preview its variants. Use **Event library** to activate a complete resource package, or **Apply room design** for an individual variant. See [the administration guide](events.md).

Each package identifies its recovered rooms, companion files and missing content. Unrecovered rooms from other editions are not presented as available variants.

The recovered catalogues are in English and use the server's existing inventory/purchase packets. Package activation is not proof that every historical purchase works.

## Resources versus complete events

All packages are labelled **Resource package**. They replace the listed assets; none is certified as a complete implementation of every original event mechanic.

Powers, transformations, objectives, rewards, party modules and general client options can require additional implementation and testing. **Included content & limitations** explains package-specific gaps.

Activating a package replaces earlier selections. Restoring all rooms/resources returns to the original configuration. Players need to reload the game to receive the updated configuration.

## Provenance and licensing

The assets were recovered from Waddle Forever's public archive at commit `02a9df8be1f33d570690d8a59a726a9bcc9d34df`. The manifest records source URLs, the pinned revision, sizes and Git/SHA-256 hashes.

See `world_manager/catalog/manifest.json`, [the upstream notice](../world_manager/catalog/UPSTREAM-LICENSE.txt) and [the Dash notice](../world_manager/DASH-LICENSE.md). The original Club Penguin assets belong to their rights holders. MIT-licensed metadata does not transfer rights to the original artwork or SWFs.

## Integrity checks

~~~sh
python scripts/import-event-catalog.py --verify
~~~

Verification checks hashes, sizes and headers without network requests. If a file is absent or damaged, `--repair` can recover it from the pinned URL. It does not track a moving source branch.

## Technical event inventory

The separate `scripts/audit-events.py` tool examines historical path aliases and classes embedded in the original client/room SWFs. The recorded audit covers 169 SWFs and 27 reference/module groups.

These groups are not 27 complete events. Aliases can point at reused filenames, and embedded classes do not establish that a particular decoration or mechanic is active.

~~~sh
python scripts/audit-events.py --check
~~~

## Validation

Catalogue checks cover fresh-install availability, file integrity, activation, persistence, restoration and rejection of incomplete mappings. Local integration checked all included room/resource deliveries through Nginx. Authenticated Ruffle validation loaded Marvel Town and music 325.

Historical purchases, complete room walkthroughs and every event's mechanics remain unverified. See [the local report](local-validation.md).
