---
name: zustand-state-management
description: Manages global state with Zustand, including stores, slices, persistence, and cross-platform considerations for React Native.
license: MIT
compatibility: opencode
---
# Gestión de Estado con Zustand

## Propósito
Instruir al agente en la correcta creación, uso y auditoría de stores de Zustand para estado global, asegurando patrones consistentes, rendimiento óptimo y correcta separación entre estado de autenticación, configuración y datos de dominio.

## Cuándo usarlo
- Al crear, modificar o auditar stores de estado global (auth, settings, datos de dominio).
- Cuando se necesita compartir estado entre múltiples componentes o pantallas.
- Al implementar persistencia de estado (AsyncStorage, react-native-keychain).
- Cuando hay errores de rendimiento relacionados con re-renders o suscripciones a stores.
- Al добавить nuevo estado que debe sobrevivir navegación o persistir entre sesiones.

## Cómo usarlo
1. Identificar el tipo de estado: ¿autenticación, configuración, o datos de dominio?
2. Usar el patrón existente del proyecto: `src/state/authStore.ts` para auth, `src/state/settingsStore.ts` para settings.
3. Definir el store con interface tipada, selectores explícitos y accionesclaras.
4. Para persistencia, usar el adapter correcto según plataforma (native: keychain, web: localStorage).
5. No almacenar datos sensibles en texto plano; usar siempre mecanismos seguros en native.
6. Mantener los stores separados por responsabilidad; no fusionar auth y datos de dominio.

## Ejemplos

### Caso 1: Crear un store de dominio
```ts
// src/state/tagStore.ts
import { create } from 'zustand';

interface TagState {
  tags: Tag[];
  selectedTag: Tag | null;
  setTags: (tags: Tag[]) => void;
  selectTag: (tag: Tag) => void;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  selectedTag: null,
  setTags: (tags) => set({ tags }),
  selectTag: (tag) => set({ selectedTag: tag }),
}));
```

### Caso 2: Selector con derivación
```ts
// ✓ Correcto: selector derivado
const activeTags = useTagStore((state) => state.tags.filter(t => t.isActive));

// ✗ Incorrecto: derivación en render
const activeTags = useTagStore(state => state.tags).filter(t => t.isActive);
```

### Caso 3: Persistencia cross-platform
```ts
// src/infrastructure/security/tokenStorage.native.ts
import * as Keychain from 'react-native-keychain';

export const tokenStorage = {
  get: async () => {
    const result = await Keychain.getGenericPassword();
    return result ? JSON.parse(result.password) : null;
  },
  set: async (token) => {
    await Keychain.setGenericPassword('auth', JSON.stringify(token));
  },
};
```

## Integración con el agente
El agente @frontend-agent debe cargar este skill automáticamente cuando:
- La tarea involucre palabras como: "store", "estado", "zustand", "global state", "persist".
- Se pida crear nuevas pantallas que requieran datos compartidos entre componentes.
- Existan errores de re-render o suscripción a estado.
- Se implemente funcionalidad que requiera datos entre sesiones (auth, settings).