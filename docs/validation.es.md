# Validación y compatibilidad

[English](validation.md) · [Español](validation.es.md) · [Documentación](README.es.md)

## Interpretar los resultados

Esta página distingue cobertura automática, integración local registrada y verificación de cada despliegue. Un cargador, eco TCP o vista previa correctos no demuestran un evento completo.

La integración base de la PR #1 superó los dos trabajos de GitHub Actions: validación general y build/arranque de backends. El [workflow registrado](https://github.com/GargonMeilan/wand-fork/actions/runs/43653518711) finalizó correctamente. El commit de documentación asociado era `dfd3bed`; las revisiones posteriores de documentación no son nuevas pruebas de compatibilidad.

## Cobertura automática

| Grupo | Cobertura |
| --- | --- |
| JavaScript | Opciones Legacy/Vanilla, HTTPS/WSS, Nieve, avisos de recarga y lista de jugadores |
| Python | Integridad/estado del catálogo, publicaciones/restauración, revisiones, rutas, permisos, presencia y Websockify |
| Compose | Base, acceso directo, compatibilidad y Dokploy generado |
| Nginx | Dominios, prefijos, host compartido, Flash, CAPTCHA y MIME WASM |
| Proxies | Nginx → Websockify → TCP, destinos fijos, rechazo de origen y POST de registro |
| Datos/montajes | Persistencia PostgreSQL/Redis tras recreación y fuentes ausentes |
| Backends | Builds, arranque en frío, disponibilidad del protocolo y recuperación coordinada |

La revisión del catálogo registró 34 pruebas Python y 12 JavaScript. Los números describen esa revisión; consulta la salida actual para versiones posteriores.

## Integración local registrada

El 13 de noviembre de 2026 se verificaron sesiones reales, manager, configuraciones y entrega de recursos en Docker aislado. La ampliación posterior del catálogo incluyó los 16 paquetes y sus recursos.

Una sesión Chromium/Ruffle autenticó, seleccionó Blizzard y cargó Town de Marvel con música 325. El monitor observó usuarios en varios mundos, movimientos y desconexiones. El estado persistió al recrear Dash.

Consulta [el informe detallado](local-validation.es.md). Son resultados registrados, no una garantía para cualquier instalación o navegador.

## Límites conocidos

| Área | Pendiente |
| --- | --- |
| Card-Jitsu Nieve | Corregir contexto/sockets no certifica una partida completa |
| Card-Jitsu Agua | Problema comunicado sin diagnosticar |
| Eventos históricos | Recursos comprobados; poderes, transformaciones, tareas, recompensas y compras sin certificar por completo |
| Activación | Una URL heredada devolvió 404; las cuentas ya estaban activas |
| Membresía | Una URL histórica omitió el puerto local no estándar |
| Autocompletado social | Preflight sin respuesta CORS válida |
| CAPTCHA | Claves reales y flujo completo necesitan comprobación por instalación |
| Navegadores | Chromium no certifica Firefox/Edge ni todos los módulos AS2/AS3 |
| Alojamiento público | TLS, certificados, Traefik y dominios fuera de la prueba HTTP local |

Las peticiones observadas fueron `/social/autocomplete/v2/search/clientRules`, `/play//web_service/activate_player.php` y `/web-service/membership`. No impidieron la sesión registrada ni se ocultaron con respuestas ficticias.

## Verificación después del despliegue

Comprueba creación/activación si corresponde, autenticación, mundos, salas, audio, reconexión y moderación. Revisa errores y conexiones WS/WSS. Verifica persistencia con una recreación controlada y los navegadores previstos.

Consulta [desarrollo](development.es.md) para comandos y [despliegue](ruffle.es.md) para comprobaciones operativas. Vincula las afirmaciones de soporte a resultados verificables.
