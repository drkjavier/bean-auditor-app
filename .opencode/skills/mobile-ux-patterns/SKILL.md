---
name: mobile-ux-patterns
description: Implements UX patterns for mobile: navigation flows, feedback, loading states, error handling, and accessibility in React Native.
license: MIT
compatibility: opencode
---
# Patrones de UX Mobile

## Propósito
Instruir al agente en la implementación de patrones de experiencia de usuario que mejoran la usability: flujos de navegación intuitivos, feedback visual/auditivo, estados de carga, manejo de errores, y accesibilidad (WCAG 2.1 AA).

## Cuándo usarlo
- Al diseñar o modificar flujos de navegación entre pantallas.
- Cuando se necesitan estados de loading, error, empty o success.
- Al implementar feedback al usuario (toasts, alerts, haptics).
- Cuando se auditan problemas de accesibilidad (contraste, labels, foco).
- Al mejorar la experiencia de formularios (validación en tiempo real, errores claros).
- Cuando se implementan gestures o interacciones touch.

## Cómo usarlo
1. Para navegación: usar `@react-navigation/native-stack` o `bottom-tabs` según el flujo.
2. Implementar estados Loading/Error/Empty para cada operación async.
3. Validación en tiempo real: mostrar errores al blur o en cambio de campo, no solo al submit.
4. Feedback inmediato: deshabilitar botones durante loading, mostrar spinners.
5. Accesibilidad: todo elemento interactivo debe tener `accessibilityLabel`, `accessibilityHint` si aplica, y `accessibilityRole`.
6. Usar `AccessibilityInfo` para announceForAccessibility en errores críticos.
7. Mantener feedback visual consistente: colores de error/warning/success del tema.

## Ejemplos

### Caso 1: Estados de carga en formulario
```tsx
// ✓ Correcto: loading state con feedback
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await login(password);
  } finally {
    setLoading(false); // siempre limpiar loading
  }
};

<Button loading={loading} disabled={loading}>
  {loading ? 'Ingresando...' : 'Login'}
</Button>
```

### Caso 2: Validación con feedback en tiempo real
```tsx
// ✓ Correcto: error mostrado al blur
<Input
  value={username}
  onChangeText={(text) => {
    setUsername(text);
    if (usernameError) setUsernameError(null); // limpiar error al escribir
  }}
  onBlur={() => validate(username)} // mostrar error al salir del campo
  error={usernameError}
/>
```

### Caso 3: Announcement para lectores de pantalla
```tsx
// ✓ Correcto: anunciar errores para accesibilidad
import { AccessibilityInfo } from 'react-native';

const focusFirstError = () => {
  if (usernameError) {
    AccessibilityInfo.announceForAccessibility(usernameError);
    usernameRef.current?.focus();
  }
};
```

### Caso 4: Navegación con feedback
```tsx
// ✓ Correcto: navegación con loading y manejo de error
const onLoginSuccess = () => {
  navigation.replace('Main'); // usar replace para evitar back al login
};

const onLoginError = (msg) => {
  setError(msg);
  // no navegar, mostrar error in-place
};
```

### ErrorBoundary para manejo de errores de render

**Archivo**: `src/presentation/components/ErrorBoundary.tsx`

Un ErrorBoundary captura errores de JavaScript durante el renderizado, en lifecycle methods y en constructores del árbol de componentes debajo de él.

**Cuándo usarlo**:
- Envolver pantallas completas para capturar errores de render inesperados.
- Envolver secciones críticas de la UI (mapa, formulario complejo, etc.).
- Cuando un componente puede fallar por datos externos (API, props inesperadas).

**Dónde colocarlo**:
- En `AppNavigator.tsx` envolviendo el contenido principal.
- En pantallas específicas que dependan de datos asíncronos.
- NO envolver toda la app (si el ErrorBoundary falla, no hay fallback).

**Ejemplo de uso**:
```tsx
import ErrorBoundary from './ErrorBoundary';

// En AppNavigator.tsx
<ErrorBoundary fallback={<Text>Error inesperado</Text>}>
  {isLoggedIn ? <MainScreen /> : <LoginScreen />}
</ErrorBoundary>
```

**Ejemplo con callback de error**:
```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Enviar a servicio de tracking (ej: Sentry)
    reportError(error, errorInfo);
  }}
>
  <MapCanvas />
</ErrorBoundary>
```

**Restricciones**:
- **NO usar** para errores de lógica (usar `try/catch` para those).
- **NO anidar** excesivamente ErrorBoundaries — cada nivel agrega overhead.
- **SIEMPRE** ofrecer una acción de recuperación (botón "Reintentar", navegación).
- En dev (`__DEV__`), mostrar detalles del error para debugging.
- No captura errores en event handlers, código asíncrono ni SSR.

## Integración con el agente
El agente @frontend-agent debe cargar este skill automáticamente cuando:
- La tarea involucre palabras como: "UX", "navegación", "feedback", "loading", "error", "accesibilidad", "validación", "experiencia".
- Se implementen flujos de usuario (login, registro, Haupt navigation).
- Se pidan estados de carga o manejo de errores.
- Se audite o mejore la accesibilidad de componentes.
- Se trabaje con formularios o interacciones de usuario.