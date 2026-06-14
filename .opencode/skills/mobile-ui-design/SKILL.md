---
name: mobile-ui-design
description: Designs and implements mobile-first UI components, layouts, spacing, and responsive patterns for React Native apps.
license: MIT
compatibility: opencode
---
# Diseño de UI Mobile-First

## Propósito
Instruir al agente en la creación de interfaces mobile-first siguiendo las convenciones del proyecto (React Native, Vite, tema compartido), asegurando consistencia visual, correcta gestión de spacing/tipografía/colores, y adherence a patrones de diseño reutilizables.

## Cuándo usarlo
- Al crear o modificar pantallas, componentes o layouts.
- Cuando se implementan formularios, listas, cards, modales o cualquier elemento visual.
- Al ajustar spacing, padding, margin entre elementos.
- Al trabajar con el sistema de tema (`src/presentation/themes/theme.ts`).
- Cuando se necesita asegurar consistencia visual entre plataformas (iOS, Android, web).

## Cómo usarlo
1. Consultar el tema global en `src/presentation/themes/theme.ts` para colores, radii, spacing.
2. Priorizar componentes reutilizables ya existentes antes de crear nuevos.
3. Usar `StyleSheet.create()` para estilos estáticos; evitar estilos inline dinámicos.
4. Aplicar spacing consistente: usar valores del tema (theme.spacing) o múltiplos de 4/8.
5. Para layouts, preferir Flexbox sobre posiciones absolutas.
6. Validar que los componentes funcionen en pantallas pequeñas (375px) y grandes (tablet).
7. Mantener componentes funcionales (functional components, hooks).

## Ejemplos

### Caso 1: Nuevo componente con tema
```tsx
// ✓ Correcto: usa tokens del tema
import { styles } from './MyComponent.styles';
import theme from '../themes/theme';

const MyComponent = () => (
  <View style={styles.container}>
    <Text style={styles.label}>Título</Text>
    <Pressable style={({ pressed }) => [
      styles.button,
      pressed && styles.buttonPressed,
    ]}>
      <Text style={styles.buttonText}>Acción</Text>
    </Pressable>
  </View>
);
```

### Caso 2: Spacing consistente
```ts
// ✓ Correcto: spacing del tema o múltiplos de 4
const styles = StyleSheet.create({
  container: { padding: theme.spacing.md },
  inputGroup: { marginBottom: theme.spacing.lg }, // 16+
  formItem: { marginBottom: 12 }, // múltiplo de 4
});

// ✗ Incorrecto: valores arbitrarios
marginBottom: 17, padding: 23
```

### Caso 3: Layout responsive
```tsx
// ✓ Correcto: max-width con centrado para web
<View style={[styles.container, { maxWidth: 420, alignSelf: 'center' }]}>

// ✓ Correcto: SafeArea para notch/dispositivos
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView edges={['top', 'bottom']}>
```

## Integración con el agente
El agente @frontend-agent debe cargar este skill automáticamente cuando:
- La tarea involucre palabras como: "UI", "componente", "pantalla", "layout", "botón", "formulario", "estilo", "diseño".
- Se pidan crear o modificar pantallas (LoginScreen, MainScreen, etc.).
- Se implementen nuevos componentes visuales.
- Se mencione spacing, tipografía, colores o consistencia visual.