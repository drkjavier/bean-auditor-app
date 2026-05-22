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
- Resumen del contexto: La app es React Native 0.85.2 con soporte web vía Vite. El módulo de auditoría tiene una pantalla `AuditScreen.tsx` con filtros de texto, fechas como TextInput y botones de estado. El mock actual tiene 10 items con colores arbitrarios. No existe date picker instalado; se usará un componente propio compatible con RN + web.

## Alcance
- Dentro del alcance: `tagsMock.ts`, `tagService.ts`, `AuditScreen.tsx`, constantes de colores
- Fuera del alcance: Backend real, autenticación, navegación, otras pantallas
- Restricciones: Sin librerías externas de date picker (no instaladas); usar solución nativa RN compatible con web. El `id` del tag pasa a ser el hex del color.

## Criterios de éxito
- Los tags solo usan los 10 colores definidos
- El filtro de ID es reemplazado por un combobox de colores
- Las fechas usan date picker con truncado correcto (00:00 inicio, 23:59 fin)
- El mock tiene entre 150-200 items con posiciones ≤3m del centro

## Definición de listo
- Código revisado y sin errores TypeScript
- Mock actualizado con datos correctos

## Definición de hecho
- AuditScreen renderiza sin errores
- Filtro por color funciona correctamente
- Date picker selecciona fecha y aplica truncado

## Supuestos
- No se instalan dependencias externas para date picker; se implementa con Modal + componente propio
- El campo `id` de Tag cambia de `number` a `string` (hex del color)
- Las posiciones se generan con radio ≤ 0.000027 grados (~3m)

## Dependencias
- Bloqueos previos: Ninguno
- Dependencias internas/externas: `tagService.ts` consume `tagsMock.ts`; `AuditScreen` consume `tagService`
- Riesgo de cambio: Cambio de tipo de `id` de `number` a `string` requiere actualizar referencias en `AuditScreen`

## Handoff
- Entrada requerida: Código actual de `tagsMock.ts`, `tagService.ts`, `AuditScreen.tsx`
- Salida esperada: Archivos actualizados + nuevo componente `ColorPicker` y `DatePickerInput`
- Agente responsable: frontend-agent

## Orden de análisis
1. Base de datos
2. Backend
3. Frontend
4. CI/CD

## Base de datos
- Motor: N/A (mock en memoria)
- Impacto: Solo afecta el archivo mock
- Cambios requeridos: Regenerar `tagsMock.ts` con 150-200 items, colores correctos, id=hex, posiciones ≤3m
- Script/migración:
```sql
-- N/A: No hay base de datos
```
- Validación previa: N/A
- Rollback: Restaurar archivo original

## Backend
- Tecnologías/arquitectura: `tagService.ts` — servicio en memoria, sin servidor
- Áreas afectadas: `tagService.ts` — filtro por `q` actualmente busca en `unique_id`; debe soportar filtro por color (hex)
- Cambios requeridos: Agregar filtro por `color` en `TagFilter`; el campo `id` ahora es string
- Tareas atómicas:
  1. Actualizar tipo `Tag.id` de `number` a `string` en `tagsMock.ts`
  2. Agregar campo `color` a `TagFilter` en `tagService.ts`
  3. Implementar filtrado por color en `fetchTags`
- Criterios de aceptación: `fetchTags({ color: '#FF0000' })` retorna solo tags rojos

## Integración backend/frontend
- Puntos de integración: `AuditScreen` llama `fetchTags` con filtros
- Contratos/APIs afectados: `TagFilter` agrega campo `color?: string`; `Tag.id` cambia a `string`
- Compatibilidad hacia atrás: `selectedId` en AuditScreen cambia de `number | null` a `string | null`

## Frontend
- Tecnologías/arquitectura: React Native 0.85.2, StyleSheet, FlatList, Pressable
- Áreas afectadas: `AuditScreen.tsx` — sección de filtros (input ID → combobox colores, TextInput fechas → DatePicker)
- Cambios requeridos:
  1. Crear constante `TAG_COLORS` con los 10 colores definidos
  2. Reemplazar TextInput de búsqueda por combobox de colores (Picker o componente propio)
  3. Reemplazar TextInput de fechas por componente `DatePickerInput` con truncado
  4. Actualizar `selectedId` de `number` a `string`
  5. Actualizar `keyExtractor` y referencias a `item.id`
- Tareas atómicas:
  1. Crear `src/presentation/components/ColorCombobox.tsx`
  2. Crear `src/presentation/components/DatePickerInput.tsx`
  3. Actualizar `AuditScreen.tsx` con nuevos componentes y tipos
- Criterios de aceptación: UI renderiza sin errores, filtros funcionan, date picker muestra selector visual

## CI/CD
- Flujos/reglas: `npm run lint` + `npm test`
- Impacto: Cambio de tipo `id` puede romper tests existentes
- Cambios requeridos: Actualizar tests en `__tests__/` si referencian `id` como número
- Tareas atómicas:
  1. Revisar y actualizar tests afectados por cambio de tipo de `id`

## Pruebas
- Estrategia: Unit tests para mock y service; snapshot para componentes nuevos
- Casos críticos: Filtro por color, truncado de fechas, renderizado de combobox
- Validación manual: Verificar en web (`npm run web`) que date picker y combobox funcionan
- Automatización: `npm test`

## Despliegue y rollback
- Plan de despliegue: Cambios solo en capa de datos y presentación; sin deploy especial
- Ventana/orden de release: Inmediato
- Rollback: `git checkout` de archivos modificados
- Señales de verificación post-deploy: `npm run lint` sin errores, `npm test` pasa

## Arquitectura / diagramas

```
TAG_COLORS (constante compartida)
    │
    ├──► tagsMock.ts  (150-200 items, id=hex, posición ≤3m)
    │         │
    │    tagService.ts  (TagFilter + color, id: string)
    │         │
    └──► AuditScreen.tsx
              ├── ColorCombobox.tsx  (reemplaza TextInput ID)
              ├── DatePickerInput.tsx  (reemplaza TextInput fechas)
              ├── MapCanvas (sin cambios)
              └── FlatList (keyExtractor: string id)
```

## Plan de ejecución

### Tarea 1 — Constantes de colores
Crear `src/domain/constants/tagColors.ts` con los 10 colores y sus nombres.

### Tarea 2 — Actualizar Mock
Regenerar `tagsMock.ts`: 175 items, id=hex del color asignado, posiciones con radio ≤0.000027° (~3m), timestamps distribuidos en los últimos 30 días.

### Tarea 3 — Actualizar TagService
- `Tag.id`: `string` (hex)
- `TagFilter.color`: `string | undefined`
- Filtrado por color en `fetchTags`

### Tarea 4 — Componente ColorCombobox
Componente RN con lista desplegable de los 10 colores con swatch visual. Compatible web.

### Tarea 5 — Componente DatePickerInput
Componente con botón que abre Modal con selector de fecha. Al confirmar: fecha inicio → 00:00:00, fecha fin → 23:59:59. Compatible web (input type=date en web).

### Tarea 6 — Actualizar AuditScreen
- Reemplazar TextInput ID → `ColorCombobox`
- Reemplazar TextInput fechas → `DatePickerInput`
- Actualizar tipos `selectedId: string | null`
- Pasar `color` al filtro de `fetchTags`

### Tarea 7 — Actualizar tests
Revisar `__tests__/` y corregir referencias a `id` numérico.

## Secuencia de trabajo

```
[T1: tagColors.ts] → [T2: tagsMock.ts] → [T3: tagService.ts]
                                                    ↓
[T4: ColorCombobox] → [T6: AuditScreen] ←──────────┘
[T5: DatePickerInput] ↗
                    ↓
              [T7: Tests]
```

## Priorización
- Prioridad general: Alta
- Urgencia: Inmediata
- Estimación: 2-3 horas

## Responsables / subagentes
- frontend-agent: Tareas T4, T5, T6
- general: Tareas T1, T2, T3, T7

## Riesgos y bloqueos
- Cambio de tipo `id` (number→string) puede romper comparaciones estrictas en AuditScreen y tests
- DatePicker nativo en RN requiere plataforma; en web se usa input HTML; solución: componente con Platform.select
- ColorCombobox en web puede usar `<select>` nativo vía Platform.select

## Validaciones
- `npm run lint` sin errores
- `npm test` sin fallos
- Mock tiene exactamente entre 150-200 items
- Posiciones verificadas: radio ≤ 0.000027 grados

## Estado por bloque
- Base de datos: Pendiente
- Backend: Pendiente
- Frontend: Pendiente
- CI/CD: Pendiente

## Observabilidad
- Métricas/señales: N/A (mock local)
- Logs/eventos a revisar: Console warnings en RN sobre tipos
- Alertas esperadas: Ninguna

## Preguntas pendientes
- Ninguna: contexto suficiente para ejecutar

## Checklist de ejecución
- [x] Contexto validado
- [x] Dependencias revisadas
- [ ] Scripts/listos para aplicar
- [ ] Pruebas definidas
- [ ] Despliegue aprobado
- [ ] Rollback preparado

## Entregables
- `src/domain/constants/tagColors.ts`
- `src/data/mocks/tagsMock.ts` (actualizado)
- `src/data/tagService.ts` (actualizado)
- `src/presentation/components/ColorCombobox.tsx`
- `src/presentation/components/DatePickerInput.tsx`
- `src/presentation/screens/AuditScreen.tsx` (actualizado)

_Completar con la salida generada por `plan-builder` antes de ejecutar el plan._
