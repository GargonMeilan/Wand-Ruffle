# Catálogo de recursos históricos

[English](event-catalogue.md) · [Español](event-catalogue.es.md) · [Documentación](README.es.md)

## Contenido incluido

La instalación contiene 16 paquetes de 2012, 307 variantes y 76 referencias complementarias. El manifiesto referencia 381 SWF únicos, aproximadamente 63 MiB. Town tiene 13 variantes históricas además del diseño original.

Los archivos están incluidos. No es necesario subirlos ni descargarlos al arrancar.

| Paquetes |
| --- |
| Underwater Expedition |
| Fashion Show |
| Rockhopper's Quest |
| Puffle Party |
| April Fools' Party |
| Easter Egg Hunt |
| Earth Day |
| Medieval Party |
| Marvel Super Hero Takeover |
| Ultimate Jam |
| Adventure Party: Temple of Fruit |
| The Fair |
| Halloween |
| 7th Anniversary |
| Operation: Blackout |
| Holiday Party |

## Utilizar la biblioteca

Abre **Rooms & events** para seleccionar una sala y previsualizar variantes. Utiliza **Event library** para activar un paquete o **Apply room design** para una variante. Consulta [administración](events.es.md).

Cada paquete identifica salas recuperadas, archivos complementarios y contenido pendiente. Las salas no recuperadas de otras ediciones no aparecen como variantes disponibles.

Los catálogos recuperados están en inglés y utilizan inventario/paquetes de compra existentes. Activar el paquete no demuestra que funcionen todas las compras históricas.

## Recursos y eventos completos

Los paquetes están marcados **Resource package**. Sustituyen los archivos enumerados; ninguno está certificado como implementación completa de todas sus mecánicas.

Poderes, transformaciones, objetivos, recompensas, módulos y opciones generales pueden necesitar desarrollo y pruebas adicionales. **Included content & limitations** explica los pendientes de cada paquete.

Activar sustituye las selecciones anteriores. Restaurar todo devuelve la configuración original. Los jugadores deben recargar el juego para recibir la configuración nueva.

## Procedencia y licencias

Los archivos se recuperaron del archivo público Waddle Forever, commit `02a9df8be1f33d570690d8a59a726a9bcc9d34df`. El manifiesto registra URLs, revisión, tamaños y hashes Git/SHA-256.

Consulta `world_manager/catalog/manifest.json`, [el aviso original](../world_manager/catalog/UPSTREAM-LICENSE.txt) y [el de Dash](../world_manager/DASH-LICENSE.md). Los recursos originales pertenecen a sus titulares. La licencia MIT de los metadatos no transfiere derechos sobre ilustraciones ni SWF.

## Comprobar integridad

~~~sh
python scripts/import-event-catalog.py --verify
~~~

Comprueba hashes, tamaños y cabeceras sin red. Si falta un archivo o está dañado, `--repair` lo recupera de la URL fijada. No sigue una rama móvil del origen.

## Inventario técnico de eventos

`scripts/audit-events.py` examina aliases históricos y clases incrustadas en los SWF originales. La auditoría registrada cubre 169 SWF y 27 grupos de referencias/módulos.

No son 27 eventos completos. Los aliases pueden apuntar a nombres reutilizados y las clases no demuestran que una decoración o mecánica esté activa.

~~~sh
python scripts/audit-events.py --check
~~~

## Validación

Las pruebas cubren disponibilidad inicial, integridad, activación, persistencia, restauración y rechazo de mapas incompletos. La integración local comprobó la entrega de todas las salas/recursos por Nginx. Una sesión autenticada de Ruffle cargó Town de Marvel y música 325.

Siguen sin verificar las compras históricas, los recorridos completos y todas las mecánicas. Consulta [el informe local](local-validation.es.md).
