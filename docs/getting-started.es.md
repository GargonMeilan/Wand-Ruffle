# Wand con Ruffle y panel de administración

Este fork adapta Wand para ejecutar Club Penguin Legacy (AS2) y Vanilla (AS3)
en navegadores modernos mediante Ruffle, sin instalar el complemento Flash.
Incluye el runtime en el servidor y conecta el navegador con Houdini mediante
un puente WebSocket/TCP interno. Mantiene Dash, Houdini, Snowflake y los medios
originales como submódulos; las ampliaciones viven fuera de ellos.

## Instalar el fork

Necesitas Git, Docker y Docker Compose, además de espacio para los submódulos
de medios y sus historiales, que ocupan varios GB. En Windows puedes usar WSL.
Clona este repositorio, ya que el instalador heredado `install.sh` todavía
descarga `solero/wand` y no instala las ampliaciones de este fork:

```sh
git clone --recurse-submodules https://github.com/GargonMeilan/wand-fork.git
cd wand-fork
```

Edita `.env` con las credenciales, dirección del juego y URLs de tu instalación.
Los dos reproductores usan Ruffle por defecto:

```dotenv
LEGACY_PLAYER=ruffle
VANILLA_PLAYER=ruffle
WEB_LEGACY_PLAY=https://old.example.com
WEB_LEGACY_MEDIA=https://legacy.example.com
WEB_VANILLA_PLAY=https://play.example.com
WEB_VANILLA_MEDIA=https://media.example.com
```

Sustituye los dominios de ejemplo por los tuyos. Si el juego usa HTTPS, sus
medios también deben usar HTTPS. El navegador descarga Ruffle desde el propio
servidor; las conexiones del juego usan WSS en el dominio de juego.

### Dokploy

Selecciona `docker-compose.dokploy.yml`, activa **Enable Submodules** y configura
los dominios de juego y medios hacia el servicio `web`, puerto interno `80`.
El Compose no publica puertos del host por defecto. Sigue la
[guía de Ruffle y Dokploy](ruffle.md) para DNS, certificados, variables y proxy,
y la [guía de redespliegue](redeploy.md) para recrear los servicios correctamente.

PostgreSQL, Redis y la configuración de salas usan volúmenes persistentes.
Conserva el nombre del proyecto Compose y los volúmenes al actualizar. Una
instalación anterior que guardaba datos en `./.data` o `./.redis` necesita una
migración previa si quieres conservar sus cuentas: el cambio no migra esos datos.

### Acceso directo sin Dokploy

Desde un entorno con Docker y los dominios configurados para resolver hacia
tu servidor, añade el archivo que publica los puertos originales:

```sh
docker compose -f docker-compose.yml -f docker-compose.direct.yml up -d --build
```

Abre la URL de `WEB_LEGACY_PLAY` o `WEB_VANILLA_PLAY`. Para volver a la
incrustación Flash anterior puedes seleccionar `flash` en la variable del
reproductor correspondiente y recrear `web`; esto requiere un cliente compatible.

## Nuevo menú de administración

Abre `/manager` en un dominio de juego configurado y accede con una cuenta
moderadora. El panel está en inglés y comparte navegación y estilo entre sus
páginas. No se crea una cuenta administradora por instalar esta ampliación.

| Menú | Qué permite hacer |
| --- | --- |
| **Overview** | Abrir las secciones principales y consultar tus accesos recientes |
| **Rooms & events** | Gestionar diseños, música y paquetes de recursos de Vanilla |
| **Online players** | Consultar jugadores conectados, servidor y ubicación |
| **Players** | Acceder a la gestión y moderación de cuentas existente |
| **Username review** | Revisar nombres de usuario pendientes |
| **Account** | Cambiar tu contraseña o correo y cerrar sesión |

### Cambiar decoración y música

1. En **Rooms & events**, selecciona una sala y pulsa **Open**.
2. Elige un diseño en **Design** y pulsa **Load preview** para verlo con Ruffle.
   La vista previa no publica cambios ni abre una sesión de jugador.
3. Selecciona el ID de música disponible, o `0` para silencio.
4. Pulsa **Apply room design** para publicar. **Restore room** restaura esa sala.

La biblioteca preinstalada incluye **16 eventos de 2012, 303 variantes de salas
y 76 referencias a recursos complementarios**. Desde **Event library** puedes
aplicar un paquete completo de recursos: sustituye las selecciones anteriores
y devuelve al original las salas no incluidas en ese paquete. También puedes
subir diseños propios; la subida no los activa hasta que pulses aplicar.

Los cambios se guardan en el volumen `world_data`, sin editar los originales.
El cliente conserva recursos en memoria: las páginas comprueban la revisión
cada 15 segundos y ofrecen recargar el juego cuando cambia. Recargar vuelve al
login; no se expulsa automáticamente a los jugadores. Las publicaciones
simultáneas de moderadores se protegen con revisiones para evitar sobrescrituras.

Esta gestión de decoraciones se aplica a **Vanilla**. Los paquetes históricos
incluyen las salas y recursos enumerados, pero no activan automáticamente las
misiones, poderes, transformaciones o recompensas de una fiesta completa.
Consulta [salas y eventos](events.md) y [biblioteca y vistas previas](event-catalogue.md).

### Consultar jugadores conectados

En **Online players** puedes buscar por nombre, ID o localización y filtrar por
servidor. La tabla muestra el usuario, servidor, sala, cliente Legacy/Vanilla y
tiempo conectado; en iglús y patios indica el propietario. Se actualiza cada
cinco segundos y distingue un mundo vacío de otro sin datos recientes.

Son instantáneas con un retraso habitual de hasta diez segundos. No se guarda
un historial de movimientos ni se muestra la ubicación interna de una partida
de Snowflake. Consulta [monitorización de jugadores](online.md).

## Cambios técnicos y límites

Se corrigieron rutas de registro, carga de medios, el healthcheck de Redis y la
coordinación de arranque de los servicios. Los montajes de fuentes ya no crean
carpetas ausentes que puedan interferir con la clonación de submódulos.
Card-Jitsu Nieve tiene una ruta WebSocket propia y una corrección de parámetros
para su contexto de conexión; no se ha validado una partida completa.

Las pruebas documentadas incluyen sesiones reales en local, entrada a salas,
cambios de diseño/música, seguimiento de jugadores y persistencia al recrear
contenedores. Ruffle no garantiza compatibilidad con todos los módulos Flash.
Quedan límites heredados en activación, membresía, funciones sociales y
minijuegos. HTTPS, Traefik y los dominios reales requieren una comprobación
posterior al despliegue. Consulta la [integración Vanilla](vanilla.md) y la
[validación local](local-validation.md) para conocer los resultados y pendientes.

## Rama del servidor de pruebas

`feature/ruffle-support` se conserva como rama de despliegue del servidor de
pruebas. Fusionar sus cambios en la rama principal no cambia por sí solo la
rama seleccionada en Dokploy. Mantén esa selección si quieres seguir probando
desde ella; los siguientes cambios publicados en la rama principal no llegan
automáticamente a la rama de pruebas.
