# Getting started

[English](getting-started.md) · [Español](getting-started.es.md) · [Documentation](README.md)

## Before installation

Read [the project overview](../README.md) for what this fork adds and its compatibility limits. You need Git, Docker and Docker Compose v2, access to the media submodules and enough space for several GB of histories.

## Install

~~~sh
git clone --recurse-submodules https://github.com/GargonMeilan/wand-ruffle.git
cd wand-ruffle
~~~

Edit `.env` for your credentials and game/media URLs. Keep `LEGACY_PLAYER=ruffle` and `VANILLA_PLAYER=ruffle` for browser play.

For Dokploy, select `docker-compose.dokploy.yml`, enable submodules and route HTTPS domains to `web:80`. For direct access, use the base Compose plus `docker-compose.direct.yml` after configuring hostname resolution.

Follow [deployment and configuration](ruffle.md) for the full commands and checks. Existing installations must follow [updates and backups](redeploy.md) before changing storage.

## Use the server

Open a configured game URL to play. Open `/manager` with an existing moderator account for administration.

Use [room management](events.md) to publish designs/music, [the catalogue](event-catalogue.md) for historical packages and [online players](online.md) for monitoring.

## Verify

Check real login, world selection, room entry and your required account/minigame workflows. [Validation](validation.md) separates tested behavior from remaining limitations.
