# Monitorización de jugadores conectados

[English](online.md) · [Español](online.es.md) · [Documentación](README.es.md)

## Acceso

Abre **Online players**, `/manager/online`, con una cuenta moderadora. La página y `/manager/online/data` comprueban sesión y permisos en cada petición. Las respuestas no se guardan en caché.

## Información disponible

La tabla muestra usuario/ID, mundo, sala, cliente (Legacy o Vanilla) y tiempo conectado. Los iglús y patios indican el ID del propietario.

Puedes buscar por nombre, ID o ubicación y filtrar por mundo. Se actualiza cada cinco segundos y permite actualizar manualmente. Si falla la API, elimina las filas antiguas para no mostrarlas como actuales.

No expone IP, correo, claves de acceso ni contraseñas. No conserva un historial persistente de movimientos.

## Actualidad de los datos

| Etapa | Intervalo |
| --- | --- |
| Publicación del mundo en Redis | Cada 5 segundos |
| Actualización del manager | Cada 5 segundos |
| Caducidad de la instantánea | 20 segundos |

El retraso habitual es de hasta diez segundos. Un mundo disponible sin jugadores es distinto de uno sin datos recientes; el panel lo diferencia. Si se detiene abruptamente, su instantánea caduca.

Los fallos de publicación se registran y reintentan sin detener el mundo.

## Cobertura

Incluye Blizzard, Glaciar, Avalanche y Yeti (IDs 3100–3103). Admite movimientos, iglús, patios, minijuegos y desconexiones.

Snowflake no publica ubicaciones internas. Durante Nieve solo se dispone de la ubicación conservada en Houdini.

Si añades un mundo, actualiza `SERVERS` en `world_manager/presence.py` y utiliza el envoltorio de arranque de la ampliación.

## Despliegue y verificación

Recrea Dash y los cuatro mundos después de instalar. No necesita migración del esquema SQL. Consulta [actualizaciones](redeploy.es.md).

Las pruebas cubren caducidad, fallos Redis, cancelación, permisos, filtros y retirada de datos obsoletos. La integración local comprobó dos sesiones en mundos distintos, movimientos, desconexiones y recuperación. Consulta [validación](validation.es.md).
