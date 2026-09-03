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
- [x] Workflow V5 con conclusión `success` y permisos de lectura.
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
- [x] Instrucciones de evaluación humana ciega actualizadas a V5.
- [x] Plantilla humana V5 por criterio.
- [ ] Tres evaluadores humanos puntúan los tres casos.
- [ ] Medianas humanas calculadas.
- [ ] Desacuerdos agente/humano identificados y clasificados.
- [ ] Ajuste posterior documentado si corresponde, o constancia de que no fue necesario.
- [ ] Resultado final de calibración cerrado.

**Evidencia:** `calibracion.md`, `calibracion/INSTRUCCIONES_EVALUACION_HUMANA.md`, `calibracion/PLANTILLA_EVALUACION_HUMANA_V5.md`.

## 5. Proceso grupal — 15%

**Exigencia:** historia de commits que muestre aportes, evolución de la rúbrica, iteraciones y decisiones.

- [x] Historial previo contiene trabajo distribuido e integración por PR.
- [x] Evolución V1/V2 → V3 → V4 → V5 documentada.
- [x] La causa de V5 está documentada: ambigüedad de SC-02 detectada en un repo externo.
- [x] V5 fue congelada antes de generar resultados.
- [x] Correcciones, pruebas y documentación son commits separados, no un único commit final.
- [x] `main` permanece fuera de la ronda de endurecimiento/calibración.
- [ ] Antes de entrega, el equipo revisa que los aportes de integrantes sean legibles en historial/PRs.

## Estructura obligatoria

- [x] `README.md` + integrantes.
- [x] `rubrica.md`.
- [x] `agente/`.
- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] `calibracion.md`.

## Pendientes reales

1. Completar calibración humana ciega V5.
2. Calcular medianas y documentar diferencias.
3. Modificar el agente solo si la evidencia humana descubre una falla material.
4. Revisión grupal final de diff e historial.
5. Limpiar manualmente ramas auxiliares antiguas del fork si se desea dejar solo `main` + rama activa.
6. Decidir en equipo cuándo integrar; hasta entonces `main` permanece intacta.
