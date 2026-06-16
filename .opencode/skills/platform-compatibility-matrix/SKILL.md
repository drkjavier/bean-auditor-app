---
name: platform-compatibility-matrix
description: Proporciona matriz de compatibilidad para APIs y componentes multiplataforma React Native + Vite, identifica APIs que requieren shims web y guía el manejo de diferencias entre plataformas. Úsalo al crear componentes cross-platform, auditar compatibilidad o resolver problemas de diferencias nativo/web.
license: MIT
compatibility: opencode
---

# Platform Compatibility Matrix

## Propósito
Proporcionar una matriz de compatibilidad completa para APIs y componentes multiplataforma en proyectos React Native + Vite, identificar qué APIs nativas requieren shims web, documentar diferencias de comportamiento entre plataformas y guiar la implementación de componentes cross-platform consistentes.

## Cuándo usarlo
- Al crear componentes que deben funcionar en native y web
- Al auditar compatibilidad multiplataforma de componentes existentes
- Al resolver problemas de diferencias de comportamiento entre plataformas
- Al decidir si una API nativa necesita shim web
- Al configurar extensiones de archivo (.native/.web)
- En auditorías de frontend-cross-platform-agent

## Alcance
- Matriz de compatibilidad de APIs React Native en web
- Identificación de APIs que requieren shims
- Guía de uso de Platform.OS para código condicional
- Patrones de extensiones de archivo (.native/.web)
- Diferencias de comportamiento documentadas
- NO implementa shims automáticamente (solo guía)
- NO valida configuración de Vite/Metro (eso es verificador-config-multiplataforma)

## Patrón principal

### Matriz de compatibilidad de APIs

| API React Native | Web (react-native-web) | Shim necesario | Notas |
|------------------|------------------------|----------------|-------|
| `View` | ✅ Soportado | No | Comportamiento consistente |
| `Text` | ✅ Soportado | No | Comportamiento consistente |
| `Image` | ✅ Soportado | No | Requiere URLs accesibles |
| `ScrollView` | ✅ Soportado | No | Performance puede variar |
| `FlatList` | ⚠️ Parcial | No | Virtualización limitada en web |
| `TextInput` | ✅ Soportado | No | Comportamiento consistente |
| `TouchableOpacity` | ✅ Soportado | No | Usa hover en web |
| `StyleSheet` | ✅ Soportado | No | CSS en web |
| `Alert` | ❌ No soportado | **Sí** | Usar modal custom en web |
| `AsyncStorage` | ❌ No soportado | **Sí** | Usar localStorage en web |
| `Dimensions` | ⚠️ Parcial | No | Funciona pero con limitaciones |
| `Keyboard` | ❌ No soportado | **Sí** | No aplica en web |
| `Linking` | ⚠️ Parcial | No | Usa window.open en web |
| `Platform` | ✅ Soportado | No | Platform.OS = 'web' |
| `StatusBar` | ❌ No soportado | **Sí** | No aplica en web |
| `AppState` | ⚠️ Parcial | No | document.visibilityState en web |
| `NetInfo` | ❌ No soportado | **Sí** | Usar navigator.onLine |
| `Camera` | ❌ No soportado | **Sí** | Usar getUserMedia en web |
| `Geolocation` | ❌ No soportado | **Sí** | Usar navigator.geolocation |
| `Clipboard` | ❌ No soportado | **Sí** | Usar navigator.clipboard |
| `react-native-maps` | ❌ No soportado | **Sí** | Usar Leaflet/Google Maps |
| `react-native-keychain` | ❌ No soportado | **Sí** | Usar localStorage (con precaución) |
| `react-native-quick-sqlite` | ❌ No soportado | **Sí** | Usar IndexedDB/SQL.js |
| `react-native-safe-area-context` | ✅ Soportado | No | Comportamiento consistente |

### Uso de Platform.OS para código condicional

```tsx
import { Platform, StyleSheet } from 'react-native';

// ✅ CORRECTO: Código condicional mínimo
const styles = StyleSheet.create({
  container: {
    padding: 16,
    // Solo diferencias reales
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
    ...(Platform.OS !== 'web' && {
      elevation: 4,
    }),
  },
});

// ✅ CORRECTO: Importación condicional
let CustomComponent;
if (Platform.OS === 'web') {
  CustomComponent = require('./CustomComponent.web').default;
} else {
  CustomComponent = require('./CustomComponent.native').default;
}
```

### Extensiones de archivo

```
Component.tsx          → Código compartido (ambas plataformas)
Component.web.tsx      → Implementación específica para web
Component.native.tsx   → Implementación específica para native (iOS + Android)
Component.ios.tsx      → Solo iOS
Component.android.tsx  → Solo Android
```

**Orden de resolución Vite**:
```
.web.tsx → .web.ts → .web.jsx → .web.js → .tsx → .ts → .jsx → .js
```

**Orden de resolución Metro**:
```
.native.tsx → .native.ts → .ios.tsx → .ios.ts → .android.tsx → .android.ts → .tsx → .ts
```

## Shims web comunes

### AsyncStorage → localStorage
```typescript
// src/web-shims/AsyncStorage.ts
export const AsyncStorage = {
  getItem: async (key: string) => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(key);
  },
  clear: async () => {
    localStorage.clear();
  },
};
```

### Alert → Modal custom
```typescript
// src/web-shims/Alert.ts
export const Alert = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    // Implementar con modal custom o window.alert
    window.alert(`${title}\n\n${message || ''}`);
  },
};
```

### NetInfo → navigator.onLine
```typescript
// src/web-shims/NetInfo.ts
export const NetInfo = {
  addEventListener: (callback: (state: any) => void) => {
    const handler = () => callback({ isConnected: navigator.onLine });
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  },
  fetch: async () => {
    return { isConnected: navigator.onLine };
  },
};
```

## Diferencias de comportamiento documentadas

### FlatList
- **Native**: Virtualización completa, rendimiento óptimo con listas grandes
- **Web**: Virtualización limitada, considerar usar react-window para listas >100 items

### TouchableOpacity
- **Native**: Feedback táctil con opacidad
- **Web**: Soporta hover, usa cursor pointer automáticamente

### Dimensions
- **Native**: Dimensions.get('window') funciona correctamente
- **Web**: Funciona pero no detecta cambios de tamaño de ventana en tiempo real (usar resize listener)

### Keyboard
- **Native**: Keyboard.addListener para eventos de teclado
- **Web**: No aplica, usar eventos de focus/blur de TextInput

## Reporte de compatibilidad

### Formato de reporte
```markdown
# Reporte de Compatibilidad Multiplataforma

## Componente analizado: [Nombre]

### APIs utilizadas
| API | Native | Web | Shim necesario | Estado |
|-----|--------|-----|----------------|--------|
| View | ✅ | ✅ | No | ✅ OK |
| AsyncStorage | ✅ | ❌ | **Sí** | ⚠️ Falta shim |
| Alert | ✅ | ❌ | **Sí** | ⚠️ Falta shim |

### Issues encontrados
1. **Alto**: AsyncStorage usado sin shim web
   - Archivo: src/data/repositories/UserRepository.ts
   - Impacto: Falla en web
   - Recomendación: Crear shim en src/web-shims/AsyncStorage.ts

2. **Medio**: Alert usado sin shim web
   - Archivo: src/presentation/screens/LoginScreen.tsx
   - Impacto: Falla en web
   - Recomendación: Crear shim o usar modal custom

### Extensiones de archivo
- ✅ Component.tsx (compartido)
- ❌ Falta Component.web.tsx para lógica específica

### Recomendaciones
1. Crear shims para AsyncStorage y Alert
2. Considerar usar Platform.OS para diferencias menores
3. Crear Component.web.tsx si hay lógica muy diferente
```

## Integración con agentes

### Para frontend-cross-platform-agent
- Usa esta matriz para validar compatibilidad de componentes
- Identifica APIs que requieren shims
- Genera reportes de compatibilidad
- Sugiere implementación de shims faltantes

### Para frontend-agent
- Consulta antes de crear componentes cross-platform
- Valida que APIs usadas tengan shims si es necesario
- Decide cuándo usar Platform.OS vs extensiones de archivo

## Restricciones
- NO implementa shims automáticamente (solo guía)
- NO valida configuración de Vite/Metro (delega a verificador-config-multiplataforma)
- NO ignora APIs sin shim web sin justificación
- NO asume que todas las APIs funcionan en web
- Requiere revisar matriz antes de usar API nativa
- Shims deben mantener misma interfaz que API nativa
