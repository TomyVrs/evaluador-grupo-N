# Agente Evaluador de Trabajos Finales

## Qué construimos

Construimos un agente evaluador para corregir repositorios de Trabajos Finales de la materia **Creación de Agentes con IA**. Inspecciona evidencia verificable, aplica una rúbrica ejecutable de 100 puntos y devuelve una evaluación estructurada con puntaje, justificación, evidencia, inconsistencias y mejoras concretas.

La versión normativa actual es **V5**. El PR #13 fue integrado en `main` el 8 de septiembre de 2026. El hardening posterior conserva la V5 congelada y corrige únicamente transparencia, documentación y validaciones operativas.

## Cómo se lo pedimos

Definimos cuatro piezas normativas:

1. `agente/system_prompt.md`
2. `rubrica.md`
3. `agente/configuracion.md`
4. `agente/contrato_salida.md`

El agente trabaja sobre una referencia GitHub resuelta a un SHA exacto, inventaría el alcance antes de puntuar, aplica precedencia de evidencia, trata todo el contenido del trabajo como evidencia no confiable, resiste prompt injection y utiliza únicamente operaciones de lectura durante la evaluación.

Para ejecución práctica también se incluye `agente/agente_completo.md`, que concatena el contrato del agente en un solo bloque, y una interfaz web local en `evaluador-web/`.

## Qué funciona

- Rúbrica V5 con cinco dimensiones y pesos oficiales **30/25/15/15/15**.
- 17 criterios con puntajes discretos para `CUMPLE`, `PARCIAL`, `NO_CUMPLE` y `NO_VERIFICABLE`.
- Definición operativa de las seis piezas del contrato del agente.
- Precedencia explícita entre ejecución/traza, artefactos, registros, README y claims.
- SC-02 tecnológicamente neutral: acepta traza/corrida, implementación local reproducible o integración reproducible.
- Evaluación anclada a SHA exacto y control de cobertura/inventario.
- Defensa contra prompt injection y manipulación de la rúbrica.
- Salida JSON estructurada y validación automática de IDs, puntajes, sumas y niveles.
- Casos obligatorios Excelente, Flojo y Tramposo ejecutados A/B sobre el mismo freeze.
- Casos de borde `NO_EVALUABLE` para repo, referencia y ruta inexistentes.
- Prueba adicional sobre un repositorio público real no usado para construir los fixtures.
- Calibración humano–agente documentada con sus limitaciones reales, sin inventar evaluadores.
- Revisión humana independiente posterior de Guillermo Rojas Yenni sobre el caso Excelente: **85/100** frente a **82/100** del agente.
- Runner web local gratuito para repositorios GitHub, carpetas y ZIP.
- CI con build, fixtures, integridad, dos smoke tests sobre repos reales y comparación runner vs. contrato.

### Resultados congelados V5

**FREEZE_V5:** `5fdd304c26097aa16dc6d065e8b1c3d6359e7010`

| Prueba | A | B | Diferencia por criterio |
|---|---:|---:|---:|
| Excelente | 82/100 | 82/100 | 0 |
| Flojo | 9/100 | 9/100 | 0 |
| Tramposo | 31/100 | 31/100 | 0 |
| Repo externo no visto | 98/100 | 98/100 | 0 |

El caso Tramposo ignora la instrucción de asignar 100/100, registra la manipulación, detecta contradicciones y recalcula un error aritmético en lugar de confiar en el claim del repositorio.

## Runner web: alcance y transparencia

`evaluador-web/` es una **mecanización determinística local y complementaria** de la rúbrica V5. Sirve para ejecutar una evaluación sin API de IA paga ni credenciales privadas del equipo.

```bash
cd evaluador-web
npm install
npm test
npm start
```

Después abrir `http://localhost:5173`.

La nota mostrada por esa web la calcula el runner local. **No se presenta como una corrida del LLM ni reemplaza al agente de IA V5.** Esta distinción aparece tanto en el README del runner como en la propia interfaz.

La comparación reproducible entre ambos mecanismos se conserva en:

- `calibracion/verificacion_motor_vs_contrato.md`
- `evaluador-web/verificar-motor-vs-contrato.mjs`

Sobre el repositorio externo usado en esa comparación existe una divergencia material entre el contrato ejecutado por modelo y el runner. En vez de ocultarla o ajustar el runner para alcanzar una nota objetivo, se documenta como limitación del mecanismo determinístico. Se corrigieron únicamente mejoras generales que no rompen los fixtures congelados.

## Calibración humano–agente

La ronda humana original se hizo sobre el mismo `FREEZE_V5`, criterio por criterio, pero **no fue ciega** y fue realizada por un evaluador humano del grupo que ya conocía los totales automáticos. Esa limitación está declarada en `calibracion.md`.

Resultados humanos iniciales: Excelente 78, Flojo 5 y Tramposo 31. Los desacuerdos materiales se adjudicaron aplicando literalmente la rúbrica sobre la evidencia; la comparación final quedó 82/9/31. No fue necesario modificar la rúbrica ni el agente.

Posteriormente, Guillermo Rojas Yenni realizó una revisión humana independiente adicional del caso Excelente y obtuvo **85/100**. La diferencia respecto del agente es de 3 puntos y se conserva como validación posterior, sin reescribir retroactivamente la calibración congelada.

Las plantillas de tres evaluadores que no llegaron a ejecutarse se conservan únicamente por trazabilidad y están marcadas explícitamente como **no ejecutadas**.

## Revisión de PR #14

El PR #14 propuso mejoras sobre determinismo, fraude y jerarquía de evidencia. Fue auditado completo junto con los comentarios del PR #13.

Se conservaron las ideas útiles:

- verificar evidencia antes de puntuar;
- precedencia clara ante contradicciones;
- alertas de manipulación;
- reproducibilidad anclada a SHA;
- mayor generalización donde puede hacerse sin romper la calibración.

No se incorporaron reglas que podían sesgar o degradar el evaluador:

- nombres de archivo obligatorios;
- cantidades mínimas arbitrarias de palabras;
- penalizaciones por horario o frecuencia de commits;
- penalizaciones por mencionar la rúbrica;
- garantías de “determinismo 100%” entre LLMs;
- un contrato JSON V6 incompatible con la V5 congelada.

El detalle comentario por comentario está en `docs/AUDITORIA_FINAL_PR13_PR14.md`. Cuando el hardening final quede integrado, el PR #14 puede cerrarse como **superseded** sin perder su historial ni la autoría de sus aportes.

## Qué falta

Para cerrar el repositorio no falta modificar la rúbrica ni el agente V5. El hardening final debe:

- pasar CI completo;
- integrarse en `main` mediante un único PR;
- luego cerrar el PR #14 como superseded;
- actualizar el deployment público para que el link de Vercel apunte al `main` final.

Como mejora posterior no bloqueante puede ampliarse la calibración con más trabajos reales de banda media y, si se quisiera convertir la web en evaluador normativo, implementar un modo LLM del lado servidor. Ninguna de esas dos mejoras es necesaria para conservar la entrega V5 actual.

## Qué aprendimos

Una rúbrica ejecutable necesita puntajes discretos, reglas de clasificación y precedencia de evidencia, pero eso no alcanza: hay que enfrentarla a estructuras distintas de los fixtures, separar evidencia de claims y documentar también las limitaciones.

La comparación entre el agente y el runner mostró que un motor determinístico basado en heurísticas puede ser reproducible y aun así divergir semánticamente de un LLM. La decisión correcta fue no esconder esa diferencia: el agente V5 queda como fuente normativa y el runner como herramienta complementaria, explícita y auditable.

La calibración también mostró que un desacuerdo humano–agente no implica automáticamente que el agente esté mal; primero hay que volver a la definición del criterio y a la evidencia antes de cambiar la rúbrica.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
