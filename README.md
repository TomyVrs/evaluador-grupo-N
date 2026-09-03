# Agente Evaluador de Trabajos Finales

## Qué construimos

Construimos un agente evaluador capaz de corregir repositorios de Trabajos Finales de la materia. Inspecciona archivos e historial, usa evidencia verificable, aplica una rúbrica ejecutable de 100 puntos y devuelve una evaluación estructurada con puntaje, justificación, evidencia y mejora concreta.

## Cómo se lo pedimos

Definimos una rúbrica ejecutable, system prompt, user prompt, configuración operativa y contrato de salida. El agente trabaja sobre una referencia GitHub congelada, inventaría el alcance antes de puntuar, aplica precedencia de evidencia, resiste prompt injection y utiliza únicamente operaciones de lectura durante la evaluación.

## Qué funciona

- Rúbrica v4 con cinco dimensiones y pesos oficiales: 30/25/15/15/15.
- Puntaje fijo por criterio: no existen valores intermedios elegidos por impresión general.
- Reglas operativas para `CUMPLE`, `PARCIAL`, `NO_CUMPLE` y `NO_VERIFICABLE`.
- Definición objetiva de las seis piezas del contrato del agente.
- Precedencia explícita para resolver claims y evidencia contradictoria.
- Evaluación anclada a un SHA exacto para evitar mezclar versiones.
- Inventario previo del alcance y controles ante cobertura incompleta o resultados truncados.
- Distinción entre evidencia de ausencia y limitación de acceso.
- GitHub tratado como herramienta de lectura; las operaciones de escritura quedan fuera del contrato del corrector.
- Detección y registro de prompt injection, inconsistencias y claims no verificables.
- Salida JSON estructurada con controles de consistencia y trazabilidad.
- Tres casos de prueba: excelente, flojo y tramposo.
- SHA V4 congelado antes de guardar resultados automáticos: `3edf04e478c515698305ac534c5a7b1cf3ab01d5`.
- Dos aplicaciones por caso sobre el mismo freeze, con estados y puntajes idénticos criterio por criterio.
- Resultados V4: **Excelente 82/100, Flojo 9/100, Tramposo 31/100**.
- El tramposo no altera la rúbrica: se detectan prompt injection, contradicciones, error aritmético y gobierno deficiente.
- Casos de borde de referencia inexistente, ruta inexistente y repositorio inexistente devuelven `NO_EVALUABLE` sin inventar puntajes.
- Validador automático en Python para estructura JSON, puntajes permitidos, sumas, niveles, evidencia, freeze, repetibilidad y umbrales.
- GitHub Actions ejecutó ese validador con permisos de solo lectura y resultado **success**.

## Qué falta o qué falló

La **validación técnica V4 está aprobada**, pero la calibración completa todavía no está cerrada.

Falta que **tres integrantes evalúen de manera independiente y ciega** los tres casos sobre el SHA congelado, calcular la mediana humana por dimensión y total y comparar esas notas con las del agente. Una diferencia mayor a 5 puntos en el total o a 2 puntos en una dimensión debe analizarse antes de modificar la rúbrica o el agente.

Dos defensas adicionales están implementadas pero no fueron forzadas con un fixture específico en esta ronda: inventario realmente truncado/paginado y contradicción entre dos evidencias de igual precedencia sin desempate superior. No se presentan como pruebas empíricamente aprobadas.

`main` no se modifica durante esta etapa. Todo el endurecimiento, las pruebas y la calibración permanecen en una única rama paralela hasta la decisión del equipo.

## Qué aprendimos

Aprendimos que una rúbrica ejecutable requiere más que rangos de puntaje: necesita valores fijos, reglas de clasificación, definiciones operativas y precedencia de evidencia. También que la reproducibilidad depende de congelar la referencia evaluada, controlar la cobertura real del repositorio y separar los resultados de calibración de la evidencia que se puntúa. La robustez no se demuestra con una única corrida: requiere repetibilidad, validaciones automáticas, casos adversariales y comparación independiente con criterio humano.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
