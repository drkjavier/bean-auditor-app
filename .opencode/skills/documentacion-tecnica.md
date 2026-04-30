---
name: documentacion-tecnica
description: Genera y valida documentación técnica clara, concisa y orientada a usuarios técnicos, asegurando mantenibilidad futura y cumplimiento de convenciones del proyecto.
license: MIT
compatibility: opencode
---
# Documentación técnica

## Propósito
Facilitar la creación y revisión de documentación técnica en el proyecto, garantizando claridad, precisión y alineación con los estándares de OpenCode. El skill ayuda a producir documentación útil para desarrolladores y futuros mantenedores.

## Cuándo usarlo
- Al crear o actualizar archivos de documentación técnica (README, guías, referencias de API, etc.).
- Antes de realizar auditorías de documentación.
- Al validar que la documentación cumple con las convenciones y requisitos del proyecto.

## Alcance
- Cubre generación, edición y validación de documentación técnica relevante para usuarios técnicos.
- Incluye recomendaciones de formato, estructura mínima y buenas prácticas.
- No cubre documentación de usuario final, ejemplos extensos ni tutoriales detallados (estos deben referenciarse o ubicarse en archivos secundarios).

## Patrón principal
```proceso
1. Identificar el objetivo y público de la documentación.
2. Generar o auditar el contenido asegurando:
   - Claridad y concisión.
   - Uso de lenguaje técnico apropiado.
   - Estructura mínima: propósito, uso, alcance, ejemplos breves si aplica.
   - Referencias a archivos secundarios para detalles extensos.
3. Validar cumplimiento de convenciones OpenCode y formato Markdown.
4. Sugerir mejoras para mantenibilidad y futuras actualizaciones.
```

## Restricciones/cláusulas
- No incluir información redundante, ambigua o irrelevante.
- No generar documentación fuera del alcance técnico definido.
- No modificar archivos de configuración ni secretos.
