# Entrega final

## Repositorio oficial

https://github.com/grojas-jpg/evaluador-grupo-N

La entrega oficial se encuentra en la rama `main` del repositorio grupal.

## App pública

https://evaluador-v5-web.vercel.app

La app pública ejecuta el **Agente Evaluador V5 con IA del lado del servidor**. La rúbrica V5 permanece congelada y la evaluación se realiza sobre evidencia trazable. El enrutamiento de modelos es automático: Gemini 3.5 → Gemini 3.6 → GPT-5.6 Luna → GPT-5.6 Sol.

Además de repositorios públicos de GitHub, la interfaz permite evaluar **archivos ZIP y carpetas locales**, tanto mediante selección manual como mediante drag & drop. El runner determinístico se conserva como componente complementario y de control; la fuente normativa sigue siendo el agente V5 definido por `agente/system_prompt.md`, `rubrica.md`, `agente/configuracion.md` y `agente/contrato_salida.md`.

## Estado de entrega

- PR #13: V5 base mergeada.
- PR #14: cerrado sin mergear, con sus aportes útiles absorbidos/documentados.
- PR #15: hardening mergeado.
- PR #16: documentación y accesos finales mergeados.
- PR #17: evaluador IA V5 oficial en Vercel mergeado.
- PR #18: soporte para ZIP y carpetas locales mergeado.
- PR #19: README actualizado al cierre final.
- PR #20: drag & drop para ZIP y carpetas mergeado.
- `main`: versión final de entrega.
- Vercel: deployment de producción READY y accesible públicamente.

## Validaciones principales

- Casos sintéticos de calibración: **82 / 9 / 31**.
- Detección de manipulación en el caso tramposo.
- Evaluación de repositorios reales.
- Evaluación por GitHub, ZIP y carpeta local.
- Fallback automático entre modelos.
- Acceso público sin login para el profesor.
