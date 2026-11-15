# Animaciones de vestimenta y poderes de eventos

[English](special-actions.md) · [Español](special-actions.es.md) · [Documentación](README.es.md)

## Usar una acción especial existente

Equipa el conjunto exacto y deja vacíos los demás huecos de ropa, salvo que la
regla incluya otras prendas. Pulsa **D** con el foco en el juego, o selecciona
Dance en el menú de acciones. Saludar tiene reglas distintas. El campo de chat
no debe tener el foco al usar un atajo.

Estas acciones no necesitan activar un evento en el manager: el cliente ya las
elige según la ropa. El color y el fondo no forman parte de los seis huecos
comparados.

| Acción | Prendas exactas por ID | Animación |
| --- | --- | --- |
| Bailar | Cabeza `403`; resto vacío | Taladro del casco de obra, acción `36` |
| Bailar | Cabeza `465`, cuerpo `299`; resto vacío | Bombero, acción `46` |
| Bailar | Cabeza `1745`, cuerpo `24008`, pies `6212`; resto vacío | Robot de juguete, acción `140` |
| Saludar | Cara `123`, cuello `302`, cuerpo `765`; resto vacío | Shadow Guy, acción `39` (configuración inspeccionada; sin prueba en partida) |

## Funcionamiento del cliente y servidor

`penguin_action_frames.json` contiene 685 reglas: 629 para bailar (frame de
entrada 26), 54 para saludar (25) y otras dos. La copia incluida en
`game_configs.bin` coincide con el JSON inglés suelto del checkout inspeccionado.
Están presentes todos los archivos externos de animación referenciados. Los
frames normales de bailar/saludar están integrados y no necesitan SWF propio.

El shell construye una clave con **cabeza, cara, cuello, cuerpo, mano y pies**
y la busca entre las reglas de la acción. Normaliza los IDs de canje entre
10001–19999 y 30000–39999 restándoles 10000. Una coincidencia proporciona
`secret_frame`; el motor carga `content/global/penguin/actions/<frame>.swf`.
Sin coincidencia, utiliza la acción normal. Una prenda extra puede impedir
el baile especial.

Houdini retransmite el frame mediante `u/sf`; los clientes resuelven la
animación según el conjunto. El campo de cuenta `special_dance` registra un
hito del tutorial y no es un interruptor general de poderes.

Para consultar las combinaciones exactas sin ejecutar Flash:

```sh
python scripts/audit-special-actions.py
python scripts/audit-special-actions.py --item 403
python scripts/audit-special-actions.py --outfit 403,0,0,0,0,0
python scripts/audit-special-actions.py --trigger wave --outfit 0,123,302,765,0,0
python scripts/audit-special-actions.py --json
```

Los seis IDs de `--outfit` siguen el orden indicado; `0` significa vacío. La
herramienta consulta la configuración base, sin los cambios que pueda introducir
un módulo de fiesta durante la ejecución. Encontrar una regla y su recurso no
certifica que las 685 reglas funcionen en Ruffle.

## Los poderes de Marvel usan otro mecanismo

### Acciones de Iron Man añadidas por este fork

Este fork añade dos acciones visuales al conjunto exacto de Iron Man: capucha
`1412`, traje `4621` y huecos de cara, cuello, mano y pies vacíos. Pulsa **D**
o selecciona bailar para elevarte con propulsores. Muévete para aterrizar.
Pulsa **T** y haz clic en un objetivo para disparar un repulsor en lugar de una
bola. Cambiarte de ropa o transformarte también termina el vuelo.

Son efectos nuevos implementados aquí, no animaciones originales recuperadas.
Utilizan los mensajes normales de frame y bola, de modo que los demás clientes
con el módulo actualizado pueden mostrarlos. No añaden daño, progreso de
misiones ni recompensas. No requieren activar un paquete de salas de Marvel.

El código está en `world_manager/client/costume-effects.as`. Una copia compilada
de `rooms_common.swf` conserva las clases originales y añade el inicializador.
Nginx la sirve mediante Dash tanto con medios en el mismo host como separados.
El submódulo Vanilla no se modifica. Despliega la plantilla web y la extensión
Dash actualizadas, y recarga cada cliente. Java/FFDec no se necesitan en ejecución.

Para reconstruir tras cambiar el código de las acciones:

```sh
python scripts/build-costume-effects.py --ffdec /ruta/a/ffdec.jar --java java
```

Usa FFDec 26.3.0. El constructor rechaza un SWF base distinto sin revisar y
registra hashes de código, compilador y resultado en
`world_manager/client/build.json`. Guarda juntos código, SWF generado y registro.
No hace falta compilar para ponerse el traje, bailar, disparar o cambiar de sala.

### Módulos originales del evento

La capucha de Iron Man `1412` y su traje `4621` no tienen una regla de baile o
saludo especial en esta configuración. Tener los sprites no demuestra que
funcione un poder. Asignar una animación ajena no lo implementaría.

El SWF `rooms_common.swf` incluye una clase **de 2013**, `SuperHeroParty`, con
guantes `5240`–`5247` y `5249`, efecto de pisotón y lógica de robots/poderes.
Espera la cookie `20130424`, alias de interfaz y mensajes como `shp#shphp`,
`shp#shpvp`, `shp#shprh` y `shpgp`. El Houdini inspeccionado no tiene los
handlers `shp` correspondientes. Su cookie genérica de fiestas no implementa
el protocolo completo de ese evento.

Para hacer funcionar esos poderes hay que conectar el inicializador y los
hooks del motor de la edición correcta, aportar interfaz/efectos/alias e
implementar los handlers y estado del servidor validando el equipamiento.
Después cada poder necesita pruebas con dos clientes para comprobar visibilidad
y coherencia del estado. El paquete Marvel **de 2012** del manager no inicializa
esta mecánica **de 2013**; mezclar ambas ediciones no acredita un evento completo.

## Validación local

Antes de añadir la extensión de Iron Man, el 15 de noviembre de 2026 pasaron los cuatro conjuntos en Ruffle/Houdini
aislado: el casco cargó la acción 36 y mostró el taladro; el bombero cargó
46 y lanzó agua; el robot cargó el baile 140 (y el saludo 143 al equiparse);
Iron Man recibió el baile normal sin cargar una acción especial. Cada
pulsación de D produjo una respuesta nueva del servidor y no hubo errores
JavaScript. Se inspeccionaron las capturas. Esto no verifica todos los trajes,
salas, espectadores remotos ni poderes de fiesta.

`tests/special-dance-browser.cjs` utiliza únicamente el proyecto Docker aislado
de `tests/local-stack.py`, sus cuentas de prueba y un navegador headless lanzado
por CLI. Requiere las cuentas creadas por `tests/check-manager-live.py`,
Playwright/Chromium como las otras pruebas de navegador y los medios Ruffle.
Equipa la cuenta antes de iniciar sesión, pulsa D, comprueba una respuesta nueva
del servidor con frame 26, comprueba la descarga de animaciones y guarda capturas
y resultados en `.validation/local-stack/`.

```sh
node tests/special-dance-browser.cjs
```

Se usó [FFDec](https://github.com/jindrapetrik/jpexs-decompiler) 26.3.0 portable
por CLI para inspeccionar shell, motor y módulo común. La investigación inicial
no modificó SWF, cuentas de producción, servidores desplegados ni ajustes de
activación. La nueva extensión sirve su propia copia generada del cliente;
no edita el SWF original ni cuentas de producción.

`tests/ironman-browser-smoke.cjs` comprueba dos clientes Ruffle conectados al
stack desechable. Inicia la misión introductoria de las cuentas de prueba para
que el tutorial no intercepte los controles, equipa únicamente la cuenta de
prueba y captura vuelo, repulsor y aterrizaje. Las trazas AVM1 distinguen la
ejecución del efecto en cada cliente de la mera recepción de un paquete.

La prueba local final con dos clientes del 15 de noviembre de 2026 pasó: ambos
ejecutaron el vuelo, aterrizaron al moverse y dibujaron el repulsor. No hubo
errores JavaScript. Pasaron además 35 comprobaciones Python, 15 JavaScript y
las cinco configuraciones de Nginx de hosts y rutas. Estos resultados cubren
los efectos nuevos de Iron Man, no el protocolo original de la fiesta Marvel.
También se comprobó en el cliente real que el casco de obra sigue cargando
correctamente la acción 36 con la extensión instalada.
