---
name: verificador-config-multiplataforma
description: Analiza y verifica la consistencia de configuraciones multiplataforma (Metro, Vite, Android, iOS, web) en proyectos React Native cross-platform. Detecta errores, conflictos y sugiere mejoras en settings para asegurar compatibilidad y funcionamiento óptimo.
license: MIT
compatibility: opencode
---
# Verificador de Configuración Multiplataforma

## Propósito
Permite auditar y validar la coherencia entre archivos de configuración de Metro, Vite, Android, iOS y web en proyectos React Native multiplataforma. Facilita la detección de errores, conflictos y oportunidades de mejora en la integración de settings.

## Cuándo usarlo
- Al integrar o actualizar soporte multiplataforma en React Native.
- Antes de lanzar builds para diferentes plataformas.
- Tras modificar configuraciones clave (Metro, Vite, android, ios, web).
- Para auditar la compatibilidad y detectar conflictos de settings.

## Alcance
- Analiza archivos de configuración relevantes: `metro.config.js`, `vite.config.ts`, carpetas `android/`, `ios/`, y settings web.
- Detecta errores comunes, conflictos entre plataformas y configuraciones redundantes o faltantes.
- Sugiere mejoras para optimizar la integración multiplataforma.
- No realiza cambios automáticos; solo reporta hallazgos y recomendaciones.

## Patrón principal
```proceso
1. Identificar y leer archivos de configuración multiplataforma.
2. Comparar settings clave (paths, alias, módulos, versiones, scripts).
3. Detectar inconsistencias, duplicados, incompatibilidades y omisiones.
4. Generar un reporte con errores, advertencias y sugerencias de mejora.
```

## Restricciones/cláusulas
- No modifica archivos; solo analiza y reporta.
- No evalúa código fuente fuera de los archivos de configuración.
- No ejecuta comandos de build ni pruebas automáticas.
