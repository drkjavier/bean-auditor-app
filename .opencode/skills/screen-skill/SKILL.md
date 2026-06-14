---
name: screen-skill
description: Define el patrón estándar para crear pantallas en BeanAuditor: estructura, estados de UI, integración con stores, theme, AbortController y navegación.
license: MIT
compatibility: opencode
---
# Creación de Pantallas (Screens)

## Propósito
Estandarizar la creación de pantallas en `src/presentation/screens/`, asegurando que todas incluyan estados de carga/error/vacío, integración con stores, uso de theme, cancelación de requests y accesibilidad básica.

## Cuándo usarlo
- Al crear una nueva pantalla.
- Al refactorizar una pantalla existente para alinearla al patrón estándar.
- Al auditar si una pantalla cumple con los estados de UI requeridos.

## Alcance
- Cubre: estructura de screen, estados de UI, integración con stores y fetchWithAuth, theme, accesibilidad.
- No cubre: lógica de negocio (va en domain/), implementación de componentes reutilizables (va en components/).

## Patrón principal

### Estructura base
```tsx
// src/presentation/screens/NewScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import theme from '../themes/theme';
import { createAndRegisterAbortController, unregisterAbortController } from '../../infrastructure/api/abortManager';
import { fetchWithAuth } from '../../infrastructure/api/fetchWithAuth';

type Status = 'idle' | 'loading' | 'error' | 'empty' | 'success';

export default function NewScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = createAndRegisterAbortController();

    async function load() {
      setStatus('loading');
      try {
        const resp = await fetchWithAuth('/api/items', { signal: ctrl.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const items = await resp.json();
        setData(items);
        setStatus(items.length === 0 ? 'empty' : 'success');
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Error desconocido');
        setStatus('error');
      }
    }

    load();
    return () => unregisterAbortController(ctrl);
  }, []);

  if (status === 'loading') {
    return (
      <View style={styles.center} accessibilityLabel="Cargando datos">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (status === 'empty') {
    return (
      <View style={styles.center} accessibilityLabel="Sin datos">
        <Text style={styles.emptyText}>No hay elementos para mostrar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="Nombre de la pantalla">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemRow item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.error, fontSize: theme.typography.body },
  emptyText: { color: theme.colors.textSecondary, fontSize: theme.typography.body },
});
```

### Checklist obligatorio para cada pantalla
1. **Estados de UI**: loading, error, empty, success. Nunca mostrar pantalla en blanco sin estado.
2. **AbortController**: registrar al montar, desregistrar al desmontar. Propagar AbortError sin tratarlo como error.
3. **Theme**: usar `theme.colors.*`, `theme.spacing.*`, `theme.typography.*`. No hardcodear colores ni tamaños.
4. **Accesibilidad**: `accessibilityLabel` en contenedores principales y estados de carga/error.
5. **Stores**: importar desde `../../state/` (no desde `../../stores/` que es legacy).
6. **Navegación**: si la pantalla es un tab, registrarla en `MainScreen` y `BottomNavBar`. Si aplica web, agregar ruta en `useWebHistory`.

## Restricciones
- No colocar lógica de negocio en la pantalla. Extraer a `domain/` o `data/`.
- No usar `axios`. Siempre `fetchWithAuth`.
- No hardcodear colores. Siempre `theme.colors.*`.
- No ignorar `AbortError`. Debe propagarse o retornar sin cambiar estado.
- No importar stores desde `../../stores/` (legacy). Usar `../../state/`.

## Archivos de referencia
- `src/presentation/screens/AuditScreen.tsx` — Screen completa con todos los estados
- `src/presentation/screens/LoginScreen.tsx` — Screen con formulario y auth
- `src/presentation/themes/theme.ts` — Design tokens
- `src/state/authStore.ts` — Store de autenticación
