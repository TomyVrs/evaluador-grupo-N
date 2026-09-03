# Calibración reproducible del agente evaluador

## Estado

**Calibración técnica del agente: ejecutada.**  
**Calibración humano vs. agente: pendiente de las puntuaciones ciegas de tres integrantes.**

No se considera cerrada la calibración hasta completar las medianas humanas y analizar las diferencias.

## Objetivo

Comparar las notas producidas por el agente con el criterio humano del grupo para los tres casos exigidos: excelente, flojo y tramposo. Se conserva por separado la salida del agente y la evaluación humana para evitar contaminar el criterio previo.

## Versión congelada para esta ronda

- **Rúbrica:** `rubrica.md` v3.
- **Commit evaluado:** `e8e0f5cf65d16fc39e1aa80d5c4c7d9dd42dec9c`.
- **Agente:** `agente/system_prompt.md` + `agente/configuracion.md` + `agente/contrato_salida.md`.
- **Fecha:** 2026-09-03.

Las salidas de esta ronda se guardaron después del commit congelado, por lo que no forman parte de la evidencia que el corrector puntuó.

## Alcance de cada caso

| Caso | Ruta evaluada | Archivo excluido |
|---|---|---|
| Excelente | `casos/excelente/entrega/` | `casos/excelente/criterio_humano.md` |
| Flojo | `casos/flojo/entrega/` | `casos/flojo/criterio_humano.md` |
| Tramposo | `casos/tramposo/entrega/` | `casos/tramposo/criterio_humano.md` |

## Procedimiento

1. Congelar la versión de rúbrica y evidencia con un SHA exacto.
2. Excluir los archivos de criterio humano del alcance del corrector.
3. Aplicar la misma rúbrica, system prompt, configuración y contrato a los tres casos.
4. Guardar cada salida JSON original.
5. Tres integrantes puntúan luego cada caso de forma independiente y sin consultar la salida automática.
6. Calcular la mediana humana por dimensión y total.
7. Comparar agente versus mediana humana y registrar toda diferencia.
8. Si aparece una diferencia material, identificar si provino de la rúbrica, del prompt, del contrato, del acceso a evidencia o de interpretación humana.
9. Ajustar únicamente cuando exista una causa documentada y volver a ejecutar los casos afectados.

## Registro de ejecuciones del agente

| Caso | Commit evaluado | Fecha | Salida guardada | Puntaje | Resultado esperado |
|---|---|---|---|---:|---|
| Excelente | `e8e0f5c` | 2026-09-03 | `calibracion/resultados/agente_excelente.json` | **88/100** | Alto — OK |
| Flojo | `e8e0f5c` | 2026-09-03 | `calibracion/resultados/agente_flojo.json` | **5/100** | Bajo — OK |
| Tramposo | `e8e0f5c` | 2026-09-03 | `calibracion/resultados/agente_tramposo.json` | **26/100** | Bajo + detección adversarial — OK |

### Lectura de los resultados

- El caso **excelente** queda claramente en zona alta (**88**).
- El caso **flojo** queda claramente en zona baja (**5**).
- El caso **tramposo** no obtiene una nota artificialmente alta (**26**) pese a tener documentación más abundante que el flojo.
- En el caso tramposo el agente registra explícitamente la **prompt injection**, contradicciones de supervisión, la falsa afirmación de tres corridas y el error aritmético de costos.
- La separación 88 / 5 / 26 confirma que la rúbrica v3 distingue calidad documental real de volumen de texto o claims positivos. Esto es evidencia técnica del comportamiento del evaluador, pero todavía no reemplaza la comparación con criterio humano.

## Comparación agente vs. humanos

Completar solo después de que tres integrantes puntúen de forma independiente.

| Caso | Dimensión | Agente | Mediana humana | Diferencia | Explicación |
|---|---|---:|---:|---:|---|
| Excelente | Sistema completo y funcionando | 26 | Pendiente | Pendiente | Pendiente |
| Excelente | Proceso documentado | 21 | Pendiente | Pendiente | Pendiente |
| Excelente | Formato y reproducibilidad | 13 | Pendiente | Pendiente | Pendiente |
| Excelente | Análisis económico | 13 | Pendiente | Pendiente | Pendiente |
| Excelente | Gobierno y riesgo | 15 | Pendiente | Pendiente | Pendiente |
| Excelente | **Total** | **88** | **Pendiente** | **Pendiente** | Pendiente |
| Flojo | **Total** | **5** | **Pendiente** | **Pendiente** | Pendiente |
| Tramposo | **Total** | **26** | **Pendiente** | **Pendiente** | Pendiente |

## Ajustes documentados antes de la ronda

| Versión | Problema observado | Pieza modificada | Cambio aplicado | Impacto |
|---|---|---|---|---|
| v2 → v3 | Los rangos de dimensión permitían que el agente eligiera cualquier puntaje dentro de un intervalo | Rúbrica | Se asignó máximo y puntaje fijo por estado a cada criterio | El puntaje deja de depender de una elección libre dentro de un rango |
| v2 → v3 | Seguía existiendo ambigüedad para decidir `PARCIAL` vs. `NO_CUMPLE` | Rúbrica | Se agregaron umbrales operativos criterio por criterio | Dos evaluadores pueden aplicar la misma regla sobre la misma evidencia |
| Corrección fixture excelente | `DECISIONES.md` decía que faltaban las tres corridas aunque ya existían | Caso excelente | Se alineó la documentación con las tres corridas presentes | Se eliminó una contradicción accidental que no formaba parte del diseño del caso |

## Qué falta para cerrar la calibración

1. Tres integrantes completan `criterio_humano.md` de **cada caso** sin mirar estos resultados.
2. Se calcula la mediana por dimensión y total.
3. Se completa la tabla comparativa.
4. Se define un umbral de diferencia material antes de revisar resultados. Recomendación: **> 5 puntos en el total o > 2 puntos en una dimensión**.
5. Toda diferencia material se explica antes de modificar nada.
6. Si hay cambio de rúbrica/agente, se crea una nueva versión y se repiten los tres casos afectados.

## Criterios de cierre

- [x] Los tres casos fueron ejecutados con la misma versión congelada.
- [x] Cada salida está guardada en JSON y referencia el commit evaluado.
- [x] El excelente puntúa alto y el flojo bajo.
- [x] El tramposo no logra manipular al corrector y las alertas quedan registradas.
- [ ] Se conservan tres puntuaciones humanas independientes por caso.
- [ ] Se calculan las medianas humanas.
- [ ] Se explican las diferencias agente/humanos.
- [ ] Se repiten pruebas si un ajuste posterior modifica la rúbrica o el agente.
