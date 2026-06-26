---
id: FEAT-WAZE-001e
title: AuditScreen Navigation Mode - Integración en Pantalla de Auditoría
type: ui-ux
status: pending
parent: FEAT-WAZE-001
children: []
layer: presentation
priority: high
created: 2026-06-25
updated: 2026-06-25
---

# Sub-Spec: AuditScreen Navigation Mode - Integración en Pantalla de Auditoría

## Objetivo
Integrar el modo de navegación en la pantalla de auditoría existente, incluyendo activación/desactivación, tracking de posición, auto-avance post-auditar, y panel de información.

## Alcance

### Archivos a modificar
- `src/presentation/screens/AuditScreen.tsx`

### Nuevos componentes a crear
- `src/presentation/components/NavigationPanel.tsx`

### Cambios en AuditScreen

#### 1. Estado nuevo
```typescript
// Agregar al estado del componente
const [isTrackingPosition, setIsTrackingPosition] = useState(false);
const watchIdRef = useRef<number | null>(null);
```

#### 2. Botón "Modo Navegación"
- **Ubicación**: Después del botón "Recargar" en la sección de filtros
- **Estilo**: Botón primario con ícono de navegación (compass)
- **Comportamiento**:
  - Al presionar: activa modo navegación + inicia tracking
  - Si ya activo: desactiva + detiene tracking

#### 3. Tracking de posición continua
```typescript
const startPositionTracking = useCallback(async () => {
  const status = await locationService.checkPermission();
  if (status !== RESULTS.GRANTED) {
    // Solicitar permiso
    const requestStatus = await locationService.requestPermission();
    if (requestStatus !== RESULTS.GRANTED) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso de ubicación para navegar');
      return;
    }
  }
  
  // Iniciar watchPosition
  watchIdRef.current = locationService.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      navigationStore.updateUserPosition(latitude, longitude);
    },
    (error) => {
      console.error('Position tracking error:', error);
      navigationStore.setPositionError(error.message);
    },
    { enableHighAccuracy: true, distanceFilter: 1, interval: 1000 }
  );
}, []);
```

#### 4. Auto-avance post-auditar
```typescript
// Modificar handleConfirmAudit existente
const handleConfirmAudit = useCallback(async () => {
  // ... lógica existente ...
  
  await saveTagAudit(markTargetTag.uuid, auditAction, { note: ... });
  
  // NUEVO: Si navegación activa, recalcular siguiente tag
  if (isNavigationActive) {
    navigationStore.recalculateNearest();
    // El mapa se centrará automáticamente en el nuevo destino
  }
  
  load(); // Refrescar lista
}, [..., isNavigationActive]);
```

#### 5. Props al MapCanvas
```typescript
<MapCanvas
  items={filtered}
  selectedId={selectedId}
  onSelect={handleSelectTag}
  showUserLocation={showUserLocation}
  // NUEVAS props de navegación
  isNavigationActive={isNavigationActive}
  navigationTarget={nearestTag}
  distanceToTarget={distanceToNearest}
  bearingToTarget={bearingToNearest}
  onNavigationPress={handleNavigationPress}
/>
```

### NavigationPanel Componente

#### Diseño

```
┌─────────────────────────────────────────┐
│  🧭 NAVEGACIÓN ACTIVA                   │
├─────────────────────────────────────────┤
│                                         │
│  Destino: TAG-001                       │
│  Distancia: 123 metros                  │
│  Estado: Pendiente                      │
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ ✅ Auditar  │  │ ⏭️ Siguiente│       │
│  └─────────────┘  └─────────────┘       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      ❌ Cerrar Navegación       │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### Props

```typescript
type NavigationPanelProps = {
  /** Tag destino actual */
  targetTag: Tag | null;
  
  /** Distancia en metros */
  distance: number | null;
  
  /** Estado de auditoría del tag */
  tagStatus: AuditStatus | null;
  
  /** Si hay posición del usuario */
  hasPosition: boolean;
  
  /** Callback para auditar */
  onAudit: () => void;
  
  /** Callback para siguiente (skip) */
  onNext: () => void;
  
  /** Callback para cerrar navegación */
  onClose: () => void;
};
```

## Criterios de Aceptación

### CA-1: Activación del modo
```
Given: Pantalla de auditoría, modo inactivo
When:  Usuario presiona "Modo Navegación"
Then:  Se activa el modo
And:   Se inicia tracking de posición
And:   Se muestra NavigationPanel
And:   Se calcula tag más cercano
And:   NavigationArrow aparece en el mapa
```

### CA-2: Desactivación del modo
```
Given: Modo navegación activo
When:  Usuario presiona "Cerrar Navegación"
Then:  Se desactiva el modo
And:   Se detiene tracking de posición
And:   Se oculta NavigationPanel
And:   Se oculta NavigationArrow
```

### CA-3: Auto-avance post-auditar
```
Given: Modo activo, tag destino "TAG-001"
When:  Usuario audita TAG-001
Then:  Se guarda la auditoría
And:   Se recalcula tag más cercano
And:   Nuevo destino es "TAG-015" (siguiente más cercano)
And:   Mapa centra en TAG-015
```

### CA-4: Botón "Siguiente" (skip)
```
Given: Modo activo, tag destino "TAG-001"
When:  Usuario presiona "Siguiente"
Then:  Se salta TAG-001 (sin auditar)
And:   Se recalcula siguiente tag
And:   Nuevo destino es el siguiente más cercano
```

### CA-5: Sin tags pendientes
```
Given: Todos los tags auditados
When:  Se recalcula nearest tag
Then:  nearestTag = null
And:  NavigationPanel muestra "¡Todos auditados!"
And:   NavigationArrow oculta
```

### CA-6: Permiso de ubicación denegado
```
Given: Permiso de ubicación no concedido
When:  Usuario activa modo navegación
Then:  Se solicita permiso
And:   Si se deniega, se muestra alerta explicativa
And:   El modo no se activa sin permiso
```

### CA-7: Accesibilidad
```
Given: NavigationPanel renderizado
When:  Screen reader accede
Then:  Panel tiene accessibilityLabel="Panel de navegación"
And:   Botones tienen labels descriptivos
And:   Info de distancia es anunciada
```

## Dependencias

### Dependencias internas
- Navigation Store (FEAT-WAZE-001b)
- NavigationArrow (FEAT-WAZE-001c)
- MapCanvas con props de navegación (FEAT-WAZE-001d)
- `locationService` existente
- `useAudit` hook existente

## Accesibilidad (WCAG 2.1)

### Requisitos
- [ ] **Touch targets**: Botones mínimos 44x44px
- [ ] **Contraste**: Texto sobre fondos con ratio ≥ 4.5:1
- [ ] **Labels**: Todos los botones con accessibilityLabel
- [ ] **Live region**: Distancia actualizada se anuncia
- [ ] **Focus**: Navegación por teclado funciona correctamente

## Notas

### Performance
- `watchPosition` con `distanceFilter: 1` para no saturar de updates
- Cálculos de bearing/distance solo cuando hay nueva posición
- Debounce en actualizaciones de UI (máx 10 updates/segundo)

### Memory leaks
- Cleanup de `watchPosition` al desactivar modo
- Cleanup en `useEffect` unmount
- Usar `useRef` para watchId (no estado)

### Edge cases
- Sin señal GPS: mostrar "Buscando señal..."
- Señal inexacta: mostrar precisión
- Tag auditado por otro usuario: recalcular automáticamente
