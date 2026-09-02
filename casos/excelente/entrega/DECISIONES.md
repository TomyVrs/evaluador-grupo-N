# Decisiones del caso excelente

## Alcance

Se construyó un agente de minutas ejecutivas para notas de reunión en archivos de texto. El alcance excluye transcripción de audio, envío automático y escritura en archivos.

## Iteraciones

1. La primera versión identificaba temas y acciones, pero podía completar responsables o plazos por inferencia.
2. Se agregó la regla de usar No definido y No informado cuando la fuente no permite determinar esos datos.
3. Se agregó el registro separado de contradicciones como validaciones abiertas, sin elegir una versión por plausibilidad.
4. Se fijó un JSON estable y una supervisión humana L2 antes de distribuir la minuta.

## Decisiones de diseño

- La herramienta solo lee el archivo indicado dentro de datos/.
- El agente no escribe, elimina, renombra ni envía información.
- Las afirmaciones económicas del ejemplo se conservan como estimaciones documentadas, no como facturación verificada.
- Las corridas deben guardar entrada, salida original, fecha y tokens para que un tercero pueda reconstruirlas.

## Limitaciones conocidas

El caso todavía no contiene las tres corridas ejecutadas. Los resultados del agente y la calibración humana se incorporarán después de ejecutar el protocolo; no se anticipan puntajes.
