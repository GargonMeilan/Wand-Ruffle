# Desarrollo y verificación

[English](development.md) · [Español](development.es.md) · [Documentación](README.es.md)

## Entorno de trabajo

La aplicación usa submódulos y dependencias fijadas. Las comprobaciones locales necesitan Python, Node.js y Docker; CI utiliza Python 3.12 y Node 22.16.0.

Inicializa submódulos para pruebas que necesiten medios/backend. Guarda dependencias e informes en `.validation/`, ignorado por Git. Utiliza un entorno virtual Python.

~~~sh
python -m venv .validation/venv
~~~

Actívalo con `source .validation/venv/bin/activate` en POSIX o `.validation\venv\Scripts\Activate.ps1` en PowerShell. Después:

~~~sh
python -m pip install -r websocket/requirements.txt websocket-client==1.9.0 PyYAML==6.0.3
~~~

Los fixtures de plantillas/navegador necesitan además Jinja2. Las dependencias del backend se instalan en sus builds Docker.

## Pruebas unitarias e integridad

~~~sh
node --test tests/legacy-player.test.cjs tests/vanilla-player.test.cjs tests/world-notice.test.cjs tests/online-panel.test.cjs
python -m unittest discover -s tests -p 'test_*.py' -v
python scripts/import-event-catalog.py --verify
python scripts/audit-events.py --check
python scripts/generate-dokploy-compose.py --check
git diff --check
~~~

Las pruebas WebSocket requieren `websocket-client`. Si el import resuelve al directorio `websocket/` sin `create_connection`, normalmente falta la dependencia en el Python seleccionado.

## Compose y Docker

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

La comprobación shell necesita POSIX, por ejemplo Linux/WSL. Los scripts crean recursos aislados; revísalos antes de ejecutarlos. No son instrucciones para actuar sobre una instalación de producción.

La prueba de backend cubre arranque en frío, recuperación al recrear una base temporal y arranque coordinado de mundos detenidos.

## Navegador

Instala runtime y herramientas:

~~~sh
npm --prefix web/ruffle ci --ignore-scripts --no-audit --no-fund
npm install --prefix .validation playwright@1.56.1
~~~

Para los scripts originales en POSIX:

~~~sh
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node .validation/node_modules/playwright/cli.js install chromium
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node tests/browser-smoke.cjs
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node tests/vanilla-browser-smoke.cjs
PLAYWRIGHT_BROWSERS_PATH=.validation/browsers node tests/snow-browser-smoke.cjs
~~~

En PowerShell utiliza `$env:PLAYWRIGHT_BROWSERS_PATH='.validation/browsers'` antes de Node en lugar del prefijo POSIX.

Algunos fixtures de catálogo/stack local incluyen rutas Chromium de Windows. Revisa `tests/catalog-browser-smoke.cjs` y el informe local antes de utilizarlos en otra plataforma. No todos los scripts son portables.

Los fixtures de arranque/transporte no sustituyen una sesión autenticada. Consulta [el informe local](local-validation.es.md) para el entorno completo aislado.

## Archivos generados y alcance

- Edita `docker-compose.yml` y ejecuta `python scripts/generate-dokploy-compose.py`.
- Verifica los recursos fijados con la herramienta del catálogo; reparar utiliza red explícitamente.
- Mantén adaptadores, plantillas Nginx y `world_manager` en este repositorio.
- Cambia commits de submódulos intencionalmente; no mezcles medios generados con fuentes originales.
- Actualiza los dos idiomas. Las guías sin sufijo están en inglés y `.es.md` en español.
- Describe evidencias de compatibilidad y límites pendientes en las PR.

## CI

`.github/workflows/ruffle-validation.yml` se ejecuta en PR y manualmente. Dos trabajos validan Compose, Node/Python, web/proxy, persistencia y montajes, y compilan/prueban el arranque de backends.

Para documentación comprueba enlaces, anclas, coherencia de comandos y paridad de idiomas. El CI existente puede ejecutarse igualmente.
