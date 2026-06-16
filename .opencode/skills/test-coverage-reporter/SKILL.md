---
name: test-coverage-reporter
description: Genera reportes de cobertura de tests con Jest, identifica gaps en la suite de tests y proporciona métricas de calidad. Úsalo al auditar testing, antes de merges o para mejorar cobertura en módulos críticos.
license: MIT
compatibility: opencode
---

# Test Coverage Reporter

## Propósito
Analizar cobertura de tests con Jest, identificar módulos sin tests o con cobertura insuficiente, y generar reportes accionables para mejorar la calidad de la suite de tests del proyecto.

## Cuándo usarlo
- Antes de hacer merge a ramas principales
- Al auditar la calidad de testing del proyecto
- Para identificar gaps en cobertura de módulos críticos
- Al configurar o mejorar la suite de tests
- Para generar reportes de cobertura para el equipo

## Alcance
- Ejecuta Jest con flags de cobertura
- Analiza reportes de cobertura (text, HTML, JSON)
- Identifica módulos críticos sin tests
- Sugiere tests faltantes basados en cobertura
- Genera reportes resumidos con métricas clave
- NO ejecuta tests end-to-end (solo unit/integration)
- NO modifica código ni tests automáticamente

## Patrón principal

### Ejecutar cobertura completa
```bash
npm test -- --coverage --watchAll=false
```

### Cobertura con reporte HTML detallado
```bash
npm test -- --coverage --watchAll=false --coverageReporters=html
```

### Cobertura para módulos específicos
```bash
npm test -- --coverage --watchAll=false --collectCoverageFrom='src/domain/**/*.{ts,tsx}'
```

### Cobertura con umbral mínimo
```bash
npm test -- --coverage --watchAll=false --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## Análisis de reportes

### Métricas clave a evaluar
- **Statements**: % de sentencias ejecutadas
- **Branches**: % de ramas de cobertura (if/else, switch)
- **Functions**: % de funciones llamadas
- **Lines**: % de líneas ejecutadas

### Umbrales recomendados por capa
```
domain/: 80% mínimo (lógica crítica)
data/: 70% mínimo (acceso a datos)
infrastructure/: 60% mínimo (adaptadores)
presentation/: 50% mínimo (UI, menos crítica)
state/: 75% mínimo (estado global)
```

### Identificar gaps críticos
1. Módulos con cobertura < 50% → prioridad alta
2. Funciones públicas sin tests → prioridad alta
3. Ramas no cubiertas en lógica de negocio → prioridad media
4. Components sin tests de render → prioridad media

## Generación de reportes

### Reporte resumido (texto)
```
=== REPORTE DE COBERTURA ===
Cobertura global: 72%
- Statements: 75%
- Branches: 68%
- Functions: 74%
- Lines: 73%

Módulos críticos (< 50%):
- src/domain/services/AuthService.ts: 35%
- src/data/repositories/UserRepository.ts: 42%

Tests faltantes sugeridos:
- AuthService.login(): 3 ramas no cubiertas
- UserRepository.findById(): función sin tests
```

### Reporte detallado (Markdown)
```markdown
# Reporte de Cobertura - [Fecha]

## Resumen ejecutivo
- Cobertura global: 72%
- Módulos analizados: 45
- Módulos críticos: 12
- Tests totales: 234

## Análisis por capa
| Capa | Cobertura | Estado |
|------|-----------|--------|
| domain/ | 78% | ✅ OK |
| data/ | 65% | ⚠️ Mejorar |
| presentation/ | 48% | ❌ Crítico |

## Módulos prioritarios
1. AuthService.ts (35%) - Lógica de autenticación crítica
2. UserRepository.ts (42%) - Acceso a datos de usuario

## Recomendaciones
1. Agregar tests para AuthService.login() (3 ramas no cubiertas)
2. Tests para UserRepository.findById() (función sin tests)
3. Mejorar cobertura de presentation/components (48%)
```

## Integración con agentes

### Para frontend-testing-agent
- Usa este skill para generar reportes de cobertura
- Identifica módulos críticos sin tests
- Sugiere tests faltantes basados en cobertura
- Valida que se cumplan umbrales mínimos

### Para frontend-agent
- Ejecuta antes de marcar sub-spec como completed
- Valida que tests cubren lógica crítica
- Documenta cobertura en historial de spec

## Restricciones
- NO ejecuta tests automáticamente (solo genera reportes)
- NO modifica código ni tests
- NO ignora módulos con baja cobertura sin justificación
- NO reporta cobertura sin ejecutar tests actualizados
- Requiere Jest configurado en el proyecto
- Cobertura no es sustituto de tests de calidad
