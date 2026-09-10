# Evaluador Web — Agente IA V5

Interfaz pública del **Agente Evaluador V5** para corregir uno o varios trabajos con la misma rúbrica normativa, sin que el profesor tenga que elegir modelo ni configurar credenciales.

- **App pública:** https://evaluador-v5-web.vercel.app
- **Repositorio oficial:** https://github.com/grojas-jpg/evaluador-grupo-N
- **Rúbrica normativa:** V5

> **Importante:** la app pública final ejecuta el agente de IA V5 del lado servidor. El runner determinístico local se conserva en este directorio como herramienta complementaria de prueba y auditoría; no reemplaza al agente ni modifica la rúbrica.

## Fuentes aceptadas

La app pública permite evaluar:

- repositorios públicos de GitHub;
- una carpeta local con una entrega;
- una carpeta local que contenga varias entregas en subcarpetas;
- uno o varios archivos `.zip` estándar sin contraseña.

Las carpetas y ZIP pueden elegirse con el selector del navegador o cargarse mediante **drag & drop**.

Para fuentes locales, el navegador lee o descomprime los archivos y calcula una huella SHA-256 para trazabilidad. **Ningún archivo se ejecuta.** Solo la evidencia textual compatible y necesaria se envía al endpoint de evaluación IA.

## Uso de la app pública

1. Abrir https://evaluador-v5-web.vercel.app.
2. Pegar uno o varios repositorios públicos de GitHub, o cargar ZIP/carpetas.
3. Agregar los trabajos.
4. Presionar **Ejecutar evaluaciones**.
5. Revisar puntaje total, dimensiones, criterios, evidencia, feedback, inconsistencias y alertas.
6. Exportar CSV o JSON si se necesita conservar el resultado.

No requiere login de Vercel, API keys, elección manual de modelo ni configuración técnica por parte del profesor.

### GitHub

La app acepta la raíz de un repositorio o una carpeta dentro del repositorio. Antes de puntuar, resuelve la referencia y fija un **SHA exacto** para que la evidencia evaluada sea trazable.

### Carpetas locales

La carga de carpetas está pensada principalmente para Chrome y Edge. Puede seleccionarse una carpeta completa o arrastrarse sobre la zona correspondiente. Si contiene varias subcarpetas reconocibles como entregas independientes, la app puede agregarlas como trabajos separados.

### ZIP

Admite uno o varios ZIP estándar sin contraseña, mediante selector o drag & drop. Si un ZIP contiene varias entregas en subcarpetas, pueden procesarse por separado. Los formatos no soportados deben cargarse como carpeta local.

## Agente IA y enrutamiento de modelos

La app mantiene fija la rúbrica V5 y selecciona el modelo automáticamente. La cadena operativa es:

1. `gemini-3.5-flash`;
2. `gemini-3.6-flash`;
3. `openai/gpt-5.6-luna` vía Vercel AI Gateway;
4. `openai/gpt-5.6-sol` vía Vercel AI Gateway.

Los modelos se recorren únicamente ante errores técnicos, límites de cuota o una respuesta inválida. **Nunca se cambia de modelo para perseguir una nota determinada.** Las credenciales permanecen del lado servidor.

La fuente normativa única sigue siendo:

- `../agente/system_prompt.md`;
- `../rubrica.md`;
- `../agente/configuracion.md`;
- `../agente/contrato_salida.md`.

## Runner determinístico local complementario

Durante el desarrollo se construyó un motor determinístico local para verificar reglas, fixtures y regresiones. Se conserva porque aporta reproducibilidad y transparencia, pero no representa por sí solo la evaluación semántica final de la app pública.

Para ejecutar sus pruebas locales:

```bash
cd evaluador-web
npm install
npm test
```

También pueden ejecutarse los scripts de generalización e integridad definidos en `package.json`.

`npm start` sirve la interfaz estática en `http://localhost:5173`; la ruta IA completa de producción depende de las funciones server-side desplegadas en Vercel.

Por transparencia, la comparación histórica entre runner y contrato V5 se conserva en:

- `../calibracion/verificacion_motor_vs_contrato.md`;
- `verificar-motor-vs-contrato.mjs`.

## Pruebas e imparcialidad

Los casos `Excelente`, `Flojo` y `Tramposo` son fixtures de calibración construidos para verificar la rúbrica V5. Sus referencias normativas son:

| Caso | Resultado V5 |
|---|---:|
| Excelente | 82/100 |
| Flojo | 9/100 |
| Tramposo | 31/100 |

El caso Tramposo debe además registrar la señal de manipulación sin obedecer instrucciones incluidas en la entrega que intenten alterar la evaluación.

Los repositorios reales usados como pruebas de generalización **no tienen una nota objetivo**. Sirven para comprobar que el agente pueda trabajar con estructuras distintas sin reglas dependientes del nombre, propietario o identidad del repositorio.

## Alcance y transparencia

La app pública final ejecuta el **Agente IA V5**. El runner determinístico conserva su propia identificación como mecanismo local complementario y sus divergencias históricas están documentadas en lugar de ocultarse.

El `FREEZE_V5` normativo permanece inmutable:

`5fdd304c26097aa16dc6d065e8b1c3d6359e7010`
