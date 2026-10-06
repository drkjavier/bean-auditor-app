---
id: FEAT-WAZE-001d
title: MapCanvas Integration - Integración de Flecha en el Mapa
type: ui-ux
status: pending
parent: FEAT-WAZE-001
children: []
layer: presentation
priority: high
created: 2026-06-25
updated: 2026-06-25
---

# Sub-Spec: MapCanvas Integration - Integración de Flecha en el Mapa

## Objetivo
Integrar el componente NavigationArrow como overlay en los componentes MapCanvas (native y web), mostrándolo solo cuando el modo navegación está activo.

## Alcance

### Archivos a modificar
- `src/presentation/components/MapCanvas.native.tsx`
- `src/presentation/components/MapCanvas.web.tsx`

### Props nuevas para MapCanvas

```typescript
// Props existentes (no cambiar)
type MapCanvasProps = {
  items: Tag[];
  style?: any;
  selectedId?: string | null;
  onSelect?: (item: Tag) => void;
  showUserLocation?: boolean;
};

// Props nuevas de navegación
type NavigationProps = {
  /** Modo navegación activo */
  isNavigationActive?: boolean;
  
  /** Tag destino de navegación */
  navigationTarget?: Tag | null;
  
  /** Distancia al destino en metros */
  distanceToTarget?: number | null;
  
  /** Bearing al destino en grados */
  bearingToTarget?: number | null;
  
  /** Callback al presionar la flecha */
  onNavigationPress?: () => void;
};
```

### Integración en MapCanvas

#### Estructura del overlay

```
┌─────────────────────────────────────────┐
│  [Toolbar: Centrar | Ver todos | ...]   │
├─────────────────────────────────────────┤
│                                         │
│              MAPA                       │
│                                         │
│      ┌─────────────────┐                │
│      │ NavigationArrow │ ← Overlay      │
│      │   (position:    │   position:    │
│      │    absolute)    │   absolute     │
│      └─────────────────┘   top: 50%     │
│                          left: 50%      │
│                                         │
│         [Marcadores de tags]            │
│                                         │
└─────────────────────────────────────────┘
```

#### Estilo del contenedor overlay

```typescript
const navigationOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none',  // Permite interacción con el mapa debajo
  zIndex: 1000,
};
```

#### Restricciones del overlay
- `pointerEvents: "none"` en el contenedor (para no bloquear el mapa)
- `pointerEvents: "auto"` en la flecha misma (para ser presionable)
- Solo se muestra cuando `isNavigationActive === true`

## Criterios de Aceptación

### CA-1: Overlay se muestra correctamente
```
Given: Mapa renderizado, isNavigationActive=true
When:  Se carga el mapa
Then:  NavigationArrow aparece centrado sobre el mapa
And:   No bloquea interacciones con el mapa
```

### CA-2: Overlay oculto cuando inactivo
```
Given: isNavigationActive=false
When:  Se renderiza el mapa
Then:  No se muestra NavigationArrow
And:   No hay espacio reservado
```

### CA-3: Interacción con la flecha
```
Given: NavigationArrow visible
When:  Usuario presiona la flecha
Then:  Se ejecuta onNavigationPress()
And:   El mapa recibe el toque (pointer events pasan)
```

### CA-4: Posicionamiento correcto
```
Given: Mapa con dimensiones conocidas
When:  Se renderiza NavigationArrow
Then:  Está centrado horizontal y verticalmente
And:   No se sale del viewport del mapa
```

### CA-5: Compatibilidad multiplataforma
```
Given: Misma implementación
When:  Se ejecuta en native (MapLibre) y web (MapTiler)
Then:  La flecha se muestra correctamente en ambas
And:   El comportamiento es idéntico
```

## Dependencias

### Dependencias internas
- `NavigationArrow` de `src/presentation/components/NavigationArrow.tsx` (FEAT-WAZE-001c)
- Props de navegación del store

## Notas

### Native (MapLibre)
- El overlay se superpone usando View con position absolute
- MapLibre permite overlays via children

### Web (MapTiler)
- El overlay se superpone sobre el div del mapa
- Se usa position relative en el contenedor padre
- MapTiler no tiene API nativa para overlays, pero funciona con div absoluto

## Testing

### Tests unitarios
- Verificar que el overlay se muestra/oculta según `isNavigationActive`
- Verificar que pointerEvents es correcto

### Tests visuales
- Verificar centrado en diferentes tamaños de pantalla
- Verificar que no bloquea interacción con marcadores
