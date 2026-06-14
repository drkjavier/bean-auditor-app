---
id: UI-XXX
title: [Título de la pantalla/componente]
type: ui-ux
status: pending
parent: null
children: []
layer: presentation
priority: medium
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# UI-XXX: [Título de la pantalla/componente]

## Descripción
[Descripción de qué muestra esta UI y su propósito principal.]

## Objetivo
[Qué necesita lograr el usuario al interactuar con esta pantalla/componente.]

## Layout general
```
┌─────────────────────────────┐
│         Header/Nav          │
├─────────────────────────────┤
│                             │
│         Contenido           │
│         principal           │
│                             │
├─────────────────────────────┤
│         Footer/Actions      │
└─────────────────────────────┘
```

## Componentes

### [ComponentePrincipal]
- **Tipo**: Screen | Modal | Component
- **Props**: [Lista de props con tipos]
- **Comportamiento**: [Qué hace al interactuar]

### [ComponenteSecundario]
- **Tipo**: Button | Input | Card | etc.
- **Variantes**: primary | secondary | outline
- **Estados**: default | hover | active | disabled | loading

## Estados de UI

### Loading
- **Cuándo**: [Cuándo se muestra]
- **Visual**: [Spinner, skeleton, etc.]
- **Comportamiento**: [Qué bloquea mientras carga]

### Error
- **Cuándo**: [Cuándo se muestra]
- **Visual**: [Mensaje de error, retry button]
- **Acción**: [Qué puede hacer el usuario]

### Empty
- **Cuándo**: [Cuándo no hay datos]
- **Visual**: [Ilustración, mensaje]
- **Acción**: [CTA para crear primer elemento]

### Success
- **Cuándo**: [Cuándo se muestra]
- **Visual**: [Toast, redirect, feedback]
- **Duración**: [Tiempo antes de desaparecer]

## Flujo de navegación
```
[Pantalla actual] ──(acción)──► [Pantalla destino]
       │                              │
       │                              │
       └──────(back/cancel)───────────┘
```

| Acción | Destino | Comportamiento |
|--------|---------|----------------|
| [Botón A] | [Pantalla X] | push |
| [Botón B] | [Pantalla Y] | replace |
| [Swipe left] | [Pantalla Z] | modal |

## Accesibilidad (WCAG 2.1)
- [ ] **Labels**: Todos los inputs tienen aria-label o label asociado
- [ ] **Contraste**: Colores cumplen ratio 4.5:1 mínimo
- [ ] **Touch targets**: Botones mínimo 44x44px
- [ ] **Foco**: Tab order lógico, focus visible
- [ ] **Screen reader**: Contenido semántico, roles ARIA
- [ ] **Motion**: Respeta prefers-reduced-motion

## Responsive
| Breakpoint | Comportamiento |
|------------|----------------|
| < 375px (small) | [Layout ajustado] |
| 375-768px (mobile) | [Layout estándar] |
| 769-1024px (tablet) | [Layout extendido] |
| > 1024px (desktop) | [Layout máximo] |

## Tokens de diseño
| Elemento | Token | Valor |
|----------|-------|-------|
| Background | --color-bg-primary | #FFFFFF |
| Text primary | --color-text-primary | #1A1A1A |
| Accent | --color-accent | #1E90FF |
| Spacing | --spacing-md | 16px |

## Integración con estado
- **Store**: [Nombre del store Zustand]
- **Selectors**: [Selectores que consume]
- **Actions**: [Acciones que dispacha]

## Integración con API
- **Endpoint**: [Qué endpoint consume]
- **Request**: [Qué datos envía]
- **Response**: [Qué datos recibe y cómo los mapea]

## Sub-specs generadas
| ID | Nombre | Tipo | Capa | Estado |
|----|--------|------|------|--------|
| UI-XXX-a | [Nombre sub-spec] | feature/api/ui-ux | presentation/domain/data/infrastructure/state | pending |

## Notas de diseño
- [Referencias visuales o wireframes]
- [Decisiones de UX relevantes]
- [Micro-interacciones o animaciones]

## Historial
| Fecha | Cambio | Autor |
|-------|--------|-------|
| YYYY-MM-DD | Creación inicial | [Agente/Usuario] |
