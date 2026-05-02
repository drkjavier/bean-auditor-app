---
name: autenticacion-segura
description: Analiza y audita flujos de autenticación y gestión de sesión en proyectos React Native y web, detectando malas prácticas, validando login/logout y recomendando patrones seguros.
license: MIT
compatibility: opencode
---
# Autenticación Segura

## Propósito
Auditar y fortalecer los flujos de autenticación y gestión de sesión en aplicaciones React Native y web, aportando contexto experto en seguridad y mejores prácticas.

## Cuándo usarlo
- Al revisar o implementar flujos de login/logout.
- Antes de lanzar una nueva versión con cambios en autenticación.
- Cuando se sospechan vulnerabilidades en la gestión de sesión.
- Durante auditorías de seguridad o refactorizaciones.

## Alcance
- Detecta malas prácticas comunes (almacenamiento inseguro, tokens en memoria, etc.).
- Valida la robustez de los flujos de login/logout.
- Recomienda patrones seguros (OAuth, refresh tokens, almacenamiento seguro).
- No implementa código, solo audita y recomienda.
- No cubre autenticación biométrica avanzada ni SSO empresarial.

## Patrón principal
```proceso
1. Analizar el flujo de autenticación y gestión de sesión.
2. Identificar malas prácticas (ej: uso de AsyncStorage para tokens, falta de expiración, logout incompleto).
3. Validar que login/logout sigan patrones seguros.
4. Recomendar mejoras concretas y patrones robustos.
```

## Restricciones/cláusulas
- No modificar archivos ni credenciales.
- No sugerir almacenamiento inseguro de secretos.
- No recomendar prácticas obsoletas (ej: JWT sin expiración, Basic Auth).
