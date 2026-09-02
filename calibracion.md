# Calibración reproducible del agente evaluador

## Objetivo

Comparar las notas producidas por el agente con el criterio humano del grupo para los tres casos exigidos: excelente, flojo y tramposo. Este archivo define el protocolo; todavía no contiene resultados porque las ejecuciones y la puntuación humana no fueron realizadas en esta versión.

## Alcance de cada caso

| Caso | Repositorio a evaluar | Archivo excluido del alcance |
|---|---|---|
| Excelente | `casos/excelente/entrega/` | `casos/excelente/criterio_humano.md` |
| Flojo | `casos/flojo/entrega/` | `casos/flojo/criterio_humano.md` |
| Tramposo | `casos/tramposo/entrega/` | criterio humano del caso, si existiera |

El evaluador debe recibir la URL o ruta del repositorio/caso, inspeccionar sus archivos e historial y producir el JSON definido en `agente/contrato_salida.md` y el system prompt vigente. Los archivos de criterio humano no se entregan al agente durante la evaluación.

## Procedimiento

1. Congelar los commits de las ramas que contienen la versión a calibrar y registrar sus SHA.
2. Tres integrantes puntúan cada caso de forma independiente aplicando `rubrica.md`, citando evidencia y sin consultar la nota de otro integrante.
3. Ejecutar el agente una vez por caso con la misma versión de rúbrica, system prompt, configuración y contrato.
4. Guardar la salida JSON original, la fecha, el commit evaluado y los datos de uso disponibles.
5. Calcular la mediana humana por dimensión y total. No reemplazar votos individuales por consenso retrospectivo.
6. Comparar agente versus mediana humana y registrar toda diferencia, aunque sea pequeña.
7. Si hay desacuerdo, identificar si provino de la rúbrica, del prompt, del contrato de salida, del acceso al repositorio o de una interpretación humana.
8. Ajustar solo la rúbrica o el agente cuando exista una causa documentada. Crear una nueva versión y repetir las tres evaluaciones afectadas.
9. Cerrar la calibración únicamente cuando el grupo documente el resultado posterior al ajuste.

## Registro de ejecuciones

Completar después de ejecutar:

| Caso | Commit evaluado | Fecha/hora | Salida guardada | Estado |
|---|---|---|---|---|
| Excelente | Pendiente | Pendiente | Pendiente | Pendiente |
| Flojo | Pendiente | Pendiente | Pendiente | Pendiente |
| Tramposo | Pendiente | Pendiente | Pendiente | Pendiente |

## Comparación de notas

Completar con los puntajes efectivamente obtenidos. No rellenar con expectativas.

| Caso | Dimensión | Agente | Mediana humana | Diferencia | Explicación del desacuerdo |
|---|---|---:|---:|---:|---|
| Excelente | Sistema completo y funcionando | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Proceso documentado | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Formato y reproducibilidad | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Análisis económico | Pendiente | Pendiente | Pendiente | Pendiente |
| Excelente | Gobierno y riesgo | Pendiente | Pendiente | Pendiente | Pendiente |
| Flojo | Total | Pendiente | Pendiente | Pendiente | Pendiente |
| Tramposo | Total | Pendiente | Pendiente | Pendiente | Pendiente |

## Ajustes documentados

| Versión | Problema observado textualmente | Pieza modificada | Cambio aplicado | Impacto posterior |
|---|---|---|---|---|
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

## Criterios de cierre

- Los tres casos fueron ejecutados realmente.
- Cada salida se puede reconstruir desde un commit y una entrada identificables.
- Se conservan las notas individuales y la mediana humana.
- Cada desacuerdo tiene explicación.
- Los cambios posteriores tienen versión y evidencia.
- No se afirma que el agente distinguió correctamente los casos hasta haberlo ejecutado y registrado.
