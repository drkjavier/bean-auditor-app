---
name: auditoria-codigo-react-native-vite
description: Realiza auditoría de código fuente en proyectos React Native y Vite mediante análisis estático, identificando errores, advertencias y sugerencias de mejora. Proporciona un reporte claro y accionable para mantener la calidad del código.
license: MIT
compatibility: opencode
---
# Auditoría de Código React Native y Vite

## Propósito
Permitir la auditoría automatizada del código fuente en proyectos que utilizan React Native y Vite, detectando errores, advertencias y oportunidades de mejora mediante análisis estático.

## Cuándo usarlo
- Antes de realizar un merge o despliegue.
- Tras cambios significativos en el código.
- Para revisiones periódicas de calidad.
- Al integrar nuevas dependencias o librerías.

## Alcance
- Analiza archivos fuente de React Native y Vite (JavaScript, TypeScript, JSX, TSX).
- Detecta errores sintácticos, malas prácticas, código muerto y vulnerabilidades comunes.
- Emite advertencias sobre patrones inseguros o inconsistentes.
- Sugiere mejoras en estilo, estructura y uso de dependencias.
- No realiza cambios automáticos en el código.
- No cubre análisis dinámico ni pruebas de ejecución.

## Patrón principal
```proceso
1. Ejecutar herramientas de análisis estático (por ejemplo, ESLint, TypeScript, linters específicos).
2. Recopilar errores, advertencias y sugerencias relevantes.
3. Generar un reporte estructurado y claro para el equipo.
```

## Restricciones/cláusulas
- No modifica archivos fuente.
- No evalúa código fuera del contexto de React Native y Vite.
- No incluye ejemplos extensos ni datos irrelevantes en el reporte.
