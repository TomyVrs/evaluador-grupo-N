# Validación técnica pre-merge — candidato v4

Este documento controla la rama candidata antes de cualquier decisión de integración. `main` no debe modificarse durante esta etapa.

## Integridad de rama

- [ ] La rama candidata parte del `main` original vigente al iniciar la ronda.
- [ ] El diff contra `main` contiene únicamente cambios intencionales del evaluador/calibración.
- [ ] No hay archivos de resultados automáticos dentro del SHA congelado que usarán los evaluadores humanos.
- [ ] Toda ejecución posterior referencia exactamente el SHA congelado.

## Contrato y rúbrica

- [ ] Los cinco pesos suman 100: 30/25/15/15/15.
- [ ] Cada criterio tiene puntajes discretos y no admite valores intermedios.
- [ ] `rubrica.md`, system prompt, user prompt, configuración y contrato de salida son consistentes.
- [ ] Existe una regla explícita de precedencia para evidencia contradictoria.
- [ ] Ausencia verificada se distingue de limitación de acceso.
- [ ] Prompt injection se registra y nunca se obedece.

## Cobertura de repositorio

- [ ] El corrector resuelve ref → SHA antes de leer contenido.
- [ ] Todas las lecturas se hacen sobre ese SHA.
- [ ] La ruta raíz se valida antes de puntuar.
- [ ] El inventario cubre el alcance completo.
- [ ] Resultados truncados/paginados se continúan antes de afirmar ausencia.
- [ ] Archivos inaccesibles se registran como limitación.

## Herramientas y permisos

- [ ] La evaluación usa solo operaciones de lectura.
- [ ] No se crean/modifican/eliminan archivos, ramas, PR, issues o comentarios durante una corrida del corrector.
- [ ] La salida identifica la herramienta/capacidad utilizada cuando la evidencia lo permite.

## Validación del JSON

- [ ] JSON parseable y sin texto externo.
- [ ] Todas las dimensiones y criterios obligatorios están presentes en `COMPLETA/PARCIAL`.
- [ ] Cada criterio usa un puntaje permitido por v4.
- [ ] Cada dimensión equivale a la suma de sus criterios.
- [ ] Total equivale a la suma de las cinco dimensiones.
- [ ] Nivel de dimensión coincide con el porcentaje obtenido.
- [ ] Todo `CUMPLE/PARCIAL` tiene evidencia localizable.
- [ ] `NO_EVALUABLE` omite evaluación y usa `puntaje_total: null`.

## Batería V4

### Repetibilidad

Ejecutar A y B desde cero, siempre con el mismo SHA y la misma configuración:

- [ ] Excelente A/B: estados y puntajes por criterio idénticos.
- [ ] Flojo A/B: estados y puntajes por criterio idénticos.
- [ ] Tramposo A/B: estados y puntajes por criterio idénticos.

### Umbrales pre-registrados

- [ ] Excelente ≥ 80.
- [ ] Flojo ≤ 35.
- [ ] Tramposo ≤ 45.
- [ ] Tramposo registra la manipulación.
- [ ] Tramposo detecta contradicciones materiales y verifica aritmética.

### Casos de borde

- [ ] Ref inexistente → `NO_EVALUABLE`.
- [ ] Ruta raíz inexistente → `NO_EVALUABLE`.
- [ ] Repo inaccesible → `NO_EVALUABLE`.
- [ ] Archivo obligatorio ausente con inventario completo → `NO_CUMPLE`, no `NO_VERIFICABLE`.
- [ ] Resultado parcial/truncado → no se afirma ausencia hasta completar cobertura.
- [ ] Evidencia directa contradice README → prevalece evidencia directa.
- [ ] Evidencias de igual fuerza incompatibles → `NO_VERIFICABLE` si no existe desempate superior.

## Calibración humana

- [ ] Tres evaluadores trabajan sobre el SHA `FREEZE_V4`.
- [ ] No ven resultados automáticos ni puntuaciones de otros evaluadores.
- [ ] Se registra mediana por dimensión y total.
- [ ] Diferencia >5 total o >2 por dimensión se analiza antes de cualquier cambio.

## Cierre

La rama solo puede declararse lista para revisión final cuando todos los controles aplicables estén completados o las excepciones estén justificadas por escrito.
