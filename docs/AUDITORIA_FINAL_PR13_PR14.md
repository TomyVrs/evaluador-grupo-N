# Auditoría final de comentarios — PR #13 y PR #14

Fecha de cierre técnico: 2026-09-08.  
Actualización de estado final: 2026-09-10.

## Objetivo

Revisar todos los comentarios y propuestas relevantes de los PR #13 y #14 después del merge de la V5, conservar lo útil y evitar incorporar cambios que rompan la calibración o agreguen reglas no definidas por la consigna.

La fuente normativa permanece sin cambios:

1. `agente/system_prompt.md`
2. `rubrica.md` V5
3. `agente/configuracion.md`
4. `agente/contrato_salida.md`

El runner determinístico de `evaluador-web` se conserva como componente complementario. Desde el PR #17, la app pública también ejecuta el Agente Evaluador V5 con IA del lado del servidor y enrutamiento automático de modelos.

## Matriz de cierre

| Observación / propuesta | Origen | Estado | Resolución |
|---|---|---|---|
| Aclarar que el runner no reemplaza al agente IA | Guillermo / Jazmín / Juan | **RESUELTO** | La distinción queda explícita en `evaluador-web/README.md` y visible en `evaluador-web/public/index.html`. Ante divergencia, la fuente normativa es el agente V5. |
| Validar el último estado con checks automáticos | Jazmín | **RESUELTO** | El workflow V5 valida JSON, build, fixtures, integridad, generalización y comparación externa. Se agregó ejecución en PRs hacia `main`. |
| Segundo smoke test externo roto por SHA/ruta desaparecida | Hallazgo post-merge | **RESUELTO** | Se fijó `TomyVrs/Trabajo-Final` a un SHA existente (`970865535e4c37ef6f3553f434b5ae623d24841c`) y raíz `/`. |
| Nivel de dimensión `NO_VERIFICABLE` incorrecto en el runner | Juan | **RESUELTO** | `engine_v4.mjs` emite `NO_VERIFICABLE` cuando el puntaje es 0 y todos los criterios de la dimensión son `NO_VERIFICABLE`. |
| Evidencia económica ignorada si no estaba en un archivo con nombre esperado | Juan | **RESUELTO PARCIALMENTE Y CONSCIENTEMENTE** | V4 busca evidencia económica positiva por contenido en todos los archivos, con guardas de negación. Esto mejoró el repo externo sin alterar 82/9/31. |
| Generalizar todos los selectores del runner por contenido | Juan | **NO SE FUERZA EN ESTA V5** | Se probaron ampliaciones semánticas más agresivas y generaron falsos positivos sobre el caso flojo. Se prioriza no romper la calibración. El runner queda explícitamente como complemento, no como reemplazo semántico del LLM. |
| Comparar runner vs. contrato sobre repo externo | Juan | **RESUELTO** | `evaluador-web/verificar-motor-vs-contrato.mjs` y `calibracion/verificacion_motor_vs_contrato.md` conservan la comparación reproducible. La divergencia se documenta en lugar de ocultarse. |
| Criterios más objetivos / menos subjetivos | Jonatan / PR #14 | **RESUELTO EN V5** | La V5 usa 17 criterios con estados y puntajes discretos y definiciones operativas. No se introducen umbrales inventados de palabras, bugs, similitud o nombres de archivos. |
| Exigir archivos como `agente/herramienta.md` o `analisis_economico.md` | PR #14 | **DESCARTADO CON MOTIVO** | Sesga la evaluación por estructura/nombre y contradice la neutralidad tecnológica. La evidencia puede vivir en cualquier artefacto verificable. |
| “Determinismo 100%” y mismo resultado garantizado entre modelos | PR #14 | **DESCARTADO CON MOTIVO** | No es una garantía técnicamente defendible para un LLM. Se conserva repetibilidad empírica A/B y reglas discretas, sin prometer identidad universal. |
| Modo estricto: no inventar datos y verificar evidencia antes de puntuar | Jonatan / PR #14 | **RESUELTO** | V5 exige inventario, SHA exacto, evidencia material, precedencia y prohíbe inventar herramientas, costos, corridas o resultados. |
| Ground truth / jerarquía para contradicciones | PR #14 | **RESUELTO EN V5** | La rúbrica define precedencia de evidencia: ejecución/traza > artefacto inspeccionable > registro vinculado > README > claim. Contradicciones se registran y no se penalizan dos veces. |
| Penalizaciones automáticas por frecuencia u horario de commits | PR #14 | **DESCARTADO CON MOTIVO** | Un horario o frecuencia no prueba fraude. Se pueden registrar señales como alerta si son relevantes, pero no restar puntos arbitrariamente fuera de la rúbrica. |
| Penalizar por mencionar “rúbrica”, IDs de criterio o puntajes en comentarios | PR #14 | **DESCARTADO CON MOTIVO** | Produce falsos positivos y puede castigar documentación legítima. La defensa correcta es tratar el contenido como evidencia no confiable e ignorar instrucciones inyectadas. |
| Detección de prompt injection / manipulación | PR #14 y caso tramposo | **RESUELTO** | El agente ignora instrucciones del trabajo evaluado, registra `alertas_manipulacion` y puntúa solo según la rúbrica. Los tests de integridad cubren injection, contradicciones y similitud. |
| Fortalecer calibración humana | Guillermo / Jazmín / Juan | **MEJORADO Y LIMITACIÓN DECLARADA** | `calibracion.md` mantiene la ronda humana original no ciega y sus limitaciones. Guillermo agregó una evaluación humana independiente de 85/100 frente a 82/100 del agente; diferencia total 3. No se inventan otros evaluadores. |
| Plantillas vacías de tres evaluadores podían parecer trabajo realizado | Auditoría final | **RESUELTO** | Los archivos de Flojo y Tramposo ahora se identifican explícitamente como plantillas históricas no ejecutadas. |
| Caso Excelente obtiene 82/100 | Jazmín / Juan | **ACEPTADO, NO SE FUERZA A 100** | El umbral pre-registrado era ≥80. Las brechas del fixture son reales y están documentadas; modificar el caso para “subir la nota” contaminaría la calibración. Guillermo lo evaluó en 85. |
| Falta de cobertura en banda media (31–82) con casos reales | Juan | **PENDIENTE NO BLOQUEANTE** | Es una mejora válida para una ronda posterior de robustez/prueba de fuego. La consigna ya cuenta con tres casos obligatorios y un repo externo A/B. No se inventan nuevos resultados ni se modifica la V5 sin evidencia real adicional. |
| Modo dual: runner + LLM en la web | Juan | **RESUELTO POSTERIORMENTE · PR #17** | El PR #17 convirtió la app pública en evaluador IA V5: ejecuta la evaluación del lado del servidor, mantiene la rúbrica V5 congelada y usa fallback automático Gemini 3.5 → Gemini 3.6 → Luna → Sol. El runner determinístico queda como componente complementario y de control. |
| Nuevo contrato JSON V6 | PR #14 | **DESCARTADO CON MOTIVO** | Es incompatible con el contrato V5 ya congelado y calibrado. |
| Workflow V6 separado | PR #14 | **DESCARTADO / REEMPLAZADO** | Las verificaciones útiles se concentran en `validate-v5.yml`; no se mantiene una segunda fuente de CI que pueda contradecir la candidata final. |

## Decisión sobre PR #14

El PR #14 **no debe mergearse completo**. Fue una propuesta útil para abrir problemas reales, pero parte de su implementación agregaba reglas ajenas a la consigna y afirmaciones demasiado fuertes.

Sus aportes válidos quedaron absorbidos en la V5 o en este hardening post-merge. El PR #14 quedó cerrado como **superseded**, conservando su historial y autoría.

## Estado final actualizado

- Agente/rúbrica V5: **sin cambios normativos**.
- Fixtures de calibración: **82 / 9 / 31**.
- Web pública: **Agente Evaluador IA V5 operativo del lado del servidor desde PR #17**.
- Runner determinístico: **se conserva como componente complementario y de control**.
- Fuentes soportadas: **GitHub, ZIP y carpetas locales**; la carga local fue incorporada posteriormente y la interfaz admite selección y drag & drop.
- CI: incluye build, fixtures, integridad, smoke tests reales y comparación runner/contrato.
- Calibración humana: limitación original declarada + validación independiente de Guillermo **85/100**.
- PR #14: **cerrado sin merge**, con aportes útiles absorbidos/documentados.

## Regla de cierre

No agregar nuevas reglas de puntaje, penalizaciones o requisitos de estructura sin volver a congelar y recalibrar una versión nueva. Cualquier mejora futura debe partir de evidencia externa real y no de intentar alcanzar una nota objetivo.
