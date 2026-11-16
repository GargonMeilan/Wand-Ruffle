# Integración Vanilla y Card-Jitsu Nieve

[English](vanilla.md) · [Español](vanilla.es.md) · [Documentación](README.es.md)

## Runtime y arranque

Vanilla utiliza Ruffle 0.7.1 local y el mismo puente Websockify que Legacy. Configura `VANILLA_PLAYER=ruffle`, también predeterminado si falta la variable. `flash` recupera la incrustación anterior.

`web/ruffle/vanilla.js` intercepta detección/incrustación de SWFObject, crea el reproductor de `club_penguin.swf` y conserva FlashVars, dimensiones, ID y callback. Mantiene scripts/estilos y ExternalInterface. No carga `boots.swf` de Legacy.

El cliente lee `environment_data.xml`, módulos world/shell y `servers.xml`. Las URLs y los sockets anunciados deben coincidir con el entorno y las plantillas generadas.

## Servicios web y registro

El host de medios habilita CORS solo para el origen Vanilla configurado. La telemetría antigua de Disney `/datatech/serverlog/v1/json` recibe 204 local; no es una API del juego.

Los enlaces de registro de los cuatro idiomas apuntan a Dash local. `/create_account/create_account.php` de Legacy se deriva a `/create/legacy/` en hosts de juego y medios, conservando POST y cuerpo. No omite términos, reglas ni CAPTCHA.

La prueba verifica rutas/cuerpo con un backend de prueba; no certifica todo el registro real.

## Sockets de Card-Jitsu Nieve

Nieve tiene una incrustación y protocolo separados. Su configuración Ruffle incluye `SNOWFLAKE_HOST` y `SNOWFLAKE_PORT` anunciados por Dash.

La ruta WSS Vanilla `/__wand/ws/snow` conecta al destino fijo `snowflake:SNOWFLAKE_PORT`. No necesita otro puerto TCP público para jugar en navegador.

Reconstruye web/Websockify y regenera páginas al cambiar esta configuración.

## Corrección del contexto de conexión

La página original aplica `encodeURIComponent` a `queryString` al construir FlashVars de SWFObject. Flash lo decodificaba una vez; Ruffle conserva el valor del objeto de parámetros.

Sin adaptación, llegaba un contexto como `battleMode%3D0%26base_asset_url%3D...`. Snowflake lo rechazaba con código 900 y el manejo del error podía provocar Error #1009 y un panel bloqueado.

El adaptador decodifica `queryString` exactamente una vez para `mpProduct=cjsnow`. No modifica el objeto original ni los FlashVars del juego principal.

Las regresiones de protocolo/navegador distinguen el contexto codificado rechazado del formato aceptado. No autentican una partida completa.

## Límites de validación

La integración posterior verificó login, mundo y sala en Vanilla, incluidos diseño histórico y música. Las pruebas iniciales de arranque no representan el último estado de integración.

Una partida completa de Nieve sigue sin verificar. El bloqueo de arranque de Card-Jitsu Agua tiene una [corrección de compatibilidad](validation.es.md); una partida completa sigue pendiente de validar. Llegar al login no garantiza funciones sociales, activación, membresía, CAPTCHA ni todos los minijuegos.

Consulta [validación](validation.es.md), [el informe local](local-validation.es.md) y [desarrollo](development.es.md).
