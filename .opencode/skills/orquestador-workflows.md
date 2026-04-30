---
name: orquestador-workflows
description: Orquesta y automatiza la ejecución de workflows de desarrollo como Metro, Vite, build Android/iOS y tareas relacionadas, permitiendo su integración secuencial o paralela según el contexto del proyecto.
license: MIT
compatibility: opencode
---
# Orquestador de Workflows

## Propósito
Facilitar la integración y ejecución coordinada de workflows de desarrollo (Metro, Vite, build Android/iOS, lint, test, etc.), permitiendo su lanzamiento, monitoreo y cierre desde un solo contexto operativo.

## Cuándo usarlo
- Cuando se requiere iniciar, detener o reiniciar múltiples servicios de desarrollo (ej. Metro y Vite) de forma coordinada.
- Para automatizar flujos de build y pruebas en Android/iOS/web.
- Al preparar entornos para desarrollo, testing o despliegue.
- Cuando se necesita asegurar el orden correcto de ejecución entre tareas dependientes.

## Alcance
- Orquestación de comandos npm/yarn relacionados con Metro, Vite, build Android/iOS, lint y test.
- Integración secuencial (ejecutar tareas en orden) o paralela (ejecutar tareas independientes simultáneamente).
- Monitoreo básico del estado de cada workflow.
- Soporte para flujos típicos de desarrollo y CI/CD en proyectos React Native y web.

### Qué no cubre
- No implementa lógica de negocio específica de cada workflow.
- No reemplaza herramientas de CI/CD externas (ej. GitHub Actions, Jenkins).
- No gestiona credenciales ni secretos.
- No modifica archivos de configuración sin instrucción explícita.

## Patrón principal
```bash
# Ejemplo de orquestación secuencial
npm run lint && npm test && npm run android

# Ejemplo de orquestación paralela (en shells separados)
npm start (Metro) | npm run web (Vite)
```

## Restricciones/cláusulas
- No debe ejecutar comandos destructivos sin confirmación.
- No debe modificar archivos de configuración salvo petición explícita.
- Debe reportar el estado y resultado de cada workflow.
- Debe respetar los límites de recursos del entorno.
