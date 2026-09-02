# Agente de minutas ejecutivas

## Qué construí

Construí un agente que transforma notas de reuniones guardadas en archivos de texto en minutas ejecutivas estructuradas. Está pensado para líderes de equipo que necesitan registrar decisiones, acciones, responsables, plazos y validaciones abiertas sin inventar información.

## Cómo se lo pedí

El contrato completo está en `prompts/system_prompt.md` y `prompts/user_prompt.md`. El system prompt separa rol, contexto, tarea, restricciones, formato y ejemplos.

## Herramienta y funcionamiento

El agente usa una herramienta de lectura de archivos con permiso exclusivo sobre `datos/`. No escribe, renombra ni elimina archivos. Las tres corridas registran la invocación, la entrada leída, la salida original, la fecha y los tokens.

## Supervisión

El sistema opera en **L2**: genera un borrador y propone responsables/plazos únicamente cuando están explícitos. El líder de la reunión revisa las validaciones abiertas y firma la minuta antes de distribuirla. Si detecta contradicciones o una decisión sin responsable, el agente no publica y escala el caso al líder.

## Cómo reproducirlo

1. Seleccionar uno de los archivos de `datos/`.
2. Usar el user prompt e informar la ruta.
3. Habilitar lectura únicamente para ese archivo.
4. Conservar la respuesta completa y los datos de uso.
5. Comparar el resultado con la corrida correspondiente.

## Qué funciona

- Lectura de archivos reales.
- Salida JSON estable.
- Detección de responsables y plazos explícitos.
- Marcación de datos no definidos.
- Registro de contradicciones como validaciones abiertas.

## Qué falta o qué falló

El agente no transcribe audio y no envía minutas automáticamente. Esas funciones se descartaron para mantener permisos mínimos y una supervisión humana clara. Los cambios y fallas están documentados en `DECISIONES.md`.

## Archivos complementarios

- `analisis_economico.md`: costo por corrida, proyección y elección del modelo.
- `gobierno_riesgo.md`: permisos, riesgos, contingencias y firma.
- `corridas/`: tres ejecuciones completas.

## Qué aprendí

La precisión mejoró cuando se prohibió inferir responsables y se separaron las validaciones abiertas de las acciones confirmadas. También comprobé que un modelo más económico resolvía correctamente este flujo acotado.

