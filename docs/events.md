# Room and event administration

[English](events.md) · [Español](events.es.md) · [Documentation](README.md)

## Access and scope

Open `/manager` on a configured game host and sign in with an existing moderator account. The extension checks authorization on each request. New world-management writes require the form's session token and publication revision.

The interface is in English. **Overview** links to **Rooms & events**, **Online players**, **Players** and **Username review**. **Account** contains password/email changes and sign-out. Player management and username review retain Dash's existing functions; this fork unifies their presentation.

Room/resource management applies to **Vanilla/AS3**. Legacy keeps its original media.

## Initial installation

Deploy the updated web image, recreate Dash and the four Houdini worlds, and retain the `world_data` volume. Dash registers the extension and reads Vanilla media; the worlds publish presence snapshots. See [deployment](ruffle.md) and [updates](redeploy.md).

After initial setup, selecting designs, uploading files, applying packages and restoring rooms happen during execution, without builds or restarts.

## Change one room

1. Open **Rooms & events**, select a room and click **Open**.
2. Select a variant under **Design**.
3. Click **Load preview** to inspect it without publishing.
4. Choose an available music ID, or `0` for silence.
5. Click **Apply room design**.
6. Use **Restore room** to remove that room's override.

Historical selections propose the documented music when available; otherwise they propose silence. Music choices come from the numbered files already present in Vanilla media. This version does not import new music or identify track titles.

## Preview behavior

The embedded Ruffle preview does not publish a revision, change the active world or open a player session. It receives no player credentials, disables SWF JavaScript access and blocks the SWF's network requests.

It is a visual preview. Buttons, minigames and scripts may depend on the full game engine and cannot be certified from the preview.

## Apply a resource package

In **Event library**, select **Activate [event]**. This applies the package's recovered rooms, music and companion files in a single transaction. It replaces the previous selection set; rooms absent from the package return to their originals.

**Restore all original rooms & resources** clears the selections and restores the original resources. Package content and limitations are listed in each card. See [the catalogue](event-catalogue.md).

Selecting an individual historical variant also activates its companion resources. When mixing variants from different events, shared resource paths use the last selected event. Apply the full package when a coherent resource set matters.

## Upload custom designs

Expand **Upload custom designs**, select a compatible room SWF and provide a design name, package name and music. Uploading registers the asset; it does not activate it.

Accepted files are FWS/CWS SWFs up to 16 MiB, with a 64 MiB uncompressed limit. Header validation does not establish gameplay compatibility. Exits, coordinates, symbols and dependencies must match the target room/client. The decoration is embedded in the SWF; the panel does not edit individual buildings or objects.

A custom package needs exactly one variant per room. Duplicate room designs make the package ineligible for activation; place the alternatives in different packages.

## What players see

Publishing changes the server configuration immediately. The client retains its configuration and Flash objects in memory, so leaving/re-entering a room does not guarantee a refresh.

Vanilla pages check the public revision every 15 seconds and offer a reload or postponement. Reload returns to login; players are not forcibly disconnected.

The extension serves JSON, JSONP and `game_configs.bin` with the selected room settings. Configurations use `Cache-Control: no-store`, and version/hash parameters identify resource content.

## Persistence and concurrent moderators

`world_data` stores `world.sqlite3` and `assets/`. Back up the entire volume, not just the database. Uploaded files are addressed by hash; restoring a room does not delete them.

Publications are atomic, revisioned and attributed to the moderator. If another moderator publishes while a form is open, the outdated publication is rejected and the operator must reload.

For Dash outside Compose, set `WAND_VANILLA_ROOT` and `WAND_WORLD_STATE`, add the repository to `PYTHONPATH` and use the extension's `boot.py` from the Dash directory.

## Limits

Resource packages do not automatically enable objectives, powers, transformations, rewards or all catalogue purchases. They do not change general client dates/options. Full events require compatible modules, assets and server behavior.

See [online monitoring](online.md) and [validation](validation.md).
