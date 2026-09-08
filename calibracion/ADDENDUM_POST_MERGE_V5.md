# Addendum post-merge — V5

Fecha: 2026-09-08.

Este documento actualiza el **estado operativo** posterior a `calibracion.md` sin reescribir la calibración histórica ni el `FREEZE_V5`.

## Estado actual

- PR #13: integrado en `main` el 2026-09-08.
- Commit de merge en el repositorio grupal: `45b1969e736a455c8d3f539a9c392ff3c2f34cdf`.
- `FREEZE_V5`: `5fdd304c26097aa16dc6d065e8b1c3d6359e7010` — permanece inalterado.
- Rúbrica, system prompt, configuración y contrato de salida V5: sin cambios normativos en el hardening post-merge.

## Validación humana adicional

Guillermo Rojas Yenni realizó una evaluación humana independiente posterior del caso Excelente:

- Agente V5: 82/100.
- Guillermo: 85/100.
- Diferencia total: 3 puntos.

Esta revisión adicional no se presenta como parte de la ronda original ni como evaluación ciega. Se conserva como una segunda mirada humana auténtica del grupo y no obliga a modificar la V5.

## Hardening post-merge

Después de integrar PR #13 se revisaron todos los comentarios relevantes de PR #13 y PR #14. El hardening resultante se limita a:

- aclarar en pantalla y documentación que `evaluador-web` es un runner determinístico complementario;
- reparar un smoke test externo cuya referencia había desaparecido;
- ejecutar CI también sobre PRs hacia `main`;
- validar automáticamente que la interfaz declare el alcance del runner;
- limpiar plantillas humanas no ejecutadas para que no parezcan resultados reales;
- documentar qué propuestas de PR #14 se incorporan y cuáles se descartan con motivo.

No se modifican los puntajes congelados 82/9/31 ni el resultado externo 98/98 del contrato.

## Runner vs. agente

La divergencia entre el runner determinístico y el agente V5 sobre un repositorio externo permanece documentada. No se intenta forzar paridad mediante heurísticas que alteren los fixtures conocidos.

La regla de interpretación es:

1. el agente V5 + `rubrica.md` constituyen la fuente normativa;
2. el runner es una implementación local auditable para pre-evaluación y demostración;
3. cualquier diferencia debe registrarse, no ocultarse.

## Cierre de PR #14

PR #14 no debe mergearse completo. Sus aportes útiles quedan reflejados en la V5/hardening y sus reglas incompatibles se descartan explícitamente en `docs/AUDITORIA_FINAL_PR13_PR14.md`.

Una vez integrado el PR final de hardening, PR #14 puede cerrarse como **superseded**.
