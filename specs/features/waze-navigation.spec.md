---
id: FEAT-WAZE-001
title: Navegación Tipo Waze hacia Tags Pendientes
type: feature
status: in_progress
parent: null
children:
  - FEAT-WAZE-001a
  - FEAT-WAZE-001b
  - FEAT-WAZE-001c
  - FEAT-WAZE-001d
  - FEAT-WAZE-001e
layer: domain
priority: high
created: 2026-06-25
updated: 2026-06-25
---

# Spec: Navegación Tipo Waze hacia Tags Pendientes

## Objetivo
Implementar un modo de navegación en la pantalla de auditoría que guíe al trabajador hacia el tag más cercano pendiente de audit, mostrando una flecha direccional y distancia en tiempo real, similar al comportamiento de Waze.

## Alcance
- Cálculo geoespacial: bearing (dirección) y distance (distancia) entre usuario y tags
- Flecha SVG direccional superpuesta en el mapa
- Indicador de distancia en tiempo real
- Auto-selección del tag más cercano sin auditar
- Auto-avance al siguiente tag después de auditar
- UI de control del modo navegación

## Restricciones
- **Costo**: $0 (sin APIs externas de pago)
- **Librerías**: Solo Turf.js (MIT) + SVG nativo
- **Multiplataforma**: Debe funcionar en native (MapLibre) y web (MapTiler)
- **Offline**: Cálculos locales, sin dependencia de red
- **Arquitectura**: Respetar capas domain/state/presentation

## Criterios de Aceptación

### CA-1: Detección del tag más cercano
- Dado un usuario con ubicación activa
- Cuando se activa el modo navegación
- Entonces se identifica el tag más cercano que NO esté en estado 'audited'
- Y se muestra como destino seleccionado

### CA-2: Cálculo de bearing
- Dada la posición del usuario y un tag destino
- Cuando se calcula la dirección
- Entonces se obtiene un ángulo en grados (0-360) desde el norte
- Y la flecha SVG rota para apuntar al tag

### CA-3: Cálculo de distancia
- Dada la posición del usuario y un tag destino
- Cuando se calcula la distancia
- Entonces se muestra en metros (< 1km) o kilómetros (≥ 1km)
- Y se actualiza en tiempo real conforme el usuario se mueve

### CA-4: Flecha SVG direccional
- Dado el modo navegación activo
- Cuando se renderiza el mapa
- Entonces aparece una flecha SVG overlay en el centro
- Y rota suavemente según el bearing al tag destino
- Y muestra la distancia debajo de la flecha

### CA-5: Auto-avance post-auditar
- Dado un tag auditado exitosamente
- Cuando se completa la auditoría
- Entonces se recalcula el tag más cercano pendiente
- Y se actualiza el destino de navegación
- Y se centra el mapa en el nuevo destino

### CA-6: Control del modo navegación
- Dada la pantalla de auditoría
- Cuando el usuario presiona "Modo Navegación"
- Entonces se activa el tracking de ubicación continua
- Y se muestra el panel de navegación
- Y se calcula el tag más cercano automáticamente

### CA-7: Desactivación del modo
- Dado el modo navegación activo
- Cuando el usuario presiona "Cerrar Navegación"
- Entonces se detiene el tracking de ubicación
- Y se oculta la flecha y panel de navegación
- Y se restaura la vista normal del mapa

## Datos Sensibles
- Ubicación GPS del usuario (lat/lon)
- No se envía a servidores externos
- Solo se usa localmente para cálculos

## Dependencias
- `react-native-geolocation-service` (ya instalado)
- `react-native-permissions` (ya instalado)
- `@turf/bearing` (nueva, MIT)
- `@turf/distance` (nueva, MIT)
- `@turf/helpers` (nueva, MIT)
- MapLibre (native) / MapTiler (web) - ya implementados

## Notas
- En contexto de plantación agrícola, "distancia recta" es más útil que ruta por calles (no hay calles)
- La flecha SVG se implementa como overlay nativo sobre el canvas del mapa
- Se usa Zustand para managing el estado de navegación
