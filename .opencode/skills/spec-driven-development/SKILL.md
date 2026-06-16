---
name: spec-driven-development
description: Sistema de desarrollo basado en especificaciones. Descompone specs maestras en sub-specs atómicas, gestiona su ciclo de vida (pending → in_progress → completed) y mantiene un reporte de progreso sincronizado. Trigger: Cuando el usuario presente una spec o solicite descomponer una funcionalidad en subtareas de implementación.
license: MIT
compatibility: opencode
---

# Spec-Driven Development

## Propósito
Sistema de desarrollo que parte de especificaciones (specs) para guiar la implementación de código. Cada spec se descompone en sub-specs atómicas, que se implementan de forma iterativa con validación del usuario entre cada paso.

## Cuándo usarlo
- Cuando el usuario presente una spec de funcionalidad, API o UI/UX
- Cuando se necesite descomponer un problema complejo en subtareas implementables
- Cuando se requiera trazabilidad completa entre lo solicitado y lo implementado
- Cuando se necesite mantener un historial de decisiones de diseño

## Alcance
- **Cubre**: Creación, descomposición, implementación y seguimiento de specs
- **No cubre**: Configuración de entorno, CI/CD, o tareas fuera del scope del proyecto

## Estructura de archivos

```
specs/
├── _templates/           # Plantillas reutilizables
│   ├── feature.spec.md   # Para funcionalidades
│   ├── api.spec.md       # Para contratos de API
│   └── ui-ux.spec.md     # Para pantallas/componentes
├── features/             # Specs de funcionalidades
├── api/                  # Specs de API
├── ui/                   # Specs de UI/UX
└── PROGRESS.md           # Reporte maestro de progreso
```

## Flujo principal

### Paso 1: Recibir spec del usuario
```
1. Leer la spec presentada (puede ser texto libre o archivo .spec.md)
2. Validar que tenga información suficiente para descomponer
3. Si hay ambigüedades → usar herramienta `question` para aclarar
4. Clasificar el tipo: feature | api | ui-ux
```

### Paso 2: Descomponer en sub-specs
```
1. Identificar las partes atómicas de la spec
2. Para cada parte, crear una sub-spec usando la plantilla correspondiente
3. Asignar IDs secuenciales (FEAT-001a, FEAT-001b, etc.)
4. Definir dependencias entre sub-specs
5. Presentar la descomposición al usuario para validación
```

**Formato de presentación al usuario:**
```
He descomponido la spec [ID] en las siguientes sub-specs:

| # | ID | Nombre | Tipo | Capa | Dependencias |
|---|-----|--------|------|------|--------------|
| T1 | FEAT-001a | Login Screen | ui-ux | presentation | — |
| T2 | FEAT-001b | Auth Store | feature | state | — |
| T3 | FEAT-001c | Auth API | api | data | T2 |
| T4 | FEAT-001d | Auth Integration | feature | domain | T1,T2,T3 |

¿Validas este orden? ¿O prefieres ajustar alguna sub-spec?
```

### Paso 3: Implementar sub-specs iterativamente
```
1. Tomar la primera sub-spec sin dependencias pendientes
2. Leer su contenido completo
3. Implementar el código correspondiente
4. Actualizar su frontmatter: status → in_progress
5. Al completar: status → completed
6. Actualizar PROGRESS.md
7. Preguntar al usuario: "Sub-spec [ID] completada. ¿Continúo con [siguiente]?"
8. Repetir hasta completar todas
```

### Paso 4: Mantener PROGRESS.md sincronizado
```
Al cada cambio de estado:
1. Actualizar tabla resumen (totales, % avance)
2. Actualizar tabla del tipo de spec correspondiente
3. Agregar entrada en historial de actividad
4. Recalcular grafo de dependencias si cambió
```

## Reglas de descomposición

### Criterios para sub-specs atómicas
- **Una responsabilidad**: Cada sub-spec describe UNA cosa
- **Un paso lógico**: Se puede implementar en una sesión de trabajo
- **Independiente posible**: Minimiza dependencias cruzadas
- **Tamaño consistente**: Ni muy grande (una feature entera) ni muy pequeña (un solo import)

### Orden de implementación por capa
```
1. Modelos de datos (domain/models)
2. Repositorios (data/repositories)
3. Servicios (domain/services)
4. Estado (state/stores)
5. UI Components (presentation/components)
6. Pantallas (presentation/screens)
7. Navegación (presentation/navigation)
8. Integración y tests
```

### Dependencias entre capas
```
presentation → state → domain → data → infrastructure
     ↓            ↓        ↓        ↓
   (consume)   (consume) (consume) (depende de)
```

## Formato de frontmatter

Todos los archivos .spec.md deben tener este frontmatter mínimo:

```yaml
---
id: [TYPE]-XXX          # ID único: FEAT-001, API-001, UI-001
title: [Título]         # Nombre descriptivo
type: feature|api|ui-ux # Tipo de spec
status: pending|in_progress|completed|blocked|cancelled
parent: null|SPEC-ID    # ID de spec padre (si es sub-spec)
children: []            # IDs de sub-specs generadas
layer: presentation|domain|data|infrastructure|state
priority: high|medium|low
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## Integración con otros agentes

### Para UI/UX specs
- Usar `frontend-ui-agent` para validar diseño visual
- Usar `frontend-ux-agent` para validar flujos y microcopy
- Usar `frontend-accessibility-agent` para validar WCAG

### Para API specs
- Usar `frontend-security-agent` para validar autenticación
- Usar `frontend-state-agent` para integrar con Zustand

### Para Feature specs
- Usar `frontend-architecture-agent` para validar separación de capas
- Usar `frontend-testing-agent` para generar tests

### Para Cross-platform specs
- Usar `frontend-cross-platform-agent` para validar compatibilidad
- Usar `frontend-performance-agent` para validar rendimiento

### Para Navigation specs
- Usar `frontend-navigation-agent` para validar navegación
- Usar `frontend-security-agent` para validar seguridad de rutas

### Para State specs
- Usar `frontend-state-agent` para validar estado global
- Usar `frontend-security-agent` para validar seguridad de datos

## Validación bidireccional

El sistema SDD implementa validación en dos fases:

### 1. Validación pre-implementación (diseño de spec)

**Cuándo**: Después de descomponer la spec maestra en sub-specs, antes de implementar

**Objetivo**: Detectar problemas de diseño antes de gastar esfuerzo en implementación

**Flujo**:
1. `frontend-agent` descompone spec maestra en sub-specs
2. `frontend-agent` invoca auditores relevantes según tipo de spec
3. Auditores revisan diseño de la spec
4. Si hay hallazgos críticos → spec marcada como `blocked`
5. Usuario decide: ajustar spec, resolver problema, o cancelar
6. Si todo OK → proceder a implementación

### 2. Validación post-implementación (código)

**Cuándo**: Después de implementar cada sub-spec, antes de marcar como `completed`

**Objetivo**: Asegurar que la implementación cumple la spec y no introduce regresiones

**Flujo**:
1. `frontend-agent` implementa sub-spec
2. `frontend-agent` invoca mismos auditores que en fase pre
3. Auditores revisan código implementado
4. Si hay hallazgos críticos → sub-spec marcada como `blocked`
5. Usuario decide: corregir implementación, ajustar spec, o cancelar
6. Si todo OK → sub-spec marcada como `completed`
7. Actualizar PROGRESS.md

## Protocolo de bloqueo

Cuando un auditor detecta un problema crítico (severity: `critical` o `high`):

1. **Auditor responde** con hallazgos en formato estructurado
2. **`frontend-agent`** recibe el reporte y:
   - Cambia estado de la sub-spec a `blocked` en el frontmatter
   - Documenta el hallazgo en el historial de la spec
   - Notifica al usuario con resumen del problema
3. **`orquestador-tareas`** notifica al usuario con:
   - ID de la sub-spec bloqueada
   - Severidad del hallazgo
   - Descripción del problema
   - Recomendación del auditor
   - Sub-specs dependientes que están esperando
4. **Usuario decide**:
   - **Resolver**: `frontend-agent` corrige el problema
   - **Ajustar spec**: se modifica la spec para evitar el problema
   - **Cancelar**: se marca la sub-spec como `cancelled` y se replanifica

## Matriz de auditores por tipo de spec

| Tipo de Spec | Auditores Obligatorios | Auditores Opcionales |
|--------------|------------------------|----------------------|
| UI/UX | ui, ux, accessibility | performance, cross-platform |
| API | security, state | architecture, testing |
| Feature | architecture, testing | security, performance |
| Navigation | navigation, security | ux, cross-platform |
| State | state, security | architecture, testing |
| Cross-platform | cross-platform, performance | ui, testing |

## Restricciones
- No implementar código sin que la spec esté en estado `completed` o `in_progress`
- No saltarse el orden de dependencias definido en la descomposición
- No marcar como `completed` sin validación automática de auditores
- No modificar PROGRESS.md manualmente (solo agentes autorizados)
- Respetar la arquitectura de capas del proyecto en toda implementación
- Todo hallazgo crítico de auditor bloquea la spec hasta resolución
