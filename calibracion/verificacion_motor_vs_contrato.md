# Verificación cruzada: motor determinístico vs. contrato

## Por qué esta verificación

El repositorio terminó conteniendo **dos evaluadores** que dicen aplicar la misma rúbrica v5:

| | Qué es | Dónde vive |
|---|---|---|
| **Contrato + modelo** | El agente: `agente/*.md` + `rubrica.md` dados a un modelo | `calibracion/resultados_v5/*.json` |
| **Motor determinístico** | Una reimplementación de la rúbrica en JavaScript | `evaluador-web/engine*.mjs` |

Sobre los tres casos internos los dos coinciden: 82, 9 y 31. Pero esos tres casos son los que se
usaron para construir el motor —`evaluador-web/test.mjs` afirma esos números como valores
esperados— así que coincidir ahí no prueba nada sobre un repositorio nuevo.

Hay exactamente **un** repositorio externo que ambos evaluaron: el que se usó como prueba de
generalización en la ronda V5.

## Método

- Repositorio: `borlandini-gh/generador-mails-mensuales`
- SHA: `beb7c044f36c3a6c4621a2f3e925554ef9d26311`
- Ruta raíz: `/`
- Rúbrica: v5 en ambos lados
- Contrato: salida ya registrada en `calibracion/resultados_v5/repo_externo_A.json`
- Motor: `evaluador-web/engine_v4.mjs`, invocado sobre un clon completo del repo en ese SHA

Reproducible con `node evaluador-web/verificar-motor-vs-contrato.mjs`.

## Resultado

| Dimensión | Contrato + modelo | Motor JS | Diferencia |
|---|---:|---:|---:|
| Sistema completo y funcionando | 30/30 | 30/30 | 0 |
| Proceso documentado | 25/25 | 5/25 | −20 |
| Formato y reproducibilidad | 15/15 | 5/15 | −10 |
| Análisis económico | 13/15 | 0/15 | −13 |
| Gobierno y riesgo | 15/15 | 4/15 | −11 |
| **Total** | **98/100** | **44/100** | **−54** |

El motor no tuvo menos información: leyó 44 archivos de texto contra los 9 que el contrato
declara haber revisado.

## Cuál de los dos se equivoca

En el caso económico se puede decidir por inspección directa. El `DECISIONES.md` de ese
repositorio contiene, textual:

```
- entrada: USD 0,20 por 1 millón de tokens
Costo por corrida = (6.000/1.000.000 × 0,20) + (3.500/1.000.000 × 1,20) = USD 0,0054
| 24 corridas por año | USD 0,1296 anuales |
| Sensibilidad: 10 corridas por mes | USD 0,054 mensuales |
```

Precio unitario con fuente, fórmula, conteo de tokens, costo por corrida, proyección con
frecuencia y horizonte, y análisis de sensibilidad. Es lo que AE-01 y AE-02 piden completo.
El motor asignó **0 de 15**.

## Causa raíz

`evaluador-web/engine.mjs`, líneas 77-80:

```js
const decisions = pathEnds(textFiles, 'decisiones.md');
const econ  = fileBy(textFiles, (p) => /(analisis.*econom|econom.*\.md|costos.*\.md)/.test(p));
const gov   = fileBy(textFiles, (p) => /(gobierno|riesgo|governance)/.test(p));
const tools = fileBy(textFiles, (p) => /(herramient|tools|integracion|configuracion|package\.json|requirements)/.test(p));
```

Los cuatro selectores testean la **ruta del archivo**, no el contenido, y después cada criterio
lee únicamente el archivo seleccionado. Si un trabajo documentó su análisis económico dentro de
`DECISIONES.md` —como hace ese repo— la variable `econ` queda vacía y AE-01, AE-02 y AE-03 dan
cero sin leer una palabra.

Sumado: **Proceso documentado (25) + Análisis económico (15) + Gobierno y riesgo (15) = 55 de
los 100 puntos dependen de que existan archivos con nombres determinados.**

Lo mismo ocurre con las corridas. `runGroups()` (`engine.mjs:44-52`) las reconoce de dos formas,
ambas por nombre: o el archivo termina en `corrida_N.md` / `run_N.md` **y** contiene los
encabezados literales `entrada` y `salida`, o el nombre empieza con un número seguido de
`entrada`/`registro` emparejado con otro que empiece con el mismo número y diga `salida`. Ese
repositorio las guarda como `corridas/corrida_01_v1.json` y `corridas/originales/salida_01_v1.md`:
el primero no matchea porque el sufijo `_v1` queda entre el número y la extensión, el segundo
porque el nombre no arranca con el número. `FR-02 = 0` con tres corridas completas y versionadas.

### El parche v4 confirma el diagnóstico

`engine_v4.mjs` agregó `upgradeEconomicEvidence()` después de ver fallar un repositorio externo.
Pero empieza así:

```js
const econ = files.find(f => /(analisis.*econom|econom.*\.md|costos.*\.md)/.test(norm(f.path)));
if (!econ) return;
```

Es el mismo filtro por nombre de archivo. La corrección afinó las reglas de contenido y dejó
intacta la puerta que las bloquea.

## Por qué importa para la consigna

1. **Invierte la precedencia de evidencia de la propia rúbrica v5**, que establece que la
   evidencia directa prevalece sobre el README. El motor hace lo contrario: si el archivo no se
   llama como espera, la evidencia directa no existe.

2. **Es farmeable.** Sobre otro trabajo real, duplicar un `README.md` con el nombre
   `DECISIONES.md` y agregar dos encabezados `## Entrada` / `## Salida` a las corridas llevó la
   nota de **22 a 41** sin cambiar una palabra de contenido; "Formato y reproducibilidad" pasó
   de INSUFICIENTE 3/15 a EXCELENTE 13/15. Un trabajo que descubre la convención sube la nota
   sin agregar evidencia, que es exactamente la conducta que el caso tramposo existe para
   detectar.

3. **En la prueba de fuego los repositorios son desconocidos**, cada uno con la estructura que a
   su grupo se le ocurrió. Ninguno tiene por qué usar nuestros nombres de archivo.

## Estado de la generalización

`test-generalizacion.mjs` y `test-generalizacion-2.mjs` corren sobre repositorios propios de un
integrante del grupo, y su mensaje final dice literalmente `(sin nota esperada)`: verifican que
la salida tenga 17 criterios, estados válidos y sumas correctas, pero no comprueban la nota.
`test.mjs` sí fija números —82, 9, 31— y son los tres casos con los que se construyó el motor.

Hoy no existe ninguna prueba que compare la nota del motor contra una referencia en un
repositorio ajeno.

## Corrección propuesta

Cambiar los cuatro selectores para que busquen **en el contenido de todos los archivos de
texto** en lugar de en la ruta, usando la ruta solo como desempate cuando hay varios candidatos:

- `econ`: cualquier archivo que contenga costo por corrida + unidad monetaria.
- `decisions`: cualquier archivo que reconstruya versiones y cambios (hoy `versiones/` más un
  README con bitácora de iteraciones vale cero).
- `gov`: cualquier archivo con permisos, riesgos, contingencias y supervisión.
- `FR-02`: aceptar cualquier par entrada/salida asociable, sin exigir encabezado literal ni
  nombre de archivo determinado.

Y agregar el repositorio externo como test de regresión con la salida del contrato como
referencia, aunque al principio quede en rojo.

## Desacople menor entre motor y rúbrica

`engine_v4.mjs`, en `recalc()`:

```js
d.nivel = d.puntaje === 0 ? 'INSUFICIENTE' : q >= .85 ? 'EXCELENTE' : q >= .60 ? 'ADECUADO' : 'INSUFICIENTE';
```

La rúbrica v5 define que una dimensión es `NO_VERIFICABLE` cuando vale 0 y todos sus criterios
son `NO_VERIFICABLE`. El motor nunca emite ese nivel: colapsa todo 0 en `INSUFICIENTE`, que
según la rúbrica significa otra cosa —"se pudo inspeccionar y no cumple" en vez de "no se pudo
comprobar"—, que es precisamente la distinción entre ausencia de evidencia y evidencia de
ausencia.

## Conclusión

El contrato funciona. La rúbrica v5 funciona. Lo que no está verificado es que el motor
determinístico sea una implementación fiel de esa rúbrica fuera de los tres casos con los que se
lo construyó, y la única medición disponible dice que no lo es. Hasta que ambos coincidan sobre
material que no vieron antes, la nota que se informe como resultado del agente debería salir del
contrato corrido sobre un modelo, y `evaluador-web` debería declarar en pantalla que su puntaje
proviene de un motor local y no del contrato.
