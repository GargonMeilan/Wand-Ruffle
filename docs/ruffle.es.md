# Despliegue y configuración

[English](ruffle.md) · [Español](ruffle.es.md) · [Documentación](README.es.md)

## Elegir la configuración Compose

| Archivo | Uso |
| --- | --- |
| `docker-compose.yml` | Configuración fuente; red interna, sin puertos publicados |
| `docker-compose.dokploy.yml` | Archivo completo generado para Dokploy |
| `docker-compose.direct.yml` | Archivo adicional para publicar los puertos originales |
| `docker-compose.ruffle-only.yml` | Compatibilidad con revisiones anteriores; ya no es necesario para retirar puertos |

Utiliza Compose v2 y valida la configuración. El YAML usa intervalos de inicio de healthchecks, propagación de reinicios y `create_host_path: false`.

## Obtener las fuentes

~~~sh
git clone --recurse-submodules https://github.com/GargonMeilan/wand-ruffle.git
cd wand-ruffle
docker compose version
~~~

Los submódulos incluyen backend y repositorios de medios grandes. Necesitas acceso a GitHub y a los hosts de `.gitmodules`. No utilices el instalador heredado: todavía clona Wand original.

## Configurar el entorno

Edita el `.env` incluido. Este ejemplo es parcial; conserva las demás opciones necesarias del archivo:

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

Sustituye dominios y contraseña. Configura `GAME_ADDRESS` y `SNOWFLAKE_HOST` para tu instalación y conserva los puertos de login/Nieve salvo cambio intencional. Las direcciones anunciadas deben coincidir con el mapa de sockets. El navegador sigue usando el endpoint WS/WSS del juego.

Utiliza URLs sin barra final. Las plantillas admiten prefijos, pero juego y medios deben tener prefijos diferentes si comparten host; sigue las plantillas Nginx para esa distribución. Los dominios separados del ejemplo facilitan la configuración inicial.

Si la página usa HTTPS, todos los medios deben usar HTTPS. Los vhosts permiten el origen configurado, no un comodín. No desactives la validación de origen para resolver un error de rutas.

### Cuentas, correo y CAPTCHA

Configura `WEB_RECAPTCHA_SITE` y `WEB_RECAPTCHA_SECRET` juntas si utilizas CAPTCHA. Déjalas vacías para desactivar la integración opcional.

`EMAIL_METHOD` selecciona el modo SMTP/SendGrid; las opciones `EMAIL_*` proporcionan credenciales y remitente. La configuración heredada indica que dejar `EMAIL_METHOD` vacío desactiva la activación por correo y activa las cuentas al registrarlas. Verifica el flujo real de tu instalación: hay endpoints heredados de activación que no se han validado por completo.

El administrador requiere una cuenta moderadora. La ampliación no la crea automáticamente.

## Dokploy

1. Crea o conserva una aplicación **Docker Compose** para este repositorio. Selecciona la rama y activa **Git submodules**.
2. Establece **Compose Path** en `docker-compose.dokploy.yml`. No lo combines con el archivo de acceso directo.
3. Si actualizas, conserva nombre de proyecto, credenciales y montajes.
4. Introduce las variables y configura DNS de cada host público.
5. En **Domains**, dirige cada host completo al servicio **web**, puerto **80**, ruta `/`, con HTTPS. No elimines prefijos ni publiques puertos Websockify/Houdini.
6. Revisa la configuración generada: web debe compartir la red interna `wand` con los backends y la red de proxy de Dokploy.
7. Despliega toda la aplicación con build.

Si se sustituye el checkout de una instalación existente, aplica la recreación de contenedores de [actualización y recuperación](redeploy.es.md). Conserva los argumentos de proyecto/env-file de Dokploy al ajustar el comando. No pegues `sh scripts/prepare-sources.sh` en un campo que espera argumentos Docker.

El archivo Dokploy se genera desde el base. Para modificarlo:

~~~sh
python scripts/generate-dokploy-compose.py
python scripts/generate-dokploy-compose.py --check
~~~

El generador necesita PyYAML 6.0.3.

## Acceso directo

Configura la resolución de los hosts de juego/medios hacia el servidor. Después:

~~~sh
docker compose -f docker-compose.yml -f docker-compose.direct.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.direct.yml up -d --build
~~~

El archivo publica web, Houdini, Snowflake y servicios de datos; revisa `docker-compose.direct.yml` antes de utilizarlo en un host público. No configura TLS. El archivo base por sí solo no expone el juego al host.

## Datos persistentes

| Volumen | Datos |
| --- | --- |
| `${COMPOSE_PROJECT_NAME:-wand}_postgres_data` | PostgreSQL |
| `${COMPOSE_PROJECT_NAME:-wand}_redis_data` | Redis |
| `${COMPOSE_PROJECT_NAME:-wand}_world_data` | Estado SQLite y diseños subidos |

Mantén el nombre de proyecto. Cambiar desde `./.data` o `./.redis` utiliza los volúmenes seleccionados, pero no migra los datos antiguos. Haz backup y migración antes de cambiar una instalación existente. No borres datos para actualizar.

## Verificar el despliegue

- Comprueba `docker compose ps` y logs con el mismo proyecto y archivos del despliegue.
- Abre ambos juegos y confirma la carga local de JavaScript/WASM de Ruffle.
- Comprueba registro/login, selección de mundo y entrada a sala.
- Revisa las conexiones WS/WSS de login y mundo: deben obtener HTTP 101.
- Accede como moderador, previsualiza y realiza una publicación intencional.
- Verifica la lista de jugadores y la persistencia tras una recreación controlada.

La pantalla inicial no demuestra autenticación, entrada a mundo ni funcionamiento de todos los minijuegos.

## Solución de problemas

| Síntoma | Comprobación |
| --- | --- |
| Faltan fuentes en el build | Inicialización de submódulos y acceso a repositorios |
| Ruffle no carga | Peticiones JS/WASM de `/__wand/ruffle/` y reconstrucción de web |
| CORS o contenido mixto | URLs públicas, HTTPS y origen exacto |
| WebSocket 403 | Origen solicitado frente a URL de juego configurada |
| WebSocket 502 | Red interna, Websockify y disponibilidad del destino |
| Falta proxy de socket | Host/puerto anunciado frente a mapa Ruffle y `servers.xml` |
| Login correcto, mundo falla | Ruta, ID/idioma/puerto y logs Houdini |
| No cambian las salas | Recargar cliente, revisar JSON/ZIP y revisión publicada |

## Alternativa Flash

Selecciona `flash` en la variable del cliente y recrea web. Recupera la incrustación anterior y requiere un cliente compatible. Los clientes TCP externos también necesitan puertos explícitos; Dokploy no los publica. Este ajuste no revierte el almacenamiento.

Consulta [arquitectura](architecture.es.md), [Vanilla](vanilla.es.md) y [validación](validation.es.md).
