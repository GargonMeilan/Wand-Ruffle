# Wand Ruffle

**Club Penguin Legacy and Vanilla in the browser, with Docker Compose, Ruffle and an expanded administration panel.**

[English](README.md) · [Español](README.es.md) · [Documentation](docs/README.md)

Wand assembles the game server, account services, media and infrastructure needed to operate a Club Penguin server. This fork extends [Solero's Wand](https://github.com/solero/wand) with a locally hosted Ruffle runtime so the existing Flash clients can run without a Flash browser plugin.

It also gives moderators tools to preview and publish Vanilla room designs, apply historical resource packages and inspect connected players. The backend and media remain upstream Git submodules; browser adapters and administration extensions live in this repository.

> **Project status:** authenticated Vanilla sessions, room changes and player monitoring have been verified locally. Ruffle compatibility is partial. Historical packages provide recovered resources, not complete implementations of every event mechanic.

## Contents

[Features](#what-changes-in-this-fork) · [Architecture](#architecture) · [Installation](#installation) · [Configuration](#configuration) · [Administration](#administration) · [Events](#historical-event-library) · [Updates](#updates-and-persistent-data) · [Compatibility](#compatibility-and-validation) · [Development](#development-and-contributions)

## What changes in this fork

| Area | Upstream foundation | Fork additions |
| --- | --- | --- |
| Clients | Legacy AS2 and Vanilla AS3 Flash clients | Self-hosted Ruffle 0.7.1, preserved startup parameters and selectable Flash fallback |
| Connections | Houdini and Snowflake TCP services | Internal Websockify 0.13.0 bridge, Nginx WebSocket routes and explicit origin/destination checks |
| Administration | Dash account management and moderation | Unified menu, room designs, music, previews, resource packages and online monitoring |
| Events | Media pinned through submodules | 16 archived 2012 packages, 307 room variants and 76 companion-resource references |
| Deployment | Docker Compose stack | Complete Dokploy configuration, optional host ports, stable volumes and coordinated readiness |
| Verification | Existing components | Client, manager, proxy, persistence and backend-startup checks |

Other fixes cover registration routes, Vanilla media loading, Card-Jitsu Snow parameters, Redis health checks and source mounts during checkout. See [architecture and fork boundaries](docs/architecture.md).

## Architecture

~~~text
Browser
  ├─ HTTP(S) ──> Nginx ──> Ruffle, client pages and media
  │                 └────> Dash + world_manager
  └─ WS(S) ───> Nginx ──> Websockify ── TCP ──> Houdini / Snowflake
                                                   │
                                             PostgreSQL + Redis
~~~

In Dokploy, Traefik terminates HTTPS/WSS and forwards to `web:80`. Room selections and uploads use the persistent `world_data` volume.

| Component | Responsibility |
| --- | --- |
| Houdini | Login and four worlds: Blizzard, Glaciar, Avalanche and Yeti |
| Dash | Registration, account services and moderator administration |
| Snowflake | Card-Jitsu Snow backend |
| Nginx / web | Pages, media, Ruffle and HTTP/WebSocket routing |
| Websockify | Browser WebSockets to fixed internal TCP destinations |
| PostgreSQL / Redis | Game/account data, cache and temporary player snapshots |
| world_manager | Fork extension for persistent room/resource selections and monitoring |

## Installation

### Requirements

- Git with access to the submodule repositories.
- Docker Engine and Docker Compose v2 supporting the supplied configuration, including health-check start intervals and dependency restart propagation.
- Space for media, submodule histories, images and persistent data. Media histories occupy several GB.
- Public hosting requires DNS, configured game/media URLs and HTTPS termination.
- Windows development uses Docker Desktop with Linux containers; WSL is also an option.

Python and Node.js are needed for development checks, not to launch the containerized stack.

### Clone and configure

~~~sh
git clone --recurse-submodules https://github.com/GargonMeilan/wand-ruffle.git
cd wand-ruffle
~~~

For an existing checkout, run `git submodule update --init --recursive`. The inherited `install.sh` still clones `solero/wand`; use these instructions to install this fork.

Edit the included `.env` with the database password, game address, public game/media URLs and optional email/CAPTCHA settings. The localhost values are examples, not a public-server configuration. Both clients default to Ruffle.

### Deploy with Dokploy

1. Select this repository and the intended deployment branch. Enable **Git submodules**.
2. Set **Compose Path** to `docker-compose.dokploy.yml`.
3. Supply the installation's environment variables.
4. Route all configured game/media domains to **web**, container port **80**, with HTTPS.
5. Deploy the full stack; check registration, login, world selection and room entry.

The base and Dokploy Compose files publish no host ports. Do not add the direct-access override behind Dokploy. See [deployment and configuration](docs/ruffle.md) and [updates and recovery](docs/redeploy.md).

### Deploy with direct access

After configuring `.env` and hostname resolution:

~~~sh
docker compose -f docker-compose.yml -f docker-compose.direct.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.direct.yml up -d --build
~~~

The direct override publishes the original web/backend ports, including PostgreSQL. Review bindings and the firewall before exposing the machine. This mode does not configure HTTPS.

Open `WEB_LEGACY_PLAY` or `WEB_VANILLA_PLAY` to play, and `/manager` on a game host to administer the server.

## Configuration

| Variable | Purpose |
| --- | --- |
| `LEGACY_PLAYER`, `VANILLA_PLAYER` | `ruffle` by default; `flash` selects the previous embedding |
| `WEB_LEGACY_PLAY`, `WEB_VANILLA_PLAY` | Public client URLs and allowed WebSocket origins |
| `WEB_LEGACY_MEDIA`, `WEB_VANILLA_MEDIA` | Media URLs; use HTTPS when the game uses HTTPS |
| `GAME_ADDRESS`, `GAME_LOGIN_PORT` | Houdini address/login port advertised to clients |
| `SNOWFLAKE_HOST`, `SNOWFLAKE_PORT` | Snow address/port matched by Ruffle's socket mapping |
| `MEDIA_LOCATION` | Snow media base; align with `WEB_VANILLA_MEDIA` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | Database identity and password |
| `WEB_RECAPTCHA_SITE`, `WEB_RECAPTCHA_SECRET` | Optional CAPTCHA settings |
| `EMAIL_METHOD`, `EMAIL_*` | Optional account email delivery |

The host/port requested by Ruffle must match its socket mapping. The browser then uses WS/WSS on the game host instead of connecting directly to Houdini TCP ports. Comments in `.env` describe the remaining options.

## Administration

Sign in at `/manager` with an existing moderator account. The extension does not create an administrator automatically. The interface is in English in both documentation editions.

| Menu | Purpose |
| --- | --- |
| **Overview** | Main shortcuts and recent account logins |
| **Rooms & events** | Preview, upload, apply and restore Vanilla designs, music and packages |
| **Online players** | Find connected players by world, room, name or ID |
| **Players** | Existing player management and moderation |
| **Username review** | Review pending usernames |
| **Account** | Change your password/email or sign out |

After initial installation, room publications need no rebuild or restart and persist across container recreation. Players receive a reload notice because the client keeps configuration in memory. Previews do not publish changes.

Read [rooms and events](docs/events.md), [the catalogue](docs/event-catalogue.md) and [online players](docs/online.md) for workflows and permissions.

## Historical event library

The repository includes **16 packages from 2012**, **307 room designs** and **76 companion-resource references**: 381 unique SWF files, approximately 63 MiB. No manual upload or startup download is required.

Examples include Medieval Party, Marvel Super Hero Takeover, Ultimate Jam, Halloween and Operation: Blackout. Each package lists recovered content and missing features. Ruffle previews leave the active world unchanged.

Applying a package replaces the selected room/resource configuration. It does not automatically implement powers, transformations, objectives or special rewards. See [the full catalogue](docs/event-catalogue.md).

## Updates and persistent data

| Volume | Content |
| --- | --- |
| `<project>_postgres_data` | PostgreSQL database |
| `<project>_redis_data` | Redis persistence |
| `<project>_world_data` | Room selections, publication history and uploads |

Back up the database and the whole world-state volume before updating. Keep the same Compose project name and bindings. Migration from `./.data` and `./.redis` bind mounts is **not automatic**; selecting new volumes does not copy accounts.

Source/media still use bind mounts. Replacing the checkout may require container recreation. Follow [the update procedure](docs/redeploy.md); do not use `down -v` or fresh-volume options to update.

`master` is the integration branch. `feature/ruffle-support` is retained for the existing test server. Merging into `master` does not change that server's selected branch or synchronize subsequent changes back to it.

## Compatibility and validation

| Area | Documented status |
| --- | --- |
| Vanilla/Ruffle | Local authenticated login, world selection and room entry verified |
| Rooms/music | Published changes served by Nginx and loaded by the client |
| Event packages | Included resource mappings checked; event mechanics remain incomplete |
| Online players | Multiple worlds, movement, disconnects and stale-world recovery checked |
| Docker stack | Proxy chain, persistence and startup/recovery covered by checks |
| Card-Jitsu Snow | Routing and connection-context regression covered; full match unverified |
| Other features | Activation, membership, social services, Water and all minigames are not fully validated |
| Public hosting | Real domains, TLS, Traefik and browser coverage need installation-specific checks |

See [validation](docs/validation.md) and the [local report](docs/local-validation.md). Passing automated checks does not establish compatibility with every Flash feature.

## Repository layout

~~~text
.github/workflows/   CI validation
docs/                English guides and matching *.es.md editions
templates/           Client-page and Nginx templates
web/ruffle/          Runtime dependency and browser adapters
websocket/           Internal Websockify service
world_manager/       Administration extension, state store and catalogue
scripts/             Compose generation, source preparation and catalogue tools
tests/               Unit, integration and browser checks
dash/                Upstream account/admin submodule
houdini/             Upstream game-server submodule
snowflake/           Upstream Card-Jitsu Snow submodule
legacy-media/        Legacy media submodule
vanilla-media/       Vanilla media submodule
~~~

## Development and contributions

Start with [the development guide](docs/development.md). Keep adapter, template and extension changes here unless a submodule update is intentional. Edit `docker-compose.yml` and regenerate Dokploy instead of editing generated YAML.

Update English and Spanish documentation together when behavior changes. Include relevant checks and compatibility limits in pull requests.

## Credits and licensing

Built on Wand, Houdini and Dash from Solero, Snowflake from Lekuruu, Ruffle and noVNC's Websockify. Historical resources were recovered from Waddle Forever; provenance and hashes are recorded in the catalogue manifest.

This repository uses the [MIT license](LICENSE.md). Submodules/dependencies retain their own licenses. Adapted Dash templates retain their [license notice](world_manager/DASH-LICENSE.md); the catalogue includes an [attribution notice](world_manager/catalog/UPSTREAM-LICENSE.txt).

Club Penguin and its original assets belong to their rights holders, including Disney. The repository's MIT license does not grant rights to those assets. This is an independent community project.
