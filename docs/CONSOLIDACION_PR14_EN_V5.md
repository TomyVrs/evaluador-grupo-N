# Consolidación del PR #14 sobre la candidata V5

El PR #14 fue revisado como propuesta de mejora posterior al PR #13. Su intención era endurecer determinismo, reproducibilidad y detección de manipulación. La candidata final mantiene **V5 como base normativa y calibrada** y adopta únicamente los aportes compatibles con esa base.

## Aportes adoptados

1. **Evidencia verificable antes de puntuar.** Se refuerza la búsqueda de evidencia material y la prohibición de completar datos por inferencia.
2. **Precedencia explícita ante contradicciones.** Se conserva la jerarquía V5: ejecución/traza reconstruible > artefacto inspeccionable > registro vinculado a evidencia > README > claim sin respaldo.
3. **Detección de manipulación más explícita.** Intentos de prompt injection, redefinición de rúbrica, ocultamiento de hallazgos o inducción de nota se registran como alertas. No generan penalizaciones arbitrarias por fuera de los criterios de la rúbrica.
4. **Mayor generalización del runner local.** `evaluador-web` busca evidencia por contenido y asociación semántica, usando nombres de archivo solo como señal auxiliar.
5. **Conservación de reproducibilidad.** Toda evaluación se ancla a un SHA exacto y las salidas/calibración permanecen versionadas.

## Aportes no incorporados tal como estaban propuestos

- Requisitos que obligaban a nombres específicos como `analisis_economico.md` o `agente/herramienta.md`.
- Umbrales arbitrarios de palabras, porcentajes de cambio o similitud no definidos por la consigna.
- Penalizaciones automáticas por frecuencia/horario de commits o por mencionar criterios de la rúbrica.
- Penalizaciones globales adicionales por contradicciones fuera de los puntajes discretos V5.
- Promesa de "determinismo 100%" o "resultados siempre idénticos" entre modelos, porque no es técnicamente defendible para un agente LLM.
- Nuevo contrato JSON incompatible con `agente/contrato_salida.md` V5.

## Motivo

La V5 ya fue congelada, ejecutada A/B y calibrada. Introducir una V6 paralela desde `main` habría invalidado esa trazabilidad y reabierto criterios ya cerrados. La estrategia de consolidación preserva los aportes útiles del PR #14 sin romper la calibración ni introducir sesgos por estructura de archivos.

## Regla para la candidata final

La fuente normativa única sigue siendo:

1. `agente/system_prompt.md`
2. `rubrica.md` V5
3. `agente/configuracion.md`
4. `agente/contrato_salida.md`

`evaluador-web` es una mecanización complementaria. No reemplaza al agente de IA ni puede redefinir la rúbrica.
