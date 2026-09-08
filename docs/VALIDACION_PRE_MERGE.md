# Validación técnica pre-merge — candidata V5

La candidata activa está en la única rama de trabajo `work/final-hardening-v4`; el nombre de rama se conserva para no crear ramas adicionales, aunque la versión activa del agente sea V5.

Durante la revisión final del grupo, `main` avanzó desde el baseline `9419bbeb41fe4dddc54ebe07249d1a9d4a3a7352` al commit `40f88a8007af6c7929b2be532575b0091652b1fa`, agregado por Guillermo Rojas Yenni con una evaluación humana independiente posterior del caso excelente. Ese cambio no pertenece al hardening V5, no modifica el `FREEZE_V5` y debe conservarse como evidencia grupal/post-calibración, no como reemplazo de la calibración congelada.

## Integridad

- [x] Base original del hardening V5: `9419bbeb41fe4dddc54ebe07249d1a9d4a3a7352`.
- [x] Rama candidata construida sobre esa base.
- [x] `FREEZE_V5 = 5fdd304c26097aa16dc6d065e8b1c3d6359e7010` fue fijado antes de los resultados V5.
- [x] El freeze no contiene resultados automáticos V5.
- [x] Todas las pruebas de los tres casos refieren al mismo freeze.
- [x] V4 se conserva solo como historial técnico.
- [x] El cambio posterior de `main` no altera el freeze ni los resultados V5.

## Rúbrica y agente

- [x] Cinco pesos oficiales suman 100.
- [x] Puntajes discretos por criterio.
- [x] Seis piezas de SC-01 definidas operativamente.
- [x] SC-02 admite de manera neutral: traza/corrida, implementación local reproducible o integración reproducible.
- [x] Precedencia de evidencia y contradicciones definida.
- [x] Ausencia comprobada se distingue de falta de acceso.
- [x] Prompt injection se ignora y registra.
- [x] System prompt, user prompt, configuración y contrato están alineados en V5.

## Cobertura y seguridad

- [x] Ref → SHA antes de leer/puntuar.
- [x] Ruta raíz validada.
- [x] Inventario previo a afirmaciones de ausencia.
- [x] Cobertura parcial no se transforma en ausencia: ejercitado con el repo externo.
- [x] Solo operaciones de lectura forman parte del corrector.
- [x] Workflow V5 usa permisos de lectura.
- [x] Ref, ruta y repo inexistentes producen `NO_EVALUABLE`.

## Batería V5

| Prueba | A | B | Diferencia por criterio | Estado |
|---|---:|---:|---:|---|
| Excelente | 82 | 82 | 0 | PASS |
| Flojo | 9 | 9 | 0 | PASS |
| Tramposo | 31 | 31 | 0 | PASS |
| Repo externo no visto | 98 | 98 | 0 | PASS |

- [x] Excelente ≥80.
- [x] Flojo ≤35.
- [x] Tramposo ≤45 y registra manipulación.
- [x] Error económico adversarial recalculado.
- [x] Claims contradictorios detectados.
- [x] Herramienta local reproducible reconocida correctamente en repo externo.

## Runner ejecutable local

Se agregó `evaluador-web/` para que un tercero pueda ejecutar la evaluación desde el repositorio sin depender de una API paga, tarjeta o credenciales privadas del equipo.

```text
cd evaluador-web
npm install
npm test
npm start
# abrir http://localhost:5173
```

- [x] Node.js 18+; sin dependencias npm de terceros.
- [x] Procesamiento por lote de repositorios públicos.
- [x] Acepta repos completos o rutas `/tree/<ref>/<ruta>`.
- [x] Resuelve cada ref a SHA antes de puntuar.
- [x] Operaciones GitHub de solo lectura.
- [x] Token GitHub opcional solo para rate limit; queda en `sessionStorage`.
- [x] Exportación CSV y JSON.
- [x] Motor identificado transparentemente como `deterministico-local`; no se presenta como una nueva corrida del LLM calibrado.
- [x] `npm test` exige 82 / 9 / 31 sobre los tres fixtures incluidos.

## Validación automática

GitHub Actions ejecuta `calibracion/validar_resultados_v5.py` y también prueba el runner local cuando cambia `evaluador-web/`.

El run #3 `33822794904`, sobre el commit `3dd3085f7792b82d91cadfe3580c53c527b64efc`, concluyó **success**. Pasaron:

- `Validate V5 JSON, scoring and repeatability`;
- `Install local runner`;
- `Test executable runner against V5 fixtures`.

El workflow V5 está configurado para cambios relevantes tanto en `work/final-hardening-v4` como en `main` y mantiene `contents: read`.

**Alcance exacto:** el validador de calibración controla los artefactos JSON guardados y `npm test` controla la mecanización local contra los fixtures. El workflow no lanza autónomamente un LLM sobre un repositorio nuevo.

## Calibración humana

- [x] Se evaluaron excelente, flojo y tramposo sobre el mismo `FREEZE_V5`.
- [x] Se registraron los resultados humanos iniciales: 78 / 5 / 31.
- [x] Se compararon contra los resultados del agente: 82 / 9 / 31.
- [x] Los dos desacuerdos materiales a nivel de dimensión fueron revisados contra la rúbrica y la evidencia.
- [x] Excelente `PD-03`: desacuerdo clasificado `ERROR_HUMANO`; adjudicación final `CUMPLE`.
- [x] Flojo `SC-01`: desacuerdo clasificado `ERROR_HUMANO`; adjudicación final `PARCIAL`.
- [x] Resultado humano adjudicado final: 82 / 9 / 31.
- [x] No fue necesario modificar rúbrica ni agente.
- [x] Se documentó la limitación metodológica: un evaluador humano del grupo, no ciego porque conocía previamente los totales automáticos.
- [x] No se fabricaron evaluadores ni resultados adicionales.

El plan previo de tres evaluadores independientes se conserva como propuesta metodológica histórica. La evaluación de Guillermo (85/100 para excelente) fue agregada **después** del cierre y se trata como revisión independiente posterior, no como parte de la ronda congelada.

## Proceso grupal

- [x] El historial de `main` conserva commits e integraciones por PR previas a V5.
- [x] El PR #13 mantiene el hardening V5 como una secuencia de cambios trazables.
- [x] Se documenta de forma explícita que el tramo V5 fue implementado desde la cuenta `TomyVrs`.
- [x] Guillermo Rojas Yenni dejó una contribución auténtica y verificable en GitHub mediante la evaluación humana independiente del commit `40f88a8...`.
- [ ] Los demás integrantes deben dejar evidencia auténtica de revisión del PR #13 mediante comentarios, reviews, aprobaciones u observaciones concretas según corresponda.

## Pendiente antes de integrar

- [ ] Revisión final del grupo sobre el PR, su diff y el runner ejecutable.
- [ ] Consolidar la revisión independiente de Guillermo sin reescribir la calibración histórica.
- [ ] Evidencia auténtica de las restantes revisiones/aportes del equipo visible en GitHub.
- [ ] Decidir en equipo si corresponde sacar el PR de draft e integrar.
- [ ] Antes del cierre, confirmar que la versión integrada en `main` conserva las contribuciones y vuelve a pasar las validaciones.

## Cierre

No queda una corrección funcional material identificada en el núcleo V5. El `FREEZE_V5` permanece inalterado. El runner local gratuito ya fue incorporado y validado por CI; las acciones pendientes son de revisión grupal, consolidación del cambio posterior de `main` e integración final.
