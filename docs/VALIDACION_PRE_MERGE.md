# Validación técnica pre-merge — candidata V5

`main` no se modifica durante esta etapa. La candidata activa está en la única rama de trabajo `work/final-hardening-v4`; el nombre de rama se conserva para no crear ramas adicionales, aunque la versión activa del agente sea V5.

## Integridad

- [x] Base original: `9419bbeb41fe4dddc54ebe07249d1a9d4a3a7352`.
- [x] Rama candidata: ahead respecto de la base y **0 behind**.
- [x] `FREEZE_V5 = 5fdd304c26097aa16dc6d065e8b1c3d6359e7010` fue fijado antes de los resultados V5.
- [x] El freeze no contiene resultados automáticos V5.
- [x] Todas las pruebas de los tres casos refieren al mismo freeze.
- [x] V4 se conserva solo como historial técnico; la plantilla humana V4 obsoleta fue eliminada.

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

## Pendiente obligatorio

- [ ] Tres integrantes evalúan independientemente excelente, flojo y tramposo sobre `FREEZE_V5`.
- [ ] No consultan resultados automáticos ni notas de los demás antes de entregar.
- [ ] Se calculan medianas por dimensión y total.
- [ ] Diferencias >5 total o >2 por dimensión se clasifican antes de modificar nada.
- [ ] Si no hay diferencia material, se documenta que no fue necesario ajustar.
- [ ] Si hay una falla real, se versiona una nueva candidata y se repiten las pruebas afectadas.

## Cierre

No queda una mejora técnica material pendiente que justifique seguir modificando la candidata antes de la calibración humana. El siguiente hito es exclusivamente humano + consolidación posterior.
