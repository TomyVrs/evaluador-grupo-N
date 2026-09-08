# Checklist final contra la consigna — Agente Evaluador

Este documento mapea la candidata **V5** contra las cuatro piezas y cinco criterios de evaluación del parcial. No reemplaza la consigna oficial ni `calibracion.md`.

## 1. Rúbrica ejecutable — 25%

**Exigencia:** escalas por nivel, evidencia exigida por cada puntaje, ejemplos alto/bajo y precisión suficiente para aplicar igual dos veces.

- [x] Cinco dimensiones y pesos oficiales 30/25/15/15/15.
- [x] Puntajes discretos por criterio.
- [x] Estados `CUMPLE`, `PARCIAL`, `NO_CUMPLE`, `NO_VERIFICABLE` definidos operativamente.
- [x] Ejemplos altos y bajos por dimensión.
- [x] Precedencia ante evidencia contradictoria.
- [x] Distinción entre ausencia comprobada y falta de acceso.
- [x] Seis piezas de SC-01 definidas operativamente.
- [x] SC-02 tecnológicamente neutral: traza/corrida, implementación local reproducible o integración reproducible.
- [x] A/B con diferencia 0 por criterio en los tres casos obligatorios.
- [x] A/B con diferencia 0 sobre un repo externo no visto.

**Evidencia:** `rubrica.md`, `calibracion.md`, `calibracion/resultados_v5/`.

## 2. Agente corrector — 25%

**Exigencia:** recibe repo real y devuelve puntaje por dimensión, justificación con evidencia y mejora concreta en formato estructurado estable.

- [x] `agente/system_prompt.md` V5.
- [x] `agente/user_prompt.md` V5.
- [x] `agente/configuracion.md` V5.
- [x] `agente/contrato_salida.md` V5.
- [x] GitHub en modo lectura durante evaluación.
- [x] Resolución ref → SHA antes de puntuar.
- [x] Inventario antes de afirmar ausencia.
- [x] Defensa ante cobertura/truncamiento incompleto.
- [x] JSON estructurado validado automáticamente.
- [x] Bordes `NO_EVALUABLE` para ref, ruta y repo inexistentes.
- [x] Workflow V5 con permisos de lectura.
- [x] Workflow V5 preparado para validar cambios relevantes en la rama activa y en `main`.
- [x] Alcance del workflow documentado sin exageración: valida artefactos guardados y el runner local; no ejecuta autónomamente una nueva evaluación LLM.
- [x] Ejecución sobre repo público real no usado en el diseño de fixtures.
- [x] Runner ejecutable local en `evaluador-web/` para que un tercero pueda evaluar repositorios sin API paga ni credenciales del equipo.
- [x] Procesamiento por lote, SHA exacto, evidencia, feedback, inconsistencias, alertas y exportación CSV/JSON.

**Evidencia:** `agente/`, `evaluador-web/`, `.github/workflows/validate-v5.yml`, `calibracion/validar_resultados_v5.py`, `calibracion/resultados_v5/repo_externo_*.json`.

## 3. Tres casos de prueba — 20%

**Exigencia:** excelente alto, flojo bajo y tramposo detectado.

- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] Excelente A/B: **82/82**.
- [x] Flojo A/B: **9/9**.
- [x] Tramposo A/B: **31/31**.
- [x] Tramposo registra prompt injection.
- [x] Tramposo detecta claims contradictorios.
- [x] Tramposo recalcula el error económico.
- [x] Los tres conservan los mismos resultados V4→V5, sin regresión al cerrar SC-02.
- [x] `evaluador-web/test.mjs` reproduce **82 / 9 / 31** con el motor local contra los casos incluidos.
- [x] GitHub Actions run #3 `33822794904` ejecutó ese test con conclusión **success**.

**Evidencia:** `calibracion/resultados_v5/`, `calibracion.md`, `evaluador-web/test.mjs`.

## 4. Calibración — 15%

**Exigencia:** comparar notas del agente con criterio humano del grupo, registrar desacuerdos, ajustes y resultado posterior.

- [x] Protocolo V5 pre-registrado antes de observar resultados V5.
- [x] `FREEZE_V5 = 5fdd304c26097aa16dc6d065e8b1c3d6359e7010` sin resultados V5 dentro del árbol evaluado.
- [x] Resultados automáticos V5 conservados en commits posteriores.
- [x] Umbral de diferencia material fijado antes de comparación humana.
- [x] Evaluación humana realizada sobre los mismos tres casos y el mismo freeze.
- [x] Resultados humanos iniciales registrados: 78 / 5 / 31.
- [x] Resultados del agente comparados: 82 / 9 / 31.
- [x] Desacuerdos materiales identificados y clasificados.
- [x] Excelente `PD-03`: `ERROR_HUMANO`; adjudicado a `CUMPLE`.
- [x] Flojo `SC-01`: `ERROR_HUMANO`; adjudicado a `PARCIAL`.
- [x] Resultado humano adjudicado final: 82 / 9 / 31.
- [x] Constancia explícita de que no fue necesario modificar agente ni rúbrica.
- [x] Limitación metodológica documentada: un evaluador humano, no ciego por conocimiento previo de totales.
- [x] No se inventaron evaluadores ni resultados humanos adicionales dentro de la calibración cerrada.
- [x] La evaluación posterior de Guillermo (Excelente 85/100) se identifica como revisión independiente post-calibración y no reemplaza la ronda congelada.

**Evidencia:** `calibracion.md`, `calibracion/INSTRUCCIONES_EVALUACION_HUMANA.md`, `calibracion/PLANTILLA_EVALUACION_HUMANA_V5.md`, commit grupal `40f88a8...`.

Nota: el plan previo de tres evaluadores independientes se conserva como propuesta metodológica histórica, pero no fue el procedimiento finalmente ejecutado. La revisión posterior de Guillermo constituye evidencia adicional de proceso grupal, no una reescritura de esa calibración.

## 5. Proceso grupal — 15%

**Exigencia:** historia de commits que muestre aportes, evolución de la rúbrica, iteraciones y decisiones.

- [x] Historial previo contiene evolución e integración por PR.
- [x] Evolución V1/V2 → V3 → V4 → V5 documentada.
- [x] La causa de V5 está documentada: ambigüedad de SC-02 detectada en un repo externo.
- [x] V5 fue congelada antes de generar resultados.
- [x] Correcciones, pruebas y documentación son commits separados, no un único commit final.
- [x] Se documenta que el hardening V5 fue implementado desde `TomyVrs`; no se simula coautoría.
- [x] Guillermo Rojas Yenni agregó una revisión humana independiente verificable en `main` (`40f88a8...`).
- [x] El PR #13 tiene reviewers solicitados de varios integrantes del grupo.
- [ ] Las revisiones/aportes reales restantes deben quedar visibles mediante comentarios, reviews, aprobaciones u observaciones concretas.
- [ ] Antes de entrega, el equipo revisa que la historia completa de commits/PRs permita entender quién hizo y revisó qué.

## Estructura obligatoria

- [x] `README.md` + integrantes.
- [x] `rubrica.md`.
- [x] `agente/`.
- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] `calibracion.md`.
- [x] `evaluador-web/` como runner adicional ejecutable desde el repositorio.

## Ejecución para el profesor

```text
cd evaluador-web
npm install
npm test
npm start
```

Abrir `http://localhost:5173` y pegar los repositorios públicos a evaluar. No requiere tarjeta, Vercel ni API de IA paga.

## Pendientes reales

1. Revisión grupal final del PR #13, su diff, el historial y el runner local.
2. Consolidar la revisión post-calibración de Guillermo sin mezclarla con la calibración congelada.
3. Dejar evidencia auténtica de las revisiones/aportes restantes en GitHub.
4. Decidir en equipo cuándo sacar el PR de draft e integrar.
5. Antes del cierre, confirmar que la versión final integrada en `main` conserva las contribuciones y vuelve a pasar las validaciones.
6. No crear ramas nuevas ni mergear sin decisión explícita del equipo.
