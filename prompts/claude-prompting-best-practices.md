# Buenas prácticas de prompting para agentes

Fuente analizada: `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices`

## Objetivo

Este documento resume las prácticas más útiles para redactar prompts más claros, más precisos y más eficientes en tokens. Está pensado como referencia local para comandos, agentes y prompts reutilizables del proyecto.

## Principios clave

1. Sé claro y directo.
2. Explica el objetivo, el resultado esperado y las restricciones.
3. Añade contexto cuando ayude a entender por qué una instrucción importa.
4. Usa estructura explícita cuando la tarea tenga varias partes.
5. No confíes en inferencias implícitas si el comportamiento debe aplicarse a todo el resultado.
6. Evita pedir más de lo necesario si quieres reducir consumo de tokens.

## Qué mejora la comprensión del agente

- Definir el rol o tipo de asistente esperado.
- Explicar el objetivo real del usuario, no solo la tarea superficial.
- Incluir restricciones concretas: formato, alcance, tono, longitud, criterios de éxito.
- Convertir instrucciones ambiguas en pasos o bloques bien delimitados.
- Declarar explícitamente el alcance: "aplica esto a toda la respuesta", "omite X", "prioriza Y".

## Qué ayuda a optimizar tokens

- Pedir respuestas concisas y enfocadas.
- Eliminar contexto redundante, vaguedad y repeticiones.
- Pedir solo el formato final útil, sin preámbulos innecesarios.
- Evitar ejemplos si no aportan valor real.
- Mantener una sola intención principal por bloque cuando sea posible.
- Usar instrucciones positivas y precisas en vez de largas listas de prohibiciones.

## Patrones recomendados

### 1. Instrucciones explícitas

Mejor que una orden genérica:

... (Continúa el documento según el original. Para espacio, coloca aquí el contenido completo del archivo fuente original.)
