# LAST MOVE

**THE BOARD TAKES MORE THAN PIECES.**

Prototipo V1 jugable de damas inglesas y supervivencia corporal. Humano contra IA, sin backend, servicios ni recursos externos. Todo el arte se dibuja proceduralmente y el audio se sintetiza en el navegador.

## Ejecutar

En esta Mac también podés ejecutar `./play.command` (o abrir ese archivo desde Finder). Usa Node instalado o el runtime de Codex disponible y abre el navegador local. Las dependencias ya están instaladas en la carpeta actual.

Con Node.js y npm instalados, desde esta carpeta:

```sh
npm install
npm run dev
```

Abrir la dirección local indicada por Vite. Para compilar y ejecutar las pruebas:

```sh
npm test
npm run build
```

La compilación queda en `dist/`. Para desarrollo también se admite pnpm; se incluye `pnpm-lock.yaml`. En este entorno de Codex se utilizó el Node y pnpm incluidos en el runtime, ya que el sistema no tiene `npm` en su ruta habitual.

## Cómo jugar

Seleccioná **BEGIN THE GAME**. Controlás las fichas de hueso y comenzás. Clic en una ficha y después en un destino marcado. También podés enfocar el tablero con Tab y usar flechas y Enter/Espacio.

- Capturas obligatorias, con elección libre de la secuencia. Cada salto posterior debe continuar con la misma ficha.
- Los hombres avanzan/capturan hacia adelante. Los kings pueden hacerlo en ambas direcciones, sin volar. Una coronación termina el turno.
- Primeras cuatro pérdidas: brazo izquierdo, pierna derecha, brazo derecho, pierna izquierda. Cada una causa 8 de daño y 3 de hemorragia permanente.
- Pérdidas posteriores: 5 de daño y 1 de hemorragia, sin extremidades adicionales. La cabeza permanece siempre.
- Sangrás una vez al terminar tu propio turno completo. Pensar no causa daño.
- Ganás tomando todas las fichas, bloqueando al enemigo o sobreviviendo a su sangre. Los empates por repetición triple y 80 turnos sin captura ni movimiento de un hombre están implementados.

## Arquitectura

| Módulo | Responsabilidad |
| --- | --- |
| `src/game/types.ts` | Modelos explícitos de tablero, movimiento, salud, fases, resultado y ajustes. |
| `src/game/engine.ts` | Generación de turnos completos, capturas, coronación, validación, resolución y empates. Funciones puras sin React. |
| `src/game/health.ts` | Lesiones, amputaciones, hemorragia y estados de percepción. |
| `src/game/balance.ts` | Daño, sangrado, límites de empate, profundidad, presupuestos de búsqueda y tiempos principales. |
| `src/game/ai.ts` | Minimax alfa-beta, ordenación de jugadas e iterative deepening con límite temporal. |
| `src/game/ai.worker.ts` | Aísla la búsqueda en un Web Worker. |
| `src/game/useGame.ts` | Control de fases, interacción de cadenas, temporizadores, ejecución de IA y reinicio. |
| `src/render/` | Canvas del tablero, piezas, muñecos, texturas, pistas y movimiento. Fondo del tablero en caché. |
| `src/audio/sound.ts` | Audio procedural: madera, impactos, crujidos, goteo, corona, latido, muerte y victoria. |
| `src/components/` | Tablero con capa accesible, paneles corporales y diálogos. |
| `src/App.tsx`, `src/style.css` | Menú, escena, ajustes, ayuda, resultados y adaptación a pantallas pequeñas. |

### Contrato de un turno

`legalMoves` devuelve movimientos **completos**, incluyendo todas las continuaciones de captura. `playTurn` rechaza jugadas ilegales e incompletas. `simulateTurn` es el mismo simulador puro usado por la IA para jugadas ya validadas.

La resolución aplica todas las lesiones del oponente, comprueba su muerte inmediata, aplica una sola hemorragia del atacante, comprueba su muerte y después comprueba las victorias de damas y los empates. La captura letal inmediata evita el sangrado del atacante. Su muerte por hemorragia tiene prioridad sobre una victoria estratégica.

La interfaz permite elegir cada bifurcación de una captura múltiple. Los saltos intermedios muestran una previsualización; el estado definitivo se confirma al completar la secuencia. Los daños se presentan juntos antes del siguiente turno. Las búsquedas hipotéticas no modifican el estado real.

La clave de repetición incluye disposición y coronación de las piezas, turno, sangre, hemorragia e historial de lesiones. Excluye los identificadores de fichas y los contadores de turnos, que no distinguen una posición.

### IA

EASY: hasta 2 plies / 180 ms. NORMAL: hasta 4 / 700 ms. HARD: hasta 6 / 1800 ms. Un ply es un turno completo. La mejor iteración completada se conserva si vence el plazo. Se evalúan material, kings, avance a coronación, centro, movilidad, capturas, sangre, hemorragia y turnos estimados hasta la muerte. Todas las ramas ejecutan las reglas corporales y las condiciones terminales reales.

El Worker se termina al salir o reiniciar. Los temporizadores y los ciclos de animación se limpian al desmontar. Los controles quedan bloqueados durante movimientos, heridas y pensamiento de la IA.

## Presentación y ajustes

Dos muñecos de madera con juntas metálicas, extremidades persistentes sobre la mesa y vasos que reflejan la sangre real. Tablero de madera, fichas con relieve y coronas de metal. Cuatro niveles de percepción, viñeta pulsante y shock tras una lesión. Las pistas de jugadas están en una capa nítida y las coordenadas del ratón permanecen estables.

Settings ofrece dificultad, sonido, volumen y efectos FULL / REDUCED / OFF. Los ajustes se guardan localmente. El audio se activa después de una interacción. No hay fuentes, imágenes ni archivos de sonido descargados durante la partida.

## Verificación

- `npm test`: 38 pruebas de reglas, salud, prioridades de muerte, simetría humano/IA, empates, legalidad y no mutación de la IA, reinicio y límites de interpolación. Incluye tres partidas completas simuladas con invariantes de sangre y conservación de fichas.
- `npm run build`: TypeScript y compilación de producción Vite.
- Prueba manual en el navegador de Codex: menú, clics, respuesta del Worker, capturas, continuación de cadenas, heridas persistentes, dos partidas hasta muerte por sangrado (turnos 19 y 21), ajustes de dificultad/efectos/sonido, ayuda y reinicio a 100/100, cuerpos completos y 12 fichas por lado.

## Balance y dificultad

Editar `src/game/balance.ts`: `amputationDamage`, `amputationBleeding`, `aggravatedDamage`, `aggravatedBleeding`, `depths`, `searchMs`, límites de empate y tiempos principales. Los pesos de evaluación estratégica están en `src/game/ai.ts`. La disposición y el estilo de los muñecos se ajustan en `src/render/body.ts`; el aspecto de la escena, en `src/style.css`.

## Límites reales de V1

- HARD apunta a 6 plies; puede completar menos según el equipo y la complejidad de la posición, respetando el presupuesto temporal.
- Las caídas y los materiales son animación e ilustración 2D, sin simulación física de cuerpos rígidos.
- Chrome y Safari son objetivos mediante APIs estándar; no se realizó una verificación manual independiente en Safari.
- La partida no se guarda al cerrar o recargar; los ajustes sí. No hay multijugador ni historial reproducible de partidas.

## Publicación online desde GitHub

Repositorio: https://github.com/Tercarioli/damas-sangrientas

El flujo `.github/workflows/pages.yml` instala las dependencias fijadas, ejecuta las pruebas y compila antes de desplegar `dist/` en GitHub Pages. Cada actualización de `main` vuelve a publicar el juego si todas las comprobaciones pasan. También puede ejecutarse manualmente en la pestaña Actions.

En Settings → Pages, la fuente debe ser **GitHub Actions**. GitHub Pages requiere que el plan de la cuenta permita publicar desde la visibilidad elegida para el repositorio. La configuración de Vite usa rutas relativas, incluidas las del Worker, para funcionar bajo el subdirectorio del repositorio.
