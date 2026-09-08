# Decisiones del caso excelente

## Alcance

Se construyó un agente de minutas ejecutivas para notas de reunión en archivos de texto. El alcance excluye transcripción de audio, envío automático y escritura en archivos.

## Iteraciones

1. La primera versión identificaba temas y acciones, pero podía completar responsables o plazos por inferencia.
2. Se agregó la regla de usar `No definido` y `No informado` cuando la fuente no permite determinar esos datos.
3. Se agregó el registro separado de contradicciones como validaciones abiertas, sin elegir una versión por plausibilidad.
4. Se fijó un JSON estable y una supervisión humana L2 antes de distribuir la minuta.

## Decisiones de diseño

- La herramienta solo lee el archivo indicado dentro de `datos/`.
- El agente no escribe, elimina, renombra ni envía información.
- Las afirmaciones económicas se conservan como estimaciones documentadas, no como facturación verificada.
- Las corridas deben guardar entrada, salida original y fecha para que un tercero pueda reconstruirlas.
- Si el entorno no informa tokens, esa ausencia se registra explícitamente y no se completa retrospectivamente con una cifra inventada.

## Evidencia de ejecución

El caso contiene tres corridas fechadas en `corridas/` (`01_registro.md`, `02_registro.md` y `03_registro.md`) con referencia a la entrada utilizada y a su salida original correspondiente. Los conteos de tokens no estuvieron disponibles y se declara esa limitación en cada registro.

## Limitaciones conocidas

- No hay conteo medido de tokens en las tres corridas conservadas.
- El costo por corrida se documenta como estimación y no como facturación real.
- La comparación de calidad entre modelos queda pendiente de una prueba específica; por eso la elección del modelo se presenta como propuesta condicionada y no como resultado medido.
