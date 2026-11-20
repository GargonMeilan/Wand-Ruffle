# Deployment and configuration

[English](ruffle.md) · [Español](ruffle.es.md) · [Documentation](README.md)

## Choose the Compose configuration

| File | Use |
| --- | --- |
| `docker-compose.yml` | Source configuration; internal networking, no published host ports |
| `docker-compose.dokploy.yml` | Complete generated file for Dokploy |
| `docker-compose.direct.yml` | Optional override publishing original ports for direct access |
| `docker-compose.ruffle-only.yml` | Compatibility override retained from earlier revisions; no longer needed to remove ports |

Use Docker Compose v2 and validate the chosen configuration. The YAML uses features including health-check start intervals, dependency restart propagation and `create_host_path: false`.

## Obtain sources

~~~sh
git clone --recurse-submodules https://github.com/GargonMeilan/wand-ruffle.git
cd wand-ruffle
docker compose version
~~~

Submodules include backend sources and large media repositories. Access to GitHub and the media hosts in `.gitmodules` is required. Do not use the inherited installation script for this fork: it still clones upstream Wand.

## Configure the environment

Edit the provided `.env`. This is a partial example; retain the other required settings from the supplied file:

~~~dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-with-your-own-password
LEGACY_PLAYER=ruffle
VANILLA_PLAYER=ruffle
WEB_LEGACY_PLAY=https://old.example.com
WEB_LEGACY_MEDIA=https://legacy.example.com
WEB_VANILLA_PLAY=https://play.example.com
WEB_VANILLA_MEDIA=https://media.example.com
MEDIA_LOCATION=https://media.example.com
~~~

Replace every example domain and password. Set `GAME_ADDRESS` and `SNOWFLAKE_HOST` for the installation; preserve the configured login/Snow ports unless intentionally changing them. These advertised addresses must match the socket mapping. Browser traffic still goes through the game's WS/WSS endpoint.

Use URLs without a trailing slash. Path prefixes are supported by the client templates, but game and media prefixes on a shared host must differ; follow the Nginx templates when arranging shared hosts. Separate domains, as above, are the clearest initial configuration.

Use HTTPS for all media when the page is HTTPS. The media vhosts allow the configured game origin rather than a wildcard. Do not disable origin checks to resolve a routing mismatch.

### Accounts, email and CAPTCHA

Configure `WEB_RECAPTCHA_SITE` and `WEB_RECAPTCHA_SECRET` together when using CAPTCHA. Leave them blank to disable the optional integration.

`EMAIL_METHOD` accepts the configured SMTP/SendGrid delivery mode; related `EMAIL_*` values supply credentials and sender details. The inherited configuration describes blank `EMAIL_METHOD` as disabling email activation and activating registrations immediately. Validate the actual registration/activation flow for your installation; inherited activation endpoints have known validation gaps.

A moderator account is required for administration. Installing the extension does not create one automatically.

## Dokploy

1. Create or retain a **Docker Compose** application for this repository. Select the intended branch and enable **Git submodules**.
2. Set **Compose Path** to `docker-compose.dokploy.yml`. Do not combine it with the direct-access override.
3. Keep the existing project name, credentials and volume bindings when updating.
4. Supply the environment values and configure DNS for each public game/media host.
5. In **Domains**, route each complete host to service **web**, container port **80**, path `/`, with HTTPS. Do not strip the path or publish Websockify/Houdini ports.
6. Check the generated/preview configuration: web must share the internal `wand` network with the backends as well as the proxy network supplied by Dokploy.
7. Deploy the complete application with a build.

For an existing installation whose checkout is replaced during deployment, apply the container-recreation procedure in [updates and recovery](redeploy.md). Preserve Dokploy's project/env-file arguments when adjusting its command. Do not paste `sh scripts/prepare-sources.sh` into a field that expects Docker arguments.

The Dokploy file is generated from the base configuration. To change it:

~~~sh
python scripts/generate-dokploy-compose.py
python scripts/generate-dokploy-compose.py --check
~~~

PyYAML 6.0.3 is required for the generator.

## Direct access

Configure hostname resolution to point the game/media hosts at the server. Then:

~~~sh
docker compose -f docker-compose.yml -f docker-compose.direct.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.direct.yml up -d --build
~~~

The override publishes web, Houdini, Snowflake and database-related bindings; inspect `docker-compose.direct.yml` before using it on a public host. It supplies no TLS termination. The base file by itself does not expose the game to the host.

## Persistent data

| Volume | Data |
| --- | --- |
| `${COMPOSE_PROJECT_NAME:-wand}_postgres_data` | PostgreSQL |
| `${COMPOSE_PROJECT_NAME:-wand}_redis_data` | Redis |
| `${COMPOSE_PROJECT_NAME:-wand}_world_data` | SQLite world state and uploaded designs |

Keep the project name stable. Moving from older `./.data` or `./.redis` mounts starts with the selected Docker volumes; it does not migrate old data. Back up and migrate existing installations before switching. Do not delete old data to perform an update.

## Verify the deployment

- Check `docker compose ps` and service logs using the same Compose files/project as the deployment.
- Open both game pages and confirm that Ruffle JavaScript and WASM load locally.
- Register/sign in using the intended account workflow, choose a world and enter a room.
- In browser developer tools, check the WS/WSS login and world connections for HTTP 101.
- Sign in as moderator, open the manager, preview a design and test an intentional publication.
- Verify the player list and persistence after a controlled container recreation.

A start screen alone does not verify authentication, world entry or all minigames.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Build cannot find source files | Submodule initialization and access to media/backend repositories |
| Ruffle does not load | `/__wand/ruffle/` JS/WASM requests and web image rebuild |
| CORS or mixed-content error | Public URLs, HTTPS and exact allowed client origin |
| WebSocket 403 | Requested origin compared with the configured game URL |
| WebSocket 502 | Internal network, Websockify and destination readiness |
| Missing socket proxy | Exact advertised host/port versus Ruffle mapping and `servers.xml` |
| Login succeeds but world fails | World route, server ID/language/port and Houdini logs |
| Rooms do not update | Reload client, inspect JSON/ZIP requests and verify publication revision |

## Flash fallback

Set the relevant player variable to `flash` and recreate web. This restores the previous embedding and requires a compatible Flash client. External TCP clients additionally need explicit port access; the Dokploy configuration does not publish those ports. This setting does not revert storage changes.

See [architecture](architecture.md), [Vanilla details](vanilla.md) and [validation](validation.md).
