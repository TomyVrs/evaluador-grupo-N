# Calibración de modelos para el evaluador IA V5

## Objetivo

Elegir el modelo operativo del evaluador público sin modificar la norma V5. Se compara calidad de corrección, estabilidad, consumo y costo manteniendo constantes:

- `agente/system_prompt.md` V5;
- `rubrica.md` V5;
- `agente/configuracion.md` V5;
- `agente/contrato_salida.md` V5;
- acceso a GitHub solo lectura;
- anclaje a SHA;
- validación mecánica de puntajes.

## Perfiles a comparar

| Perfil | Proveedor | Modelo | Rol en la prueba |
|---|---|---|---|
| `sol` | OpenAI | `gpt-5.6-sol` | Referencia de máxima calidad |
| `luna` | OpenAI | `gpt-5.6-luna` | Alternativa económica |
| `free` | OpenRouter | `openai/gpt-oss-120b:free` | Alternativa de costo de inferencia USD 0 |

El perfil gratuito se considera experimental hasta completar esta calibración. No se lo convierte en corrector oficial solo por ser gratuito.

## Casos de control

La comparación debe incluir, como mínimo:

1. caso Excelente — referencia V5: 82/100;
2. caso Flojo — referencia V5: 9/100;
3. caso Tramposo — referencia V5: 31/100;
4. repositorio externo usado en la prueba de fuego — referencia V5: 98/100.

Además de la nota total, se comparan los 17 estados de criterio para detectar coincidencias artificiales en el total con desacuerdos internos.

## Datos que registra cada corrida

La app conserva junto al resultado:

- perfil;
- proveedor;
- modelo solicitado y modelo resuelto;
- cantidad de llamadas al modelo;
- `input_tokens`;
- `cached_input_tokens`;
- `output_tokens`;
- `reasoning_tokens`;
- `total_tokens`;
- costo estimado USD.

## Criterio de aceptación

Un perfil alternativo puede proponerse como modelo operativo final solo si:

- no cambia el estado global de evaluabilidad de los casos de control;
- no presenta fallas de herramientas, structured output o seguimiento de `previous_response_id`;
- no genera errores de suma, estados fuera de rúbrica ni evidencia inventada;
- mantiene una diferencia total de hasta 5 puntos frente a la referencia en cada caso;
- las diferencias de criterio son explicables y no muestran sesgo sistemático;
- el caso adversarial mantiene las alertas/manipulación y la precedencia de evidencia;
- la reducción de costo es material.

Si el perfil `free` falla por disponibilidad o rate limit, eso se registra como limitación operativa aunque la calidad de sus corridas exitosas sea buena.

## Decisión prevista

Orden de preferencia si supera la calibración:

1. `free`, si iguala suficientemente la calidad y estabilidad y soporta el volumen de la cursada;
2. `luna`, si `free` no es estable pero Luna conserva calidad con fuerte reducción de costo;
3. `sol`, si las alternativas degradan materialmente la corrección.

La decisión final debe documentarse con los resultados reales; no se asume de antemano.
