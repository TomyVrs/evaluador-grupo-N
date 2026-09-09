# Calibración de modelos para el evaluador IA V5

## Objetivo

Mantener fija la norma V5 y permitir que la app corrija trabajos públicos de GitHub sin que el profesor elija modelo, cargue API keys ni complete parámetros técnicos.

La evaluación mantiene constantes `agente/system_prompt.md`, `rubrica.md`, `agente/configuracion.md` y `agente/contrato_salida.md` V5, con GitHub solo lectura, SHA exacto, salida estructurada, recálculo mecánico y controles de evidencia para criterios frontera.

## Casos de control

| Caso | Referencia V5 |
|---|---:|
| Excelente | 82/100 |
| Flojo | 9/100 |
| Tramposo | 31/100 |

Los casos sirven para calibrar consistencia entre modelos. Los trabajos reales pueden ser completamente distintos y obtener cualquier puntaje que corresponda a su evidencia. Además existe una prueba de fuego con un repositorio externo cuya referencia histórica es 98/100.

## Resultado de calibración gratuita

**Gemini 3.5 Flash** fue validado con Excelente 82, Flojo 9 y Tramposo 31 con alerta de manipulación.

**Gemini 3.6 Flash** también fue validado de punta a punta. En una prueba real de fallback, Gemini 3.7 devolvió 503 y Gemini 3.5 devolvió 429; la app continuó automáticamente a Gemini 3.6 y obtuvo 82 / 9 / 31 sin exponer errores intermedios al usuario y con costo estimado USD 0.

Gemini 3.7 y el modelo gratuito probado vía OpenRouter no quedan habilitados en la cadena final porque no completaron una calibración de punta a punta suficientemente estable.

## Cadena operativa final

1. `gemini-3.5-flash` — gratuito y calibrado;
2. `gemini-3.6-flash` — gratuito y calibrado;
3. `openai/gpt-5.6-luna` vía Vercel AI Gateway — fallback pago;
4. `openai/gpt-5.6-sol` vía Vercel AI Gateway — último fallback de máxima calidad.

El cambio de modelo ocurre únicamente por un problema técnico o por una respuesta inválida. Nunca se cambia de modelo para perseguir una nota determinada.

Los dos modelos gratuitos ya están calibrados. Los fallbacks pagos quedan implementados como respaldo técnico. Antes de producción se completa la prueba integrada final y se verifica el comportamiento operativo de AI Gateway.

## Experiencia del profesor

El profesor solo debe abrir la URL pública, pegar uno o varios repositorios públicos de GitHub, agregarlos y ejecutar la evaluación. Puede revisar resultados y exportar CSV o JSON.

No necesita API keys, login del proveedor de IA, elegir modelo, indicar rama/SHA/ruta ni copiar prompts manualmente.

## Trazabilidad

Cada evaluación registra proveedor y modelo resuelto, cantidad de intentos, ruta de modelos recorrida, tokens, costo estimado USD y SHA exacto evaluado.

## Checklist previo al merge

- Excelente = 82/100;
- Flojo = 9/100;
- Tramposo = 31/100 y alerta de manipulación;
- repositorio externo real;
- lote con varios repositorios;
- acceso público en incógnito sin login ni credenciales del profesor.

La prioridad operativa es: **gratuito validado primero, pago solo como respaldo, sin trasladar ninguna complejidad al profesor**.
