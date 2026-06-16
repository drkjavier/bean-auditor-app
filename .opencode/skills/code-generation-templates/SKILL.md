---
name: code-generation-templates
description: Plantillas estandarizadas para generación de componentes, screens, hooks, stores Zustand, services y repositories siguiendo la arquitectura de capas del proyecto. Trigger: Al crear nuevos módulos, componentes o features para acelerar desarrollo y asegurar consistencia.
license: MIT
compatibility: opencode
---

# Code Generation Templates

## Propósito
Proporcionar plantillas estandarizadas para generación rápida de código siguiendo la arquitectura de capas del proyecto (presentation/domain/data/infrastructure/state). Acelera desarrollo y asegura consistencia.

## Cuándo usarlo
- Al crear un nuevo componente, screen o hook
- Al implementar un nuevo store Zustand
- Al crear services o repositories
- Al scaffoldar una nueva feature
- Cuando necesitas una base consistente para empezar

## Alcance
- **Cubre**: Plantillas para componentes, screens, hooks, stores, services, repositories, models
- **No cubre**: Lógica de negocio específica, configuraciones de entorno, tests

## Arquitectura de capas

```
src/
├── presentation/     → UI, pantallas, componentes, hooks, navegación, temas
├── state/           → Estado global (Zustand stores)
├── domain/          → Lógica de negocio (models, services, usecases)
├── data/            → Acceso a datos (repositories, datasources)
└── infrastructure/  → Adaptadores, configuraciones, utilidades
```

## Plantillas

### 1. Componente funcional React Native

```tsx
// src/presentation/components/ComponentName.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../themes/theme';

interface ComponentNameProps {
  title: string;
  onPress?: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
  },
});
```

### 2. Screen (pantalla)

```tsx
// src/presentation/screens/ScreenNameScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../themes/theme';

interface ScreenNameScreenState {
  loading: boolean;
  error: string | null;
  data: any | null;
}

export const ScreenNameScreen: React.FC = () => {
  const [state, setState] = useState<ScreenNameScreenState>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      // Lógica de carga
      setState(prev => ({ ...prev, loading: false, data: {} }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  if (state.loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  if (state.error) {
    return <Text style={styles.error}>{state.error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen Name</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: 'bold',
  },
  error: {
    color: theme.colors.error,
    padding: theme.spacing.md,
  },
});
```

### 3. Hook custom

```tsx
// src/presentation/hooks/useHookName.ts
import { useState, useEffect } from 'react';

interface UseHookNameReturn {
  data: any;
  loading: boolean;
  error: string | null;
}

export const useHookName = (param?: string): UseHookNameReturn => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Lógica del hook
        setData({});
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [param]);

  return { data, loading, error };
};
```

### 4. Store Zustand

```tsx
// src/state/storeName.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreNameState {
  // Estado
  items: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setItems: (items: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchItems: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  items: [],
  loading: false,
  error: null,
};

export const useStoreName = create<StoreNameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setItems: (items) => set({ items }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      fetchItems: async () => {
        set({ loading: true, error: null });
        try {
          // Lógica de fetch
          set({ items: [], loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'store-name-storage',
      partialize: (state) => ({ items: state.items }), // Solo persistir lo necesario
    }
  )
);

// Selector eficiente
export const selectItems = (state: StoreNameState) => state.items;
export const selectLoading = (state: StoreNameState) => state.loading;
```

### 5. Service (domain)

```tsx
// src/domain/services/ServiceName.ts
import { RepositoryName } from '../repositories/RepositoryName';

export class ServiceName {
  private repository: RepositoryName;

  constructor(repository: RepositoryName) {
    this.repository = repository;
  }

  async execute(param: string): Promise<any> {
    // Validaciones de negocio
    if (!param) {
      throw new Error('Param is required');
    }

    // Lógica de negocio
    const result = await this.repository.getData(param);
    
    // Transformación si es necesario
    return result;
  }
}
```

### 6. Repository (data)

```tsx
// src/data/repositories/RepositoryName.ts
import { IRepositoryName } from '../../domain/repositories/IRepositoryName';
import { ApiDataSource } from '../datasources/ApiDataSource';

export class RepositoryName implements IRepositoryName {
  private apiDataSource: ApiDataSource;

  constructor(apiDataSource: ApiDataSource) {
    this.apiDataSource = apiDataSource;
  }

  async getData(param: string): Promise<any> {
    try {
      const response = await this.apiDataSource.fetchData(param);
      return response;
    } catch (error) {
      throw new Error(`Failed to get data: ${error.message}`);
    }
  }
}
```

### 7. Model (domain)

```tsx
// src/domain/models/ModelName.ts
export interface ModelName {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelNameEntity implements ModelName {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: ModelName) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Métodos de negocio si es necesario
  isValid(): boolean {
    return this.name.length > 0;
  }
}
```

## Reglas de uso

1. **Respeta la arquitectura**: Cada archivo va en su capa correspondiente
2. **Usa tokens de tema**: Siempre referencia `theme` para colores, spacing, typography
3. **Maneja estados**: Loading, error, empty, success en screens y hooks
4. **Selectores eficientes**: En Zustand, usa selectores específicos para evitar rerenders
5. **Persistencia mínima**: En stores, solo persiste lo necesario con `partialize`
6. **Validaciones en domain**: Lógica de negocio y validaciones en services, no en UI
7. **Error handling**: Captura y maneja errores en repositories y services

## Personalización

Adapta las plantillas según:
- Requisitos específicos de la feature
- Patrones existentes en el codebase
- Preferencias del equipo

## Restricciones
- No incluir lógica de negocio en componentes de UI
- No hardcodear colores, spacing o typography (usar theme)
- No persistir datos sensibles en stores sin encriptación
- No importar React en domain/
- No importar presentation/ en data/ o infrastructure/
