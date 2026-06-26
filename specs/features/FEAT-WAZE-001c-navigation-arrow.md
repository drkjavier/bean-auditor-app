---
id: FEAT-WAZE-001c
title: NavigationArrow - Componente SVG de Flecha Direccional
type: ui-ux
status: pending
parent: FEAT-WAZE-001
children: []
layer: presentation
priority: high
created: 2026-06-25
updated: 2026-06-25
---

# Sub-Spec: NavigationArrow - Componente SVG de Flecha Direccional

## Objetivo
Crear un componente React Native que renderice una flecha SVG direccional superpuesta en el mapa, rotada según el bearing al tag destino, con indicador de distancia.

## Alcance

### Archivos a crear
- `src/presentation/components/NavigationArrow.tsx`

### Props del componente

```typescript
type NavigationArrowProps = {
  /** Ángulo de rotación en grados (0-360, 0=Norte) */
  bearing: number;
  
  /** Distancia en metros */
  distance: number;
  
  /** ID del tag destino */
  tagId: string;
  
  /** Estado de auditoría del tag destino */
  tagStatus: AuditStatus | null;
  
  /** Si la flecha está visible */
  visible: boolean;
  
  /** Callback al presionar la flecha */
  onPress?: () => void;
};
```

### Diseño visual

```
┌─────────────────────────────────┐
│                                 │
│            ▲                    │  ← Flecha SVG (azul #1e40af)
│           ╱ ╲                   │     rotada según bearing
│          ╱   ╲                  │
│         ╱     ╲                 │
│        ╱   ●   ╲                │  ← Centro (punto blanco)
│         ╲     ╱                 │
│          ╲   ╱                  │
│           ╲ ╱                   │
│            ▼                    │
│                                 │
│         123m                    │  ← Badge de distancia
│        TAG-001                  │     (fondo oscuro, texto blanco)
│                                 │
└─────────────────────────────────┘
```

### Especificaciones de diseño

#### Flecha SVG
- **Tamaño**: 80x80px
- **Color**: `#1e40af` (azul primario)
- **Rotación**: `transform: [{ rotate: `${bearing}deg` }]`
- **Centro**: Punto blanco de 8px
- **Sombra**: `elevation: 5`, `shadowColor: '#000'`

#### Badge de distancia
- **Posición**: Debajo de la flecha
- **Fondo**: `rgba(15, 23, 42, 0.85)` (oscuro semi-transparente)
- **Texto**: Blanco, 14px, bold
- **Padding**: 8px horizontal, 4px vertical
- **Border radius**: 8px

#### Badge de tag ID
- **Posición**: Debajo de la distancia
- **Fondo**: Color del estado de auditoría
- **Texto**: Blanco, 12px
- **Formato**: "TAG-001" o "Pendiente"

### Comportamiento

#### 1. Rotación suave
- La flecha rota con animación de 300ms
- Easing: `ease-out`
- Actualización máxima cada 500ms (para evitar flicker)

#### 2. Animación de pulse
- Cuando la distancia es < 50m
- La flecha pulsa suavemente (scale 1.0 → 1.1 → 1.0)
- Indica "estás cerca"

#### 3. Estados de color
- **Distancia > 500m**: Azul normal
- **Distancia 100-500m**: Azul claro
- **Distancia < 100m**: Verde (#10b981)
- **Distancia < 50m**: Verde pulsante

## Criterios de Aceptación

### CA-1: Renderizado básico
```
Given: bearing=45, distance=150, visible=true
When:  Se renderiza NavigationArrow
Then:  Flecha rotada 45° (noreste)
And:   Badge muestra "150m"
```

### CA-2: Rotación según bearing
```
Given: bearing=0 (norte)
When:  Se renderiza
Then:  Flecha apunta hacia arriba

Given: bearing=90 (este)
When:  Se renderiza
Then:  Flecha apunta hacia la derecha
```

### CA-3: Formateo de distancia
```
Given: distance=50
When:  Se renderiza
Then:  Badge muestra "50m"

Given: distance=2500
When:  Se renderiza
Then:  Badge muestra "2.5km"
```

### CA-4: Estado de visibilidad
```
Given: visible=false
When:  Se renderiza NavigationArrow
Then:  No se muestra (return null)
```

### CA-5: Accesibilidad
```
Given: bearing=45, distance=150, tagId="TAG-001"
When:  Screen reader accede al componente
Then:  Label: "Navegación hacia TAG-001, 150 metros, dirección noreste"
```

## Dependencias

### Dependencias internas
- `AuditStatus` de `src/domain/audit/AuditRecord.ts`
- Tema de colores (si existe) o hardcoded values

## Accesibilidad (WCAG 2.1)

### Requisitos
- [ ] **Contraste**: Texto blanco sobre fondo oscuro (ratio ≥ 4.5:1)
- [ ] **Touch target**: Mínimo 44x44px para área táctil
- [ ] **Label**: `accessibilityLabel` descriptivo
- [ ] **Role**: `accessibilityRole="button"` si es presionable
- [ ] **State**: `accessibilityState={{}}` con información relevante

### Label sugerido
```
"Navegación hacia {tagId}, {distancia} metros, dirección {dirección}"
```

## Notas
- Usar `react-native` View + style transform (no SVG nativo para mayor compatibilidad)
- La flecha se superpone al mapa usando position absolute
- En web, funciona igual via react-native-web
