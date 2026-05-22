---
description: Replantea y optimiza un prompt para hacerlo mas claro, coherente y eficiente en tokens
agent: build
subtask: false
---
Analiza y replantea el siguiente prompt del usuario para que sea mas comprensible para el agente, conserve la intencion original y optimice el gasto de tokens.

Usa como referencia conceptual las buenas practicas almacenadas en `@prompts/claude-prompting-best-practices.md`.

Objetivos obligatorios:
- Aclarar la intencion principal del usuario.
- Eliminar redundancias, ruido y ambiguedad.
- Mejorar sentido, orden y coherencia.
- Mantener solo el contexto necesario para ejecutar bien la tarea.
- No inventar requisitos nuevos.
- Si faltan datos importantes, reduce al minimo los supuestos y deja el prompt util sin sobre-explicarlo.

Proceso:
1. Identifica la meta principal del prompt.
2. Detecta ambiguedades, contradicciones, redundancias o contexto sobrante.
3. Reescribe el prompt con lenguaje claro, directo y accionable.
4. Si aporta valor, organiza el resultado con bloques como objetivo, contexto, restricciones y salida esperada.
5. Ajusta la redaccion para minimizar gasto de tokens sin perder informacion esencial.

Entrega solo el prompt final optimizado.
No agregues titulos, explicaciones, observaciones, listas ni texto introductorio.
No envies comillas envolventes salvo que formen parte natural del prompt.

Prompt a optimizar:

$ARGUMENTS
