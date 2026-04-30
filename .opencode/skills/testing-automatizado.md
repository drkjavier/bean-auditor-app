---
name: testing-automatizado
description: Automatiza la ejecución de pruebas con Jest y validación de linting con ESLint, asegurando cobertura mínima y reporte de fallos en proyectos JavaScript/TypeScript. Útil para flujos CI/CD y revisiones previas a merge.
license: MIT
compatibility: opencode
---
# Testing Automatizado

## Propósito
Automatizar la validación de calidad de código mediante la ejecución de pruebas unitarias con Jest y análisis estático con ESLint, garantizando cobertura mínima y reporte detallado de errores.

## Cuándo usarlo
- Antes de realizar un merge o despliegue.
- En flujos de integración continua (CI/CD).
- Para validar cambios en ramas de desarrollo.
- Al auditar calidad de código en revisiones.

## Alcance
- Ejecuta pruebas con Jest.
- Verifica que la cobertura supere el umbral definido.
- Ejecuta ESLint y reporta errores o advertencias.
- Genera reportes de fallos y cobertura.
- Aplica a proyectos JavaScript/TypeScript con configuración estándar de Jest y ESLint.

## Patrón principal
```bash
npm run lint && npm test -- --coverage
```

## Restricciones/cláusulas
- No modifica código fuente ni corrige errores automáticamente.
- Requiere configuración previa de Jest y ESLint.
- No cubre pruebas end-to-end ni integración con otros frameworks.
- No sube reportes a plataformas externas salvo configuración explícita.
