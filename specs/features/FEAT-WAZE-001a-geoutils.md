---
id: FEAT-WAZE-001a
title: GeoUtils - Funciones de Cálculo Geoespacial
type: feature
status: pending
parent: FEAT-WAZE-001
children: []
layer: domain
priority: high
created: 2026-06-25
updated: 2026-06-25
---

# Sub-Spec: GeoUtils - Funciones de Cálculo Geoespacial

## Objetivo
Implementar las funciones puras de cálculo geoespacial (bearing y distance) usando Turf.js, optimizadas para el contexto de auditoría en campo.

## Alcance

### Archivos a crear
- `src/domain/farm/geoUtils.ts`

### Funciones a implementar

#### 1. `bearing(from, to) → number`
- Calcula la dirección en grados (0-360) desde `from` hacia `to`
- Usa Turf.js `@turf/bearing`
- Input: `from: {lat, lon}`, `to: {lat, lon}`
- Output: `number` (grados, 0=norte, 90=este, etc.)

#### 2. `distance(from, to) → number`
- Calcula la distancia en metros entre dos puntos
- Usa Turf.js `@turf/distance`
- Input: `from: {lat, lon}`, `to: {lat, lon}`
- Output: `number` (metros)

#### 3. `getNearestUncAuditTag(tags, userPosition) → Tag | null`
- Encuentra el tag más cercano que NO esté en estado 'audited'
- Filtra tags con `audit_status !== 'audited'`
- Calcula distancia para cada tag candidato
- Retorna el más cercano o null si no hay pendientes

#### 4. `formatDistance(meters) → string`
- Formatea distancia para UI
- < 1000m: "123m"
- ≥ 1000m: "1.2km"

## Criterios de Aceptación

### CA-1: Cálculo de bearing
```
Given: Punto A (14.283, -91.366) y Punto B (14.284, -91.365)
When:  bearing(A, B)
Then:  Retorna número entre -180 y 180 (o 0-360)
```

### CA-2: Cálculo de distance
```
Given: Punto A (14.283, -91.366) y Punto B (14.284, -91.365)
When:  distance(A, B)
Then:  Retorna distancia en metros (aprox 111-157m según dirección)
```

### CA-3: Selección del tag más cercano
```
Given: Lista de 10 tags (3 auditados, 7 pendientes)
When:  getNearestUncAuditTag(tags, userPosition)
Then:  Retorna el tag pendiente más cercano al usuario
And:   Nunca retorna tags con audit_status === 'audited'
```

### CA-4: Formateo de distancia
```
Given: 150 metros
When:  formatDistance(150)
Then:  "150m"

Given: 2500 metros
When:  formatDistance(2500)
Then:  "2.5km"
```

## Dependencias

### npm packages (nuevos)
```json
{
  "@turf/bearing": "^7.0.0",
  "@turf/distance": "^7.0.0",
  "@turf/helpers": "^7.0.0"
}
```

### Dependencias internas
- `Tag` type de `src/data/mocks/tagsMock.ts`

## Tests requeridos
- Unit tests para cada función
- Edge cases: mismo punto, sin tags pendientes, un solo tag

## Notas
- Turf.js es MIT ($0 costo)
- Tree-shakeable: importar solo módulos necesarios (~15KB total)
- Funciones puras: sin side effects, fácilmente testeables
