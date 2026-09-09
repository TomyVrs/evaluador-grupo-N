# Calibración de modelos para el evaluador IA V5

## Objetivo

Mantener fija la norma V5 y permitir que la app corrija trabajos públicos de GitHub sin que el profesor elija modelo, cargue API keys ni complete parámetros técnicos.

La evaluación mantiene constantes:

- `agente/system_prompt.md` V5;
- `rubrica.md` V5;
- `agente/configuracion.md` V5;
- `agente/contrato_salida.md` V5;
- acceso a GitHub solo lectura;
- anclaje a SHA exacto;
- salida estructurada;
- recálculo mecánico de puntajes;
- controles mecánicos de evidencia para criterios frontera.

## Casos de control

Se usan tres trabajos diseñados para calibración, no como plantillas de los trabajos reales:

| Caso | Referencia V5 |
|---|---:|
| Excelente | 82/100 |
| Flojo | 9/100 |
| Tramposo | 31/100 |

Además existe una prueba de fuego con un repositorio externo cuya referencia histórica es 98/100.

Los puntajes esperados sirven para verificar consistencia entre modelos. Los trabajos reales pueden ser completamente distintos y obtener cualquier puntaje que corresponda a su evidencia.

## Resultado de calibración gratuita

### Gemini 3.5 Flash

Fue validado con los tres casos de control:

- Excelente: 82/100;
- Flojo: 9/100;
- Tramposo: 31/100 con alerta de manipulación.

### Gemini 3.6 Flash

También fue validado de punta a punta con los tres casos de control. En una prueba real de fallback, Gemini 3.7 devolvió 503 y Gemini 3.5 devolvió 429; la app continuó automáticamente a Gemini 3.6 y obtuvo:

- Excelente: 82/100;
- Flojo: 9/100;
- Tramposo: 31/100.

La app no expuso los errores intermedios al usuario y el costo estimado de esas corridas fue USD 0.

### Modelos no habilitados en la cadena final

Gemini 3.7 y el modelo gratuito probado vía OpenRouter no quedan habilitados como fallback automático final porque no completaron una calibración de punta a punta suficientemente estable. Pueden volver a evaluarse en el futuro, pero no se incorporan solo por ser gratuitos.

## Cadena operativa final

El orden automático queda:

1. `gemini-3.5-flash` — gratuito y calibrado;
2. `gemini-3.6-flash` — gratuito y calibrado;
3. `openai/gpt-5.6-luna` vía Vercel AI Gateway — fallback pago;
4. `openai/gpt-5.6-sol` vía Vercel AI Gateway — último fallback de máxima calidad.

El cambio de modelo ocurre únicamente por un problema técnico o por una respuesta inválida: rate limit, cuota, timeout, indisponibilidad del proveedor o salida que no cumple el contrato estructurado. Nunca se cambia de modelo para perseguir una nota determinada.

**Estado antes de producción:** los dos modelos gratuitos ya están calibrados. Los fallbacks pagos quedan implementados como respaldo técnico, pero la promoción final a producción requiere comprobar que el AI Gateway tenga billing/créditos habilitados y realizar una prueba controlada del fallback pago. Si Gateway no está habilitado, la app debe agotar primero los dos modelos gratuitos y luego mostrar un error amigable, sin exponer mensajes internos del proveedor.

## Experiencia del profesor

El profesor solo debe:

1. abrir la URL pública;
2. pegar uno o varios repositorios públicos de GitHub, uno por línea;
3. agregar los trabajos;
4. ejecutar la evaluación;
5. revisar resultados y, si lo desea, exportar CSV o JSON.

No necesita API keys, login del proveedor de IA, elegir modelo, indicar rama/SHA/ruta ni copiar prompts manualmente.

## Trazabilidad

Cada evaluación registra junto al resultado:

- proveedor y modelo resuelto;
- cantidad de intentos de IA;
- ruta de modelos recorrida;
- tokens de entrada y salida;
- tokens totales;
- costo estimado USD;
- SHA exacto evaluado.

## Regla de aceptación

Un nuevo modelo solo puede incorporarse al fallback automático si mantiene la aplicación de la rúbrica V5, no inventa evidencia, produce salida estructurada válida, conserva las alertas del caso adversarial y completa una calibración de punta a punta antes de quedar habilitado.

## Checklist previo al merge

Antes de promover esta rama al repo oficial se debe completar una última prueba integrada con la cadena final:

- Excelente = 82/100;
- Flojo = 9/100;
- Tramposo = 31/100 y alerta de manipulación;
- prueba con repositorio externo real;
- prueba de lote con varios repositorios;
- acceso público en incógnito sin login ni credenciales del profesor.

La prioridad operativa es: **gratuito validado primero, pago solo como respaldo, sin trasladar ninguna complejidad al profesor**.
