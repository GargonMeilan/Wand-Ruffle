# Administración de salas y eventos

[English](events.md) · [Español](events.es.md) · [Documentación](README.es.md)

## Acceso y alcance

Abre `/manager` en un dominio del juego y accede con una cuenta moderadora existente. La ampliación comprueba la autorización en cada petición. Las nuevas escrituras del mundo requieren el token de sesión y la revisión del formulario.

La interfaz está en inglés. **Overview** enlaza a **Rooms & events**, **Online players**, **Players** y **Username review**. **Account** contiene contraseña/correo y cierre de sesión. Jugadores y revisión de nombres mantienen las funciones existentes de Dash; el fork unifica su presentación.

La gestión de salas/recursos se aplica a **Vanilla/AS3**. Legacy conserva sus medios.

## Instalación inicial

Despliega la imagen web actualizada, recrea Dash y los cuatro mundos Houdini, y conserva `world_data`. Dash registra la ampliación y lee los medios Vanilla; los mundos publican presencia. Consulta [despliegue](ruffle.es.md) y [actualizaciones](redeploy.es.md).

Después, seleccionar diseños, subir archivos, aplicar paquetes y restaurar salas se realiza durante la ejecución, sin builds ni reinicios.

## Cambiar una sala

1. Abre **Rooms & events**, selecciona una sala y pulsa **Open**.
2. Selecciona una variante en **Design**.
3. Pulsa **Load preview** para verla sin publicar.
4. Elige un ID de música disponible, o `0` para silencio.
5. Pulsa **Apply room design**.
6. Utiliza **Restore room** para retirar la selección de esa sala.

Las variantes históricas proponen su música documentada o silencio cuando no consta. La música procede de los archivos numerados existentes de Vanilla. No se importa música nueva ni se identifican títulos.

## Vistas previas

La vista Ruffle no publica revisiones, modifica el mundo ni abre sesiones de jugador. No recibe credenciales, desactiva acceso JavaScript del SWF y bloquea sus peticiones de red.

Es una vista visual. Botones, minijuegos y scripts pueden depender del motor completo; no pueden certificarse desde la vista previa.

## Aplicar un paquete

En **Event library**, pulsa **Activate [event]**. Aplica salas, música y archivos complementarios en una transacción. Sustituye las selecciones anteriores; las salas no incluidas vuelven al original.

**Restore all original rooms & resources** vacía las selecciones y restaura recursos originales. Cada ficha enumera contenido y límites. Consulta [el catálogo](event-catalogue.es.md).

Seleccionar una variante histórica individual también activa sus recursos complementarios. Si mezclas eventos, los recursos compartidos corresponden al último seleccionado. Aplica el paquete completo para mantener un conjunto coherente.

## Subir diseños propios

Abre **Upload custom designs**, elige un SWF compatible e indica nombre de diseño, paquete y música. Subir registra el archivo; no lo activa.

Se admiten SWF FWS/CWS de hasta 16 MiB, con límite descomprimido de 64 MiB. Validar la cabecera no demuestra compatibilidad. Salidas, coordenadas, símbolos y dependencias deben coincidir con la sala/cliente. La decoración está incrustada en el SWF; el panel no edita edificios u objetos individuales.

Un paquete propio necesita exactamente una variante por sala. Los duplicados impiden activarlo; coloca las alternativas en paquetes distintos.

## Qué ven los jugadores

Publicar cambia inmediatamente la configuración del servidor. El cliente conserva configuración y objetos en memoria; salir y entrar a una sala no garantiza actualizarla.

Las páginas Vanilla consultan la revisión cada 15 segundos y ofrecen recargar o posponer. Recargar vuelve al login; no se expulsa a los jugadores automáticamente.

La ampliación sirve JSON, JSONP y `game_configs.bin` con las selecciones. Las configuraciones usan `Cache-Control: no-store` y los parámetros de versión/hash identifican el contenido.

## Persistencia y concurrencia

`world_data` contiene `world.sqlite3` y `assets/`. Copia todo el volumen, no solo la base. Los archivos se identifican por hash; restaurar una sala no los elimina.

Las publicaciones son atómicas, tienen revisión y registran al moderador. Si otro publica mientras el formulario está abierto, se rechaza la edición antigua y hay que recargar.

Fuera de Compose, establece `WAND_VANILLA_ROOT` y `WAND_WORLD_STATE`, añade el repositorio a `PYTHONPATH` y utiliza `boot.py` de la ampliación desde Dash.

## Límites

Los paquetes no habilitan automáticamente objetivos, poderes, transformaciones, recompensas ni todas las compras de catálogos. No cambian fechas/opciones generales. Un evento completo necesita módulos, recursos y comportamiento del servidor compatibles.

Consulta [monitorización](online.es.md) y [validación](validation.es.md).
