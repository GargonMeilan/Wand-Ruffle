# Arquitectura y alcance del fork

[English](architecture.md) · [Español](architecture.es.md) · [Documentación](README.es.md)

## Componentes originales

Wand es un repositorio de orquestación. Fija Houdini, Dash, Snowflake y los dos árboles de medios mediante submódulos Git. El fork añade adaptadores, plantillas, servicios y envoltorios de arranque; la integración Ruffle/manager no cambia sus fuentes fijadas ni el esquema SQL de Houdini.

| Capa | Fuente | Responsabilidad del fork |
| --- | --- | --- |
| Login/mundos | `houdini/` | Disponibilidad en Compose y arranque con publicación de presencia |
| Cuentas/admin | `dash/` | Registro de la ampliación y plantillas del manager |
| Nieve | `snowflake/` | Rutas de sockets y parámetros del navegador |
| Clientes/medios | `legacy-media/`, `vanilla-media/` | Páginas generadas, rutas y sustituciones de recursos |
| Runtime | `web/ruffle/` | Paquete Ruffle fijado y adaptadores de clientes |
| Puente TCP | `websocket/` | Destinos fijos y validación de origen |
| Gestión del mundo | `world_manager/` | Estado, catálogo, rutas, vistas previas y presencia |

## Arranque del navegador

**Legacy** arranca desde el `boots.swf` original. El adaptador conserva ese flujo, proporciona la base de medios y reescribe el cargador inicial cuando la consulta original del host perdería un prefijo o un puerto no estándar.

**Vanilla** conserva página, scripts y estilos. El adaptador intercepta SWFObject para crear un reproductor Ruffle de `club_penguin.swf` con sus FlashVars, ID, dimensiones y callbacks. Nieve utiliza una incrustación separada con una corrección específica de decodificación. Consulta [la integración Vanilla](vanilla.es.md).

La imagen web instala Ruffle 0.7.1 desde el lockfile y sirve JavaScript/WASM localmente. Los jugadores no descargan el runtime desde un CDN.

## Recorrido de las conexiones

~~~text
Navegador ─ HTTPS/WSS ─ Traefik ─ HTTP/WS ─ web:80
                                           ├─ Dash: cuentas y manager
                                           ├─ páginas, Ruffle y medios
                                           └─ websocket:8080 ─ TCP ─ juego
~~~

Traefik forma parte del entorno Dokploy. El archivo de acceso directo lo omite.

Ruffle asocia un host/puerto exacto a una URL WebSocket del dominio público del juego. Nginx reenvía a Websockify, que selecciona un destino interno fijo en lugar de aceptar una dirección TCP proporcionada por el navegador.

| Sufijo bajo `/__wand/ws/` | Destino interno |
| --- | --- |
| `login` | `houdini_login:GAME_LOGIN_PORT` |
| `blizzard` | `houdini_blizzard:9875` |
| `glaciar` | `houdini_glaciar:9876` |
| `avalanche` | `houdini_avalanche:9877` |
| `yeti` | `houdini_yeti:9878` |
| `snow` | `snowflake:SNOWFLAKE_PORT`, mediante el host Vanilla |

Los orígenes del juego son explícitos. CORS de medios se limita al origen configurado. Las páginas HTTPS necesitan medios HTTPS; WSS utiliza el certificado público del juego.

## Recursos de salas durante la ejecución

La ampliación se registra en Dash mediante `world_manager/boot.py`. Nginx deriva las configuraciones y recursos seleccionados de Vanilla a Dash. No se sobrescriben los medios originales.

Las selecciones se aplican a JSON, JSONP y `game_configs.bin`, el ZIP de configuración del cliente. Los demás miembros del ZIP se conservan; restaurar todo devuelve el paquete original. Los SWF mantienen el directorio de su URL original para resolver dependencias relativas.

Estado y subidas se guardan en `world_data`. Las publicaciones son transaccionales, tienen revisión y registran al moderador. Un formulario antiguo no puede sobrescribir una publicación más reciente.

## Presencia de jugadores

Cada mundo arranca con `world_manager/houdini_boot.py` y publica instantáneas en Redis cada cinco segundos, con caducidad de veinte. El manager consulta cada cinco segundos. Los fallos se reintentan sin detener el mundo; los datos caducados aparecen como no disponibles.

No se añade un historial de movimientos ni se modifican las colecciones de población del juego. No se rastrea la ubicación interna de las partidas Snowflake.

## Límites del despliegue

El Compose base no publica puertos. El archivo Dokploy generado incorpora aliases y volúmenes estables. El archivo opcional de acceso directo recupera las publicaciones al host.

La disponibilidad de Houdini se comprueba con `apiOK`, no solo con un puerto abierto. Los reinicios de dependencias se propagan en operaciones coordinadas de Compose; el estado unhealthy no reinicia por sí solo un proceso que sigue vivo.

Consulta [despliegue](ruffle.es.md), [actualizaciones](redeploy.es.md) y [validación](validation.es.md).
