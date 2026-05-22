# Plan de implementación

## Control del plan
- Estado: En ejecución
- Fecha: 2026-05-07
- Versión: 1.0.0
- Owner: plan-builder

## Contexto
- Proyecto: BeanAuditorApp
- Módulo/componente: Módulo de Auditoría (`AuditScreen`, `tagsMock`, `tagService`)
- Objetivo: Ajustar colores de tags, reemplazar filtro de ID por combobox de colores, implementar date pickers con truncado de horas, y regenerar mock con 150-200 items usando los colores y posiciones correctas.
- Resumen del contexto: La app es React Native 0.85.2 con soporte web vía Vite. El módulo de auditoría tiene una pantalla `AuditScreen.tsx` con filtros de texto, fechas como TextInput y botones de estado. El mock actual tiene 10 items con colores arbitrarios. No existe date picker instalado; se usará un componente propio compatible con RN + web. El campo `id` del tag pasa de `number` a `string` (hex del color).

## Alcance
- Dentro del alcance: `tagsMock.ts`, `tagService.ts`, `AuditScreen.tsx`, constantes de colores, componentes `ColorCombobox` y `DatePickerInput`
- Fuera del alcance: Backend real, autenticación, navegación, otras pantallas
- Restricciones: Sin librerías externas de date picker (no instaladas); usar solución nativa RN compatible con web. El `id` del tag es el hex del color.

## Criterios de éxito
- Los tags solo usan los 10 colores definidos: Naranja `#ff8000`, Negra `#000000`, Café `#3F2212`, Amarilla `#FFFF00`, Azul `#0000FF`, Plata `#BEBEBE`, Morada `#EE82EE`, Blanca `#FFFFFF`, Verde `#77a345`, Roja `#FF0000`
- El filtro de ID es reemplazado por un combobox de colores con swatch visual
- Las fechas usan date picker con truncado correcto (00:00:00 inicio, 23:59:59 fin)
- El mock tiene 175 items con posiciones ≤ 3 metros del centro de la finca

## Definición de listo
- Código revisado y sin errores TypeScript
- Mock actualizado con datos correctos y estructura nueva

## Definición de hecho
- `npm run lint` sin errores
- `npm test` sin fallos
- AuditScreen renderiza sin errores en web y nativo
- Filtro por color funciona correctamente
- Date picker selecciona fecha y aplica truncado

## Supuestos
- No se instalan dependencias externas para date picker; se implementa con Modal + componente propio
- El campo `id` de Tag cambia de `number` a `string` (hex del color)
- Las posiciones se generan con radio ≤ 0.000027 grados (~3 metros)
- El generador pseudo-aleatorio LCG con semilla fija garantiza datos deterministas

## Dependencias
- Bloqueos previos: Ninguno
- Dependencias internas/externas: `tagService.ts` consume `tagsMock.ts`; `AuditScreen` consume `tagService`; ambos componentes nuevos consumen `tagColors.ts`
- Riesgo de cambio: Cambio de tipo de `id` de `number` a `string` requiere actualizar referencias en `AuditScreen` y tests

## Handoff
- Entrada requerida: Código actual de `tagsMock.ts`, `tagService.ts`, `AuditScreen.tsx`
- Salida esperada: Archivos actualizados + nuevos componentes `ColorCombobox` y `DatePickerInput` + constantes `tagColors.ts`
- Agente responsable: frontend-agent

## Orden de análisis
1. Base de datos
2. Backend
3. Frontend
4. CI/CD

## Base de datos
- Motor: N/A (mock en memoria, sin base de datos)
- Impacto: Solo afecta el archivo `tagsMock.ts`
- Cambios requeridos: Regenerar con 175 items, colores de la paleta oficial, `id` = hex del color, posiciones con radio ≤ 0.000027° (~3m), timestamps distribuidos en los últimos 30 días
- Script/migración:
```sql
-- N/A: No hay base de datos. El mock es el único origen de datos.
```
- Validación previa: N/A
- Rollback: `git checkout src/data/mocks/tagsMock.ts`

## Backend
- Tecnologías/arquitectura: `tagService.ts` — servicio en memoria, sin servidor real
- Áreas afectadas: `tagService.ts` — filtro `q` (búsqueda por `unique_id`) reemplazado por filtro `color` (hex); tipo `Tag.id` cambia a `string`
- Cambios requeridos:
  - Eliminar campo `q` de `TagFilter`
  - Agregar campo `color?: string` a `TagFilter`
  - Implementar filtrado por color (comparación case-insensitive)
  - Exportar tipo `Tag` desde `tagService.ts`
- Tareas atómicas:
  1. Actualizar tipo `Tag.id` de `number` a `string` en `tagsMock.ts`
  2. Agregar campo `color` a `TagFilter` en `tagService.ts`
  3. Implementar filtrado por color en `fetchTags`
  4. Eliminar filtrado por `q` (ya no aplica)
- Criterios de aceptación: `fetchTags({ color: '#FF0000' })` retorna solo tags rojos; `fetchTags()` retorna los 175 items

## Integración backend/frontend
- Puntos de integración: `AuditScreen` llama `fetchTags` con filtros `{ color, state, from, to }`
- Contratos/APIs afectados: `TagFilter` agrega `color?: string` y elimina `q?: string`; `Tag.id` cambia de `number` a `string`
- Compatibilidad hacia atrás: `selectedId` en AuditScreen cambia de `number | null` a `string | null`; `keyExtractor` ya usa `String(i.id)` por lo que el impacto es mínimo

## Frontend
- Tecnologías/arquitectura: React Native 0.85.2, StyleSheet, FlatList, Pressable, Modal, Platform.OS
- Áreas afectadas: `AuditScreen.tsx` — sección de filtros completa; tipos de estado interno
- Cambios requeridos:
  1. Crear `src/domain/constants/tagColors.ts` con los 10 colores y sus nombres
  2. Crear `src/presentation/components/ColorCombobox.tsx` — reemplaza TextInput de búsqueda
  3. Crear `src/presentation/components/DatePickerInput.tsx` — reemplaza TextInput de fechas
  4. Actualizar `AuditScreen.tsx`: tipos, imports, filtros, llamada a `fetchTags`
- Tareas atómicas:
  1. **T1** — Crear `src/domain/constants/tagColors.ts`
  2. **T2** — Regenerar `src/data/mocks/tagsMock.ts`
  3. **T3** — Actualizar `src/data/tagService.ts`
  4. **T4** — Crear `src/presentation/components/ColorCombobox.tsx`
  5. **T5** — Crear `src/presentation/components/DatePickerInput.tsx`
  6. **T6** — Actualizar `src/presentation/screens/AuditScreen.tsx`
  7. **T7** — Revisar y actualizar tests en `__tests__/`
- Criterios de aceptación: UI renderiza sin errores, combobox muestra swatch de color, date picker abre modal/selector, filtros aplican correctamente

## CI/CD
- Flujos/reglas: `npm run lint` (ESLint) + `npm test` (Jest, config: `jest.config.js`)
- Impacto: Cambio de tipo `id` de `number` a `string` puede romper tests existentes que comparen `id` con número
- Cambios requeridos: Actualizar tests en `__tests__/` que referencien `id` como número o usen `unique_id` para búsqueda
- Tareas atómicas:
  1. Revisar `__tests__/` en busca de referencias a `id` numérico o filtro `q`
  2. Actualizar mocks de test y aserciones afectadas

## Pruebas
- Estrategia: Unit tests para mock y service; snapshot/render tests para componentes nuevos
- Casos críticos:
  - `fetchTags({ color: '#FF0000' })` retorna solo tags rojos
  - `fetchTags({ from: '2026-05-01', to: '2026-05-07' })` filtra por rango de fechas
  - `ColorCombobox` renderiza los 10 colores y llama `onChange` al seleccionar
  - `DatePickerInput` trunca fecha inicio a 00:00:00 y fecha fin a 23:59:59
- Validación manual: Verificar en web (`npm run web`) que date picker y combobox funcionan visualmente
- Automatización: `npm test`

## Despliegue y rollback
- Plan de despliegue: Cambios solo en capa de datos y presentación; sin deploy especial
- Ventana/orden de release: Inmediato tras pasar lint y tests
- Rollback: `git checkout` de los archivos modificados
- Señales de verificación post-deploy: `npm run lint` sin errores, `npm test` pasa, app carga en web sin errores de consola

## Arquitectura / diagramas

```
src/domain/constants/tagColors.ts   ← NUEVO
    │  (TAG_COLORS: 10 colores con nombre y hex)
    │
    ├──► src/data/mocks/tagsMock.ts  ← ACTUALIZADO
    │         (175 items, id=hex, posición ≤3m, LCG seed=42)
    │                   │
    │         src/data/tagService.ts  ← ACTUALIZADO
    │         (TagFilter: color?, state?, from?, to?)
    │                   │
    └──► src/presentation/screens/AuditScreen.tsx  ← ACTUALIZADO
              │
              ├── ColorCombobox.tsx   ← NUEVO
              │   (Modal nativo / <select> en web, swatch visual)
              │
              ├── DatePickerInput.tsx  ← NUEVO
              │   (Modal nativo / input[type=date] en web, truncado horas)
              │
              ├── MapCanvas (sin cambios)
              └── FlatList (keyExtractor: string id)
```

**Flujo de filtrado:**
```
Usuario selecciona color en ColorCombobox
    → setColorFilter(hex)
    → debounce 350ms
    → fetchTags({ color: hex, state, from, to })
    → setItems(resultado)
    → FlatList + MapCanvas se actualizan
```

**Truncado de fechas:**
```
DatePickerInput (inicio) → fecha seleccionada → setHours(0,0,0,0)   → ISO string
DatePickerInput (fin)    → fecha seleccionada → setHours(23,59,59,0) → ISO string
```

## Plan de ejecución

| # | Tarea | Archivo | Estado |
|---|-------|---------|--------|
| T1 | Crear constantes de colores | `src/domain/constants/tagColors.ts` | ✅ Completado |
| T2 | Regenerar mock (175 items) | `src/data/mocks/tagsMock.ts` | ✅ Completado |
| T3 | Actualizar tagService | `src/data/tagService.ts` | ✅ Completado |
| T4 | Crear ColorCombobox | `src/presentation/components/ColorCombobox.tsx` | ✅ Completado |
| T5 | Crear DatePickerInput | `src/presentation/components/DatePickerInput.tsx` | ⏳ Pendiente |
| T6 | Actualizar AuditScreen | `src/presentation/screens/AuditScreen.tsx` | ⏳ Pendiente |
| T7 | Actualizar tests | `__tests__/` | ⏳ Pendiente |

## Secuencia de trabajo

```
[T1: tagColors.ts] ──► [T2: tagsMock.ts] ──► [T3: tagService.ts]
                                                        │
              [T4: ColorCombobox.tsx] ──────────────────┤
              [T5: DatePickerInput.tsx] ────────────────┤
                                                        ▼
                                          [T6: AuditScreen.tsx]
                                                        │
                                                        ▼
                                               [T7: Tests]
```

## Priorización
- Prioridad general: Alta
- Urgencia: Inmediata
- Estimación: 2-3 horas total

## Responsables / subagentes
- **frontend-agent**: T4, T5, T6 (componentes y pantalla)
- **general**: T1, T2, T3 (datos y dominio)
- **general**: T7 (tests)

## Riesgos y bloqueos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Cambio de tipo `id` (number→string) rompe comparaciones | Medio | Actualizar `selectedId` y `keyExtractor` en AuditScreen y tests |
| DatePicker nativo no disponible en web | Alto | Usar `Platform.OS === 'web'` con `<input type="date">` |
| ColorCombobox en web requiere elemento HTML nativo | Medio | Usar `Platform.OS === 'web'` con `<select>` nativo |
| Color `#FFFFFF` (Blanca) invisible sobre fondo blanco | Bajo | Agregar `borderWidth: 1` al swatch cuando hex === `#FFFFFF` |
| Color `#000000` (Negra) invisible sobre fondo oscuro | Bajo | Mostrar nombre del color junto al swatch siempre |

## Validaciones

- [ ] `tagsMock.ts` exporta exactamente 175 items
- [ ] Todos los items del mock usan solo los 10 colores definidos
- [ ] Ningún item del mock tiene posición a más de 3m del centro (radio > 0.000027°)
- [ ] `fetchTags({ color: '#FF0000' })` retorna solo tags con `color === '#FF0000'`
- [ ] `fetchTags({ from: 'X', to: 'Y' })` filtra correctamente por rango
- [ ] `ColorCombobox` muestra swatch + nombre + hex para cada color
- [ ] `DatePickerInput` (inicio) produce timestamp con hora 00:00:00
- [ ] `DatePickerInput` (fin) produce timestamp con hora 23:59:59
- [ ] `npm run lint` sin errores
- [ ] `npm test` sin fallos

## Estado por bloque
- Base de datos: ✅ Completado (mock regenerado)
- Backend: ✅ Completado (tagService actualizado)
- Frontend: 🔄 En progreso (T4 completado, T5 y T6 pendientes)
- CI/CD: ⏳ Pendiente (tests por actualizar)

## Observabilidad
- Métricas/señales: N/A (mock local, sin telemetría)
- Logs/eventos a revisar: Console warnings en RN sobre tipos incompatibles
- Alertas esperadas: Ninguna en producción

## Preguntas pendientes
- Ninguna: el contexto es suficiente para completar la implementación.

## Checklist de ejecución
- [x] Contexto validado
- [x] Dependencias revisadas
- [x] Scripts/listos para aplicar
- [ ] Pruebas definidas y actualizadas
- [ ] Despliegue aprobado
- [ ] Rollback preparado

## Entregables

| Archivo | Tipo | Estado |
|---------|------|--------|
| `src/domain/constants/tagColors.ts` | Nuevo | ✅ |
| `src/data/mocks/tagsMock.ts` | Actualizado | ✅ |
| `src/data/tagService.ts` | Actualizado | ✅ |
| `src/presentation/components/ColorCombobox.tsx` | Nuevo | ✅ |
| `src/presentation/components/DatePickerInput.tsx` | Nuevo | ⏳ |
| `src/presentation/screens/AuditScreen.tsx` | Actualizado | ⏳ |
| `__tests__/` (archivos afectados) | Actualizado | ⏳ |

---

## Snippets de referencia

### tagColors.ts
```typescript
export type TagColor = { name: string; hex: string };

export const TAG_COLORS: TagColor[] = [
  { name: 'Naranja',  hex: '#ff8000' },
  { name: 'Negra',    hex: '#000000' },
  { name: 'Café',     hex: '#3F2212' },
  { name: 'Amarilla', hex: '#FFFF00' },
  { name: 'Azul',     hex: '#0000FF' },
  { name: 'Plata',    hex: '#BEBEBE' },
  { name: 'Morada',   hex: '#EE82EE' },
  { name: 'Blanca',   hex: '#FFFFFF' },
  { name: 'Verde',    hex: '#77a345' },
  { name: 'Roja',     hex: '#FF0000' },
];

export const TAG_COLOR_HEXES = TAG_COLORS.map(c => c.hex);
```

### tagsMock.ts — estructura del item
```typescript
export type Tag = {
  id: string;        // hex del color, ej: '#FF0000'
  unique_id: string; // ej: 'TAG-TIQ-001'
  color: string;     // hex color
  lat: number;       // radio ≤ 0.000027° del centro
  lon: number;
  timestamp: string; // ISO, últimos 30 días
  state?: 'open' | 'closed' | 'pending';
};
```

### tagService.ts — TagFilter actualizado
```typescript
export type TagFilter = {
  color?: string;  // hex, ej: '#FF0000'
  state?: string;
  from?: string;   // ISO date — 00:00:00 del día
  to?: string;     // ISO date — 23:59:59 del día
};
```

### DatePickerInput — lógica de truncado
```typescript
// Fecha inicio → 00:00:00
const d = new Date(selectedDate);
d.setHours(0, 0, 0, 0);
onChangeFrom(d.toISOString());

// Fecha fin → 23:59:59
const d = new Date(selectedDate);
d.setHours(23, 59, 59, 0);
onChangeTo(d.toISOString());
```

### AuditScreen — cambios de tipo
```typescript
// Antes
const [selectedId, setSelectedId] = useState<number | null>(null);
// Después
const [selectedId, setSelectedId] = useState<string | null>(null);

// Antes: filtro q
fetchTags({ q: query, state: stateFilter, from, to })
// Después: filtro color
fetchTags({ color: colorFilter, state: stateFilter, from, to })
```

_Plan generado por `plan-builder` — 2026-05-07_
