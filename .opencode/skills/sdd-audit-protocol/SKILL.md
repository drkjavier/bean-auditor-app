---
name: sdd-audit-protocol
description: Protocolo estandarizado de auditoría bidireccional para Spec-Driven Development. Define flujos pre/post-implementación, criterios de bloqueo, severidad y formato de respuesta para todos los agentes auditores. Trigger: Cuando un agente auditor necesita validar una spec o implementación en el flujo SDD.
license: MIT
compatibility: opencode
---

# SDD Audit Protocol

## Propósito
Protocolo común de auditoría bidireccional para el flujo Spec-Driven Development. Elimina duplicación de instrucciones en agentes auditores y asegura consistencia en criterios de bloqueo, severidad y formato de respuesta.

## Cuándo usarlo
- Al auditar diseño de spec (pre-implementación)
- Al auditar código implementado (post-implementación)
- Al determinar si una spec debe bloquearse
- Al generar reportes de auditoría estructurados

## Alcance
- **Cubre**: Flujos de auditoría, criterios de bloqueo, formato de respuesta, severidad
- **No cubre**: Criterios específicos de dominio (UI, UX, seguridad, etc.) — cada auditor los define

## Flujo de auditoría bidireccional

### 1. Auditoría pre-implementación (diseño de spec)

**Cuándo**: Después de que `frontend-agent` descompone la spec maestra en sub-specs, antes de implementar.

**Objetivo**: Detectar problemas de diseño antes de gastar esfuerzo en implementación.

**Pasos**:
1. Leer spec y evaluar decisiones de diseño según tu dominio
2. Identificar hallazgos con severidad (critical/high/medium/low)
3. Responder con formato estándar (ver abajo)
4. Si hay hallazgos `critical` o `high`:
   - Indicar que la spec debe ajustarse
   - `frontend-agent` marcará la spec como `blocked`
5. Si todo OK → proceder a implementación

### 2. Auditoría post-implementación (código)

**Cuándo**: Después de que `frontend-agent` implementa una sub-spec, antes de marcar como `completed`.

**Objetivo**: Asegurar que la implementación cumple la spec y no introduce regresiones.

**Pasos**:
1. Leer código implementado
2. Comparar con spec original
3. Validar que se aplicaron decisiones de diseño aprobadas
4. Identificar nuevos problemas introducidos
5. Responder con formato estándar
6. Si hay hallazgos `critical` o `high`:
   - Indicar que la implementación debe corregirse
   - `frontend-agent` marcará la sub-spec como `blocked`
7. Si todo OK → sub-spec marcada como `completed`

## Criterios de severidad

| Severidad | Definición | Acción |
|-----------|------------|--------|
| **critical** | Bloquea funcionalidad o introduce vulnerabilidad grave | Bloqueo inmediato de spec |
| **high** | Problema significativo que afecta calidad o seguridad | Bloqueo de spec |
| **medium** | Problema moderado que debe resolverse antes de merge | Recomendación de ajuste |
| **low** | Mejora menor o sugerencia de estilo | Opcional |

## Protocolo de bloqueo

Cuando detectas hallazgo `critical` o `high`:

1. **Responde** con formato estándar incluyendo hallazgos
2. **`frontend-agent`** recibe tu reporte y:
   - Cambia estado de sub-spec a `blocked` en frontmatter
   - Documenta hallazgo en historial de spec
   - Notifica al usuario con resumen
3. **`orquestador-tareas`** notifica al usuario con:
   - ID de sub-spec bloqueada
   - Severidad del hallazgo
   - Descripción del problema
   - Tu recomendación
   - Sub-specs dependientes afectadas
4. **Usuario decide**:
   - **Resolver**: `frontend-agent` corrige el problema
   - **Ajustar spec**: se modifica spec para evitar problema
   - **Cancelar**: se marca sub-spec como `cancelled` y se replanifica

## Formato de respuesta estándar

Responde siempre en este formato (Markdown o JSON):

```markdown
## Resumen [Tu Dominio]
Breve resumen de la auditoría (1-2 frases).

## Hallazgos

### Críticos
- **[Problema]**: Descripción, impacto, recomendación

### Altos
- **[Problema]**: Descripción, impacto, recomendación

### Medios
- **[Problema]**: Descripción, recomendación

### Bajos
- **[Problema]**: Sugerencia

## Veredicto
`approve` | `adjust` | `require_validation`

## Notas
Contexto adicional si es necesario.
```

**Ejemplo JSON**:
```json
{
  "summary": "Auditoría de diseño visual: problemas menores en consistencia de tokens.",
  "findings": [
    {
      "severity": "high",
      "location": "src/presentation/components/Button.tsx",
      "description": "Color hardcodeado #3B82F6 en lugar de token theme.colors.primary",
      "impact": "Inconsistencia visual y dificultad de mantenimiento",
      "recommendation": "Reemplazar con theme.colors.primary"
    }
  ],
  "overall": "adjust",
  "confidence": "alta",
  "notes": "Ver theme.ts para tokens disponibles"
}
```

## Cuándo auditar

**SÍ auditar**:
- Specs que involucran tu dominio de especialización
- Cambios en archivos bajo tu responsabilidad
- Features críticas con impacto en tu área
- Refactors que tocan tu dominio

**NO auditar**:
- Specs que no involucran tu dominio
- Cambios puramente de otras áreas
- Tareas menores sin impacto en tu especialidad (<3 archivos, <50 líneas)
- Documentación sin impacto en código

## Integración con auditores

Cada agente auditor debe:
1. Cargar esta skill al iniciar auditoría SDD
2. Aplicar flujo bidireccional según corresponda
3. Usar formato de respuesta estándar
4. Respetar criterios de severidad
5. Documentar hallazgos en historial de spec

## Restricciones
- No implementar código (solo auditar)
- No modificar specs directamente (solo reportar hallazgos)
- No bloquear specs por hallazgos `medium` o `low`
- No auditar fuera de tu dominio de especialización
- Mantener respuestas concisas (máx. 30 líneas)
