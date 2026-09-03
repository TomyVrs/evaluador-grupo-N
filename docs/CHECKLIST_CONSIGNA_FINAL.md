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
- [x] Alcance del workflow documentado sin exageración: valida artefactos guardados, no ejecuta de forma autónoma una nueva evaluación LLM.
- [x] Ejecución sobre repo público real no usado en el diseño de fixtures.

**Evidencia:** `agente/`, `.github/workflows/validate-v5.yml`, `calibracion/validar_resultados_v5.py`, `calibracion/resultados_v5/repo_externo_*.json`.

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

**Evidencia:** `calibracion/resultados_v5/`, `calibracion.md`.

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
- [x] No se inventaron evaluadores ni resultados humanos adicionales.

**Evidencia:** `calibracion.md`, `calibracion/INSTRUCCIONES_EVALUACION_HUMANA.md`, `calibracion/PLANTILLA_EVALUACION_HUMANA_V5.md`.

Nota: el plan previo de tres evaluadores independientes se conserva como propuesta metodológica histórica, pero no fue el procedimiento finalmente ejecutado. Los archivos de instrucciones/plantilla quedan identificados como protocolo previo; `calibracion.md` documenta el método real.

## 5. Proceso grupal — 15%

**Exigencia:** historia de commits que muestre aportes, evolución de la rúbrica, iteraciones y decisiones.

- [x] Historial previo contiene evolución e integración por PR.
- [x] Evolución V1/V2 → V3 → V4 → V5 documentada.
- [x] La causa de V5 está documentada: ambigüedad de SC-02 detectada en un repo externo.
- [x] V5 fue congelada antes de generar resultados.
- [x] Correcciones, pruebas y documentación son commits separados, no un único commit final.
- [x] Se documenta que el hardening V5 fue implementado desde `TomyVrs`; no se simula coautoría.
- [ ] Antes de integrar, las revisiones y aportes reales de otros integrantes deben quedar visibles en el PR mediante comentarios, reviews, aprobaciones o cambios concretos.
- [ ] Antes de entrega, el equipo revisa que la historia completa de commits/PRs permita entender quién hizo y revisó qué.

## Estructura obligatoria

- [x] `README.md` + integrantes.
- [x] `rubrica.md`.
- [x] `agente/`.
- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] `calibracion.md`.

## Pendientes reales

1. Revisión grupal final del PR #13, su diff y el historial.
2. Dejar evidencia auténtica de esas revisiones/aportes en GitHub.
3. Decidir en equipo cuándo sacar el PR de draft e integrar.
4. Antes del cierre, confirmar que la candidata final quedó integrada en `main`.
5. Hasta esa decisión, `main` permanece intacta y no se crean ramas nuevas.
