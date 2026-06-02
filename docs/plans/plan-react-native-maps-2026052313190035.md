# Plan de implementación

## Control del plan
- Estado: Propuesto
- Fecha: 2026-05-23
- Versión: 1.0.0
- Owner: plan-builder

## Contexto
- Proyecto: BeanAuditorApp (React Native + Vite web)
- Módulo/componente: `src/presentation/components/MapCanvas.native.tsx` + `src/infrastructure/locationService.ts` + configuración iOS/Android
- Objetivo: Implementar y estabilizar el componente nativo con `react-native-maps` para mostrar puntos de auditoría y localización de usuario bajo consentimiento.
- Resumen del contexto: El proyecto ya incluye `react-native-maps`, `@react-native-community/geolocation` y `react-native-permissions` (optionalDependencies). Existe `MapCanvas.native.tsx` con `MapView`, `Marker`, permisos y centrado en ubicación. Android ya tiene `ACCESS_FINE_LOCATION` y iOS ya tiene `NSLocationWhenInUseUsageDescription`. CI ejecuta lint + tests en Node 18.

## Alcance
- Dentro del alcance: consolidación funcional de `react-native-maps` en nativo, flujo de permisos, visualización opcional de ubicación del usuario, pruebas unitarias de permisos y navegación básica de mapa.
- Fuera del alcance: geofencing, tracking en background, rutas, clusterización nativa avanzada, integración real RTK/NTRIP productiva.
- Restricciones: respetar arquitectura en capas (`presentation`, `infrastructure`, etc.), mantener privacidad por defecto, no romper web (`MapCanvas.web.tsx`).

## Criterios de éxito
- El mapa nativo renderiza marcadores de auditoría y permite centrado en ubicación con permisos correctos.
- La visualización de ubicación de usuario es opt-in y cubierta por pruebas (flujos granted/denied/blocked/unavailable).

## Definición de listo
- Dependencias instaladas y enlazadas correctamente para Android/iOS.
- Permisos móviles y mensajes de privacidad verificados antes de codificar cambios de UX.

## Definición de hecho
- Lint y tests pasan localmente y en CI.
- Componente nativo operando en Android/iOS con evidencia de validación manual.

## Supuestos
- Se mantendrá `@react-native-community/geolocation` (sin migración inmediata a `react-native-geolocation-service`).
- `showUserLocation` continuará en modo opt-in (desactivado por defecto).

## Dependencias
- Bloqueos previos: instalación de pods en iOS (`bundle install && bundle exec pod install`) cuando aplique.
- Dependencias internas/externas: `react-native-maps`, `react-native-permissions`, `@react-native-community/geolocation`, Google Maps SDK/config nativa si se usa provider Google en iOS.
- Riesgo de cambio: Medio (differences Android/iOS permisos y provider).

## Handoff
- Entrada requerida: definición UX final (¿mostrar ubicación por defecto u opt-in?) y criterio de privacidad.
- Salida esperada: componente estable, pruebas actualizadas y checklist operativo por plataforma.
- Agente responsable: frontend-agent (implementación), frontend-security-agent (revisión de exposición de ubicación).

## Orden de análisis
1. Base de datos
2. Backend
3. Frontend
4. CI/CD

## Base de datos
- Motor: No aplica (sin base de datos relacional/noSQL impactada por este cambio).
- Impacto: Nulo.
- Cambios requeridos: Ninguno.
- Script/migración:
```sql
-- N/A
```
- Validación previa: Confirmar que no se persisten coordenadas sensibles en storage local/remoto dentro de este alcance.
- Rollback: N/A.

## Backend
- Tecnologías/arquitectura: No hay backend dedicado en el alcance actual (app cliente + datos mock/service local).
- Áreas afectadas: Ninguna API/contrato remoto obligatorio.
- Cambios requeridos: Ninguno obligatorio; opcional documentar endpoint futuro si se persiste ubicación.
- Tareas atómicas:
  - [B1] Verificar que `src/data/tagService.ts` no introduzca dependencia de ubicación de usuario.
  - [B2] Definir contrato futuro (solo si producto requiere enviar coordenadas), fuera de este sprint.
- Criterios de aceptación: cero cambios backend para cerrar implementación de mapa nativo.

## Integración backend/frontend
- Puntos de integración: actualmente nulos para geolocalización de usuario (manejo local en `locationService`).
- Contratos/APIs afectados: Ninguno en alcance.
- Compatibilidad hacia atrás: Total, al no modificar contratos remotos.

## Frontend
- Tecnologías/arquitectura: React Native 0.85.x, `react-native-maps`, `react-native-permissions`, `@react-native-community/geolocation`; estructura por capas con presentación e infraestructura separadas.
- Áreas afectadas: `MapCanvas.tsx` (proxy), `MapCanvas.native.tsx`, `locationService.ts`, `AuditScreen.tsx` (si se habilita prop), mocks/tests (`__mocks__`, `__tests__`).
- Cambios requeridos:
  1. Normalizar API del componente nativo (`showUserLocation`, eventos de ubicación, fallback seguro).
  2. Asegurar comportamiento por defecto privado (sin pin/seguimiento automático salvo opt-in).
  3. Mantener compatibilidad con inyección de `locationService` para testabilidad.
  4. Validar provider y permisos por plataforma.
- Tareas atómicas:
  - [F1] Confirmar props públicas de `MapCanvas.native.tsx` (`items`, `selectedId`, `onSelect`, `locationService`, `showUserLocation`).
  - [F2] Implementar/validar en `MapView` props: `showsUserLocation`, `showsMyLocationButton`, `onUserLocationChange`, sin exponer coordenadas por defecto.
  - [F3] Revisar flujo de `centerOnMe` + `requestLocation` para mensajes consistentes (denied/blocked/unavailable).
  - [F4] Verificar que `locationService.ts` mantenga fachada estable (`checkPermission`, `requestPermission`, `openSettings`, `getCurrentPosition`, `onPosition`).
  - [F5] Actualizar `AuditScreen.tsx` solo si negocio decide habilitar `showUserLocation` en UI (toggle o hardcoded true).
  - [F6] Ajustar mocks si faltan props/eventos de `react-native-maps` para test runner.
  - [F7] Ampliar tests de `MapCanvas.native.permission.test.tsx` con caso opt-in (cuando `showUserLocation=true`) y no-regresión del centrado.
  - [F8] Ejecutar validación manual en Android e iOS (incluye revocar permisos y reintentar).
- Criterios de aceptación:
  - Marcadores renderizados correctamente.
  - Botón “Mi ubicación” centra mapa cuando permiso está concedido.
  - `showUserLocation=false` no muestra pin nativo de usuario.
  - `showUserLocation=true` habilita visualización nativa y botón de localización.

## CI/CD
- Flujos/reglas: GitHub Actions `ci.yml` ejecuta `npm ci`, `npm run lint`, `npm test -- --coverage` en Node 18.
- Impacto: Bajo/medio; el proyecto declara Node >=22.11.0 y CI está en 18 (riesgo de inconsistencias futuras).
- Cambios requeridos:
  - [C1] Validar que tests de mapa nativo no dependan de entorno no-mockeado.
  - [C2] Recomendar actualización de CI a Node 22 para alineación con `engines` (fuera de alcance funcional, pero recomendado).
- Tareas atómicas:
  - Ejecutar `npm run lint` y `npm test` local.
  - Verificar cobertura de tests modificados.
  - Confirmar no snapshots frágiles por cambios de props nativas.

## Pruebas
- Estrategia: unitarias/integración ligera sobre componente nativo con mocks de geolocalización, permisos y `react-native-maps`.
- Casos críticos:
  - Permiso granted tras request → animación/centrado.
  - Permiso denied/blocked/unavailable → alerta y no geolocalización.
  - `showUserLocation` false/true → comportamiento opt-in esperado.
  - `onUserLocationChange` no rompe render aunque el evento venga parcial.
- Validación manual:
  - Android: instalar app, conceder/denegar permisos, validar botón nativo de ubicación.
  - iOS: idem, verificar texto de permiso en Info.plist y comportamiento tras bloquear permiso.
- Automatización: mantener suite Jest existente y agregar pruebas puntuales de nuevos escenarios.

## Despliegue y rollback
- Plan de despliegue: merge a main tras validación local + CI verde.
- Ventana/orden de release: primero Android interno, luego iOS interno (TestFlight/dev build).
- Rollback: revert commit(s) de `MapCanvas.native.tsx` y tests si surge regresión crítica.
- Señales de verificación post-deploy: tasa de errores JS, reportes de permisos, confirmación de render de mapa en ambas plataformas.

## Arquitectura / diagramas
```text
AuditScreen
   │
   ▼
MapCanvas (proxy por plataforma)
   ├── web  -> MapCanvas.web.tsx (Leaflet)
   └── native -> MapCanvas.native.tsx (react-native-maps)
                      │
                      ▼
              locationService.ts
                ├─ react-native-permissions
                └─ @react-native-community/geolocation
```

Flujo “Mi ubicación”:
```text
Tap botón -> checkPermission -> (requestPermission si aplica)
  -> granted -> getCurrentPosition -> animateToRegion
  -> denied/blocked/unavailable -> Alert + (openSettings cuando bloqueado)
```

## Plan de ejecución
1. Confirmar decisión de producto sobre `showUserLocation` (opt-in vs default).
2. Consolidar implementación nativa del componente y eventos de ubicación.
3. Ajustar/fortalecer pruebas y mocks.
4. Validar manualmente Android/iOS.
5. Ejecutar lint/tests y preparar release interno.

## Secuencia de trabajo
1) Frontend base (F1-F4) → 2) UI/feature flag (F5) → 3) Testing (F6-F7) → 4) Validación manual (F8) → 5) CI/CD checks (C1-C2)

## Priorización
- Prioridad general: Alta
- Urgencia: Media
- Estimación: 1–2 días hábiles

## Responsables / subagentes
- frontend-agent: implementación del componente, props y wiring con pantalla.
- frontend-security-agent: revisión de permisos, minimización de exposición de coordenadas, textos y flujo de settings.
- general (QA técnico): ejecución de pruebas y validación cruzada Android/iOS.

## Riesgos y bloqueos
- Diferencias de comportamiento de `react-native-maps` entre iOS/Android.
- Provider Google en iOS puede requerir configuración adicional si se usa explícitamente.
- CI en Node 18 puede divergir de entorno local Node 22.
- Pruebas frágiles por temporización (`setImmediate`/`setTimeout`) en eventos de ubicación.

## Validaciones
- `npm run lint`
- `npm test`
- `npm run android` (smoke test manual)
- `npm run ios` + pods (smoke test manual)
- Confirmar que no se guarda ubicación de usuario sin consentimiento.

## Estado por bloque
- Base de datos: Sin cambios
- Backend: Sin cambios
- Frontend: Requiere implementación/ajustes finales
- CI/CD: Revisado; mejoras recomendadas

## Observabilidad
- Métricas/señales: errores de render de mapa, fallos de permiso, éxito de centrado en ubicación.
- Logs/eventos a revisar: alertas de permiso, errores silenciosos de geolocation/map animate.
- Alertas esperadas: ninguna nueva; monitorear regresiones funcionales post-release.

## Preguntas pendientes
- ¿`showUserLocation` debe activarse por defecto en `AuditScreen` o mediante toggle en UI?
- ¿Se mantendrá `PROVIDER_GOOGLE` fijo en iOS o se usará provider por defecto de plataforma?

## Checklist de ejecución
- [x] Contexto validado
- [x] Dependencias revisadas
- [x] Scripts/listos para aplicar
- [x] Pruebas definidas
- [ ] Despliegue aprobado
- [ ] Rollback preparado

## Entregables
- Plan técnico de implementación de `react-native-maps` por capas.
- Checklist de validación funcional y de permisos por plataforma.

_Completar con la salida generada por `plan-builder` antes de ejecutar el plan._
