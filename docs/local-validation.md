# Local integration report · 13 November 2026

[English](local-validation.md) · [Español](local-validation.es.md) · [Documentation](README.md)

## Test environment

The recorded test built an isolated stack from `docker-compose.dokploy.yml`: PostgreSQL, Redis, Houdini login and four worlds, Dash, Nginx, Websockify and Snowflake.

It used test credentials, a host port bound only to `127.0.0.1` and uniquely named disposable volumes. It did not access Dokploy or the data of an existing installation. This report documents prior execution; editing it does not rerun the tests.

## Catalogue and unified-manager extension

The extension passed 34 Python and 12 JavaScript checks, integrity verification for 377 catalogue files and a headless browser test covering 16 events, 13 Town designs and zero publication requests during previews. Real Marvel/Halloween previews and the 390 px layout were inspected.

The full-stack checks verified:

- Activation of all 16 packages and delivery of 303 room variants and 76 companion references through Nginx, with matching hashes.
- State persistence after recreating Dash, JSON/ZIP restoration, CSRF protection and manager access control.
- Two authenticated players in separate worlds, movement, disconnects and expiry/recovery of world presence.
- Authenticated previews and the Players, player-detail, username-review, password and email pages with common navigation and English UI.
- A real Ruffle login, Blizzard selection, Marvel Town and music 325. No unexpected JavaScript/resource failures occurred beyond the inherited issues below.
- Five Nginx configurations: separate domains, subpaths, shared host, Flash and CAPTCHA.

These results verify resource delivery and the session described. They do not certify historical purchases, every room walkthrough or complete event mechanics.

## Earlier integration coverage

The preceding room/monitor implementation recorded 28 Python and 12 JavaScript tests, plus:

- All eleven services starting and Houdini protocol handshakes succeeding.
- Moderator access, rejection of unauthorized accounts/requests and panel CSS/JavaScript delivery.
- Music changes, SWF uploads, hashed resource delivery, package application and rejection of invalid form tokens.
- Effective JSON, JSONP and `game_configs.bin` updates; unrelated ZIP members preserved and exact original-bundle restoration.
- State and uploaded assets surviving Dash recreation.
- Authenticated sessions through Nginx/Websockify/Houdini in Blizzard and Glaciar, moves and removal on disconnect.
- Yeti snapshot expiry, the distinction between zero players/unavailable data and recovery on restart.
- Vanilla/Ruffle login and room entry, then a selected uploaded Town copy and track 9 served with HTTP 200. That fixture checked selection/delivery, not a new historical artwork.
- PostgreSQL/Redis test data surviving container recreation.
- Cold startup, coordinated recovery after temporary database recreation and starting stopped worlds with one Compose operation.

## Fixes identified during testing

1. Sanic static routing added a double slash; extension and inherited manager resource routes were corrected outside the submodule.
2. The inherited login attempted CAPTCHA without keys; the extension template now loads it only when configured while preserving backend validation.
3. The client consumed `game_configs.bin` in addition to loose JSON; the override now updates that bundle too.
4. HTTP readiness was added for Dash, and web waits for it to become healthy.

## Observed inherited limitations

| Request | Local result |
| --- | --- |
| `/social/autocomplete/v2/search/clientRules` | Invalid/missing preflight response; CORS block |
| `/play//web_service/activate_player.php` | HTTP 404; test accounts were already activated |
| `/web-service/membership` | Historical URL omitted the nonstandard local port |

These did not prevent the tested session. No artificial success response was added. Activation, membership, autocomplete, all minigames and complete historical events are not certified.

Snowflake started, but no complete Card-Jitsu Snow match was played. Testing used local HTTP; HTTPS, certificates, Traefik and production domains need separate post-deployment checks.

## Reproduce the isolated Windows stack

With Docker Desktop running, initialized submodules, Python test dependencies and the local Playwright/Chromium tooling described in [development](development.md):

~~~sh
python tests/local-stack.py prepare
python tests/local-stack.py up
python tests/check-manager-live.py
node tests/local-browser-smoke.cjs
python tests/check-nginx-local.py
python tests/check-data-persistence.py
python tests/check-backend-startup.py
python tests/local-stack.py down
~~~

`prepare` creates `.validation/local-stack/compose.json` for reuse. `down` removes only the isolated project's registered test resources. Checks that use its accounts or modify rooms must run sequentially.

Reports and screenshots are stored under `.validation/local-stack/` and ignored by Git, including `integration-results.json`, `browser-report.json` and manager/client screenshots. These local artifacts are not shipped as repository files.

See [current validation boundaries](validation.md).
