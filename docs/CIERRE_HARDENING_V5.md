# Cierre de hardening V5

Este cambio posterior al merge de PR #13 no modifica la fuente normativa ni los resultados congelados de V5.

## Alcance

- transparencia visible de `evaluador-web` como runner determinístico complementario;
- reparación del segundo smoke test real con un SHA vigente;
- CI también sobre pull requests a `main`;
- validación automática de la transparencia de la interfaz;
- aclaración de la evaluación independiente de Guillermo (85/100);
- identificación explícita de las plantillas humanas no ejecutadas;
- auditoría completa de los comentarios y propuestas de PR #13 y PR #14;
- actualización del README al estado real post-merge.

## Fuera de alcance deliberadamente

- cambiar la rúbrica V5;
- cambiar system/user prompt, configuración o contrato de salida;
- forzar paridad del runner con un LLM mediante heurísticas que rompan los fixtures;
- introducir penalizaciones de fraude no definidas por la rúbrica;
- prometer determinismo universal entre modelos;
- convertir la web en un backend LLM pago.

## Resultado esperado

Después del merge de este hardening:

1. `main` queda como única candidata operativa;
2. PR #14 puede cerrarse como superseded;
3. el siguiente paso es revisión final del equipo y actualización del deployment público desde el `main` definitivo.
