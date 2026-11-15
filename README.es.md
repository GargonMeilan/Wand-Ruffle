# Wand · Ruffle Edition

**Club Penguin Legacy y Vanilla en el navegador, con Docker Compose, Ruffle y un panel ampliado de administración.**

[English](README.md) · [Español](README.es.md) · [Documentación](docs/README.es.md)

Wand reúne el servidor de juego, los servicios de cuentas, los medios y la infraestructura para operar un servidor de Club Penguin. Este fork amplía [Wand de Solero](https://github.com/solero/wand) con un runtime Ruffle local para utilizar los clientes existentes sin instalar el complemento Flash.

También permite a los moderadores previsualizar y publicar diseños de Vanilla, aplicar recursos históricos y consultar jugadores conectados. El backend y los medios siguen siendo submódulos originales; los adaptadores y las ampliaciones de administración viven en este repositorio.

> **Estado del proyecto:** se han verificado sesiones autenticadas de Vanilla, cambios de salas y monitorización en local. La compatibilidad con Ruffle es parcial. Los paquetes contienen recursos recuperados, no todas las mecánicas de cada evento.

## Contenido

[Funciones](#qué-cambia-en-este-fork) · [Arquitectura](#arquitectura) · [Instalación](#instalación) · [Configuración](#configuración) · [Administración](#administración) · [Eventos](#biblioteca-de-eventos-históricos) · [Actualizaciones](#actualizaciones-y-datos-persistentes) · [Compatibilidad](#compatibilidad-y-validación) · [Desarrollo](#desarrollo-y-contribuciones)

## Qué cambia en este fork

| Área | Base original | Aportaciones del fork |
| --- | --- | --- |
| Clientes | Clientes Flash Legacy AS2 y Vanilla AS3 | Ruffle 0.7.1 local, parámetros originales y alternativa Flash |
| Conexiones | Servicios TCP Houdini y Snowflake | Websockify 0.13.0 interno, rutas WebSocket y comprobaciones de origen/destino |
| Administración | Cuentas y moderación de Dash | Menú unificado, diseños, música, vistas previas, paquetes y monitorización |
| Eventos | Medios fijados mediante submódulos | 16 paquetes de 2012, 303 variantes y 76 referencias complementarias |
| Despliegue | Entorno Docker Compose | Configuración Dokploy, puertos opcionales, volúmenes estables y disponibilidad coordinada |
| Verificación | Componentes existentes | Pruebas de clientes, administrador, proxies, persistencia y arranque |

También se corrigen registro, medios de Vanilla, parámetros de Nieve, healthchecks de Redis y montajes durante la clonación. Consulta [arquitectura y alcance](docs/architecture.es.md).

## Arquitectura

~~~text
Navegador
  ├─ HTTP(S) ──> Nginx ──> Ruffle, páginas y medios
  │                 └────> Dash + world_manager
  └─ WS(S) ───> Nginx ──> Websockify ── TCP ──> Houdini / Snowflake
                                                   │
                                             PostgreSQL + Redis
~~~

En Dokploy, Traefik termina HTTPS/WSS y reenvía a `web:80`. Las selecciones y subidas usan el volumen persistente `world_data`.

| Componente | Responsabilidad |
| --- | --- |
| Houdini | Login y cuatro mundos: Blizzard, Glaciar, Avalanche y Yeti |
| Dash | Registro, servicios de cuentas y administración para moderadores |
| Snowflake | Backend de Card-Jitsu Nieve |
| Nginx / web | Páginas, medios, Ruffle y enrutamiento HTTP/WebSocket |
| Websockify | WebSockets del navegador a destinos TCP internos fijos |
| PostgreSQL / Redis | Datos del juego y cuentas, caché e instantáneas temporales |
| world_manager | Ampliación para selecciones persistentes y monitorización |

## Instalación

### Requisitos

- Git con acceso a los repositorios de los submódulos.
- Docker Engine y Docker Compose v2 compatibles con los campos utilizados, incluidos los intervalos de inicio de healthchecks y la propagación de reinicios.
- Espacio para medios, historiales, imágenes y datos. Los historiales de medios ocupan varios GB.
- Para alojamiento público: DNS, URLs configuradas y terminación HTTPS.
- En Windows: Docker Desktop con contenedores Linux; también puede utilizarse WSL.

Python y Node.js se necesitan para desarrollo, no para iniciar los contenedores.

### Clonar y configurar

~~~sh
git clone --recurse-submodules https://github.com/GargonMeilan/wand-fork.git
cd wand-fork
~~~

En un checkout existente, ejecuta `git submodule update --init --recursive`. El `install.sh` heredado todavía clona `solero/wand`; utiliza estas instrucciones para instalar este fork.

Edita el `.env` incluido con contraseña de base de datos, dirección del juego, URLs públicas y ajustes opcionales de correo/CAPTCHA. Los valores localhost son ejemplos, no una configuración pública. Ambos clientes utilizan Ruffle por defecto.

### Desplegar con Dokploy

1. Selecciona este repositorio y la rama de despliegue. Activa **Git submodules**.
2. Establece **Compose Path** en `docker-compose.dokploy.yml`.
3. Introduce las variables de entorno de la instalación.
4. Dirige todos los dominios de juego/medios a **web**, puerto de contenedor **80**, con HTTPS.
5. Despliega todo el entorno y comprueba registro, login, selección de mundo y entrada a sala.

El Compose base y Dokploy no publican puertos del host. No añadas el archivo de acceso directo detrás de Dokploy. Consulta [despliegue y configuración](docs/ruffle.es.md) y [actualización y recuperación](docs/redeploy.es.md).

### Desplegar con acceso directo

Después de configurar `.env` y la resolución de nombres:

~~~sh
docker compose -f docker-compose.yml -f docker-compose.direct.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.direct.yml up -d --build
~~~

El archivo adicional publica los puertos originales de web y backends, incluido PostgreSQL. Revisa los puertos y el firewall antes de exponer la máquina. No configura HTTPS.

Abre `WEB_LEGACY_PLAY` o `WEB_VANILLA_PLAY` para jugar y `/manager` en un dominio del juego para administrar.

## Configuración

| Variable | Propósito |
| --- | --- |
| `LEGACY_PLAYER`, `VANILLA_PLAYER` | `ruffle` por defecto; `flash` selecciona la incrustación anterior |
| `WEB_LEGACY_PLAY`, `WEB_VANILLA_PLAY` | URLs de clientes y orígenes WebSocket permitidos |
| `WEB_LEGACY_MEDIA`, `WEB_VANILLA_MEDIA` | URLs de medios; HTTPS cuando el juego use HTTPS |
| `GAME_ADDRESS`, `GAME_LOGIN_PORT` | Dirección/puerto de login anunciados al cliente |
| `SNOWFLAKE_HOST`, `SNOWFLAKE_PORT` | Dirección/puerto de Nieve asociados al mapa de Ruffle |
| `MEDIA_LOCATION` | Base de medios de Nieve; debe coincidir con `WEB_VANILLA_MEDIA` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | Usuario y contraseña de base de datos |
| `WEB_RECAPTCHA_SITE`, `WEB_RECAPTCHA_SECRET` | Ajustes opcionales de CAPTCHA |
| `EMAIL_METHOD`, `EMAIL_*` | Envío opcional de correo |

El host/puerto solicitado por Ruffle debe coincidir con su mapa de sockets. El navegador utiliza después WS/WSS en el dominio del juego en lugar de conectar directamente al TCP de Houdini. Los comentarios de `.env` describen las demás opciones.

## Administración

Accede a `/manager` con una cuenta moderadora existente. La ampliación no crea un administrador automáticamente. La interfaz está en inglés en las dos ediciones de la documentación.

| Menú | Propósito |
| --- | --- |
| **Overview** | Accesos principales e historial reciente |
| **Rooms & events** | Previsualizar, subir, aplicar y restaurar diseños, música y paquetes de Vanilla |
| **Online players** | Buscar jugadores por mundo, sala, nombre o ID |
| **Players** | Gestión y moderación existentes |
| **Username review** | Revisar nombres pendientes |
| **Account** | Cambiar contraseña/correo o cerrar sesión |

Después de instalar, publicar salas no necesita compilar ni reiniciar y los cambios persisten al recrear contenedores. Los jugadores reciben un aviso de recarga porque el cliente conserva su configuración en memoria. Las vistas previas no publican cambios.

Consulta [salas y eventos](docs/events.es.md), [el catálogo](docs/event-catalogue.es.md) y [jugadores conectados](docs/online.es.md) para los procedimientos y permisos.

## Biblioteca de eventos históricos

El repositorio incluye **16 paquetes de 2012**, **303 diseños de salas** y **76 referencias complementarias**: 377 SWF únicos, aproximadamente 62 MiB. No necesitan subidas manuales ni descargas al arrancar.

Incluye Medieval Party, Marvel Super Hero Takeover, Ultimate Jam, Halloween y Operation: Blackout, entre otros. Cada paquete enumera contenido recuperado y funciones pendientes. Las vistas previas no cambian el mundo activo.

Aplicar un paquete sustituye la configuración seleccionada. No implementa automáticamente poderes, transformaciones, objetivos ni recompensas. Consulta [el catálogo completo](docs/event-catalogue.es.md).

## Actualizaciones y datos persistentes

| Volumen | Contenido |
| --- | --- |
| `<proyecto>_postgres_data` | Base de datos PostgreSQL |
| `<proyecto>_redis_data` | Persistencia de Redis |
| `<proyecto>_world_data` | Selecciones, historial y archivos subidos |

Haz una copia de la base de datos y de todo el volumen del mundo antes de actualizar. Conserva el nombre del proyecto Compose y los montajes. La migración desde `./.data` y `./.redis` **no es automática**; seleccionar volúmenes nuevos no copia las cuentas.

Las fuentes y medios siguen usando montajes de directorios. Sustituir el checkout puede necesitar recrear contenedores. Sigue [el procedimiento](docs/redeploy.es.md); no utilices `down -v` ni volúmenes nuevos para actualizar.

`master` es la rama de integración. `feature/ruffle-support` se conserva para el servidor de pruebas existente. Fusionar en `master` no cambia la rama del servidor ni sincroniza automáticamente los cambios posteriores hacia ella.

## Compatibilidad y validación

| Área | Estado documentado |
| --- | --- |
| Vanilla/Ruffle | Login, selección de mundo y entrada a sala autenticados verificados en local |
| Salas/música | Cambios servidos por Nginx y cargados por el cliente |
| Paquetes históricos | Recursos comprobados; mecánicas incompletas |
| Jugadores conectados | Varios mundos, movimientos, desconexiones y recuperación verificados |
| Entorno Docker | Proxies, persistencia y arranque/recuperación cubiertos |
| Card-Jitsu Nieve | Rutas y regresión de conexión cubiertas; partida completa sin verificar |
| Otras funciones | Activación, membresía, servicios sociales, Agua y todos los minijuegos sin validar por completo |
| Alojamiento público | Dominios, TLS, Traefik y navegadores requieren comprobación por instalación |

Consulta [validación](docs/validation.es.md) y el [informe local](docs/local-validation.es.md). Superar las pruebas no demuestra compatibilidad con todas las funciones de Flash.

## Estructura del repositorio

~~~text
.github/workflows/   Validación en CI
docs/                Guías en inglés y sus versiones *.es.md
templates/           Plantillas de clientes y Nginx
web/ruffle/          Dependencia del runtime y adaptadores
websocket/           Servicio interno Websockify
world_manager/       Ampliación del administrador, estado y catálogo
scripts/             Generación Compose, fuentes y catálogo
tests/               Pruebas unitarias, de integración y navegador
dash/                Submódulo original de cuentas y administración
houdini/             Submódulo del servidor de juego
snowflake/           Submódulo de Card-Jitsu Nieve
legacy-media/        Submódulo de medios Legacy
vanilla-media/       Submódulo de medios Vanilla
~~~

## Desarrollo y contribuciones

Empieza por [la guía de desarrollo](docs/development.es.md). Mantén aquí los cambios de adaptadores, plantillas y ampliaciones salvo actualización intencional de un submódulo. Edita `docker-compose.yml` y regenera Dokploy en lugar de modificar el YAML generado.

Actualiza juntas las versiones inglesa y española cuando cambie un comportamiento. Incluye las comprobaciones y límites relevantes en las PR.

## Créditos y licencias

Basado en Wand, Houdini y Dash de Solero, Snowflake de Lekuruu, Ruffle y Websockify de noVNC. Los recursos históricos se recuperaron de Waddle Forever; su procedencia y hashes figuran en el manifiesto.

El repositorio utiliza [licencia MIT](LICENSE.md). Los submódulos/dependencias conservan sus licencias. Las plantillas Dash mantienen su [aviso de licencia](world_manager/DASH-LICENSE.md) y el catálogo incluye un [aviso de atribución](world_manager/catalog/UPSTREAM-LICENSE.txt).

Club Penguin y sus recursos pertenecen a sus titulares, incluido Disney. La licencia MIT no concede derechos sobre esos recursos. Este es un proyecto comunitario independiente.
