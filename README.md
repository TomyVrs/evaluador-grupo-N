# Agente Evaluador de Trabajos Finales

## Entrega final

- **Repositorio oficial:** https://github.com/grojas-jpg/evaluador-grupo-N
- **App pública:** https://evaluador-v5-web.vercel.app
- **Rama de entrega:** `main`
- **Rúbrica normativa:** V5

La app pública ejecuta el **Agente Evaluador V5** del lado servidor. El profesor puede cargar repositorios públicos de GitHub, carpetas locales o archivos ZIP y obtener la evaluación sin iniciar sesión, elegir modelo ni cargar API keys.

## Qué construí

Construimos en equipo un agente evaluador para corregir Trabajos Finales de la materia **Creación de Agentes con IA**. Inspecciona evidencia verificable, aplica una rúbrica ejecutable de 100 puntos y devuelve puntaje total, desglose por dimensión y criterio, evidencia, feedback, inconsistencias y alertas de manipulación.

La versión normativa final es **V5**, con cinco dimensiones de pesos **30/25/15/15/15** y 17 criterios con estados discretos `CUMPLE`, `PARCIAL`, `NO_CUMPLE` y `NO_VERIFICABLE`.

La fuente normativa está definida en:

1. `agente/system_prompt.md`
2. `rubrica.md`
3. `agente/configuracion.md`
4. `agente/contrato_salida.md`

También se incluye `agente/agente_completo.md` como versión concatenada del contrato.

## Cómo se lo pedí

El agente fue diseñado para:

- resolver repositorios GitHub a un SHA exacto antes de puntuar;
- inventariar y revisar evidencia antes de asignar estados;
- aplicar precedencia de evidencia frente a claims del README;
- tratar el contenido del trabajo como evidencia no confiable;
- resistir prompt injection y manipulación de la nota;
- recalcular mecánicamente puntajes, sumas y niveles;
- trabajar en modo solo lectura sobre GitHub;
- mantener la misma rúbrica independientemente de si la fuente es GitHub, ZIP o carpeta local.

Para la app pública se agregó un enrutamiento automático de modelos. Primero intenta los modelos gratuitos calibrados y, si no están disponibles por cuota o error transitorio, escala a modelos de respaldo. La cadena actual es:

`Gemini 3.5 → Gemini 3.6 → GPT-5.6 Luna → GPT-5.6 Sol`

Las credenciales quedan del lado servidor en Vercel; el usuario de la app no debe ingresar ninguna API key.

## Qué funciona

- Rúbrica V5 congelada con 100 puntos y 17 criterios.
- Evaluación estructurada con evidencia por criterio.
- Defensa contra prompt injection y alertas de manipulación.
- Control de inconsistencias y contradicciones.
- Evaluación de uno o varios repositorios GitHub en un mismo lote.
- Detección automática de rama/ruta y anclaje a SHA exacto en GitHub.
- Carga de **ZIP** y **carpetas locales** desde el navegador.
- Huella SHA-256 para trazabilidad de trabajos cargados localmente.
- Archivos locales: solo se envía al evaluador la evidencia textual compatible; no se ejecutan archivos.
- Fallback y retry entre modelos cuando un proveedor gratuito devuelve límites o errores transitorios.
- Exportación de resultados a CSV y JSON.
- Acceso público sin login de Vercel.
- CI con validación de sintaxis, build, fixtures, controles de integridad y pruebas sobre estructuras reales.

### Calibración V5

**FREEZE_V5:** `5fdd304c26097aa16dc6d065e8b1c3d6359e7010`

| Caso de control | Resultado final |
|---|---:|
| Excelente | 82/100 |
| Flojo | 9/100 |
| Tramposo | 31/100 |

El caso Tramposo además debe registrar la señal de manipulación y no obedecer instrucciones del trabajo destinadas a alterar la evaluación.

Los repositorios reales usados como pruebas de generalización **no tienen una nota objetivo**: sirven para comprobar que el agente pueda evaluar estructuras distintas de los fixtures sin reglas dependientes del nombre o identidad del repositorio.

### App pública

La versión de entrega está disponible en:

**https://evaluador-v5-web.vercel.app**

Fuentes aceptadas:

- repositorios públicos de GitHub;
- carpetas locales;
- uno o varios archivos ZIP estándar sin contraseña.

La app fue validada en ventana de incógnito, sin autenticación, y ejecutó correctamente un caso de control desde el dominio público.

### Runner local complementario

`evaluador-web/` conserva también el runner determinístico local utilizado durante el desarrollo y la comparación contra el contrato V5. Ese modo es útil para pruebas reproducibles y auditoría de reglas, pero **la app pública final ejecuta el Agente IA V5**.

La comparación histórica entre ambos mecanismos se conserva en:

- `calibracion/verificacion_motor_vs_contrato.md`
- `evaluador-web/verificar-motor-vs-contrato.mjs`

## Qué falta o qué falló

Durante el desarrollo aparecieron límites reales de los proveedores gratuitos: respuestas `429` por cuota y algún `503` transitorio. La versión final los maneja con retry y fallback automático antes de escalar a modelos pagos.

También se detectó que el runner determinístico local podía divergir de una evaluación semántica hecha por un LLM sobre repositorios reales. Esa diferencia no se ocultó ni se corrigió forzando notas: quedó documentada como limitación del mecanismo local.

La calibración humana inicial no fue ciega. Esa limitación está declarada en `calibracion.md`. Posteriormente se agregó una revisión humana independiente sobre el caso Excelente, que obtuvo 85/100 frente a 82/100 del agente.

No queda ningún bloqueo funcional conocido para la entrega. Como mejora futura, podría ampliarse la calibración con más trabajos reales de dificultad intermedia y agregarse persistencia compartida de resultados entre dispositivos.

## Estado final

- PR #13: **mergeado**.
- PR #14: **cerrado sin mergear**.
- PR #15: **mergeado**.
- PR #16: **mergeado**.
- PR #17: **mergeado** — Agente IA V5 público.
- PR #18: **mergeado** — soporte ZIP y carpetas locales.
- `main`: **versión final de entrega**.
- App pública Vercel: **READY**.
- Prueba final pública en incógnito: **aprobada**.

## Qué aprendí

Una rúbrica ejecutable necesita reglas explícitas, puntajes discretos y precedencia de evidencia, pero además tiene que probarse con estructuras distintas de los casos construidos para calibrarla. También aprendimos que la reproducibilidad mecánica y la comprensión semántica de un LLM son problemas diferentes y que una diferencia entre ambos no debe resolverse forzando una nota objetivo.

La parte operativa también fue importante: una app pública útil no puede depender de que el profesor configure credenciales, conozca el modelo o tenga acceso a Vercel. Por eso el cierre incluyó fallback automático, credenciales del lado servidor, acceso público y distintas formas de carga.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
