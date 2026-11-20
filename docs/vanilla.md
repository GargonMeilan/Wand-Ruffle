# Vanilla and Card-Jitsu Snow integration

[English](vanilla.md) · [Español](vanilla.es.md) · [Documentation](README.md)

## Runtime and startup

Vanilla uses the same locally hosted Ruffle 0.7.1 runtime and Websockify bridge as Legacy. Set `VANILLA_PLAYER=ruffle`; this is also the default when the variable is absent. `flash` restores the previous embedding.

The adapter in `web/ruffle/vanilla.js` intercepts SWFObject detection/embedding, creates a player for `club_penguin.swf` and preserves the original FlashVars, dimensions, ID and callback. It retains the page's scripts/styles and ExternalInterface flow. It does not load Legacy's `boots.swf`.

The client reads `environment_data.xml`, world/shell modules and `servers.xml`. Public media URLs and advertised socket values must match the environment and generated templates.

## Web services and registration

The Vanilla media host enables CORS only for the configured Vanilla origin. The obsolete Disney telemetry endpoint `/datatech/serverlog/v1/json` receives a local 204 response; it is not a game API.

Registration links in the four client languages point to local Dash. Legacy's `/create_account/create_account.php` is proxied to Dash's canonical `/create/legacy/` on both game and media hosts, preserving POST and body. This does not bypass terms, rules or CAPTCHA validation.

The registration proxy test verifies routing/body preservation with a test backend; it does not certify the entire real registration flow.

## Card-Jitsu Snow sockets

Snow uses a separate embedding and protocol. Its Ruffle configuration includes `SNOWFLAKE_HOST` and `SNOWFLAKE_PORT` as advertised by Dash.

The Vanilla WSS route `/__wand/ws/snow` connects to the fixed internal destination `snowflake:SNOWFLAKE_PORT`. No extra public TCP port is required for browser play.

Rebuild web and Websockify and regenerate client pages when deploying socket configuration changes.

## Connection-context correction

The original Snow page applies `encodeURIComponent` to `queryString` when constructing SWFObject's FlashVars string. Flash decoded it once; Ruffle's object parameters retain the supplied value.

Without adaptation, Snow received an encoded context such as `battleMode%3D0%26base_asset_url%3D...`. Snowflake rejected it with user code 900, and the client's error handling could trigger Error #1009 and an unresponsive panel.

The adapter decodes `queryString` exactly once for `mpProduct=cjsnow`. It does not alter the page's original parameter object or the main game's FlashVars.

Protocol and browser regression checks distinguish the rejected encoded context from the accepted normal form. They do not authenticate a full match.

## Snow combat stability

Compose applies `compat/snowflake/combat.patch` to a private copy of the submodule when Snowflake starts. Restart the `snowflake` service to load these fixes.

Indefinite animation loops, queued blank images and private targeting cues no longer block turn progression. Animation handles are unique for each match, so a delayed acknowledgement from another client cannot complete a later action. Room loading events register clicks without confirming the player's turn. The patch also fixes timeout recovery, effect cleanup and large enemies being duplicated in area attack targets.

Run `tests/snow-combat-turns.py` with the dependencies from `snowflake/requirements.txt` and the patched source on `PYTHONPATH`.

Local Chromium and Ruffle testing against the debug data provider verified board loading, movement clicks and multiple turns with two AI teammates. Persistent rewards and a complete match with three human players remain unverified.

## Validation boundaries

Local integration later verified Vanilla login, world selection and room entry, including a historical room and music. Earlier boot-only checks are not the latest end-to-end status.

A complete Snow match remains unverified. Card-Jitsu Water has a [startup compatibility fix](validation.md); a complete match remains unverified. Full social, activation, membership, CAPTCHA and minigame compatibility is not implied by reaching login.

See [validation](validation.md), [the local report](local-validation.md) and [development checks](development.md).
