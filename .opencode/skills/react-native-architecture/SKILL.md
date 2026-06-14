---
name: react-native-architecture
description: Handles layered architecture, separation of concerns, and best practices for React Native projects with Vite web support.
license: MIT
compatibility: opencode
---
# Arquitectura React Native y Vite

## Propósito
Guiar al agente en la correcta implementación y auditoría de la arquitectura de capas (presentation/domain/data/infrastructure) del proyecto, asegurando separación de responsabilidades, escalabilidad y adherence a patrones establecidos.

## Cuándo usarlo
- Al crear, refactorizar o auditar componentes, screens o lógica de negocio.
- Cuando se introduce una nueva feature que requiere evaluar impacto arquitectónico.
- Al revisar si una implementación respeta la estructura de capas definida en `AGENTS.md`.
- Cuando se necesitan evaluar decisiones de diseño entre capas.

## Cómo usarlo
1. Consultar `AGENTS.md` para la estructura de capas autorizada.
2. Identificar si el cambio pertenece a `src/presentation/`, `src/domain/`, `src/data/` o `src/infrastructure/`.
3. Verificar que no haya acoplamiento cruzado entre capas (ej: lógica de negocio en componentes de UI).
4. Si hay ambigüedad, proponer la ubicación correcta con justificación.
5. Para cambios multi-capa, orquestar el trabajo y asegurar contracts consistentes.

## Ejemplos

### Caso 1: Nuevo componente de UI
```tsx
// ✓ Correcto: UI en presentation, lógica en domain
// src/presentation/components/MyComponent.tsx
// src/domain/usecases/MyUseCase.ts

// ✗ Incorrecto: lógica de negocio en componente
// component.setState({ data: fetchFromApi() }) // NO
```

### Caso 2: Nueva integración de datos
```ts
// ✓ Correcto: Repository pattern en data, interfaz en domain
// src/domain/repositories/ISettingsRepository.ts
// src/data/repositories/SettingsRepository.ts

// ✗ Incorrecto: acceso directo a API desde presentation
```

### Caso 3: Auditoría de arquitectura
```proceso
1. Identificar archivos afectados por el cambio.
2. Clasificar cada archivo en la capa correspondiente.
3. Verificar que las dependencias van en dirección correcta: presentation → domain ← data.
4. Reportar cualquier violación de la arquitectura.
```

## Integración con el agente
El agente @frontend-agent debe cargar este skill automáticamente cuando:
- La tarea incluya palabras como: "arquitectura", "refactorizar", "nueva feature", "capa", "separación", "estructura".
- Se pida crear componentes, screens, hooks, services o repositories.
- Exista ambigüedad sobre dónde colocar código nuevo.