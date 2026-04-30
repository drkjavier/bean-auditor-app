---
name: reformulacion-prompt
description: Reformula y optimiza prompts complejos eliminando ambigüedad, redundancia y contexto innecesario. Alinea la instrucción con las mejores prácticas de OpenCode, siguiendo los estándares de `/prompt` y `/prompt-pro`, para maximizar la claridad y efectividad en la interacción con agentes. Responde únicamente en español.
license: MIT
compatibility: opencode
---
# Reformulación y Mejora Avanzada de Prompts

## Propósito
Proporcionar una reformulación precisa y optimizada de prompts complejos, asegurando claridad, brevedad y alineación con los estándares de OpenCode. El skill elimina ambigüedad, redundancia y exceso de contexto, facilitando la interacción efectiva entre usuario y agentes.

## Cuándo usarlo
- Cuando el usuario envía instrucciones extensas, ambiguas o poco estructuradas.
- Antes de crear, modificar o auditar skills o agentes.
- Para adaptar prompts a los formatos `/prompt` o `/prompt-pro`.
- Al requerir máxima claridad y acción directa en la instrucción.

## Alcance
- Reformula prompts en español, optimizándolos para agentes OpenCode.
- Elimina información irrelevante, ambigua o redundante.
- Estructura la instrucción según mejores prácticas de prompts.
- No traduce idiomas ni genera ejemplos extensos.
- No ejecuta tareas fuera de la mejora del prompt.

## Patrón principal
```plaintext
Entrada: Prompt complejo o ambiguo.
Proceso: 
  1. Analiza el objetivo y contexto.
  2. Elimina ambigüedad, redundancia y detalles innecesarios.
  3. Reformula en español claro, breve y alineado a OpenCode.
  4. Presenta el prompt optimizado, listo para uso en agentes.
Salida: Prompt optimizado y alineado a `/prompt` o `/prompt-pro`.
```

## Restricciones/cláusulas
- Responde sólo en español.
- No modifica archivos ni ejecuta acciones fuera de la reformulación.
- No incluye información adicional ni comentarios fuera del prompt optimizado.
- Mantiene la instrucción alineada a los estándares de OpenCode.
