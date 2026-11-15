# Informe de integración local · 13 de noviembre de 2026

[English](local-validation.md) · [Español](local-validation.es.md) · [Documentación](README.es.md)

## Entorno de prueba

La ejecución registrada construyó un entorno aislado desde `docker-compose.dokploy.yml`: PostgreSQL, Redis, login y cuatro mundos Houdini, Dash, Nginx, Websockify y Snowflake.

Utilizó credenciales de prueba, un puerto ligado a `127.0.0.1` y volúmenes desechables únicos. No accedió a Dokploy ni a datos existentes. Este informe describe una ejecución anterior; editarlo no vuelve a ejecutar pruebas.

## Catálogo y manager unificado

La ampliación superó 34 pruebas Python y 12 JavaScript, verificación de 377 archivos y navegador headless con 16 eventos, 13 diseños de Town y cero publicaciones al previsualizar. Se inspeccionaron Marvel/Halloween y el diseño a 390 px.

La integración comprobó:

- Activación de los 16 paquetes y entrega de 303 variantes y 76 referencias por Nginx con hashes coincidentes.
- Persistencia al recrear Dash, restauración JSON/ZIP, CSRF y permisos.
- Dos jugadores autenticados en mundos distintos, movimientos, desconexiones y caducidad/recuperación.
- Vistas previas autenticadas, jugadores, ficha, nombres, contraseña y correo con navegación común e interfaz inglesa.
- Login real Ruffle, Blizzard, Town de Marvel y música 325. Sin fallos inesperados de JavaScript/recursos aparte de los heredados.
- Cinco configuraciones Nginx: dominios, subrutas, host compartido, Flash y CAPTCHA.

Verifica la entrega de recursos y esa sesión. No certifica compras, recorridos por todas las salas ni mecánicas completas.

## Integración anterior

La versión anterior de salas/monitor registró 28 pruebas Python y 12 JavaScript, además de:

- Arranque de los once servicios y handshakes Houdini correctos.
- Acceso de moderador, rechazo sin permisos/sesión y recursos CSS/JavaScript.
- Música, subidas, entrega por hash, paquetes y rechazo de tokens incorrectos.
- JSON, JSONP y `game_configs.bin` efectivos; conservación de otros miembros y restauración exacta del ZIP.
- Estado y subidas persistentes al recrear Dash.
- Sesiones por Nginx/Websockify/Houdini en Blizzard/Glaciar, movimientos y retirada al salir.
- Caducidad de Yeti, diferencia entre cero jugadores/datos no disponibles y recuperación.
- Login y sala Vanilla/Ruffle, con copia de Town seleccionada y música 9 recibidas con HTTP 200. Era una prueba del mecanismo, no una decoración histórica nueva.
- Persistencia de datos de prueba PostgreSQL/Redis.
- Arranque en frío, recuperación tras recrear la base temporal y arranque de mundos detenidos con una operación Compose.

## Correcciones detectadas

1. Sanic añadía doble barra en rutas estáticas; se corrigieron recursos de ampliación/manager sin editar el submódulo.
2. El login intentaba CAPTCHA sin claves; la plantilla lo carga solo si está configurado y conserva validación backend.
3. El cliente consumía `game_configs.bin` además de JSON; ahora se modifica también.
4. Se añadió disponibilidad HTTP de Dash y web espera su estado healthy.

## Límites heredados observados

| Petición | Resultado |
| --- | --- |
| `/social/autocomplete/v2/search/clientRules` | Preflight inválido/ausente y bloqueo CORS |
| `/play//web_service/activate_player.php` | HTTP 404; cuentas ya activadas |
| `/web-service/membership` | URL histórica sin puerto local no estándar |

No impidieron la sesión ni se ocultaron con respuestas ficticias. Activación, membresía, autocompletado, todos los minijuegos y eventos completos no están certificados.

Snowflake arrancó, pero no se jugó una partida completa de Nieve. Se utilizó HTTP local; HTTPS, certificados, Traefik y dominios públicos necesitan verificación posterior.

## Reproducir el entorno aislado en Windows

Con Docker Desktop, submódulos, dependencias Python y Playwright/Chromium de [desarrollo](development.es.md):

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

`prepare` crea `.validation/local-stack/compose.json` reutilizable. `down` elimina solo recursos registrados de ese proyecto aislado. Las pruebas que usan sus cuentas o modifican salas se ejecutan en secuencia.

Informes y capturas están en `.validation/local-stack/`, ignorados por Git: `integration-results.json`, `browser-report.json` y capturas del manager/cliente. Estos artefactos locales no se distribuyen como archivos del repositorio.

Consulta [los límites de validación](validation.es.md).
