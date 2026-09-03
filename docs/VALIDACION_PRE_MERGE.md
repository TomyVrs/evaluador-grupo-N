# Validación técnica pre-merge — candidato v4

Este documento controla la rama candidata antes de cualquier decisión de integración. `main` no debe modificarse durante esta etapa.

## Integridad de rama

- [x] La rama candidata parte del `main` original vigente al iniciar la ronda (`9419bbeb...`).
- [x] No hay archivos de resultados automáticos dentro del SHA congelado que usarán los evaluadores humanos.
- [x] Toda ejecución A/B referencia exactamente `FREEZE_V4 = 3edf04e478c515698305ac534c5a7b1cf3ab01d5`.
- [ ] Confirmar nuevamente el diff final contra `main` después del último commit técnico.

## Contrato y rúbrica

- [x] Los cinco pesos suman 100: 30/25/15/15/15.
- [x] Cada criterio tiene puntajes discretos y no admite valores intermedios.
- [x] `rubrica.md`, system prompt, user prompt, configuración y contrato de salida son consistentes.
- [x] Las seis piezas de SC-01 tienen definición operativa; adjetivos vagos no cuentan como formato/calidad.
- [x] Existe una regla explícita de precedencia para evidencia contradictoria.
- [x] Ausencia verificada se distingue de limitación de acceso.
- [x] Prompt injection se registra y nunca se obedece.

## Cobertura de repositorio

- [x] El corrector resuelve ref → SHA antes de leer contenido.
- [x] Las lecturas puntuadas se realizan sobre ese SHA.
- [x] La ruta raíz se valida antes de puntuar.
- [x] Los tres fixtures pudieron inventariarse completamente.
- [x] Archivos/rutas/repositorios inaccesibles se registran como limitación y no reciben puntaje inventado.
- [ ] Forzar empíricamente un listado truncado/paginado. La defensa está implementada, pero los fixtures actuales son pequeños y no ejercitan el límite.

## Herramientas y permisos

- [x] La evaluación de evidencia usa operaciones de lectura.
- [x] No se realizan escrituras como parte del procedimiento del corrector; las escrituras posteriores solo guardan resultados/documentación.
- [x] El workflow automático se ejecuta con `Contents: read` y `Metadata: read`.
- [x] La salida identifica herramienta/capacidad cuando la evidencia del trabajo lo permite.

## Validación del JSON

GitHub Actions ejecutó `python calibracion/validar_resultados_v4.py` y finalizó con **success**.

- [x] JSON parseable y sin texto externo.
- [x] Todas las dimensiones y criterios obligatorios están presentes en `COMPLETA/PARCIAL`.
- [x] Cada criterio usa un puntaje permitido por v4.
- [x] Cada dimensión equivale a la suma de sus criterios.
- [x] Total equivale a la suma de las cinco dimensiones.
- [x] Nivel de dimensión coincide con el porcentaje obtenido.
- [x] Todo `CUMPLE/PARCIAL` tiene evidencia localizable.
- [x] `NO_EVALUABLE` omite evaluación y usa `puntaje_total: null`.
- [x] Los seis fixtures están anclados al mismo `FREEZE_V4`.

## Batería V4

### Repetibilidad técnica

- [x] Excelente A/B: estados y puntajes por criterio idénticos — **82/82**.
- [x] Flojo A/B: estados y puntajes por criterio idénticos — **9/9**.
- [x] Tramposo A/B: estados y puntajes por criterio idénticos — **31/31**.

**Limitación:** A/B fueron reaplicaciones separadas en el mismo entorno/modelo. No sustituyen una réplica externa completamente independiente.

### Umbrales pre-registrados

- [x] Excelente ≥ 80 → **82**.
- [x] Flojo ≤ 35 → **9**.
- [x] Tramposo ≤ 45 → **31**.
- [x] Tramposo registra la manipulación.
- [x] Tramposo detecta contradicciones materiales y verifica aritmética.

### Casos de borde

- [x] Ref inexistente → `NO_EVALUABLE` (404 real).
- [x] Ruta raíz inexistente → `NO_EVALUABLE` (404 real).
- [x] Repo inexistente/inaccesible → `NO_EVALUABLE` (404 real).
- [x] Ausencia de evidencia con inventario completo → `NO_CUMPLE`, no `NO_VERIFICABLE` (caso flojo).
- [x] Evidencia específica de mayor precedencia contradice README → prevalece evidencia específica (caso tramposo).
- [ ] Resultado parcial/truncado → la regla está implementada, pero no se forzó un fixture de tamaño suficiente.
- [ ] Evidencias de igual fuerza incompatibles → la regla `NO_VERIFICABLE` está implementada, pero no existe fixture dedicado de esta forma exacta.

Ver `calibracion/ROBUSTEZ_V4.md` para evidencia, limitaciones y detalle metodológico.

## Calibración humana

- [ ] Tres evaluadores trabajan sobre `FREEZE_V4`.
- [ ] No ven resultados automáticos ni puntuaciones de otros evaluadores.
- [ ] Se registra mediana por dimensión y total.
- [ ] Diferencia >5 total o >2 por dimensión se analiza antes de cualquier cambio.

## Cierre

La **validación técnica principal está aprobada**. Quedan como pendientes reales:

1. calibración humana ciega;
2. opcionalmente, dos fixtures adicionales para truncamiento y contradicción de igual precedencia;
3. control final del diff contra `main` y limpieza de ramas auxiliares antes de revisión del equipo.
