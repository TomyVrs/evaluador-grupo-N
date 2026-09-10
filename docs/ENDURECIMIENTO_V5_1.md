# Auditoría de endurecimiento V5.1 — decisión de cierre

## Contexto

Antes de la entrega se revisaron tres riesgos planteados al probar el evaluador sobre un lote mayor de trabajos:

1. que distintas rutas de modelo produzcan resultados diferentes sin trazabilidad;
2. que existan entregas muy similares o intentos de manipulación;
3. que los tres casos de control (Excelente, Flojo y Tramposo) sean insuficientes para representar todas las estructuras posibles.

La revisión mostró que dos de esos controles ya existen en la app y que convertirlos en campos normativos nuevos dentro de `agente/contrato_salida.md` generaría una incompatibilidad con el `response_format` estricto del runner actual. Por eso este PR no modifica la rúbrica ni las cuatro piezas normativas del agente.

## 1. Trazabilidad del modelo: ya está en el runtime

Desde el enrutamiento automático incorporado a la app, la respuesta registra en `uso_api`:

- proveedor utilizado;
- modelo solicitado/resuelto;
- cantidad de intentos;
- ruta de modelos intentados y su estado;
- tokens y costo estimado cuando corresponde.

`evaluador-web/api/evaluate-with-usage.mjs` conserva el modelo que efectivamente respondió y la secuencia de fallback. Esto permite auditar una eventual diferencia entre dos corridas sin exigir que el LLM declare por sí mismo qué modelo lo ejecutó.

**Decisión:** mantener la trazabilidad como metadata determinística del runtime. No duplicarla como un bloque `motor` obligatorio dentro del contrato normativo.

## 2. Originalidad/similitud: ya existe como señal auxiliar

`evaluador-web/public/integrity.mjs` construye perfiles de integridad y compara trabajos del mismo lote mediante similitud de contenido. El reporte:

- identifica coincidencias relevantes;
- separa señales de prompt injection/manipulación;
- informa contradicciones;
- declara explícitamente `changesScore: false`.

`evaluador-web/test-integrity.mjs` prueba un caso similar, uno diferente y la presencia de señales de manipulación. La decisión sobre plagio o autoría sigue siendo humana.

**Decisión:** no agregar una segunda lógica de `senales_integridad` dentro del agente. La comparación entre trabajos requiere contexto del lote y pertenece al runtime, no a una evaluación aislada contra la rúbrica.

## 3. Instrucciones ocultas o codificadas

La V5 ya trata el contenido del trabajo como evidencia no confiable y registra intentos de manipulación en `alertas_manipulacion`. El evaluador puede detectar instrucciones presentes en el texto que efectivamente recibe.

No existe, sin embargo, una garantía completa para contenido no extraído por el pipeline actual —por ejemplo propiedades internas de formatos binarios, texto visualmente oculto que no llegue como texto compatible o contenido cifrado/obfuscado que requiera un extractor específico—.

**Decisión:** no prometer en el contrato una cobertura que el runner no puede garantizar. Ampliar esos extractores queda como mejora futura y no bloquea la entrega.

## 4. Qué significan los tres casos de control

Excelente, Flojo y Tramposo son **anclas de calibración y regresión**, no ejemplos de entrenamiento ni una muestra estadística de todas las entregas posibles. Sirven para detectar que una modificación no cambie comportamientos ya validados.

La generalización se controla además con:

- `test-generalizacion.mjs`;
- `test-generalizacion-2.mjs`;
- evaluación semántica por el Agente IA V5 sobre estructuras reales;
- reglas de evidencia que no dependen del nombre o identidad del repositorio.

Esto reduce el riesgo de sobreajuste, pero no constituye una garantía estadística sobre 50 trabajos. La mitigación correcta es conservar trazabilidad, controles de regresión y revisión humana ante casos dudosos; no agregar criterios nuevos a último momento.

## 5. Cambios efectivos de este PR

Después de la auditoría, el alcance se reduce deliberadamente a:

- documentar los controles reales que ya existen;
- reforzar CI para verificar que la trazabilidad de modelo y la integridad sigan presentes;
- mantener **sin cambios** `rubrica.md`, `agente/system_prompt.md`, `agente/configuracion.md`, `agente/contrato_salida.md` y `agente/agente_completo.md` respecto de `main`;
- mantener `FREEZE_V5 = 5fdd304c26097aa16dc6d065e8b1c3d6359e7010`.

No se agregan criterios, no se cambian pesos, no se cambia el esquema de salida y no se mueve el freeze normativo.

## 6. Validación requerida antes de mergear

El PR solo es candidato a merge si CI confirma:

- sintaxis y build correctos;
- calibración V5 intacta;
- Excelente = 82, Flojo = 9 y Tramposo = 31;
- tests de integridad aprobados;
- tests de generalización aprobados;
- presencia de `modelo_resuelto`, `ruta_modelos` y registro de intentos en el auto-router;
- ausencia de los bloques incompatibles `motor` y `senales_integridad` en el contrato normativo V5.

## Lo que queda afuera

- detección forense de plagio contra fuentes externas;
- inspección exhaustiva de metadatos/binarios/cifrados no extraídos por el pipeline;
- garantía de equivalencia exacta entre proveedores/modelos distintos;
- calibración estadística sobre un lote de 50 entregas.

Son mejoras posibles, pero no justifican modificar la norma a una hora del cierre sin implementación y pruebas end-to-end.