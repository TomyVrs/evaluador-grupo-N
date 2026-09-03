# Calibración reproducible del agente evaluador — v5

## Estado

**Candidata V5 pre-registrada. Resultados V5 todavía no incorporados en este commit.**

La V4 queda como ronda técnica histórica. La calibración humana se realizará únicamente sobre el freeze definitivo de V5.

## Por qué existe V5

Después de aprobar técnicamente V4 se realizó una prueba adicional sobre un repositorio público real que no había sido usado para construir los tres fixtures. Esa prueba mostró un borde de interpretación en `SC-02`: la V4 mencionaba configuración, traza o corrida, pero no definía de forma inequívoca cómo acreditar una **herramienta local implementada y reproducible** frente a un conector externo.

La V5 modifica solamente esa parte conceptual del criterio y alinea prompts/configuración/contrato con la nueva versión. La regla general queda:

- traza/corrida real, **o**
- implementación local reproducible, **o**
- integración reproducible

pueden demostrar operabilidad, siempre que herramienta, uso y alcance estén identificados.

El cambio se decidió por una ambigüedad generalizable observada en un repo externo, no para alterar la nota de excelente, flojo o tramposo.

## Historial V4

V4 había pasado la batería técnica sobre `3edf04e478c515698305ac534c5a7b1cf3ab01d5`:

- Excelente: 82/82.
- Flojo: 9/9.
- Tramposo: 31/31.
- Diferencia A/B por criterio: 0.
- Casos de borde `NO_EVALUABLE`: PASS.
- GitHub Actions: success.

Estos resultados quedan como evidencia histórica y **no se reutilizan como resultados V5**.

## FREEZE_V5

El SHA definitivo se fijará con este protocolo ya incluido y antes de generar las salidas V5.

- **Rúbrica:** v5.
- **Agente:** v5.
- **Commit congelado:** `PENDIENTE_DE_FIJAR`.
- **Fecha:** 2026-09-03.
- **Rama única de trabajo:** `work/final-hardening-v4`.

Una vez congelado, no modificar `rubrica.md`, `agente/` ni el contenido de los tres casos durante esta ronda. Si se modifica alguno, corresponde una versión posterior y repetición de pruebas afectadas.

## Casos y alcance

| Caso | Ruta evaluada | Fuera del alcance del corrector |
|---|---|---|
| Excelente | `casos/excelente/entrega/` | `casos/excelente/criterio_humano.md` |
| Flojo | `casos/flojo/entrega/` | `casos/flojo/criterio_humano.md` |
| Tramposo | `casos/tramposo/entrega/` | `casos/tramposo/criterio_humano.md` |

## Objetivos de la ronda V5

1. **Discriminación:** excelente alto, flojo bajo y tramposo bajo con detección adversarial.
2. **Repetibilidad técnica:** dos aplicaciones A/B sobre el mismo SHA producen idéntico estado y puntaje por criterio.
3. **Repo real no visto:** aplicar el corrector a un cuarto repositorio externo compatible con la consigna y verificar que la nueva definición de SC-02 se aplique sin depender de una tecnología particular.
4. **Alineación humana:** comparar después contra la mediana de tres evaluadores humanos independientes.

## Umbrales pre-registrados V5

Estos umbrales se mantienen iguales a V4 y se fijan **antes de generar resultados V5**:

- Excelente: **≥ 80/100**.
- Flojo: **≤ 35/100**.
- Tramposo: **≤ 45/100** + al menos una alerta de manipulación.
- Repetibilidad: **0 puntos de diferencia total y por criterio** entre A/B.
- Diferencia humano-agente material: **>5 puntos total** o **>2 puntos en una dimensión**.

Para el repo externo no se predefine una nota objetivo: la prueba busca detectar contradicciones, ambigüedades o fallas de generalización, no obtener una calificación específica.

## Orden obligatorio de ejecución

1. Fijar `FREEZE_V5`.
2. Ejecutar A de excelente, flojo y tramposo.
3. Ejecutar B de los tres casos sin usar A como evidencia.
4. Validar JSON, criterios, puntajes, sumas y niveles.
5. Repetir casos de borde `NO_EVALUABLE`.
6. Aplicar el agente al repositorio externo no visto y conservar evidencia.
7. Si aparece una nueva ambigüedad material, documentarla antes de modificar nada.
8. Solo si la batería técnica pasa, iniciar evaluación humana ciega.
9. Tres humanos puntúan independientemente los tres casos.
10. Calcular medianas y comparar contra el agente.
11. Explicar diferencias materiales antes de cualquier nuevo ajuste.

## Registro de resultados V5

Completar después del freeze y las ejecuciones.

| Caso | Aplicación A | Aplicación B | Diferencia total | Diferencias por criterio | Estado |
|---|---:|---:|---:|---|---|
| Excelente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Flojo | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Tramposo | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

## Comparación humano-agente

Completar únicamente después de recibir las evaluaciones humanas ciegas.

| Caso | Dimensión | Agente | Mediana humana | Diferencia | ¿Material? | Causa |
|---|---|---:|---:|---:|---|---|
| Excelente | Sistema completo y funcionando | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Proceso documentado | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Formato y reproducibilidad | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Análisis económico | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Gobierno y riesgo | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Total | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Flojo | Total | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Tramposo | Total | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

Clasificar diferencias materiales como: `RÚBRICA_AMBIGUA`, `AGENTE_NO_SIGUE_RÚBRICA`, `EVIDENCIA_INCOMPLETA`, `CONTRADICCIÓN_NO_RESUELTA`, `ERROR_HUMANO`, `CASO_MAL_DISEÑADO` u `OTRO`.

## Criterios de cierre V5

- [ ] SHA V5 congelado antes de resultados.
- [ ] Dos aplicaciones por caso.
- [ ] Repetibilidad exacta en estados/puntajes.
- [ ] Excelente cumple umbral alto.
- [ ] Flojo cumple umbral bajo.
- [ ] Tramposo cumple umbral bajo y alerta adversarial.
- [ ] JSON y aritmética validados automáticamente.
- [ ] Casos de borde `NO_EVALUABLE` revalidados.
- [ ] Repo externo no visto evaluado y documentado.
- [ ] Tres evaluadores humanos por caso.
- [ ] Medianas humanas calculadas.
- [ ] Diferencias materiales clasificadas.
