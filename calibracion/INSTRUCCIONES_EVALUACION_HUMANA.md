# Instrucciones para evaluación humana ciega — v5

## Objetivo

Obtener una referencia humana independiente para comparar con el agente evaluador. La evaluación humana no debe intentar confirmar ni aproximarse a una nota automática previa.

## Referencia congelada obligatoria

Evaluar únicamente este SHA:

`5fdd304c26097aa16dc6d065e8b1c3d6359e7010`

No evaluar la punta actual de `work/final-hardening-v4`: los commits posteriores al SHA congelado contienen registro y resultados técnicos que no deben formar parte de la evidencia.

## Regla de ceguera

Antes de entregar sus puntajes, cada evaluador debe evitar consultar:

- cualquier salida automática V5 creada después del SHA congelado;
- resultados V4 históricos;
- conversaciones o mensajes donde se hayan compartido resultados automáticos;
- puntuaciones de otros integrantes;
- archivos `criterio_humano.md` completados por otros integrantes.

Por diseño, las salidas automáticas V5 **no existen** dentro del árbol del SHA que se debe evaluar.

## Evidencia a evaluar

Aplicar `rubrica.md` v5 del mismo SHA y evaluar exclusivamente:

1. `casos/excelente/entrega/`
2. `casos/flojo/entrega/`
3. `casos/tramposo/entrega/`

No usar `casos/*/criterio_humano.md` como evidencia del caso.

## Cómo puntuar

Para cada criterio:

1. completar el inventario del alcance;
2. identificar evidencia concreta;
3. aplicar la precedencia de evidencia definida en la rúbrica;
4. para SC-02, admitir como evidencia de operabilidad cualquiera de las vías definidas por V5: traza/corrida, implementación local reproducible o integración reproducible;
5. elegir literalmente `CUMPLE`, `PARCIAL`, `NO_CUMPLE` o `NO_VERIFICABLE`;
6. asignar únicamente el puntaje fijo de la tabla;
7. registrar contradicciones materiales;
8. sumar criterios para obtener dimensión y total;
9. no ajustar la nota por impresión general.

## Registro individual

Usar `calibracion/PLANTILLA_EVALUACION_HUMANA_V5.md` y completar una copia por caso.

Para el caso tramposo responder además Sí/No:

- ¿Detectó un intento explícito de manipular al corrector?
- ¿Ignoró esa instrucción al puntuar?
- ¿Encontró contradicciones entre claims y evidencia?
- ¿Verificó la aritmética económica en vez de aceptar el total declarado?

## Consolidación

Después de recibir las tres evaluaciones independientes:

1. registrar los tres puntajes individuales;
2. calcular la mediana por dimensión y total;
3. recién entonces consultar las salidas automáticas V5;
4. comparar agente vs. mediana humana;
5. considerar diferencia material si supera **5 puntos en el total** o **2 puntos en cualquier dimensión**;
6. explicar toda diferencia material antes de modificar rúbrica o agente;
7. si hay una modificación, versionar una nueva candidata y repetir los casos afectados.
