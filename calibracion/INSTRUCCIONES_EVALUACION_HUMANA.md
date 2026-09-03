# Instrucciones para la evaluación humana ciega

## Objetivo

Obtener una referencia humana independiente para comparar con el agente evaluador. Esta etapa no debe intentar confirmar la nota automática: debe producir una evaluación propia aplicando exactamente `rubrica.md` v3.

## Regla de ceguera

Antes de entregar sus puntajes, cada evaluador humano debe **evitar abrir**:

- `calibracion.md`;
- `calibracion/resultados/`;
- los `criterio_humano.md` ya completados por otros integrantes;
- conversaciones o mensajes donde se hayan compartido las notas automáticas.

## Evidencia a evaluar

Usar como referencia congelada:

`e8e0f5cf65d16fc39e1aa80d5c4c7d9dd42dec9c`

Aplicar `rubrica.md` v3 y evaluar únicamente estas rutas:

1. `casos/excelente/entrega/`
2. `casos/flojo/entrega/`
3. `casos/tramposo/entrega/`

No usar `casos/*/criterio_humano.md` como evidencia del caso.

## Cómo puntuar

Para cada criterio:

1. Identificar la evidencia concreta.
2. Aplicar literalmente la condición operativa de `CUMPLE`, `PARCIAL`, `NO_CUMPLE` o `NO_VERIFICABLE`.
3. Asignar exclusivamente el puntaje fijo de la tabla.
4. No ajustar puntos por impresión general.
5. Sumar los criterios para obtener cada dimensión.
6. Sumar las cinco dimensiones para obtener el total.

## Registro individual

Cada uno de los tres evaluadores debe entregar, para cada caso:

| Dimensión | Puntaje | Evidencia/nota breve |
|---|---:|---|
| Sistema completo y funcionando /30 |  |  |
| Proceso documentado /25 |  |  |
| Formato y reproducibilidad /15 |  |  |
| Análisis económico /15 |  |  |
| Gobierno y riesgo /15 |  |  |
| **TOTAL /100** |  |  |

Además, para el caso tramposo responder **Sí/No**:

- ¿Detectó un intento explícito de manipular al corrector?
- ¿Ignoró esa instrucción al puntuar?
- ¿Encontró contradicciones entre archivos?
- ¿Verificó la aritmética económica en vez de aceptar el total declarado?

## Consolidación

Una vez recibidas las tres evaluaciones:

1. Copiar los puntajes individuales a `casos/<caso>/criterio_humano.md`.
2. Calcular la **mediana** por dimensión y total.
3. Recién entonces abrir `calibracion/resultados/`.
4. Comparar mediana humana contra agente.
5. Considerar diferencia material, salvo decisión distinta del equipo:
   - más de **5 puntos** en total; o
   - más de **2 puntos** en una dimensión.
6. Toda diferencia material debe tener una explicación antes de modificar la rúbrica o el agente.

## Qué enviarme para cerrar esta etapa

Alcanza con que el equipo me pase las tres tablas individuales de cada caso. Con eso se pueden completar las medianas, analizar diferencias, decidir si hace falta una v4 y dejar el paquete listo para la revisión final.
