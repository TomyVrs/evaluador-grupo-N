# Agente Evaluador de Trabajos Finales

## Qué construimos

Construimos un agente evaluador capaz de corregir repositorios de Trabajos Finales de la materia. Inspecciona archivos e historial, usa evidencia verificable, aplica una rúbrica ejecutable de 100 puntos y devuelve una evaluación estructurada con puntaje, justificación, evidencia y mejora concreta.

## Cómo se lo pedimos

Definimos una rúbrica ejecutable, system prompt, user prompt, configuración operativa y contrato de salida. El agente trabaja sobre una referencia GitHub congelada, inventaría el alcance antes de puntuar, aplica precedencia de evidencia, resiste prompt injection y utiliza únicamente operaciones de lectura durante la evaluación.

## Qué funciona

- Rúbrica **V5** con cinco dimensiones y pesos oficiales: 30/25/15/15/15.
- Puntaje fijo por criterio y reglas operativas para `CUMPLE`, `PARCIAL`, `NO_CUMPLE` y `NO_VERIFICABLE`.
- Definición objetiva de las seis piezas del contrato del agente.
- Precedencia explícita para resolver claims y evidencia contradictoria.
- Tres vías tecnológicamente neutrales para demostrar una herramienta operable: traza/corrida, implementación local reproducible o integración reproducible.
- Evaluación anclada a un SHA exacto para evitar mezclar versiones.
- Inventario previo del alcance y defensa ante cobertura incompleta/truncada.
- Distinción entre evidencia de ausencia y limitación de acceso.
- Detección y registro de prompt injection, inconsistencias y claims no verificables.
- Salida JSON estructurada y validador automático.
- Casos excelente, flojo y tramposo probados dos veces sobre el mismo freeze.
- Casos de borde para referencia, ruta y repositorio inexistentes.
- Prueba adicional sobre un repositorio público real no usado durante el diseño de los fixtures.
- Calibración humano-agente documentada con desacuerdos iniciales, adjudicación y resultado final.

## Validación técnica V5

**FREEZE_V5:** `5fdd304c26097aa16dc6d065e8b1c3d6359e7010`.

Ese SHA fue fijado antes de crear resultados V5.

| Prueba | Resultado A | Resultado B | Diferencia por criterio |
|---|---:|---:|---:|
| Excelente | 82/100 | 82/100 | 0 |
| Flojo | 9/100 | 9/100 | 0 |
| Tramposo | 31/100 | 31/100 | 0 |
| Repo externo no visto | 98/100 | 98/100 | 0 |

El caso tramposo no altera la rúbrica: se detectan prompt injection, claims contradictorios, error aritmético y gobierno deficiente.

El repo externo permitió comprobar que V5 reconoce una herramienta XLSX local realmente implementada/reproducible sin exigir artificialmente un conector externo. También ejercitó el comportamiento conservador ante una respuesta de inventario demasiado grande para la integración: se declara limitación en vez de inferir ausencia.

Los tres casos de borde `NO_EVALUABLE` —referencia inexistente, ruta inexistente y repo inexistente— fueron ejecutados nuevamente en V5.

GitHub Actions ejecutó `calibracion/validar_resultados_v5.py` con permisos de lectura y conclusión **success**. El validador confirma la consistencia de los resultados guardados: JSON, criterios, puntajes permitidos, sumas, niveles, evidencia, SHA, repetibilidad, umbrales, bordes y SC-02 V5. **No ejecuta por sí solo una nueva evaluación LLM sobre un repositorio nuevo.** El workflow V5 corre sobre la rama activa y queda preparado para volver a validar al integrarse en `main`.

## Evolución de V4 a V5

V4 ya había superado su batería técnica. Antes de enviar la rúbrica a humanos, una prueba sobre un repo real no visto mostró que SC-02 podía ser interpretado distinto para una herramienta local reproducible frente a un conector externo.

V5 cerró esa ambigüedad antes de la calibración humana. La modificación no cambió la nota de los tres casos conocidos: 82, 9 y 31 se mantuvieron idénticos, lo que funciona además como prueba de no regresión.

## Calibración humano-agente

La evaluación humana se hizo sobre el mismo `FREEZE_V5`, criterio por criterio.

Resultados iniciales:

| Caso | Humano inicial | Agente |
|---|---:|---:|
| Excelente | 78 | 82 |
| Flojo | 5 | 9 |
| Tramposo | 31 | 31 |

Los dos desacuerdos se revisaron contra la definición literal de la rúbrica y la evidencia congelada:

- Excelente: `PD-03` debía ser `CUMPLE`, porque `DECISIONES.md` vincula explícitamente la falla de inferencia con la regla agregada para no completar responsables/plazos sin evidencia.
- Flojo: `SC-01` debía ser `PARCIAL`, porque entre ambos prompts existen al menos cuatro piezas operativas.

Ambos desacuerdos se clasificaron como `ERROR_HUMANO`. Después de la adjudicación, humano y agente coinciden exactamente: **82 / 9 / 31**.

No fue necesario modificar la rúbrica ni el agente V5.

La metodología real y su limitación están detalladas en `calibracion.md`: la ronda final fue realizada por un evaluador humano del grupo y no fue ciega, ya que conocía previamente los totales automáticos. No se inventaron evaluadores adicionales.

## Proceso grupal y revisión final

El historial previo de `main` conserva la evolución mediante commits y PRs ya integrados. El endurecimiento V5 del PR #13 fue implementado desde la cuenta `TomyVrs`; por eso no se presenta ese tramo como si hubiera sido escrito por seis autores distintos. La participación adicional del grupo debe quedar reflejada de forma auténtica en la revisión del PR —comentarios, observaciones, aprobaciones o cambios concretos— antes de decidir el merge.

## Qué falta

La candidata V5 ya tiene cerradas la validación técnica y la calibración humano-agente.

Queda únicamente la **revisión final del grupo** sobre el PR antes de decidir si se integra. Hasta esa decisión:

- `main` no se modifica;
- no se crean ramas nuevas;
- no se mergea el PR.

Antes de la entrega, la versión elegida debe quedar efectivamente integrada en `main` para que el repositorio público por defecto exponga la candidata final.

## Qué aprendimos

Aprendimos que una rúbrica ejecutable necesita puntajes discretos, reglas de clasificación y precedencia de evidencia; y que una regla aparentemente precisa debe enfrentarse a repositorios distintos de los fixtures con los que fue diseñada. La robustez no se demuestra con una corrida favorable: requiere repetibilidad, casos adversariales, fallos de acceso, validación automática, una prueba externa y comparación explícita con criterio humano.

La calibración mostró además que un desacuerdo humano-agente no implica automáticamente que el agente esté mal: primero hay que volver a la definición del criterio y a la evidencia antes de cambiar la rúbrica o el sistema.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
