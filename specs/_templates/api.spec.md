---
id: API-XXX
title: [Título del contrato API]
type: api
status: pending
parent: null
children: []
layer: data
priority: medium
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# API-XXX: [Título del contrato API]

## Descripción
[Descripción del conjunto de endpoints y contratos de datos.]

## Base URL
`[API_URL]/[versión]/[recurso]`

## Endpoints

### GET / [resource]
**Descripción**: [Qué retorna esta operación]

**Headers**:
| Header | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| Authorization | string | Sí | Bearer token |
| Content-Type | string | Sí | application/json |

**Query Params**:
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| page | number | 1 | Página actual |
| limit | number | 10 | Resultados por página |

**Response 200**:
```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10
  }
}
```

**Response 401**:
```json
{
  "error": "unauthorized",
  "message": "Token inválido o expirado"
}
```

---

### POST / [resource]
**Descripción**: [Qué crea esta operación]

**Headers**:
| Header | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| Authorization | string | Sí | Bearer token |
| Content-Type | string | Sí | application/json |

**Body**:
```json
{
  "field1": "string",
  "field2": 0,
  "field3": true
}
```

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "field1": "string",
    "field2": 0,
    "createdAt": "ISO-8601"
  }
}
```

**Response 400**:
```json
{
  "error": "validation_error",
  "message": "Descripción del error",
  "details": [
    {
      "field": "field1",
      "message": "Es requerido"
    }
  ]
}
```

---

### PUT / [resource]/:id
**Descripción**: [Qué actualiza esta operación]

*[Misma estructura que POST con las diferencias pertinentes]*

---

### DELETE / [resource]/:id
**Descripción**: [Qué elimina esta operación]

**Response 204**: Sin contenido

**Response 404**:
```json
{
  "error": "not_found",
  "message": "Recurso no encontrado"
}
```

## Modelos de datos

### [Resource]Model
```typescript
interface [Resource] {
  id: string;
  field1: string;
  field2: number;
  field3: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Autenticación
- **Método**: Bearer Token (JWT)
- **Expiración**: [Tiempo de expiración]
- **Refresh**: [Política de refresh token]

## Errores comunes
| Código | Error | Descripción | Solución |
|--------|-------|-------------|----------|
| 400 | validation_error | Datos inválidos | Revisar body/params |
| 401 | unauthorized | Token inválido | Refrescar token |
| 403 | forbidden | Sin permisos | Verificar roles |
| 404 | not_found | Recurso no existe | Verificar ID |
| 429 | rate_limit | Demasiadas requests | Retry after header |

## Sub-specs generadas
| ID | Nombre | Tipo | Capa | Estado |
|----|--------|------|------|--------|
| API-XXX-a | [Nombre sub-spec] | feature/api/ui-ux | presentation/domain/data/infrastructure/state | pending |

## Notas
- [Convenciones de naming]
- [Versionado]
- [Rate limits específicos]
- [Caché si aplica]

## Historial
| Fecha | Cambio | Autor |
|-------|--------|-------|
| YYYY-MM-DD | Creación inicial | [Agente/Usuario] |
