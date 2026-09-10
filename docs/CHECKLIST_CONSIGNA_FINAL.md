# Checklist final contra la consigna — Agente Evaluador

Este documento mapea la versión final **V5** contra las piezas y criterios de evaluación del trabajo. No reemplaza la consigna oficial ni `calibracion.md`.

## 1. Rúbrica ejecutable — 25%

**Exigencia:** escalas por nivel, evidencia exigida por cada puntaje, ejemplos alto/bajo y precisión suficiente para aplicar igual dos veces.

- [x] Cinco dimensiones y pesos oficiales 30/25/15/15/15.
- [x] Puntajes discretos por criterio.
- [x] Estados `CUMPLE`, `PARCIAL`, `NO_CUMPLE`, `NO_VERIFICABLE` definidos operativamente.
- [x] Ejemplos altos y bajos por dimensión.
- [x] Precedencia ante evidencia contradictoria.
- [x] Distinción entre ausencia comprobada y falta de acceso.
- [x] Seis piezas de SC-01 definidas operativamente.
- [x] SC-02 tecnológicamente neutral: traza/corrida, implementación local reproducible o integración reproducible.
- [x] A/B con diferencia 0 por criterio en los tres casos obligatorios.
- [x] A/B con diferencia 0 sobre un repo externo no visto.

**Evidencia:** `rubrica.md`, `calibracion.md`, `calibracion/resultados_v5/`.

## 2. Agente corrector — 25%

**Exigencia:** recibe una entrega real y devuelve puntaje por dimensión, justificación con evidencia y mejora concreta en formato estructurado estable.

- [x] `agente/system_prompt.md` V5.
- [x] `agente/user_prompt.md` V5.
- [x] `agente/configuracion.md` V5.
- [x] `agente/contrato_salida.md` V5.
- [x] GitHub en modo lectura durante evaluación.
- [x] Resolución ref → SHA antes de puntuar repositorios GitHub.
- [x] Inventario antes de afirmar ausencia.
- [x] Defensa ante cobertura/truncamiento incompleto.
- [x] JSON estructurado y recálculo mecánico.
- [x] Bordes `NO_EVALUABLE` para ref, ruta y repo inexistentes.
- [x] Workflow V5 con permisos de lectura y validaciones automáticas.
- [x] Ejecución sobre repositorios públicos reales no usados como fixtures.
- [x] App pública con Agente IA V5 server-side.
- [x] Procesamiento por lote.
- [x] Carga por GitHub, ZIP y carpetas locales.
- [x] Selección manual y drag & drop para ZIP/carpetas.
- [x] Trazabilidad por SHA exacto o huella local SHA-256.
- [x] Evidencia, feedback, inconsistencias, alertas y exportación CSV/JSON.
- [x] Fallback automático de modelos sin elección manual del profesor.
- [x] Acceso público sin login ni API keys del usuario.

**Evidencia:** `agente/`, `evaluador-web/`, `.github/workflows/validate-v5.yml`, `calibracion/validar_resultados_v5.py`, `calibracion/resultados_v5/`.

## 3. Tres casos de prueba — 20%

**Exigencia:** excelente alto, flojo bajo y tramposo detectado.

- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] Excelente A/B: **82/82**.
- [x] Flojo A/B: **9/9**.
- [x] Tramposo A/B: **31/31**.
- [x] Tramposo registra prompt injection/manipulación.
- [x] Tramposo detecta claims contradictorios.
- [x] Los tres conservan la calibración V5 sin regresión.
- [x] `evaluador-web/test.mjs` reproduce **82 / 9 / 31** con el runner local complementario.

**Evidencia:** `calibracion/resultados_v5/`, `calibracion.md`, `evaluador-web/test.mjs`.

## 4. Calibración — 15%

**Exigencia:** comparar notas del agente con criterio humano del grupo, registrar desacuerdos, ajustes y resultado posterior.

- [x] Protocolo V5 pre-registrado antes de observar resultados V5.
- [x] `FREEZE_V5 = 5fdd304c26097aa16dc6d065e8b1c3d6359e7010`.
- [x] Resultados automáticos V5 conservados en commits posteriores.
- [x] Umbral de diferencia material fijado antes de comparación humana.
- [x] Evaluación humana realizada sobre los mismos tres casos y el mismo freeze.
- [x] Resultados humanos iniciales registrados: 78 / 5 / 31.
- [x] Resultados del agente comparados: 82 / 9 / 31.
- [x] Desacuerdos materiales identificados y clasificados.
- [x] Resultado humano adjudicado final: 82 / 9 / 31.
- [x] Constancia explícita de que no fue necesario modificar agente ni rúbrica para perseguir una nota.
- [x] Limitación metodológica documentada: ronda humana inicial no ciega.
- [x] Revisión humana independiente posterior de Guillermo: Excelente 85/100 frente a 82/100 del agente.

**Evidencia:** `calibracion.md`, `calibracion/INSTRUCCIONES_EVALUACION_HUMANA.md`, `calibracion/PLANTILLA_EVALUACION_HUMANA_V5.md`.

## 5. Proceso grupal — 15%

**Exigencia:** historia de commits que muestre aportes, evolución de la rúbrica, iteraciones y decisiones.

- [x] Historial de commits y PRs conserva la evolución del trabajo.
- [x] Evolución V1/V2 → V3 → V4 → V5 documentada.
- [x] La causa de V5 está documentada: ambigüedad de SC-02 detectada en un repo externo.
- [x] V5 fue congelada antes de generar resultados finales.
- [x] Correcciones, pruebas y documentación quedaron en commits/PRs separados.
- [x] El historial identifica aportes y revisiones reales sin simular coautoría.
- [x] La revisión humana independiente de Guillermo queda registrada.
- [x] El equipo realizó revisión final y pruebas adicionales antes de la entrega; los hallazgos documentales fueron corregidos en PRs posteriores sin alterar la rúbrica.

## Estructura obligatoria

- [x] `README.md` + integrantes.
- [x] `rubrica.md`.
- [x] `agente/`.
- [x] `casos/excelente/`.
- [x] `casos/flojo/`.
- [x] `casos/tramposo/`.
- [x] `calibracion.md`.
- [x] App/runner en `evaluador-web/`.

## Ejecución para el profesor

La vía principal de entrega es la app pública:

**https://evaluador-v5-web.vercel.app**

El profesor puede cargar repositorios públicos de GitHub, ZIP o carpetas locales y ejecutar la evaluación sin login, sin elegir modelo y sin ingresar API keys.

Para auditoría técnica del runner determinístico local:

```text
cd evaluador-web
npm install
npm test
```

## Estado final

- [x] Rúbrica V5 congelada.
- [x] Agente corrector V5 completo.
- [x] Tres casos obligatorios presentes y calibrados.
- [x] Calibración agente vs. criterio humano documentada.
- [x] Proceso grupal trazable en GitHub.
- [x] App pública IA disponible.
- [x] GitHub, ZIP y carpetas soportados.
- [x] Acceso público sin login validado.
- [x] Documentación final alineada con el producto entregado.

**No quedan bloqueos conocidos para la entrega.** Las mejoras futuras no forman parte de la consigna ni modifican la V5 congelada.
