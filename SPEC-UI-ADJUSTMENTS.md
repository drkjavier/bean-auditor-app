# SPEC: Ajuste de UI — HomeScreen, AuditScreen, SettingsScreen

> **Fecha:** 2026-06-12
> **Base:** Mejores prácticas Context7 (`facebook/react-native`) + auditoría del codebase actual
> **Objetivo:** Establecer un punto de partida consistente, responsive y accesible para las 3 pantallas principales

---

## 1. Hallazgos de Context7 (Resumen ejecutivo)

| Patrón | Fuente Context7 | Aplicación en el proyecto |
|---|---|---|
| **Theme Context + useColorScheme** | RN Light/Dark theme definitions using `createContext` + `Appearance.getColorScheme()` | No existe soporte dark mode. `theme.ts` es un objeto estático sin Context |
| **Design tokens centralizados** | Temas con `LabelColor`, `SystemBackgroundColor`, etc. como objetos tipados | `theme.ts` tiene tokens básicos pero sin `textCaption`, `textButton`, `overline`, ni sombras |
| **Flexbox como layout engine** | Flexbox es el sistema de layout por defecto; `flexDirection`, `justifyContent`, `alignItems` | Las pantallas usan `flex: 1` + `alignItems: 'center'` de forma inconsistente |
| **StyleSheet.create** | Siempre usar `StyleSheet.create` para optimización de diffing y RN runtime | Se cumple en la mayoría, pero SettingsScreen tiene estilos inline |
| **useWindowDimensions** | Hook para breakpoints responsivos en vez de media queries | No se usa en ninguna pantalla. Breakpoint definido en `theme.ts` pero nunca consultado |
| **KeyboardAvoidingView** | `behavior: 'height' \| 'position' \| 'padding'` + `keyboardVerticalOffset` | No se usa en LoginScreen ni en pantallas con formularios |
| **FlatList + contentInset** | `position: 'absolute'` en headers fijos + `contentInset` para compensar | AuditScreen ya usa FlatList con ListHeaderComponent (correcto) |
| **SafeArea** | `SafeAreaView` / `useSafeAreaInsets()` para notch y gesture areas | Se mockea en tests; web usa shim con insets zero. Native necesita integración real |
| **Accessibility** | `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, `accessibilityLiveRegion` | Componentes Button/Input/ErrorBanner lo usan. Pantallas principales no tienen labels |

---

## 2. Diagnóstico del estado actual

### 2.1 `theme.ts` — Deficiencias

```
✅ Tiene: colors, spacing (xs/sm/md/lg), typography (h1/h2/body), radii, responsiveBreakpoint
❌ Falta: textCaption, textButton, textOverline, textSubtitle, sombras, dark palette, semantic tokens
❌ Falta: Context provider para dark mode
❌ Falta: utilidad `useTheme()` hook
```

### 2.2 `HomeScreen` — Deficiencias

```
✅ Tiene: accessibilityLabel
❌ Falta: contenido real (solo placeholder "Inicio" centrado)
❌ Falta: scroll para contenido dinámico
❌ Falta: jerarquía visual (cards, secciones)
❌ Falta: responsive design
```

### 2.3 `AuditScreen` — Deficiencias

```
✅ Tiene: FlatList con scroll, ListHeaderComponent, filtros, mapa
✅ Tiene: paddingBottom para footer
⚠️ Ajustado recientemente — estructura funcional
❌ Falta: accessibilityLabel en secciones del header
❌ Falta: estados vacío y error explícitos en UI
```

### 2.4 `SettingsScreen` — Deficiencias

```
✅ Tiene: funcionalidad de logout y toggle de ubicación
❌ Falta: estilos inline → deberían usar theme tokens
❌ Falta: scroll (el contenido puede desbordar en pantallas pequeñas)
❌ Falta: jerarquía visual (secciones, cards, dividers)
❌ Falta: accessibility labels en toggles y botones
❌ Falta: confirmación antes de logout
```

### 2.5 Componentes compartidos

```
✅ Button: variantes primary/secondary/ghost/tonal, loading, disabled
✅ Input: label, error, secure, prependIcon, appendIcon
✅ ErrorBanner: accessibilityRole="alert"
✅ Header: menú hamburguesa, título, slot derecho
❌ Falta: Card component reutilizable
❌ Falta: SectionHeader component
❌ Falta: Toggle/Switch component estilizado
❌ Falta: EmptyState component
```

---

## 3. Spec de implementación

### Fase 1: Theme mejorado + Dark Mode Context

**Archivo: `src/presentation/themes/theme.ts`**

```typescript
// Agregar al theme existente:
const theme = {
  colors: {
    // ... existentes ...
    // Nuevos tokens semánticos
    textCaption: '#6B7280',
    textButton: '#FFFFFF',
    textOverline: '#9CA3AF',
    textLink: '#0B5FFF',
    // Superficies
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    // Sombras (web-friendly)
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    // ... existentes h1, h2, body ...
    subtitle: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
    caption:  { fontSize: 12, fontWeight: '400', lineHeight: 18 },
    button:   { fontSize: 16, fontWeight: '600', lineHeight: 24 },
    overline: { fontSize: 11, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 },
  },
  spacing: {
    // ... existentes xs/sm/md/lg ...
    xl: 32,
    '2xl': 48,
  },
  radii: {
    // ... existentes sm/md ...
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    lg: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  },
} as const;
```

**Nuevo archivo: `src/presentation/themes/ThemeContext.tsx`**

```typescript
// Context + Provider + useTheme hook
// Soporte dark mode via useColorScheme de React Native
// En web: detección automática via CSS prefers-color-scheme
// En native: Appearance API
```

**Cambio requerido:** Todos los componentes y pantallas deben consumir theme via `useTheme()` en vez de importar `theme` estáticamente. Esto habilita dark mode futuro.

---

### Fase 2: Componentes nuevos reutilizables

#### 2a. `Card` component
**Archivo: `src/presentation/components/Card.tsx`**

```typescript
// Props: children, variant ('elevated' | 'outlined' | 'filled'), style
// - elevated: sombra md + fondo blanco
// - outlined: borde 1px + fondo transparente
// - filled: fondo surface + sin borde
// - borderRadius: theme.radii.lg
// - padding: theme.spacing.md
```

#### 2b. `SectionHeader` component
**Archivo: `src/presentation/components/SectionHeader.tsx`**

```typescript
// Props: title, subtitle?, action?: ReactNode
// - Título: theme.typography.subtitle
// - Subtítulo: theme.typography.caption + theme.colors.textSecondary
// - Acción (derecha): slot para botón o link
```

#### 2c. `EmptyState` component
**Archivo: `src/presentation/components/EmptyState.tsx`**

```typescript
// Props: icon (nombre MDI), title, description?, action?: { label, onPress }
// - Centrado verticalmente
// - Icon: 48px, color muted
// - Title: theme.typography.subtitle
// - Description: theme.typography.body + textSecondary
// - Action: Button variant tonal
```

#### 2d. `SettingsRow` component
**Archivo: `src/presentation/components/SettingsRow.tsx`**

```typescript
// Props: label, trailing (ReactNode para toggle/chevron/value), onPress?, showDivider
// - Fila horizontal con label izquierda y trailing derecha
// - Separator visual entre filas
// - accessibilityRole="button" cuando tiene onPress
// - Touch target mínimo 44x44 (WCAG)
```

---

### Fase 3: Ajuste de pantallas

#### 3a. `HomeScreen`

**Estructura propuesta:**
```
ScrollView (o FlatList si hay datos dinámicos)
├── SectionHeader: "Bienvenido"
├── Card variant="elevated": Resumen rápido
│   ├── Última auditoría (fecha, estado)
│   ├── Tags pendientes (conteo)
│   └── Button → "Ir a Auditoría"
├── Card variant="outlined": Accesos rápidos
│   ├── Pressable → Auditoría (icono + label)
│   ├── Pressable → Ajustes (icono + label)
│   └── Pressable → Cerrar sesión (icono + label, color error)
└── Footer spacer (paddingBottom: bottomBarOffset)
```

**Estilos a eliminar:** Inline styles → theme tokens
**Accesibilidad:** `accessibilityLabel` en cada card/pressable, `accessibilityRole` apropiado

#### 3b. `AuditScreen`

**Ajustes menores (ya tiene buena estructura):**
- Agregar `accessibilityLabel` a secciones del `ListHeaderComponent`
- Agregar componente `EmptyState` cuando `filtered.length === 0`
- Agregar componente `ErrorBanner` cuando `dateRangeError` o `load` falle
- Usar `Card` para el `detailCard` en vez de estilo inline
- Asegurar touch targets ≥ 44x44 en botones de filtro

#### 3c. `SettingsScreen`

**Estructura propuesta:**
```
ScrollView
├── SectionHeader: "Cuenta"
├── Card variant="outlined"
│   └── SettingsRow: Email del usuario (value)
├── SectionHeader: "Preferencias"
├── Card variant="outlined"
│   ├── SettingsRow: "Mostrar ubicación" → Switch/Toggle
│   └── SettingsRow: "Notificaciones" → Switch/Toggle (futuro)
├── SectionHeader: "Acerca de"
├── Card variant="outlined"
│   ├── SettingsRow: "Versión" → "1.0.0"
│   └── SettingsRow: "Política de privacidad" → chevron
├── View spacer
├── Button variant="tonal" color error: "Cerrar sesión"
│   └── Alert.alert confirmación antes de logout
└── Footer spacer
```

**Cambios específicos:**
- Eliminar todos los estilos inline → theme tokens
- Agregar `ScrollView` para scroll
- Agregar `Card` y `SettingsRow` para estructura
- Agregar `Alert.alert` de confirmación antes de logout
- Agregar `accessibilityLabel` en cada interacción

---

### Fase 4: Responsive Design

**Uso de `useWindowDimensions` (Context7 pattern):**

```typescript
import { useWindowDimensions } from 'react-native';

// En cada pantalla:
const { width, height } = useWindowDimensions();
const isCompact = width < theme.responsiveBreakpoint; // 900px

// Layout condicional:
// - isCompact: columna única, cards full-width
// - !isCompact: grid 2 columnas, cards con maxWidth
```

**Aplicación:**
- `HomeScreen`: Cards en grid 2 columnas en tablet/web, columna en móvil
- `AuditScreen`: Filtros en row en desktop, stack en móvil
- `SettingsScreen`: Card width maxWidth: 480 centrado en desktop

---

### Fase 5: KeyboardAvoidingView en LoginScreen

**Aplicar pattern de Context7:**

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
  style={{ flex: 1 }}
>
  <ScrollView contentContainerStyle={...}>
    {/* Formulario */}
  </ScrollView>
</KeyboardAvoidingView>
```

---

## 4. Orden de ejecución recomendado

| Paso | Archivo(s) | Dependencias | Esfuerzo |
|---|---|---|---|
| 1 | `theme.ts` (agregar tokens) | Ninguna | Bajo |
| 2 | `ThemeContext.tsx` (nuevo) | Paso 1 | Medio |
| 3 | `Card.tsx`, `SectionHeader.tsx`, `EmptyState.tsx`, `SettingsRow.tsx` (nuevos) | Paso 1 | Medio |
| 4 | `HomeScreen.tsx` (rediseñar) | Pasos 1-3 | Medio |
| 5 | `SettingsScreen.tsx` (rediseñar) | Pasos 1-3 | Medio |
| 6 | `AuditScreen.tsx` (ajustes menores) | Paso 3 | Bajo |
| 7 | `LoginScreen.tsx` (KeyboardAvoidingView) | Ninguna | Bajo |
| 8 | Responsive: `useWindowDimensions` en 3 pantallas | Pasos 4-6 | Medio |
| 9 | Tests: actualizar snapshots, agregar tests de accesibilidad | Todos | Medio |

---

## 5. Criterios de aceptación

- [ ] Todas las pantallas usan theme tokens (cero colores hex hardcodeados fuera de `theme.ts`)
- [ ] Dark mode funciona via `useTheme()` (cambio automático en web por `prefers-color-scheme`)
- [ ] Todas las pantallas son scrolleables cuando el contenido excede la pantalla
- [ ] Touch targets ≥ 44x44px en todos los elementos interactivos
- [ ] `accessibilityLabel` presente en todos los elementos interactivos
- [ ] `accessibilityRole` correcto en botones, links, alerts
- [ ] Responsive: layout columna en móvil, grid en tablet/web
- [ ] KeyboardAvoidingView en LoginScreen
- [ ] Confirmación antes de logout
- [ ] EmptyState visible cuando no hay datos
- [ ] Tests: 0 fallos, cobertura de nuevos componentes

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper tests existentes al cambiar estilos | Actualizar snapshots después de cada fase; no cambiar estructura de componentes testados |
| Dark mode requiere cambio masivo de imports | Fase 2 usa Context; migración gradual, ambos modos funcionan simultáneamente |
| Web-shims pueden no soportar nuevas APIs RN | Verificar `vite.config.ts` aliases después de agregar `useWindowDimensions` |
| Performance con `useWindowDimensions` en re-renders | El hook ya es optimizado por RN; usar `useMemo` para cálculos derivados |
