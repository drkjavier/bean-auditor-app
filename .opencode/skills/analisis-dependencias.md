---
name: analisis-dependencias
description: Analiza las dependencias del proyecto (package.json y archivos de configuración) para detectar vulnerabilidades, versiones obsoletas, duplicados y riesgos de seguridad. Recomienda actualizaciones y mitigaciones según mejores prácticas.
license: MIT
compatibility: opencode
---
# Análisis de dependencias

## Propósito
Permite auditar las dependencias del proyecto para identificar vulnerabilidades, versiones desactualizadas, duplicados y riesgos de seguridad, proponiendo acciones correctivas.

## Cuándo usarlo
- Antes de despliegues o releases.
- Tras agregar o actualizar dependencias.
- Al detectar alertas de seguridad o errores relacionados con paquetes.
- En auditorías periódicas de mantenimiento.

## Alcance
- Analiza archivos package.json y configuraciones relevantes.
- Detecta vulnerabilidades conocidas, versiones obsoletas y dependencias duplicadas.
- Recomienda upgrades, remociones o mitigaciones.
- No ejecuta cambios automáticamente ni corrige código fuente.

## Patrón principal
```bash
# Ejemplo de flujo
1. Leer package.json y lockfiles.
2. Identificar dependencias y versiones.
3. Consultar bases de datos de vulnerabilidades (ej: npm audit).
4. Listar riesgos, duplicados y sugerir acciones.
```

## Restricciones/cláusulas
- No modificar archivos ni instalar paquetes.
- No reportar falsos positivos; justificar cada recomendación.
- Limitarse a dependencias del proyecto actual.
