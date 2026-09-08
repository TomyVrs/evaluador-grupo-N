# Evaluador Web local — V5

Interfaz ejecutable y gratuita para aplicar la rúbrica V5 sobre uno o muchos trabajos.

## Fuentes aceptadas

La misma rúbrica se aplica independientemente de la fuente:

- repositorios públicos de GitHub;
- una carpeta local con una entrega;
- una carpeta local que contenga varias entregas en subcarpetas;
- uno o varios archivos `.zip` estándar sin contraseña.

Los archivos locales se procesan directamente en el navegador y no se suben a ningún servidor. Para identificar una evaluación local se calcula una huella SHA-256 sobre los archivos de texto leídos.

## Ejecutar

Requisito: Node.js 18 o superior.

```bash
cd evaluador-web
npm install
npm start
```

Abrir en el navegador:

```text
http://localhost:5173
```

`npm install` no descarga dependencias de terceros en esta versión; se mantiene como paso estándar para que la ejecución sea predecible.

## Uso

1. Cargar uno o varios trabajos desde GitHub, carpeta local o ZIP.
2. Revisar la tabla visible con las 5 dimensiones y los 17 criterios de la rúbrica.
3. Presionar **Ejecutar evaluaciones**.
4. Revisar nota total, dimensiones, criterios, evidencia, feedback, inconsistencias y alertas.
5. Exportar CSV o JSON.

### GitHub

Se puede pegar una URL por línea. La app acepta la raíz de un repositorio o una carpeta (`/tree/<ref>/<ruta>`). Cada trabajo se resuelve a un SHA exacto antes de puntuar.

Sin autenticación, GitHub aplica un límite bajo a su REST API. Para clases grandes se puede ingresar un token personal opcional. El token:

- no se escribe en el repositorio;
- no se envía a ningún servidor de esta app;
- queda únicamente en `sessionStorage` de la pestaña;
- solo se usa para aumentar el límite de lectura de GitHub.

### Carpetas locales

La selección de carpetas está pensada para Chrome/Edge. Si la carpeta elegida contiene varias subcarpetas que parecen entregas independientes, la app las agrega como trabajos separados.

### ZIP

Admite ZIP estándar sin contraseña. Puede cargarse uno o varios archivos. Si un ZIP contiene varias carpetas de entregas reconocibles, se agregan por separado. ZIP64 o métodos de compresión no soportados deben cargarse como carpeta local.

## Motor

Esta app usa un **motor local determinístico** que implementa los estados y puntajes discretos de `rubrica.md` V5 y genera el mismo tipo de salida estructurada del agente. No requiere Vercel, OpenAI, tarjeta ni API paga.

La fuente normativa de la evaluación sigue siendo:

- `../rubrica.md`;
- `../agente/system_prompt.md`;
- `../agente/configuracion.md`;
- `../agente/contrato_salida.md`.

El runner existe para que un tercero pueda ejecutar una evaluación desde el repositorio sin depender de credenciales privadas del equipo.

## Pruebas e imparcialidad

Los casos `Excelente`, `Flojo` y `Tramposo` son fixtures de calibración construidos específicamente para verificar que la rúbrica y el motor conservan los resultados acordados durante la calibración V5.

Los repositorios reales usados como pruebas de generalización **no fijan ni esperan una nota concreta**. Esas pruebas solo verifican que el evaluador pueda leer estructuras distintas y producir una evaluación válida, completa y consistente con los estados y puntajes permitidos por la rúbrica. La nota obtenida por un repo real es siempre una salida del evaluador, no una condición del test.

Ninguna regla del motor depende del nombre, propietario o identidad de un repositorio evaluado. Los ajustes del motor deben corresponder a evidencia o reglas generales de la rúbrica, no a alcanzar una nota deseada para un trabajo particular.

## Alcance y transparencia

Los criterios mecánicos (archivos, corridas, estructura, cálculos, sumas, contradicciones objetivas y patrones operativos) se resuelven directamente. Los criterios semánticos se aproximan mediante reglas explícitas y auditables. Por eso el JSON incluye `motor_ejecutable.tipo = deterministico-local`; no se presenta como una corrida del LLM usado durante la calibración V5.

El `FREEZE_V5` de referencia permanece inmutable:

`5fdd304c26097aa16dc6d065e8b1c3d6359e7010`
