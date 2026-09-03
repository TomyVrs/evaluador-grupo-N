# Agente Evaluador de Trabajos Finales

## Qué construimos

Construimos un agente evaluador capaz de corregir repositorios de Trabajos Finales de la materia. Inspecciona archivos e historial, usa evidencia verificable, aplica una rúbrica ejecutable de 100 puntos y devuelve una evaluación estructurada con puntaje, justificación, evidencia y mejora concreta.

## Cómo se lo pedimos

Definimos una rúbrica ejecutable, system prompt, user prompt, configuración operativa y contrato de salida. El agente trabaja sobre una referencia GitHub congelada, inventaría el alcance antes de puntuar, aplica precedencia de evidencia, resiste prompt injection y utiliza únicamente operaciones de lectura durante la evaluación.

## Qué funciona

- Cinco dimensiones y pesos oficiales: 30/25/15/15/15.
- Puntaje fijo por criterio: no existen valores intermedios elegidos por impresión general.
- Reglas operativas para `CUMPLE`, `PARCIAL`, `NO_CUMPLE` y `NO_VERIFICABLE`.
- Definición objetiva de las seis piezas del contrato del agente.
- Precedencia explícita para resolver claims y evidencia contradictoria.
- Evaluación anclada a un SHA exacto para evitar mezclar versiones.
- Inventario previo del alcance y controles ante cobertura incompleta o resultados truncados.
- Distinción entre evidencia de ausencia y limitación de acceso.
- Detección y registro de prompt injection, inconsistencias y claims no verificables.
- Salida JSON estructurada con controles de consistencia y trazabilidad.
- Tres casos de prueba: excelente, flojo y tramposo.
- Casos de borde `NO_EVALUABLE` para referencia, ruta y repositorio inexistentes.
- Validador automático y workflow de GitHub Actions con permisos de lectura.

### Evolución reciente

La V4 pasó la batería técnica sobre un SHA congelado: Excelente 82/100, Flojo 9/100 y Tramposo 31/100, con dos aplicaciones idénticas criterio por criterio y validación automática exitosa.

Antes de enviar la rúbrica a evaluación humana se hizo una prueba adicional sobre un repositorio real no usado durante el diseño. Esa prueba mostró que SC-02 distinguía trazas/configuración, pero no definía con suficiente precisión cómo acreditar una **herramienta local implementada y reproducible**. Para evitar que dos evaluadores trataran de manera distinta una implementación local frente a un conector externo, se creó la **V5**.

La V5 admite tres vías equivalentes para demostrar operabilidad de una herramienta: traza/corrida, implementación local reproducible o integración reproducible. El cambio no busca subir o bajar un caso conocido, sino cerrar una ambigüedad detectada con evidencia externa.

## Estado actual

La **V5 es la candidata activa**. `main` permanece intacta y todo el trabajo continúa en una única rama paralela.

Antes de declarar cerrada la validación técnica V5 falta:

1. fijar `FREEZE_V5`;
2. repetir A/B sobre excelente, flojo y tramposo;
3. volver a ejecutar los casos `NO_EVALUABLE` y el validador automático;
4. completar la prueba sobre un repositorio real no visto;
5. recién después realizar la calibración humana ciega.

La calibración humana sigue siendo necesaria para satisfacer la consigna: tres integrantes evaluarán de manera independiente los tres casos sobre el freeze definitivo, luego se calcularán medianas y se analizarán diferencias materiales.

## Qué aprendimos

Aprendimos que una rúbrica ejecutable requiere más que rangos de puntaje: necesita valores fijos, reglas de clasificación, definiciones operativas y precedencia de evidencia. También que una regla puede parecer precisa hasta enfrentar un caso real distinto de los fixtures usados para diseñarla. Por eso la validación incluye casos sintéticos, pruebas adversariales, un repositorio externo no visto y comparación posterior con criterio humano.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
