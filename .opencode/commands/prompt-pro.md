---
description: Replantea un prompt con estructura estricta, mayor precision y optimizacion de tokens
agent: build
subtask: false
---
Analiza y reconstruye el siguiente prompt del usuario para producir una version mas precisa, mas estructurada y mas eficiente en tokens.

Usa como referencia conceptual las buenas practicas almacenadas en `@prompts/claude-prompting-best-practices.md`.

Reglas obligatorias:
- Conserva la intencion original del usuario.
- No inventes requisitos ni decisiones no respaldadas por la entrada.
- Elimina ambiguedad, redundancia, contradicciones y contexto innecesario.
- Prefiere instrucciones explicitas, breves y accionables.
- Si faltan datos esenciales, marca el faltante de forma breve dentro de un bloque final.
- Si la tarea es simple, no fuerces una estructura compleja.
- Si la tarea es compleja, organiza el prompt en bloques claros y compactos.

Reconstruye el prompt usando este criterio:
1. Define con precision el objetivo.
2. Conserva solo el contexto que cambie materialmente la respuesta esperada.
3. Explicita restricciones, alcance y formato de salida cuando sea util.
4. Reduce el texto a la minima longitud razonable sin perder claridad.
5. Usa etiquetas XML solo si mejoran claramente la interpretacion.

Entrega exactamente en este formato y nada mas:

<prompt_optimizado>
[prompt final reescrito]
</prompt_optimizado>

<datos_faltantes>
[Ninguno o lista breve de faltantes criticos]
</datos_faltantes>

Prompt a optimizar:

$ARGUMENTS
