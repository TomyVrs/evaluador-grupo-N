# Cómo usar el agente corrector

El agente no es un programa: es un contrato de prompts. Existe cuando alguien se lo da a un
modelo junto con un repositorio para evaluar.

**No está atado a ningún proveedor.** La lógica —rúbrica, procedimiento, reglas de evidencia y
contrato de salida— vive en este repositorio; el modelo es solamente el motor que la ejecuta.
Cualquier modelo con acceso al repositorio puede ser ese motor.

**El archivo `agente/agente_completo.md` es el agente entero en un solo bloque.** Contiene el
system prompt, la rúbrica v5, la configuración y el contrato de salida, concatenados. Con eso
alcanza: no hace falta abrir los cuatro archivos por separado.

---

## Antes de elegir cómo correrlo

Hay una condición que no se puede saltear: **el modelo tiene que poder leer el repositorio que
va a evaluar.** Sin eso, el propio contrato le ordena devolver `NO_EVALUABLE` en vez de
improvisar.

Eso significa un entorno con acceso a internet o a archivos. Un chat sin herramientas no sirve:
va a alucinar el contenido del repo o va a cortar de entrada. Es la primera cosa que hay que
verificar el día de la prueba.

---

## Opción A — Asistente preconfigurado · recomendada para la prueba de fuego

Es la más rápida en vivo, porque el agente queda cargado de antemano y cada evaluación es un
mensaje corto. Sirve cualquier plataforma que permita guardar instrucciones persistentes: un
Proyecto de Claude, un GPT personalizado de ChatGPT, un Gem de Gemini.

**Preparación, una sola vez y antes de la clase:**

1. Crear el asistente y llamarlo *Agente evaluador — Grupo N*.
2. Pegar el contenido completo de `agente/agente_completo.md` en su campo de instrucciones.
3. Verificar que el asistente tenga acceso a internet o a lectura de repositorios.
4. Guardar. El agente ya está montado.

**En vivo, por cada repositorio a evaluar**, abrir un chat nuevo dentro del proyecto y pegar
esto, reemplazando la URL:

```
Evaluá este trabajo final aplicando el contrato que tenés cargado.

- URL del repositorio: https://github.com/USUARIO/REPO
- Rama: la predeterminada. Registrá el commit exacto que evaluaste.
- Ruta raíz: /
- Fecha de evaluación: [AAAA-MM-DD]

Leé el repositorio con las herramientas disponibles, inventariá los archivos
antes de puntuar, y devolvé exclusivamente el JSON del contrato de salida.
Sin texto adicional.
```

**Cada evaluación va en un chat nuevo, nunca encadenada a la anterior.** Si se encadenan dos en
una misma conversación, la segunda arrastra lo que el modelo vio en la primera y deja de ser
reproducible.

## Opción B — Chat suelto, sin proyecto

Sirve si no se puede armar un proyecto. Es más lento porque hay que pegar el bloque completo
cada vez.

1. Abrir un chat nuevo con un modelo que tenga acceso a internet.
2. Pegar todo `agente/agente_completo.md` como primer mensaje.
3. Esperar la confirmación de que lo leyó.
4. Pegar el pedido de evaluación de la Opción A como segundo mensaje.

## Opción C — Terminal

Útil para correr varios casos seguidos o para dejar registro automático de las salidas. El
ejemplo usa un cliente de línea de comandos; el mismo esquema aplica a cualquier otro.

```bash
git clone https://github.com/USUARIO/REPO repo-a-evaluar

claude -p "Evaluá el repositorio que está en ./repo-a-evaluar aplicando el
contrato completo. Ruta raíz: /. Fecha: $(date +%F). Devolvé exclusivamente
el JSON del contrato de salida." \
  --append-system-prompt "$(cat agente/agente_completo.md)" \
  > salida.json
```

Conviene verificar los flags con `claude --help`, que cambian entre versiones.

---

## Opción D — `evaluador-web`

El repositorio incluye además una interfaz web (`evaluador-web/`) que evalúa repositorios de
GitHub, carpetas locales o ZIP.

**Importante, para no confundir dos cosas distintas:** esa app **no le pasa el contrato a un
modelo.** Puntúa con un motor determinístico local escrito en JavaScript, que reimplementa la
rúbrica. Es rápido, gratuito y no necesita clave de API, pero es una implementación paralela,
no el agente.

La diferencia no es teórica: sobre el único repositorio externo que ambos evaluaron
(`borlandini-gh/generador-mails-mensuales`, SHA `beb7c04`) el contrato dio **98/100** y el motor
**44/100**. Está documentado en `calibracion/verificacion_motor_vs_contrato.md` y se reproduce
con `evaluador-web/verificar-motor-vs-contrato.mjs`.

Usar `evaluador-web` como pre-filtro rápido o para una demo está bien. **La nota que se informa
como resultado del agente tiene que salir de las opciones A, B o C**, hasta que ambos coincidan.

---

## Sobre qué motor se calibró

Los resultados registrados en `calibracion.md` —82, 9 y 31 para los casos excelente, flojo y
tramposo— se obtuvieron ejecutando este contrato en sesiones aisladas, sobre el commit
congelado `5fdd304` (FREEZE_V5).

El contrato es portable, pero **los puntajes no son necesariamente idénticos entre motores
distintos**. Si se corre sobre otro modelo y los números difieren, la diferencia es del motor,
no de la rúbrica — salvo que la rúbrica tenga ambigüedades, que es justamente lo que una
comparación entre motores permite descubrir.

Para una evaluación reproducible hay que fijar y declarar tres cosas: el modelo, su versión
exacta y la temperatura. Cada salida debería registrarlas.

---

## Verificación antes de dar por buena una salida

Cinco controles rápidos, en orden:

1. La respuesta es **JSON válido y nada más** — sin markdown ni comentarios alrededor.
2. `puntaje_total` es exactamente la suma de las cinco dimensiones.
3. Ninguna dimensión supera su máximo: 30, 25, 15, 15, 15.
4. `repositorio.commit_sha` está completo. Si viene vacío, la evaluación no es reproducible y
   hay que repetirla.
5. Cada dimensión trae evidencia con ruta y una mejora concreta.

Si el estado es `NO_EVALUABLE`, revisar primero si el problema fue de acceso al repositorio
antes de suponer que el trabajo está mal.

---

## Ensayo previo a la prueba de fuego

Conviene hacerlo con el asistente ya montado, un día antes:

- Correrlo sobre los tres casos del repo y confirmar que reproduce 82, 9 y 31. Si dan muy
  distinto, algo cambió en el contrato y hay que revisar qué.
- Correrlo sobre un repositorio real de un trabajo final ajeno, para ver cómo se comporta con
  material que nadie diseñó para él.
- Correrlo sobre un repositorio que no exista, para confirmar que devuelve `NO_EVALUABLE` y no
  un cero.
- Cronometrar cuánto tarda una evaluación completa. En vivo, saberlo evita quedar esperando sin
  saber si se colgó.
