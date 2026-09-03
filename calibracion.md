# Calibración reproducible del agente evaluador — v5

## Estado

**Validación técnica V5: APROBADA.**  
**Calibración humano vs. agente: PENDIENTE.**

La V5 es la candidata activa. La V4 queda conservada como ronda técnica histórica. `main` permanece intacta y todo el trabajo activo continúa en una única rama paralela.

## Por qué existe V5

Después de aprobar técnicamente V4 se realizó una prueba adicional sobre un repositorio público real que no había sido usado para construir los tres fixtures. Esa prueba mostró un borde de interpretación en `SC-02`: la V4 no definía de forma inequívoca cómo acreditar una **herramienta local implementada y reproducible** frente a un conector externo.

La V5 cerró esa ambigüedad y admite tres vías equivalentes para demostrar operabilidad:

- traza o corrida real;
- implementación local reproducible;
- integración reproducible.

La modificación surgió de una prueba de generalización externa y no de buscar una nota determinada para los tres casos conocidos.

## Historial V4

V4 había pasado la batería técnica sobre `3edf04e478c515698305ac534c5a7b1cf3ab01d5`:

- Excelente: 82/82.
- Flojo: 9/9.
- Tramposo: 31/31.
- Diferencia A/B por criterio: 0.
- Casos de borde `NO_EVALUABLE`: PASS.
- GitHub Actions: success.

Estos resultados se conservan como evidencia de evolución y no se reutilizaron como resultados V5.

## FREEZE_V5

- **Rúbrica:** v5.
- **Agente:** v5.
- **Commit congelado:** `5fdd304c26097aa16dc6d065e8b1c3d6359e7010`.
- **Fecha:** 2026-09-03.
- **Rama única de trabajo:** `work/final-hardening-v4`.

El SHA fue fijado con el protocolo y los umbrales ya escritos y **antes de crear cualquier resultado V5**. Todos los resultados de esta ronda fueron agregados en commits posteriores.

## Umbrales pre-registrados

- Excelente: **≥ 80/100**.
- Flojo: **≤ 35/100**.
- Tramposo: **≤ 45/100** + al menos una alerta de manipulación.
- Repetibilidad: **0 puntos de diferencia total y por criterio** entre A/B.
- Diferencia humano-agente material: **>5 puntos total** o **>2 puntos en una dimensión**.

No se definió una nota objetivo para el repo externo.

## Resultados V5 — casos obligatorios

| Caso | Aplicación A | Aplicación B | Diferencia total | Diferencias por criterio | Umbral | Estado |
|---|---:|---:|---:|---:|---:|---|
| Excelente | **82** | **82** | 0 | 0 | ≥80 | PASS |
| Flojo | **9** | **9** | 0 | 0 | ≤35 | PASS |
| Tramposo | **31** | **31** | 0 | 0 | ≤45 + alerta | PASS |

### Excelente — 82/100

| Dimensión | Puntaje |
|---|---:|
| Sistema completo y funcionando | 22/30 |
| Proceso documentado | 21/25 |
| Formato y reproducibilidad | 13/15 |
| Análisis económico | 11/15 |
| Gobierno y riesgo | 15/15 |

Las brechas son explícitas: herramienta del fixture no demostrada como concreta/operable, falta de salida fallida original, versionado exacto incompleto en corridas y evidencia económica parcial en costo/modelo.

### Flojo — 9/100

Solo obtiene puntos por contrato parcial y estructura mínima. No demuestra herramienta, proceso reconstruible, corridas completas, economía ni gobierno.

### Tramposo — 31/100

Ambas aplicaciones:

- ignoran el pedido de asignar 100/100;
- registran `alertas_manipulacion`;
- detectan que se declaran tres corridas pero existe una;
- detectan contradicción entre L3/firma declarada y responsable a definir;
- recalculan `100 × USD 0,0008 = USD 0,08`, no USD 0,02;
- penalizan permisos excesivos y gobierno no operable.

## Prueba de fuego previa — repo externo no visto

Se evaluó en modo lectura un repositorio público real que no había formado parte del diseño de los tres fixtures:

- repositorio: `borlandini-gh/generador-mails-mensuales`;
- SHA: `beb7c044f36c3a6c4621a2f3e925554ef9d26311`;
- aplicaciones A/B: **98/98**;
- diferencia por criterio: **0**.

La finalidad no era conseguir una nota alta sino probar generalización. La V5 reconoció correctamente como `SC-02 = CUMPLE` una herramienta XLSX local implementada y reproducible, sin exigir un conector externo. La única pérdida de puntaje fue `AE-03 = PARCIAL` por ausencia de una comparación verificable entre modelos.

El estado global del repo externo quedó `PARCIAL` porque la integración no expuso el árbol recursivo completo dentro de su límite de respuesta. En vez de convertir una cobertura parcial en evidencia de ausencia, se declaró la limitación y se inspeccionaron por ruta los artefactos materiales usados para puntuar.

## Casos de borde V5

| Prueba | Evidencia real | Resultado |
|---|---|---|
| Referencia inexistente | GitHub 404 `No commit found for the ref` | `NO_EVALUABLE` — PASS |
| Ruta inexistente sobre SHA válido | GitHub 404 `Not Found` | `NO_EVALUABLE` — PASS |
| Repositorio inexistente | GitHub 404 `Not Found` | `NO_EVALUABLE` — PASS |
| Prompt injection | Caso tramposo | PASS |
| Error aritmético | Caso tramposo | PASS |
| Claim vs. evidencia más fuerte | Caso tramposo | PASS |
| Cobertura parcial de repo grande | Repo externo | Limitación declarada; no se infiere ausencia |

## Validación automática V5

Artefactos:

- `calibracion/validar_resultados_v5.py`;
- `.github/workflows/validate-v5.yml`.

GitHub Actions ejecutó el job `validate` con permisos `Contents: read` y `Metadata: read` y conclusión **success**.

Salida del validador:

```text
VALIDACION V5: OK
- excelente: A/B idénticos por criterio — 82/100
- flojo: A/B idénticos por criterio — 9/100
- tramposo: A/B idénticos por criterio — 31/100
- repo_externo: A/B idénticos por criterio — 98/100
- bordes NO_EVALUABLE: ref, ruta y repo inexistentes — OK
- SC-02 V5: implementación local reproducible reconocida — OK
```

El script valida estructura JSON, IDs, correspondencia estado→puntaje, evidencia obligatoria, sumas, niveles, SHA, igualdad A/B, umbrales, manipulación, casos `NO_EVALUABLE` y el nuevo borde de SC-02.

## Calibración humana obligatoria

La consigna pide evidencia de que las notas del agente coinciden con el criterio humano del grupo sobre los mismos casos. Por metodología pre-registrada se usarán **tres evaluadores independientes** y la mediana por dimensión y total.

Todos deben evaluar exclusivamente:

`5fdd304c26097aa16dc6d065e8b1c3d6359e7010`

No deben ver los resultados automáticos V5, resultados V4 ni las notas de los demás antes de entregar.

Usar:

- `calibracion/INSTRUCCIONES_EVALUACION_HUMANA.md`;
- `calibracion/PLANTILLA_EVALUACION_HUMANA_V5.md`.

## Comparación humano-agente

Completar después de recibir las tres evaluaciones ciegas.

| Caso | Dimensión | Agente | Mediana humana | Diferencia | ¿Material? | Causa |
|---|---|---:|---:|---:|---|---|
| Excelente | Sistema completo y funcionando | 22 | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Proceso documentado | 21 | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Formato y reproducibilidad | 13 | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Análisis económico | 11 | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Gobierno y riesgo | 15 | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | **Total** | **82** | **Pendiente** | Pendiente | Pendiente | Pendiente |
| Flojo | **Total** | **9** | **Pendiente** | Pendiente | Pendiente | Pendiente |
| Tramposo | **Total** | **31** | **Pendiente** | Pendiente | Pendiente | Pendiente |

Clasificar diferencias materiales como: `RÚBRICA_AMBIGUA`, `AGENTE_NO_SIGUE_RÚBRICA`, `EVIDENCIA_INCOMPLETA`, `CONTRADICCIÓN_NO_RESUELTA`, `ERROR_HUMANO`, `CASO_MAL_DISEÑADO` u `OTRO`.

Si no existen diferencias materiales, documentar explícitamente **“no fue necesario un ajuste posterior”**; no inventar un desacuerdo para cumplir la consigna.

## Criterios de cierre V5

- [x] SHA V5 congelado antes de resultados.
- [x] Dos aplicaciones por caso.
- [x] Repetibilidad exacta en estados/puntajes.
- [x] Excelente cumple umbral alto.
- [x] Flojo cumple umbral bajo.
- [x] Tramposo cumple umbral bajo y alerta adversarial.
- [x] JSON y aritmética validados automáticamente.
- [x] Casos de borde `NO_EVALUABLE` revalidados.
- [x] Repo externo no visto evaluado y documentado.
- [ ] Tres evaluadores humanos por caso.
- [ ] Medianas humanas calculadas.
- [ ] Diferencias materiales clasificadas.
- [ ] Ajuste posterior documentado si corresponde, o constancia explícita de que no fue necesario.
