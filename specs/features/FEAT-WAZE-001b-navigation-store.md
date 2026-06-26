---
id: FEAT-WAZE-001b
title: Navigation Store - Estado Global de Navegación
type: feature
status: pending
parent: FEAT-WAZE-001
children: []
layer: state
priority: high
created: 2026-06-25
updated: 2026-06-25
---

# Sub-Spec: Navigation Store - Estado Global de Navegación

## Objetivo
Implementar un store Zustand para manejar el estado del modo de navegación, incluyendo tracking de posición, cálculos de bearing/distance, y destino actual.

## Alcance

### Archivos a crear
- `src/state/navigationStore.ts`

### Estado a manejar

```typescript
type NavigationState = {
  // Modo
  isNavigationActive: boolean;
  
  // Posición del usuario
  userPosition: { lat: number; lon: number } | null;
  positionError: string | null;
  
  // Tag destino actual
  nearestTag: Tag | null;
  distanceToNearest: number | null;  // metros
  bearingToNearest: number | null;   // grados 0-360
  
  // Lista de tags (para recalcular)
  currentTags: Tag[];
  
  // Acciones
  startNavigation: (tags: Tag[]) => void;
  stopNavigation: () => void;
  updateUserPosition: (lat: number, lon: number) => void;
  recalculateNearest: () => void;
  setCurrentTags: (tags: Tag[]) => void;
};
```

### Lógica del store

#### 1. `startNavigation(tags)`
- Activa `isNavigationActive = true`
- Almacena tags en `currentTags`
- Inicia proceso de cálculo de nearest tag
- (El tracking de posición se maneja en el componente)

#### 2. `stopNavigation`
- Desactiva `isNavigationActive = false`
- Limpia posición y cálculos
- Resetea nearestTag a null

#### 3. `updateUserPosition(lat, lon)`
- Actualiza `userPosition`
- Limpia `positionError`
- Llama a `recalculateNearest()` automáticamente

#### 4. `recalculateNearest()`
- Usa `getNearestUncAuditTag()` de geoUtils
- Actualiza `nearestTag`, `distanceToNearest`, `bearingToNearest`
- Si no hay tags pendientes, nearestTag = null

#### 5. `setCurrentTags(tags)`
- Actualiza `currentTags`
- Recalcula nearest tag (útil después de auditar)

## Criterios de Aceptación

### CA-1: Inicialización
```
Given: Store recién creado
When:  Se accede al estado
Then:  isNavigationActive = false, nearestTag = null
```

### CA-2: Activar navegación
```
Given: Lista de 5 tags (3 pendientes)
When:  startNavigation(tags)
Then:  isNavigationActive = true
And:   nearestTag es el tag pendiente más cercano
```

### CA-3: Actualizar posición
```
Given: Navegación activa, nearestTag = "TAG-001"
When:  updateUserPosition(newLat, newLon)
Then:  userPosition actualizado
And:   distanceToNearest recalculado
And:   bearingToNearest recalculado
```

### CA-4: Desactivar navegación
```
Given: Navegación activa
When:  stopNavigation()
Then:  isNavigationActive = false
And:   nearestTag = null
And:   distanceToNearest = null
```

### CA-5: Auto-recalculo post-audit
```
Given: Navegación activa, nearestTag = "TAG-001"
When:  Se actualizan los tags (TAG-001 auditado)
And:   recalculateNearest()
Then:  nearestTag es el SIGUIENTE tag pendiente más cercano
```

## Dependencias

### Dependencias internas
- `getNearestUncAuditTag` de `src/domain/farm/geoUtils.ts` (FEAT-WAZE-001a)
- `Tag` type de `src/data/mocks/tagsMock.ts`
- Zustand (ya instalado)

## Tests requeridos
- Unit tests para cada acción del store
- Test de recálculo después de auditoría
- Test de limpieza al desactivar

## Notas
- Store simple, sin persistencia (solo sesión)
- Los cálculos se ejecutan en el store (no en UI)
- El tracking de posición se maneja fuera del store (en componente)
