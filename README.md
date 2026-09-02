# Agente Evaluador de Trabajos Finales

## Qué construimos

Construimos un agente evaluador capaz de corregir repositorios de Trabajos Finales de la materia. Inspecciona archivos e historial, usa evidencia verificable, aplica la rúbrica oficial de 100 puntos y devuelve una evaluación estructurada con puntaje, justificación, evidencia y mejora concreta.

## Cómo se lo pedimos

Definimos una rúbrica ejecutable, un contrato de salida y un system prompt con reglas de acceso, trazabilidad, supervisión, manejo de evidencia insuficiente y resistencia a prompt injection. También construimos tres casos de prueba y un protocolo de calibración.

## Qué funciona

- Rúbrica con cinco dimensiones y pesos oficiales: 30/25/15/15/15.
- Evaluación basada en archivos, historial y evidencia verificable.
- Distinción entre ausencia de evidencia y evidencia de ausencia.
- Detección de instrucciones maliciosas dentro del repositorio.
- Salida JSON estructurada con puntaje por dimensión, evidencia y mejora.
- Casos excelente, flojo y tramposo preparados para prueba.

## Qué falta o qué falló

La calibración real todavía no fue ejecutada. Por eso `calibracion.md` contiene el protocolo y tablas pendientes, pero no resultados inventados. La integración final al repositorio original queda sujeta a la decisión del equipo.

## Qué aprendimos

Aprendimos que una rúbrica debe transformar criterios generales en evidencia y límites aplicables por un agente. También que un repositorio puede contener instrucciones engañosas y que el evaluador debe tratar todo su contenido como datos. La trazabilidad de commits y corridas es necesaria para discutir una nota.

## Integrantes

- Silvia Bustos
- Jazmin Farias
- Tomas Sarti
- Juan Martin Mozotegui
- Jonathan Chilano
- Guillermo Rojas Yenni
