# PROGRESS.md — Reporte Maestro de Specs

> Este archivo se actualiza automáticamente por el agente每当 se modifique el estado de una spec.
> Última actualización: YYYY-MM-DD

## Resumen general

| Métrica | Valor |
|---------|-------|
| Total specs | 0 |
| Completadas | 0 |
| En progreso | 0 |
| Pendientes | 0 |
| % Avance | 0% |

## Specs por tipo

### Features
| ID | Nombre | Estado | Prioridad | Capa | Fecha |
|----|--------|--------|-----------|------|-------|
| — | Sin specs registradas | — | — | — | — |

### APIs
| ID | Nombre | Estado | Prioridad | Capa | Fecha |
|----|--------|--------|-----------|------|-------|
| — | Sin specs registradas | — | — | — | — |

### UI/UX
| ID | Nombre | Estado | Prioridad | Capa | Fecha |
|----|--------|--------|-----------|------|-------|
| — | Sin specs registradas | — | — | — | — |

## Grafo de dependencias

```
[Spec padre] ──► [Sub-spec 1]
             ──► [Sub-spec 2]
                    ──► [Sub-spec 2a]
```

*Se actualizará cuando existan specs con relaciones padre-hijo.*

## Historial de actividad

| Fecha | Spec | Acción | Detalle |
|-------|------|--------|---------|
| — | — | — | Sin actividad registrada |

## Reglas de actualización

1. **Al crear una spec**: Agregar entrada en la tabla correspondiente con estado `pending`.
2. **Al iniciar implementación**: Cambiar estado a `in_progress` y registrar fecha.
3. **Al completar**: Cambiar estado a `completed`, calcular % avance.
4. **Al modificar dependencias**: Actualizar grafo de dependencias.
5. **Cada cambio**: Agregar entrada en historial de actividad.

## Leyenda de estados

| Estado | Significado |
|--------|-------------|
| `pending` | Spec creada, esperando implementación |
| `in_progress` | Implementación en curso |
| `completed` | Implementación completa y validada |
| `blocked` | Bloqueada por dependencia o decisión |
| `cancelled` | Ya no es necesaria |
