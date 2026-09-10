# Calibración de modelos para el evaluador IA V5

## Objetivo

Mantener fija la norma V5 y permitir que la app corrija trabajos sin que el profesor elija modelo, cargue API keys ni complete parámetros técnicos.

La evaluación mantiene constantes `agente/system_prompt.md`, `rubrica.md`, `agente/configuracion.md` y `agente/contrato_salida.md` V5, con evidencia trazable, salida estructurada, recálculo mecánico y controles de integridad.

## Casos de control

| Caso | Referencia V5 |
|---|---:|
| Excelente | 82/100 |
| Flojo | 9/100 |
| Tramposo | 31/100 |

Los casos sirven para calibrar consistencia. Los trabajos reales pueden ser completamente distintos y obtener cualquier puntaje que corresponda a su evidencia. Los repositorios externos se usan como pruebas de generalización, no para fijar una nota objetivo.

## Resultado de calibración gratuita

**Gemini 3.5 Flash** fue validado con Excelente 82, Flojo 9 y Tramposo 31, incluyendo la alerta de manipulación del caso Tramposo.

**Gemini 3.6 Flash** también fue validado de punta a punta. En pruebas reales de fallback la app pudo continuar al siguiente modelo gratuito ante errores transitorios o límites de cuota, sin trasladar esa complejidad al usuario.

Gemini 3.7 y el modelo gratuito probado vía OpenRouter no quedaron habilitados en la cadena final porque no completaron una calibración de punta a punta suficientemente estable.

## Cadena operativa final

1. `gemini-3.5-flash` — gratuito y calibrado;
2. `gemini-3.6-flash` — gratuito y calibrado;
3. `openai/gpt-5.6-luna` vía Vercel AI Gateway — fallback técnico pago;
4. `openai/gpt-5.6-sol` vía Vercel AI Gateway — último fallback técnico.

El cambio de modelo ocurre únicamente ante un problema técnico, límite de cuota o respuesta inválida. **Nunca se cambia de modelo para perseguir una nota determinada.**

La calibración normativa 82 / 9 / 31 se conserva independiente del mecanismo operativo de fallback. Los modelos pagos forman parte de la resiliencia de producción; no redefinen la rúbrica ni los puntajes esperados de los fixtures.

## Estado productivo

La app final está desplegada en:

**https://evaluador-v5-web.vercel.app**

La configuración de producción mantiene las credenciales del lado servidor y un enrutamiento automático de modelos. El profesor no necesita conocer ni seleccionar el proveedor utilizado.

La resiliencia frente a proveedores gratuitos se comprobó durante las pruebas mediante errores reales de cuota/capacidad y fallback. Los respaldos de AI Gateway quedaron configurados para evitar que la elección técnica del modelo forme parte de la experiencia del usuario.

## Experiencia del profesor

El profesor puede:

- pegar uno o varios repositorios públicos de GitHub;
- cargar uno o varios archivos ZIP;
- cargar carpetas locales;
- usar selección manual o drag & drop para ZIP/carpetas;
- ejecutar la evaluación;
- revisar puntajes, evidencia, feedback, inconsistencias y alertas;
- exportar CSV o JSON.

No necesita API keys, login del proveedor de IA, elegir modelo, indicar rama/SHA/ruta manualmente ni copiar prompts.

## Trazabilidad

En GitHub, cada evaluación fija un SHA exacto. Para cargas locales se genera una huella SHA-256 del paquete evaluado. La interfaz registra además el modelo resuelto y datos de uso disponibles para la corrida.

Los archivos locales se leen o descomprimen en el navegador; **ningún archivo se ejecuta**. Solo la evidencia textual compatible necesaria se envía al evaluador IA.

## Validaciones de cierre

- Excelente = **82/100**;
- Flojo = **9/100**;
- Tramposo = **31/100** + alerta de manipulación;
- repositorios reales evaluados;
- procesamiento por lote;
- GitHub, ZIP y carpetas locales;
- acceso público en incógnito sin login;
- fallback automático ante fallas de proveedores gratuitos;
- app de producción disponible en el dominio estable.

La prioridad operativa final es: **modelos gratuitos calibrados primero, respaldos técnicos después, misma rúbrica V5 siempre y sin trasladar complejidad al profesor**.
