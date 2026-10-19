# Verificación de V1

Fecha: 19 de octubre de 2026.

## Automatizada

38 pruebas Vitest, 2 archivos, todas aprobadas. TypeScript sin errores y compilación Vite de producción correcta. La distribución incluye un Worker independiente para la IA.

Se prueban reglas inglesas completas, captura obligatoria global, elección libre entre cadenas de distinta longitud, kings, coronación que termina la cadena, daño corporal y su orden, sangrado una sola vez por turno, prioridad de captura letal, prioridad de muerte propia sobre victoria de damas, simetría de jugadores, empates, legalidad y pureza de la búsqueda de IA, reinicio y tres partidas simuladas completas.

Cuatro pruebas adicionales cubren los extremos de interpolación, incluido el primer fotograma cuyo timestamp puede ser anterior al evento que inicia el movimiento. Ese caso produjo un error durante la primera revisión del navegador y se corrigió antes de la segunda partida completa.

## Navegador de Codex

- Menú → iniciar → seleccionar ficha → destino legal → respuesta automática del Worker.
- Capturas obligatorias y continuación de cadenas elegidas por clic.
- Primer brazo desprendido, sangre 92 y hemorragia 3; extremidad persistente sobre la mesa.
- Primera partida completa: derrota por hemorragia, turno 19, cuatro extremidades perdidas, oponente con 26 de sangre.
- Segunda partida completa después de corregir la interpolación: derrota por hemorragia, turno 21, cuatro extremidades perdidas, oponente con 37 de sangre. No aparecieron nuevos errores ni advertencias de consola.
- Reinicios en ambos casos: 12 fichas por lado, sangre 100, sangrado cero, cuerpos completos, turno 1.
- Diálogos de ayuda y ajustes; cambios de dificultad NORMAL/HARD, efectos FULL/REDUCED y sonido ON/OFF. Se restauraron los valores predeterminados.
- Respuesta HTTP local 200 y carga sin recursos externos.

Las capturas `game.png` y `result.png` muestran la escena y el resultado de la segunda partida. La comprobación visual se realizó en el navegador integrado (aproximadamente 1020 × 1000). Los puntos de adaptación de CSS contemplan 1440 × 900 y pantallas pequeñas, pero no se verificó manualmente cada resolución ni Safari. La síntesis sonora está conectada a interacciones reales; no se realizó una evaluación auditiva independiente.
