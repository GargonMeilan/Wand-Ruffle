# Development and verification

[English](development.md) · [Español](development.es.md) · [Documentation](README.md)

## Working environment

The containerized application uses pinned backend submodules and dependency files. Local verification uses Python, Node.js and Docker; CI runs Python 3.12 and Node 22.16.0.

Initialize the submodules before checks that need original media or backend sources. Keep local dependencies and generated reports in `.validation/`, which is ignored by Git. Use a virtual environment for Python dependencies.

~~~sh
python -m venv .validation/venv
~~~

Activate it with `source .validation/venv/bin/activate` on POSIX shells or `.validation\venv\Scripts\Activate.ps1` in PowerShell, then install:

~~~sh
python -m pip install -r websocket/requirements.txt websocket-client==1.9.0 PyYAML==6.0.3
~~~

Browser/template fixtures additionally need Jinja2. The application backend dependencies are installed by their own Docker builds.

## Unit and integrity checks

~~~sh
node --test tests/legacy-player.test.cjs tests/vanilla-player.test.cjs tests/world-notice.test.cjs tests/online-panel.test.cjs
python -m unittest discover -s tests -p 'test_*.py' -v
python scripts/import-event-catalog.py --verify
python scripts/audit-events.py --check
python scripts/generate-dokploy-compose.py --check
git diff --check
~~~

The Python WebSocket tests require `websocket-client`. An import resolving to the repository's `websocket/` directory without `create_connection` usually means that dependency is missing from the selected Python environment.

## Compose and Docker checks

~~~sh
docker compose config --quiet
docker compose -f docker-compose.yml -f docker-compose.direct.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.ruffle-only.yml config --quiet
docker compose -f docker-compose.dokploy.yml config --quiet
docker build -t wand-websocket-test websocket
sh tests/check-nginx.sh
python tests/check-proxy-chain.py
python tests/check-redis-health.py
python tests/check-data-persistence.py
python tests/check-bind-sources.py
docker compose build houdini_login dash snowflake
python tests/check-backend-startup.py
~~~

The shell check requires a POSIX shell such as Linux/WSL. The integration scripts create isolated test resources; review each script before running it. These checks are not a command sequence for an existing production deployment.

The backend check covers cold startup, recovery after recreating a temporary database and restarting stopped worlds with a coordinated Compose operation.

## Browser checks

Install the pinned runtime and browser tooling:

~~~sh
npm --prefix web/ruffle ci --ignore-scripts --no-audit --no-fund
npm install --prefix .validation playwright@1.56.1
~~~

For the original smoke scripts in a POSIX shell:

~~~sh
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node .validation/node_modules/playwright/cli.js install chromium
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node tests/browser-smoke.cjs
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node tests/vanilla-browser-smoke.cjs
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node tests/snow-browser-smoke.cjs
~~~

PowerShell uses `$env:PLAYWRIGHT_BROWSERS_PATH='.validation/browsers'` before the Node commands instead of the POSIX variable prefix.

Some catalogue/local-stack fixtures contain Windows-specific Chromium paths. Inspect `tests/catalog-browser-smoke.cjs` and the local report before using them on another platform. Do not assume every smoke script is portable.

Boot/transport fixtures do not replace a real authenticated game session. See [the local integration report](local-validation.md) for the isolated full-stack procedure.

## Generated files and boundaries

- Edit `docker-compose.yml`, then run `python scripts/generate-dokploy-compose.py`.
- Use the catalogue tool to verify pinned assets; repairs are an explicit network operation.
- Keep adapters, Nginx templates and `world_manager` changes in this repository.
- Change submodule commits only intentionally; do not mix generated media with upstream source changes.
- Update both documentation languages together. Unsuffixed guides are English; `.es.md` files are Spanish.
- Describe compatibility evidence and unresolved limits in pull requests.

## CI

`.github/workflows/ruffle-validation.yml` runs on pull requests and manual dispatch. Its two jobs validate Compose, Node/Python tests, web/proxy behavior, persistence and mounts, then build backends and exercise startup/recovery.

Documentation-only edits should be checked for local links, section anchors, command consistency and language parity. Existing CI may still run for their pull request.
