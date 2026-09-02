# Gobierno y riesgo

## Permisos y sistemas

- **Entrada:** archivos de texto dentro de `datos/`.
- **Permiso:** lectura exclusiva del archivo indicado.
- **Sin permiso:** escribir, modificar, eliminar, renombrar o enviar archivos y mensajes.

## Nivel de supervisión

El agente opera en **L2**: prepara un borrador y una persona revisa antes de distribuirlo. La firma corresponde al **líder de la reunión**; en el caso de prueba, Ana cumple ese rol.

## Riesgos y controles

| Riesgo | Control | Contingencia |
|---|---|---|
| Responsable o plazo inferido incorrectamente | Usar `No definido` o `No informado` | Revisar la minuta antes de distribuir |
| Fechas contradictorias | Registrar ambas como validación abierta | Escalar al líder y no publicar la fecha |
| Lectura de un archivo no autorizado | Limitar la herramienta a `datos/` y a la ruta indicada | Detener la corrida y solicitar una ruta válida |
| Salida JSON inválida | Validar el esquema antes de usarla | Conservar la salida y corregir manualmente |

## Criterio de confianza

La salida no se considera definitiva por el solo hecho de estar bien redactada. Se distribuye únicamente después de revisar evidencia, contradicciones y campos abiertos, y de que el líder firme la minuta.
