# Validación técnica pre-merge — candidata V5

`main` no se modifica durante esta etapa. La candidata activa está en la única rama de trabajo `work/final-hardening-v4`; el nombre de rama se conserva para no crear ramas adicionales, aunque la versión activa del agente sea V5.

## Integridad

- [x] Base original: `9419bbeb41fe4dddc54ebe07249d1a9d4a3a7352`.
- [x] Rama candidata construida sobre esa base.
- [x] `FREEZE_V5 = 5fdd304c26097aa16dc6d065e8b1c3d6359e7010` fue fijado antes de los resultados V5.
- [x] El freeze no contiene resultados automáticos V5.
- [x] Todas las pruebas de los tres casos refieren al mismo freeze.
- [x] V4 se conserva solo como historial técnico.

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
- [x] Workflow V5 usa `Contents: read` y `Metadata: read`.
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

## Validación automática

GitHub Actions ejecutó `calibracion/validar_resultados_v5.py` con conclusión **success**.

```text
VALIDACION V5: OK
- excelente: A/B idénticos por criterio — 82/100
- flojo: A/B idénticos por criterio — 9/100
- tramposo: A/B idénticos por criterio — 31/100
- repo_externo: A/B idénticos por criterio — 98/100
- bordes NO_EVALUABLE: ref, ruta y repo inexistentes — OK
- SC-02 V5: implementación local reproducible reconocida — OK
```

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

El plan previo de tres evaluadores independientes se conserva como propuesta metodológica histórica en los archivos de instrucciones, pero no fue el procedimiento finalmente ejecutado. `calibracion.md` documenta explícitamente la desviación y el procedimiento real.

## Pendiente antes de integrar

- [ ] Revisión final del grupo sobre el PR y su diff.
- [ ] Confirmar que los aportes del equipo sean legibles en historial/PRs.
- [ ] Decidir en equipo si corresponde sacar el PR de draft e integrar.

## Cierre

No queda una mejora técnica o de calibración material que justifique modificar la candidata V5 antes de la revisión del grupo. El `FREEZE_V5` permanece inalterado y `main` no debe tocarse hasta decisión explícita del equipo.
