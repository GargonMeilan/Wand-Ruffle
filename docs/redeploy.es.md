# Actualizaciones, copias y recuperación

[English](redeploy.md) · [Español](redeploy.es.md) · [Documentación](README.es.md)

## Conservar la identidad del despliegue

Utiliza la aplicación existente, nombre del proyecto Compose, credenciales y volúmenes. Los nombres derivan de `COMPOSE_PROJECT_NAME`, con `wand` como alternativa.

| Almacenamiento | Conservar |
| --- | --- |
| PostgreSQL | Copia de base de datos y montaje `postgres_data` |
| Redis | Montaje `redis_data` y política de persistencia |
| Manager | Todo `world_data`: SQLite y `assets/` |
| Configuración | Variables, rama, dominios y argumentos de proyecto |

Haz una copia coherente de base de datos/estado antes de cambiar. No ejecutes `down -v` ni selecciones Fresh Volumes o elimines la aplicación para actualizar.

## Migración desde montajes antiguos

Las versiones anteriores guardaban PostgreSQL/Redis en `./.data` y `./.redis`. La configuración actual utiliza volúmenes fuera del checkout.

Cambiar el Compose no copia esos directorios. Una instalación con cuentas/progreso necesita backup y migración separados con los servicios pertinentes detenidos. Conserva los datos anteriores hasta verificar la migración.

Volver a código antiguo no debe recuperar accidentalmente montajes relativos al checkout.

## Actualización habitual

1. Revisa cambios y límites.
2. Copia los datos y registra proyecto/volúmenes.
3. Obtén la rama e inicializa sus submódulos fijados.
4. Valida Compose.
5. Compila y recrea todo el entorno con el mismo proyecto/variables.
6. Comprueba salud, cuentas, salas, estado del manager y presencia.

Para un checkout gestionado directamente con el archivo de acceso directo:

~~~sh
git pull --ff-only
git submodule update --init --recursive
docker compose -f docker-compose.yml -f docker-compose.direct.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.direct.yml up -d --build --force-recreate --wait --wait-timeout 180
~~~

Recrea servicios y puede interrumpir sesiones. Utiliza solo los archivos de esa instalación; no añadas puertos directos a Dokploy.

## Sustitución del checkout en Dokploy

Los backends montan fuentes. Si Dokploy sustituye el checkout, los contenedores reutilizados pueden seguir vinculados al montaje anterior.

Tras asegurar la persistencia externa, utiliza el comando Compose normal de Dokploy añadiendo `--force-recreate --wait --wait-timeout 180` a `up`. Conserva proyecto, env-file y Compose Path. Command recibe argumentos Docker, no un hook shell arbitrario.

Para contenedores con montajes antiguos, detén una vez la aplicación antes de reclonar/desplegar. Desactiva Auto Deploy y cancela despliegues en cola durante esa recuperación. No borres aplicación ni volúmenes.

Los montajes actuales usan `create_host_path: false` para fallar si faltan fuentes en lugar de crear carpetas que bloqueen Git. Un comando posterior al clon no repara un fallo de clonación anterior.

## Arranque y recuperación

Login espera PostgreSQL/Redis healthy. Los mundos esperan también login. Dash, Snowflake, web y sus dependencias se coordinan en Compose. Houdini debe responder `apiOK`.

`depends_on.restart: true` propaga actualizaciones/reinicios explícitos de Compose. `restart: always` reinicia procesos terminados, no procesos vivos unhealthy.

Utiliza **General → Deploy** para toda la operación. Reiniciar un contenedor no reanuda un despliegue Compose abortado. Revisa logs y dependencia fallida antes de reintentar.

## Reversión y ramas

Registra la revisión anterior. Revierte código manteniendo proyecto/volúmenes y comprueba que la versión anterior puede leer el estado. Seleccionar `flash` solo cambia la incrustación, no el almacenamiento.

`master` integra los cambios. Conserva `feature/ruffle-support` si el servidor de pruebas la utiliza. Un merge no cambia la rama en Dokploy ni lleva automáticamente commits posteriores a esa rama.

Consulta [despliegue](ruffle.es.md) y [validación](validation.es.md).
