# Wand — Ruffle edition

This fork adapts Wand to run Club Penguin Legacy (AS2) and Vanilla (AS3) in
modern browsers with Ruffle, without installing the Flash browser plugin.
Wand configures Dash, Houdini, Snowflake and the media servers with Docker Compose.
Ruffle compatibility is still partial; see the limitations below.

**[Guía en español: Ruffle y nuevo panel de administración](docs/getting-started.es.md)**

## What this fork adds

- Locally hosted Ruffle for both clients, with an internal WebSocket/TCP bridge
  for game connections and Card-Jitsu Snow routing.
- An expanded `/manager` interface with room designs, music, event resource
  packages, previews and live player monitoring, alongside account moderation.
- A bundled library of 16 events from 2012, containing 303 room designs and
  76 references to companion resources.
- Dokploy deployment configuration, persistent database/cache/world volumes,
  coordinated startup and automated integration checks.

## Browser clients and administration

Legacy now uses a locally hosted, pinned Ruffle runtime and a WebSocket/TCP
bridge. Vanilla also uses Ruffle through its original page and FlashVars; see
[Vanilla integration](docs/vanilla.md). See [Ruffle and Dokploy deployment](docs/ruffle.md)
for HTTPS domains, configuration, validation, limitations and rollback.

Vanilla room decorations and music can be managed at `/manager/world`; see
[Runtime rooms and event inventory](docs/events.md) for setup, uploads,
decoration packages, client reloads and the limits of the bundled event assets.
The [preinstalled event library and room previews](docs/event-catalogue.md)
include 16 historical resource packages, with 303 room designs and archived
companion files. The manager uses one English interface across all menus.
The moderator panel also includes [Online players](docs/online.md), with live
server and room snapshots for Legacy and Vanilla.

For Dokploy, select **`docker-compose.dokploy.yml`**, enable Git submodules and
configure HTTPS domains on `web:80`. PostgreSQL and Redis use stable Docker
volumes outside the Git checkout. Keep the project name unchanged. Existing
bind-mount data is not migrated automatically; read the deployment guide before
switching an installation whose accounts must be preserved.

The base Compose publishes no host ports. For direct access without Dokploy,
add `-f docker-compose.direct.yml` after `-f docker-compose.yml` to publish the
original ports. Do not enable that optional file behind Dokploy's proxy.

> [!NOTE]
> This can also be ran on Windows using WSL.

## Installation script

The inherited `install.sh` still clones `solero/wand`. To install this Ruffle
fork, use the manual setup below or the [Dokploy guide](docs/ruffle.md).
## Manual setup

Install this fork and its submodules, configure `.env` for your domains and
credentials, then start the services. For a guided explanation, use the
[Spanish getting-started guide](docs/getting-started.es.md).

**Step 1** Choose your Linux Distribution

<details>
  <summary>Debian/Ubuntu</summary>

```bash
$ sudo apt update
$ sudo apt install git curl
$ curl -fsSL https://get.docker.com -o get-docker.sh
$ sh get-docker.sh
$ sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
$ sudo chmod +x /usr/local/bin/docker-compose
```
</details>

<details>
  <summary>Fedora/RHEL</summary>
  
```bash
$ sudo dnf update
$ sudo dnf install git curl
$ curl -fsSL https://get.docker.com -o get-docker.sh
$ sh get-docker.sh
$ sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
$ sudo chmod +x /usr/local/bin/docker-compose
```
</details>

<details>
  <summary>Arch based distros</summary>
  
```bash
$ sudo pacman -Syu
$ sudo pacman -S docker docker-compose git curl
$ systemctl start docker.service
$ systemctl enable docker.service
```
</details>


**Step 2** Clone the repository & submodules
```bash
$ git clone --recurse-submodules https://github.com/GargonMeilan/wand-fork.git
$ cd wand-fork
```

**Step 3** Edit the config file (set credentials and public URLs for your installation)
```bash
$ nano .env
```

**Step 4** Start the services
```bash
$ sudo docker-compose -f docker-compose.yml -f docker-compose.direct.yml up
```

**Step 5** You're done!

Open the configured `WEB_LEGACY_PLAY` or `WEB_VANILLA_PLAY` URL to play. Ruffle is
the default for both clients (`LEGACY_PLAYER=ruffle`, `VANILLA_PLAYER=ruffle`).
For administration, open `/manager` on a configured game host and sign in with
a moderator account. The new menu is in English:

| Menu | Purpose |
| --- | --- |
| Overview | Shortcuts and recent account logins |
| Rooms & events | Preview and apply Vanilla room designs, music and event resources |
| Online players | Find connected players by server, room, name or ID |
| Players | Existing player management and moderation |
| Username review | Review pending usernames |
| Account | Change your password or email, or sign out |

See [room management](docs/events.md), [the event library](docs/event-catalogue.md)
and [online monitoring](docs/online.md) for permissions, persistence and usage.

## Compatibility and validation

Local Docker/browser validation includes real sessions entering rooms, room
design/music changes and player monitoring. Historical event packages replace
the listed resources; they do not implement complete quests, powers or rewards.
A complete Card-Jitsu Snow match and all inherited activation, membership,
social and minigame features have not been validated. HTTPS and real Dokploy
domains require checks on the deployed installation.

See [local validation](docs/local-validation.md) for results and known limits,
and [redeployment](docs/redeploy.md) before updating an existing installation.
Keep the Compose project name and persistent volumes; existing bind-mount data
is not migrated automatically.
