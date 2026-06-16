---
name: state-migration-helper
description: Guía la migración de stores Zustand desde src/stores/ (legacy) hacia src/state/ (objetivo), valida imports, actualiza tests y asegura que no haya referencias rotas. Úsalo al migrar stores, auditar estado global o reorganizar estructura de estado.
license: MIT
compatibility: opencode
---

# State Migration Helper

## Propósito
Guiar la migración de stores Zustand desde la ubicación legacy `src/stores/` hacia la ubicación objetivo `src/state/`, validar que todos los imports se actualicen correctamente, asegurar que los tests se migren también y verificar que no haya referencias rotas en el código base.

## Cuándo usarlo
- Al migrar stores desde `src/stores/` hacia `src/state/`
- Al reorganizar la estructura de estado del proyecto
- Al auditar stores que aún están en ubicación legacy
- Para validar que la migración se completó correctamente
- En auditorías de frontend-state-agent
- Al cerrar tareas de migración de estado

## Alcance
- Guía paso a paso para migrar stores
- Validación de imports actualizados
- Migración de tests asociados
- Detección de referencias rotas
- Validación de persistencia y dev-bypass
- NO migra automáticamente (solo guía)
- NO modifica código sin validación previa
- NO migra stores que no siguen patrón Zustand

## Patrón principal

### Flujo de migración paso a paso

```
1. Identificar store a migrar
   ↓
2. Copiar archivo de src/stores/ a src/state/
   ↓
3. Actualizar nombre de archivo (si es necesario)
   ↓
4. Actualizar imports internos del store
   ↓
5. Actualizar todos los imports en el código base
   ↓
6. Migrar tests asociados
   ↓
7. Validar que no hay referencias a src/stores/
   ↓
8. Ejecutar tests para validar migración
   ↓
9. Eliminar archivo legacy de src/stores/
   ↓
10. Validar que todo funciona correctamente
```

### Paso 1: Identificar store a migrar

```bash
# Listar stores en ubicación legacy
ls -la src/stores/

# Ver contenido del store
cat src/stores/authStore.ts
```

**Criterios para migrar**:
- ✅ Store usa patrón Zustand (`create()`)
- ✅ Store tiene tests asociados
- ✅ Store no tiene dependencias circulares
- ❌ NO migrar si store usa patrón legacy (Redux, Context)
- ❌ NO migrar si store tiene lógica de negocio (debe ir a domain/)

### Paso 2: Copiar archivo a src/state/

```bash
# Copiar archivo manteniendo nombre
cp src/stores/authStore.ts src/state/auth.store.ts

# O renombrar siguiendo convención de nombres
cp src/stores/authStore.ts src/state/auth.store.ts
```

**Convención de nombres en src/state/**:
```
src/state/
├── auth.store.ts           # Store de autenticación
├── user.store.ts           # Store de usuario
├── nfc.store.ts            # Store de NFC
├── settings.store.ts       # Store de configuraciones
└── index.ts                # Exportar todos los stores
```

### Paso 3: Actualizar imports internos del store

```typescript
// ❌ ANTES (src/stores/authStore.ts)
import { api } from '../infrastructure/api';
import { User } from '../domain/models/User';

// ✅ DESPUÉS (src/state/auth.store.ts)
import { api } from '../infrastructure/api';
import { User } from '../domain/models/User';
// Imports relativos se mantienen, solo cambia ubicación del store
```

### Paso 4: Actualizar todos los imports en el código base

```bash
# Buscar todos los imports al store legacy
grep -r "from.*stores/authStore" src/ --include="*.ts" --include="*.tsx"

# Ejemplo de archivos que necesitan actualización:
# src/presentation/screens/LoginScreen.tsx
# src/presentation/components/ProfileCard.tsx
# src/domain/services/AuthService.ts
```

**Actualización de imports**:
```typescript
// ❌ ANTES
import { useAuthStore } from '../../stores/authStore';

// ✅ DESPUÉS
import { useAuthStore } from '../../state/auth.store';
```

### Paso 5: Migrar tests asociados

```bash
# Buscar tests del store
find __tests__ -name "*authStore*" -o -name "*auth.store*"

# Copiar test a nueva ubicación
cp __tests__/stores/authStore.test.ts __tests__/state/auth.store.test.ts
```

**Actualización de imports en tests**:
```typescript
// ❌ ANTES
import { useAuthStore } from '../../src/stores/authStore';

// ✅ DESPUÉS
import { useAuthStore } from '../../src/state/auth.store';
```

### Paso 6: Validar que no hay referencias a src/stores/

```bash
# Buscar referencias restantes
grep -r "stores/authStore" src/ __tests__/ --include="*.ts" --include="*.tsx"

# Si hay resultados, actualizar imports restantes
```

### Paso 7: Ejecutar tests para validar migración

```bash
# Ejecutar tests del store migrado
npm test -- auth.store.test.ts

# Ejecutar todos los tests para validar que no hay regresiones
npm test

# Validar cobertura
npm test -- --coverage --collectCoverageFrom='src/state/auth.store.ts'
```

### Paso 8: Eliminar archivo legacy

```bash
# Solo después de validar que todo funciona
rm src/stores/authStore.ts
rm __tests__/stores/authStore.test.ts
```

## Validaciones post-migración

### Checklist de migración completa

```markdown
# Checklist de Migración: [Nombre del Store]

## Archivos
- [ ] Store copiado a src/state/[nombre].store.ts
- [ ] Tests copiados a __tests__/state/[nombre].store.test.ts
- [ ] Archivo legacy eliminado de src/stores/
- [ ] Test legacy eliminado de __tests__/stores/

## Imports
- [ ] Todos los imports en src/ actualizados
- [ ] Todos los imports en __tests__/ actualizados
- [ ] No hay referencias a src/stores/[nombre]
- [ ] No hay referencias a __tests__/stores/[nombre]

## Funcionalidad
- [ ] Tests del store pasan correctamente
- [ ] Tests de componentes que usan el store pasan
- [ ] Tests de servicios que usan el store pasan
- [ ] Cobertura de tests se mantiene o mejora

## Estado global
- [ ] Persistencia configurada correctamente (si aplica)
- [ ] Dev-bypass funciona en desarrollo (si aplica)
- [ ] Selectores eficientes (uso de useShallow)
- [ ] No hay rerenders innecesarios

## Documentación
- [ ] Historial de spec actualizado (si aplica)
- [ ] README del módulo actualizado (si aplica)
```

### Validación de persistencia

```typescript
// ✅ CORRECTO: Persistencia configurada en src/state/
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado y acciones
    }),
    {
      name: 'auth-storage', // Nombre único para localStorage
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      }), // Solo persistir lo necesario
    }
  )
);
```

### Validación de dev-bypass

```typescript
// ✅ CORRECTO: Dev-bypass solo en desarrollo
const isDevBypass = __DEV__ && 
  process.env.DEV_BYPASS === 'true' &&
  storage.getString('dev-bypass-enabled') === 'true';

if (isDevBypass) {
  // Lógica de dev-bypass
  set({ user: { id: 'admin', role: 'admin' } });
}
```

## Reporte de migración

### Formato de reporte
```markdown
# Reporte de Migración de Store

## Store migrado: [Nombre]

### Archivos modificados
- ✅ src/stores/authStore.ts → src/state/auth.store.ts
- ✅ __tests__/stores/authStore.test.ts → __tests__/state/auth.store.test.ts
- ✅ 15 imports actualizados en src/
- ✅ 3 imports actualizados en __tests__/

### Validaciones
- ✅ Tests pasan correctamente (12/12)
- ✅ Cobertura: 85% (objetivo: 80%)
- ✅ No hay referencias a src/stores/authStore
- ✅ Persistencia configurada correctamente
- ✅ Dev-bypass funciona en desarrollo

### Issues encontrados
- ⚠️ 2 componentes usaban import incorrecto (corregido)
- ⚠️ 1 test tenía mock desactualizado (corregido)

### Recomendaciones
1. Considerar migrar userStore.ts (siguiente prioridad)
2. Agregar tests para selectores del store
3. Documentar persistencia en README del módulo
```

## Integración con agentes

### Para frontend-state-agent
- Usa este skill para guiar migración de stores
- Valida que migración sigue patrones correctos
- Genera reportes de migración
- Asegura que tests se migren correctamente

### Para frontend-agent
- Consulta antes de migrar stores
- Sigue flujo paso a paso para migración
- Valida que no hay referencias rotas
- Documenta migración en historial de spec

## Restricciones
- NO migra automáticamente (solo guía)
- NO modifica código sin validación previa
- NO migra stores que no siguen patrón Zustand
- NO elimina archivos legacy sin validar tests
- NO ignora referencias rotas sin justificación
- Requiere ejecutar tests después de cada migración
- Requiere validar persistencia y dev-bypass
- Requiere actualizar tests asociados
