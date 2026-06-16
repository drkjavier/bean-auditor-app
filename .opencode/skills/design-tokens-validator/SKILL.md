---
name: design-tokens-validator
description: Valida el uso correcto de tokens de diseño (colores, spacing, typography, shadows) del theme, detecta valores hardcodeados y asegura consistencia visual en componentes React Native. Úsalo al auditar UI, revisar componentes o validar cumplimiento del sistema de diseño.
license: MIT
compatibility: opencode
---

# Design Tokens Validator

## Propósito
Validar que los componentes y pantallas usen correctamente los tokens de diseño definidos en el theme del proyecto, detectar valores hardcodeados (colores, spacing, typography, shadows) y asegurar consistencia visual en toda la aplicación.

## Cuándo usarlo
- Al auditar componentes de UI antes de cerrar tareas
- Al revisar pantallas nuevas o refactorizadas
- Para validar cumplimiento del sistema de diseño
- Al detectar inconsistencias visuales entre componentes
- Para migrar componentes legacy a tokens del theme
- En auditorías de frontend-ui-agent

## Alcance
- Valida uso de tokens de color (theme.colors.*)
- Valida uso de tokens de spacing (theme.spacing.*)
- Valida uso de tokens de typography (theme.typography.*)
- Valida uso de tokens de shadows (theme.shadows.*)
- Valida uso de tokens de borders (theme.borders.*)
- Detecta valores hardcodeados (hex, rgb, px, em)
- NO valida contraste WCAG (eso es frontend-accessibility-agent)
- NO valida flujos UX (eso es frontend-ux-agent)

## Patrón principal

### Uso correcto de tokens
```tsx
// ✅ CORRECTO: Usar tokens del theme
import { theme } from '../themes/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borders.radius.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
  },
});
```

### Uso incorrecto (valores hardcodeados)
```tsx
// ❌ INCORRECTO: Valores hardcodeados
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',  // ❌ Color hardcodeado
    padding: 16,                  // ❌ Spacing hardcodeado
    borderRadius: 8,              // ❌ Border radius hardcodeado
  },
  title: {
    color: '#000000',             // ❌ Color hardcodeado
    fontSize: 24,                 // ❌ Font size hardcodeado
    fontWeight: 'bold',           // ⚠️ Aceptable pero mejor usar token
  },
});
```

## Validaciones automáticas

### 1. Colores hardcodeados
```bash
# Buscar colores hex hardcodeados
grep -r "#[0-9A-Fa-f]\{6\}" src/presentation/ --include="*.tsx" --include="*.ts"

# Buscar colores rgb/rgba hardcodeados
grep -r "rgb\|rgba" src/presentation/ --include="*.tsx" --include="*.ts"
```

**Tokens de color esperados**:
```typescript
theme.colors.primary
theme.colors.secondary
theme.colors.background
theme.colors.surface
theme.colors.text.primary
theme.colors.text.secondary
theme.colors.error
theme.colors.success
theme.colors.warning
theme.colors.info
```

### 2. Spacing hardcodeado
```bash
# Buscar números en padding/margin (posibles hardcodes)
grep -r "padding:\s*[0-9]" src/presentation/ --include="*.tsx" --include="*.ts"
grep -r "margin:\s*[0-9]" src/presentation/ --include="*.tsx" --include="*.ts"
```

**Tokens de spacing esperados**:
```typescript
theme.spacing.xs   // 4
theme.spacing.sm   // 8
theme.spacing.md   // 16
theme.spacing.lg   // 24
theme.spacing.xl   // 32
theme.spacing.xxl  // 48
```

### 3. Typography hardcodeada
```bash
# Buscar font sizes hardcodeados
grep -r "fontSize:\s*[0-9]" src/presentation/ --include="*.tsx" --include="*.ts"
```

**Tokens de typography esperados**:
```typescript
theme.typography.h1.fontSize
theme.typography.h2.fontSize
theme.typography.body.fontSize
theme.typography.caption.fontSize
theme.typography.button.fontSize
```

### 4. Border radius hardcodeado
```bash
# Buscar border radius hardcodeados
grep -r "borderRadius:\s*[0-9]" src/presentation/ --include="*.tsx" --include="*.ts"
```

**Tokens de borders esperados**:
```typescript
theme.borders.radius.sm   // 4
theme.borders.radius.md   // 8
theme.borders.radius.lg   // 12
theme.borders.radius.full // 9999
```

## Reporte de validación

### Formato de reporte
```markdown
# Reporte de Validación de Design Tokens

## Resumen
- Componentes analizados: 15
- Componentes con issues: 4
- Total de issues: 12

## Issues encontrados

### Críticos (colores hardcodeados)
1. `src/presentation/components/Button.tsx:23`
   - Issue: Color hardcodeado `#3B82F6`
   - Recomendación: Usar `theme.colors.primary`

2. `src/presentation/screens/LoginScreen.tsx:45`
   - Issue: Color hardcodeado `rgb(0, 0, 0)`
   - Recomendación: Usar `theme.colors.text.primary`

### Medios (spacing hardcodeado)
3. `src/presentation/components/Card.tsx:12`
   - Issue: Padding hardcodeado `16`
   - Recomendación: Usar `theme.spacing.md`

### Bajos (typography hardcodeada)
4. `src/presentation/components/Title.tsx:8`
   - Issue: Font size hardcodeado `24`
   - Recomendación: Usar `theme.typography.h1.fontSize`

## Cumplimiento por componente
| Componente | Colores | Spacing | Typography | Estado |
|------------|---------|---------|------------|--------|
| Button | ❌ 1 | ✅ 0 | ✅ 0 | ⚠️ |
| Card | ✅ 0 | ❌ 1 | ✅ 0 | ⚠️ |
| Title | ✅ 0 | ✅ 0 | ❌ 1 | ⚠️ |
| LoginScreen | ❌ 1 | ✅ 0 | ✅ 0 | ⚠️ |

## Recomendaciones
1. Reemplazar todos los colores hardcodeados con tokens del theme
2. Migrar spacing hardcodeado a tokens de spacing
3. Usar tokens de typography para font sizes
4. Considerar crear script de validación automática
```

## Integración con agentes

### Para frontend-ui-agent
- Usa este skill para validar uso de tokens en auditorías de UI
- Detecta valores hardcodeados en componentes
- Genera reportes de cumplimiento del sistema de diseño
- Sugiere migración a tokens del theme

### Para frontend-agent
- Valida uso de tokens antes de cerrar tareas de UI
- Asegura consistencia visual en componentes nuevos
- Documenta issues de tokens en historial de spec

## Restricciones
- NO modifica código automáticamente (solo reporta)
- NO valida contraste WCAG (delega a frontend-accessibility-agent)
- NO valida flujos UX (delega a frontend-ux-agent)
- NO ignora valores hardcodeados sin justificación
- Requiere theme.ts configurado en el proyecto
- Valores hardcodeados en tests pueden ser aceptables
