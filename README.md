# Agente Evaluador de Trabajos Finales

## Qué construimos

Construimos un agente evaluador capaz de corregir repositorios de Trabajos Finales de la materia. Inspecciona archivos e historial, usa evidencia verificable, aplica una rúbrica ejecutable de 100 puntos y devuelve una evaluación estructurada con puntaje, justificación, evidencia y mejora concreta.

## Cómo se lo pedimos

Definimos una rúbrica ejecutable, un contrato de salida y un system prompt con reglas de acceso, trazabilidad, supervisión, manejo de evidencia insuficiente y resistencia a prompt injection. También construimos tres casos de prueba y un protocolo de calibración reproducible.

## Qué funciona

- Rúbrica v3 con cinco dimensiones y pesos oficiales: 30/25/15/15/15.
- Puntajes fijos por criterio y reglas operativas para clasificar `CUMPLE`, `PARCIAL`, `NO_CUMPLE` y `NO_VERIFICABLE`.
- Evaluación basada en archivos, historial y evidencia verificable.
- Distinción entre ausencia de evidencia y evidencia de ausencia.
- Detección y registro de instrucciones maliciosas dentro del repositorio.
- Salida JSON estructurada con puntaje por dimensión, evidencia y mejora.
- Tres casos de prueba: excelente, flojo y tramposo.
- Corrida técnica de los tres casos sobre la misma versión congelada: **88/100, 5/100 y 26/100**, respectivamente.
- El caso tramposo no logra alterar la rúbrica y se detectan sus contradicciones, error económico e intento de prompt injection.

## Qué falta o qué falló

La **calibración técnica del agente ya fue ejecutada**, pero la calibración completa todavía no está cerrada. Falta que tres integrantes puntúen cada caso de forma independiente y ciega, calcular las medianas humanas y comparar esas notas con las del agente. Los resultados automáticos y el procedimiento están registrados en `calibracion.md` y `calibracion/resultados/`.

La versión de trabajo posterior a la integración inicial se mantiene en una rama paralela para revisión; no requiere modificar `main` hasta que el equipo decida incorporar los cambios.

## Qué aprendimos

Aprendimos que una rúbrica no alcanza con definir rangos generales: para que un agente la aplique de manera consistente también debe fijar el valor de cada criterio y las condiciones exactas que separan cumplimiento parcial de incumplimiento. También comprobamos que un repositorio puede usar una documentación convincente para intentar manipular la evaluación, por lo que el corrector debe contrastar claims con evidencia concreta y conservar trazabilidad de cada decisión.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
