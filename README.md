# Agente Evaluador de Trabajos Finales

## Qué construimos

Construimos un agente evaluador capaz de corregir repositorios de Trabajos Finales de la materia. Inspecciona archivos e historial, usa evidencia verificable, aplica una rúbrica ejecutable de 100 puntos y devuelve una evaluación estructurada con puntaje, justificación, evidencia y mejora concreta.

## Cómo se lo pedimos

Definimos una rúbrica ejecutable, system prompt, user prompt, configuración operativa y contrato de salida. El agente trabaja sobre una referencia GitHub congelada, inventaría el alcance antes de puntuar, aplica precedencia de evidencia, resiste prompt injection y usa únicamente operaciones de lectura.

## Qué funciona

- Rúbrica v4 con cinco dimensiones y pesos oficiales: 30/25/15/15/15.
- Puntaje fijo por criterio: el agente no elige valores intermedios.
- Reglas operativas para `CUMPLE`, `PARCIAL`, `NO_CUMPLE` y `NO_VERIFICABLE`.
- Precedencia explícita para resolver afirmaciones y evidencia contradictoria.
- Evaluación anclada a un SHA exacto para evitar mezclar versiones durante una corrida.
- Inventario previo del alcance y controles ante resultados truncados o parciales.
- Distinción entre evidencia de ausencia y limitación de acceso.
- GitHub tratado como herramienta de lectura; las operaciones de escritura quedan fuera del contrato del corrector.
- Detección y registro de prompt injection y claims no verificables.
- Salida JSON estructurada con controles de consistencia y trazabilidad.
- Tres casos de prueba: excelente, flojo y tramposo.
- Protocolo de calibración pre-registrado, incluyendo prueba de repetibilidad A/B y comparación contra criterio humano.

## Qué falta o qué falló

La v4 es la **candidata de calibración**, todavía no la versión cerrada. Antes de declarar el evaluador validado hay que:

1. congelar el SHA candidato;
2. ejecutar dos veces cada uno de los tres casos sobre exactamente ese SHA;
3. comprobar que los puntajes por criterio sean idénticos entre A y B;
4. comprobar los umbrales pre-registrados para excelente, flojo y tramposo;
5. completar la evaluación humana ciega de tres integrantes;
6. comparar medianas humanas versus agente y explicar diferencias materiales.

`main` no se modifica durante esta etapa. Todo el endurecimiento y la calibración se realizan en una única rama paralela hasta que el equipo decida qué integrar.

## Qué aprendimos

Aprendimos que una rúbrica ejecutable requiere más que rangos de puntaje: necesita criterios con valores fijos, reglas de clasificación y precedencia de evidencia. También que la reproducibilidad depende de congelar la referencia evaluada, controlar la cobertura real del repositorio y separar los resultados de calibración de la evidencia que se está puntuando. La robustez del corrector no se demuestra por una única corrida exitosa, sino por repetibilidad, resistencia a casos adversariales y comparación con criterio humano.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
