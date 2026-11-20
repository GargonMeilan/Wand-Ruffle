# Primeros pasos

[English](getting-started.md) · [Español](getting-started.es.md) · [Documentación](README.es.md)

## Antes de instalar

Lee [la presentación](../README.es.md) para conocer aportaciones y límites. Necesitas Git, Docker, Compose v2, acceso a los submódulos y espacio para varios GB de historiales.

## Instalar

~~~sh
git clone --recurse-submodules https://github.com/GargonMeilan/wand-ruffle.git
cd wand-ruffle
~~~

Edita `.env` con credenciales y URLs. Mantén `LEGACY_PLAYER=ruffle` y `VANILLA_PLAYER=ruffle` para el navegador.

En Dokploy, selecciona `docker-compose.dokploy.yml`, activa submódulos y dirige dominios HTTPS a `web:80`. Para acceso directo, utiliza Compose base y `docker-compose.direct.yml` tras configurar la resolución de nombres.

Sigue [despliegue y configuración](ruffle.es.md) para comandos y comprobaciones. Las instalaciones existentes deben seguir [actualizaciones y copias](redeploy.es.md) antes de cambiar almacenamiento.

## Utilizar el servidor

Abre la URL del juego para jugar y `/manager` con una cuenta moderadora existente para administrar.

Consulta [salas](events.es.md) para publicar diseños/música, [el catálogo](event-catalogue.es.md) para paquetes y [jugadores conectados](online.es.md) para monitorización.

## Verificar

Comprueba login, mundo, sala y los flujos de cuentas/minijuegos que necesites. [Validación](validation.es.md) distingue comportamientos comprobados y límites pendientes.
