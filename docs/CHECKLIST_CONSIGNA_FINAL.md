# Checklist final contra la consigna — Agente Evaluador

Este documento mapea la candidata V4 contra las cuatro piezas y cinco criterios de evaluación del parcial. No reemplaza la consigna oficial ni `calibracion.md`.

## 1. Rúbrica ejecutable — 25%

**Exigencia de la consigna:** escalas por nivel, evidencia exigida por cada puntaje, ejemplos de nivel alto/bajo y precisión suficiente para que el agente la aplique igual dos veces.

- [x] Cinco dimensiones y pesos oficiales 30/25/15/15/15.
- [x] Puntajes discretos por criterio.
- [x] Definiciones operativas de `CUMPLE`, `PARCIAL`, `NO_CUMPLE`, `NO_VERIFICABLE`.
- [x] Ejemplos altos y bajos por dimensión.
- [x] Regla de precedencia ante evidencia contradictoria.
- [x] Distinción entre ausencia comprobada y falta de acceso.
- [x] Las seis piezas de SC-01 tienen definición operativa.
- [x] Prueba A/B técnica con diferencia 0 en todos los criterios de los tres casos.

**Evidencia principal:** `rubrica.md`, `calibracion/ROBUSTEZ_V4.md`.

## 2. Agente corrector — 25%

**Exigencia de la consigna:** recibe un repositorio real y devuelve puntaje por dimensión, justificación con evidencia y mejora concreta en formato estructurado idéntico.

- [x] `agente/system_prompt.md`.
- [x] `agente/user_prompt.md`.
- [x] `agente/configuracion.md`.
- [x] `agente/contrato_salida.md`.
- [x] Acceso GitHub definido como lectura operativa.
- [x] Resolución ref → SHA antes de puntuar.
- [x] Inventario antes de declarar ausencias.
- [x] Salida JSON estructurada y validada automáticamente.
- [x] Casos de borde `NO_EVALUABLE` para ref, ruta y repo inexistentes.
- [x] Workflow automático ejecutado con conclusión `success`.

**Evidencia principal:** `agente/`, `.github/workflows/validate-v4.yml`, `calibracion/validar_resultados_v4.py`.

## 3. Tres casos de prueba — 20%

**Exigencia de la consigna:** excelente alto, flojo bajo y tramposo detectado.

- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] Excelente A/B: 82/82.
- [x] Flojo A/B: 9/9.
- [x] Tramposo A/B: 31/31.
- [x] Tramposo registra prompt injection.
- [x] Tramposo detecta claims contradictorios.
- [x] Tramposo recalcula el error económico.

**Evidencia principal:** `calibracion/resultados_v4/`, `calibracion/ROBUSTEZ_V4.md`.

## 4. Calibración — 15%

**Exigencia de la consigna:** evidencia de comparación entre notas del agente y criterio humano del grupo, desacuerdos, ajustes y resultado posterior.

- [x] Protocolo pre-registrado antes de observar resultados V4.
- [x] SHA congelado sin resultados automáticos dentro de la evidencia evaluada.
- [x] Resultados automáticos conservados.
- [x] Umbral de diferencia material definido antes de la comparación humana.
- [x] Instrucciones para evaluación humana ciega.
- [x] Plantilla humana por criterio.
- [ ] Tres evaluadores humanos puntúan los tres casos.
- [ ] Medianas humanas calculadas.
- [ ] Desacuerdos agente/humano identificados y clasificados.
- [ ] Ajuste posterior documentado si corresponde; si no hay desacuerdo material, documentar explícitamente que no fue necesario ajustar.
- [ ] Resultado final de calibración cerrado.

**Evidencia principal:** `calibracion.md`, `calibracion/INSTRUCCIONES_EVALUACION_HUMANA.md`, `calibracion/PLANTILLA_EVALUACION_HUMANA_V4.md`.

## 5. Proceso grupal — 15%

**Exigencia de la consigna:** historia de commits que muestre quién aportó qué, evolución de la rúbrica, iteraciones y decisiones.

- [x] Historial previo del repo contiene trabajo distribuido e integración por PR.
- [x] Evolución de rúbrica V1/V2 → V3 → V4 documentada en commits.
- [x] La V4 está aislada de `main` durante validación.
- [x] Correcciones y validaciones se conservan como commits separados, no como un único commit final.
- [ ] Antes de entrega, el equipo revisa que los aportes de los integrantes queden representados de forma entendible en historial/PRs.

## Estructura obligatoria

- [x] `README.md` + integrantes.
- [x] `rubrica.md`.
- [x] `agente/`.
- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] `calibracion.md`.

## Pendientes reales antes de considerar terminada la entrega

1. Completar calibración humana ciega.
2. Analizar y documentar diferencias humano/agente.
3. Repetir pruebas solo si un desacuerdo obliga a modificar rúbrica o agente.
4. Revisión final grupal del diff y del historial.
5. Limpiar ramas auxiliares antiguas del fork manualmente si la integración no permite borrarlas.
6. Decidir en equipo cuándo y cómo integrar la candidata; hasta entonces `main` permanece intacta.
