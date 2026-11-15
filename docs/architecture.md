# Architecture and fork boundaries

[English](architecture.md) · [Español](architecture.es.md) · [Documentation](README.md)

## Upstream components

Wand is an orchestration repository. It pins Houdini, Dash, Snowflake and the two media trees through Git submodules. The fork adds adapters, templates, services and startup wrappers around them; the Ruffle/manager integration does not change their pinned source code or the Houdini SQL schema.

| Layer | Source | Fork responsibility |
| --- | --- | --- |
| Login/worlds | `houdini/` | Compose readiness and a world-start wrapper for presence publication |
| Accounts/admin | `dash/` | Extension registration and overridden manager templates |
| Snow | `snowflake/` | Browser socket routing and connection parameters |
| Clients/media | `legacy-media/`, `vanilla-media/` | Generated entry pages, routing and runtime resource overrides |
| Browser runtime | `web/ruffle/` | Pinned Ruffle package and client-specific adapters |
| TCP bridge | `websocket/` | Fixed destinations and origin validation |
| World management | `world_manager/` | State, catalogue, routes, previews and presence |

## Browser startup

**Legacy** starts from its original `boots.swf`. The adapter preserves that loading flow, supplies the configured media base and rewrites the initial loader URL where the original host lookup would lose a path prefix or nonstandard port.

**Vanilla** keeps its original page, scripts and styles. The adapter intercepts SWFObject embedding to create a Ruffle player for `club_penguin.swf` with the original FlashVars, player ID, dimensions and callbacks. Snow uses a separate embedding with a targeted parameter-decoding correction. See [Vanilla integration](vanilla.md).

The web image installs Ruffle 0.7.1 from the lockfile and serves its JavaScript/WASM locally. Players do not fetch the runtime from a CDN.

## Connection path

~~~text
Browser ─ HTTPS/WSS ─ Traefik ─ HTTP/WS ─ web:80
                                         ├─ Dash: accounts and manager
                                         ├─ client pages, Ruffle and media
                                         └─ websocket:8080 ─ TCP ─ game service
~~~

Traefik is part of the Dokploy deployment environment. The direct-access Compose override bypasses it.

Ruffle maps an exact requested host/port to a WebSocket URL on the public game host. Nginx forwards that route to Websockify. The proxy selects a fixed internal destination rather than accepting a browser-supplied TCP address.

| Route suffix under `/__wand/ws/` | Internal destination |
| --- | --- |
| `login` | `houdini_login:GAME_LOGIN_PORT` |
| `blizzard` | `houdini_blizzard:9875` |
| `glaciar` | `houdini_glaciar:9876` |
| `avalanche` | `houdini_avalanche:9877` |
| `yeti` | `houdini_yeti:9878` |
| `snow` | `snowflake:SNOWFLAKE_PORT`, exposed through the Vanilla host |

Game origins are explicit. Media CORS is scoped to the configured client origin. HTTPS pages require HTTPS media; WSS uses the game's public certificate.

## Runtime room resources

The extension registers with Dash through `world_manager/boot.py`. Nginx forwards selected Vanilla configurations and resources to Dash. Original submodule media are not overwritten.

Room selections affect JSON, JSONP and `game_configs.bin`, the ZIP configuration bundle consumed by the client. Unrelated ZIP members are preserved; restoring all selections returns the original bundle. SWF overrides retain their original URL directory so relative dependencies continue to resolve.

State and uploads live in `world_data`. Publications are transactional, revisioned and attributed to the moderator. A stale form cannot overwrite a more recent publication.

## Player presence

Each world starts through `world_manager/houdini_boot.py` and publishes snapshots to Redis every five seconds, with a twenty-second expiry. The manager polls every five seconds. Publication failures are retried without stopping the world; expired snapshots are shown as unavailable.

Presence does not add a movement history or modify the existing game population collections. Snowflake's internal match location is not tracked.

## Deployment boundaries

The base Compose publishes no host ports. The generated Dokploy file provides explicit aliases and stable volumes. The optional direct file restores host bindings.

Readiness checks include Houdini's `apiOK` protocol response, rather than treating an open port as a fully started server. Dependency restarts propagate during coordinated Compose operations; unhealthy status alone does not restart a still-running process.

See [deployment](ruffle.md), [updates](redeploy.md) and [validation](validation.md).
