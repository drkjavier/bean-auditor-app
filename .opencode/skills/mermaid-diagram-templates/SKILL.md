---
name: mermaid-diagram-templates
description: Proporciona plantillas estandarizadas para generar diagramas de arquitectura en Mermaid, incluyendo diagramas de capas, flujos de navegación, arquitectura de componentes y grafos de dependencia. Úsalo al documentar arquitectura, crear specs o generar documentación técnica.
license: MIT
compatibility: opencode
---

# Mermaid Diagram Templates

## Propósito
Proporcionar plantillas estandarizadas para generar diagramas de arquitectura en formato Mermaid, facilitando la documentación visual de la arquitectura del proyecto, flujos de navegación, relaciones entre componentes y dependencias entre módulos.

## Cuándo usarlo
- Al documentar la arquitectura del proyecto
- Al crear specs que requieren diagramas de arquitectura
- Al generar documentación técnica para módulos
- Al visualizar flujos de navegación
- Al representar dependencias entre capas o componentes
- Al crear diagramas para presentaciones o onboarding
- Para frontend-documentation-agent al generar documentación

## Alcance
- Diagramas de arquitectura en capas (C4 Model)
- Diagramas de flujo de navegación
- Diagramas de arquitectura de componentes
- Grafos de dependencia entre módulos
- Diagramas de secuencia para flujos críticos
- NO genera diagramas automáticamente (solo proporciona plantillas)
- NO valida sintaxis de Mermaid (responsabilidad del usuario)
- NO reemplaza herramientas de diagramación profesional

## Patrón principal

### 1. Diagrama de arquitectura en capas (C4 Model - Container)

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[React Components]
        Screens[Screens]
        Navigation[Navigation]
    end
    
    subgraph "State Layer"
        Stores[Zustand Stores]
    end
    
    subgraph "Domain Layer"
        Services[Services]
        UseCases[Use Cases]
        Models[Models]
    end
    
    subgraph "Data Layer"
        Repos[Repositories]
        DataSources[Data Sources]
    end
    
    subgraph "Infrastructure Layer"
        API[API Client]
        Storage[Local Storage]
        Config[Config]
    end
    
    UI --> Stores
    Screens --> Stores
    Navigation --> Screens
    Stores --> Services
    Services --> UseCases
    UseCases --> Models
    UseCases --> Repos
    Repos --> DataSources
    DataSources --> API
    DataSources --> Storage
    API --> Config
```

### 2. Diagrama de flujo de navegación

```mermaid
graph TD
    Start((App Start)) --> AuthCheck{Is Authenticated?}
    
    AuthCheck -->|No| Login[Login Screen]
    AuthCheck -->|Yes| Main[Main Screen]
    
    Login --> LoginSuccess{Login Success?}
    LoginSuccess -->|Yes| Main
    LoginSuccess -->|No| Login
    
    Main --> Tab1[Tab 1]
    Main --> Tab2[Tab 2]
    Main --> Tab3[Tab 3]
    Main --> Settings[Settings]
    
    Tab1 --> Detail1[Detail Screen 1]
    Tab2 --> Detail2[Detail Screen 2]
    
    Settings --> Profile[Profile]
    Settings --> Logout[Logout]
    Logout --> Login
    
    style Login fill:#ff6b6b
    style Main fill:#4ecdc4
    style Settings fill:#95e1d3
```

### 3. Diagrama de arquitectura de componentes

```mermaid
graph TB
    subgraph "Screens"
        LoginScreen[LoginScreen]
        HomeScreen[HomeScreen]
        ProfileScreen[ProfileScreen]
    end
    
    subgraph "Components"
        Button[Button]
        Input[Input]
        Card[Card]
        Header[Header]
        BottomNav[BottomNav]
    end
    
    subgraph "Hooks"
        useAuth[useAuth]
        useUser[useUser]
        useNavigation[useNavigation]
    end
    
    subgraph "Stores"
        authStore[authStore]
        userStore[userStore]
    end
    
    LoginScreen --> Button
    LoginScreen --> Input
    LoginScreen --> useAuth
    
    HomeScreen --> Header
    HomeScreen --> Card
    HomeScreen --> BottomNav
    HomeScreen --> useUser
    
    ProfileScreen --> Card
    ProfileScreen --> Button
    ProfileScreen --> useUser
    
    useAuth --> authStore
    useUser --> userStore
    useNavigation --> BottomNav
```

### 4. Grafo de dependencia entre módulos

```mermaid
graph LR
    subgraph "Presentation"
        LoginScreen[LoginScreen]
        HomeScreen[HomeScreen]
        ProfileScreen[ProfileScreen]
    end
    
    subgraph "State"
        authStore[authStore]
        userStore[userStore]
    end
    
    subgraph "Domain"
        AuthService[AuthService]
        UserService[UserService]
    end
    
    subgraph "Data"
        AuthRepo[AuthRepository]
        UserRepo[UserRepository]
    end
    
    subgraph "Infrastructure"
        apiClient[API Client]
        storage[Storage]
    end
    
    LoginScreen --> authStore
    HomeScreen --> userStore
    ProfileScreen --> userStore
    
    authStore --> AuthService
    userStore --> UserService
    
    AuthService --> AuthRepo
    UserService --> UserRepo
    
    AuthRepo --> apiClient
    UserRepo --> apiClient
    AuthRepo --> storage
```

### 5. Diagrama de secuencia para flujo crítico

```mermaid
sequenceDiagram
    participant U as User
    participant L as LoginScreen
    participant S as authStore
    participant A as AuthService
    participant R as AuthRepository
    participant API as API Client
    
    U->>L: Enter credentials
    L->>S: login(email, password)
    S->>A: login(email, password)
    A->>R: login(email, password)
    R->>API: POST /auth/login
    
    API-->>R: { token, user }
    R-->>A: { token, user }
    A-->>S: { token, user }
    
    S->>S: Save token to storage
    S->>S: Set isAuthenticated = true
    S-->>L: Login success
    
    L->>U: Navigate to Home
```

### 6. Diagrama de flujo de datos (Data Flow)

```mermaid
graph LR
    subgraph "User Actions"
        Click[Click Button]
        Type[Type Input]
    end
    
    subgraph "Components"
        Button[Button]
        Input[Input]
        Screen[Screen]
    end
    
    subgraph "Hooks"
        useForm[useForm]
        useSubmit[useSubmit]
    end
    
    subgraph "Stores"
        formStore[formStore]
        dataStore[dataStore]
    end
    
    subgraph "Services"
        submitService[submitService]
    end
    
    subgraph "API"
        endpoint[POST /data]
    end
    
    Click --> Button
    Type --> Input
    
    Button --> Screen
    Input --> Screen
    
    Screen --> useForm
    Screen --> useSubmit
    
    useForm --> formStore
    useSubmit --> dataStore
    
    dataStore --> submitService
    submitService --> endpoint
    
    endpoint -.->|Response| dataStore
    dataStore -.->|Update| Screen
```

## Plantillas personalizables

### Template básico para feature

```mermaid
graph TB
    subgraph "Feature: [Nombre]"
        Screen[Screen]
        Component[Component]
        Hook[Hook]
        Store[Store]
        Service[Service]
        Repository[Repository]
    end
    
    Screen --> Component
    Screen --> Hook
    Hook --> Store
    Store --> Service
    Service --> Repository
```

### Template para módulo con dependencias externas

```mermaid
graph TB
    subgraph "Módulo: [Nombre]"
        A[Componente A]
        B[Componente B]
        C[Servicio C]
    end
    
    subgraph "Dependencias Externas"
        D[API Externa]
        E[Base de Datos]
        F[Servicio Tercero]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
```

## Guía de uso

### Convenciones de estilo

```mermaid
%% Definir estilos personalizados
classDef primary fill:#4ecdc4,stroke:#333,stroke-width:2px
classDef secondary fill:#95e1d3,stroke:#333,stroke-width:2px
classDef critical fill:#ff6b6b,stroke:#333,stroke-width:2px
classDef warning fill:#ffd93d,stroke:#333,stroke-width:2px

%% Aplicar estilos
class Screen,Component primary
class Store,Service secondary
class API,Database critical
```

### Mejores prácticas

1. **Mantener simplicidad**: No más de 15-20 nodos por diagrama
2. **Usar subgrafos**: Agrupar elementos relacionados por capa o módulo
3. **Dirección consistente**: Usar TB (top-bottom) o LR (left-right) consistentemente
4. **Nombres descriptivos**: Usar nombres claros y concisos para nodos
5. **Colores semánticos**: Usar colores para indicar tipo o estado
6. **Leyendas**: Incluir leyenda si hay múltiples tipos de elementos

### Herramientas para renderizar

- **Mermaid Live Editor**: https://mermaid.live
- **GitHub/GitLab**: Renderizado nativo en Markdown
- **VS Code**: Extensión "Markdown Preview Mermaid Support"
- **Notion/Obsidian**: Soporte nativo o mediante plugins
- **Docusaurus**: Plugin oficial de Mermaid

## Integración con agentes

### Para frontend-documentation-agent
- Usa estas plantillas para generar diagramas en documentación
- Adapta plantillas según el módulo o feature documentado
- Incluye diagramas en READMEs de módulos
- Genera diagramas de arquitectura para specs

### Para plan-builder
- Usa diagramas de capas para visualizar arquitectura propuesta
- Genera grafos de dependencia para planificar refactorizaciones
- Crea diagramas de flujo para features complejas
- Incluye diagramas en planes de implementación

### Para frontend-agent
- Usa diagramas de componentes para visualizar relaciones
- Genera diagramas de secuencia para flujos críticos
- Crea grafos de dependencia para validar arquitectura
- Incluye diagramas en specs de features

## Restricciones
- NO genera diagramas automáticamente (solo proporciona plantillas)
- NO valida sintaxis de Mermaid (responsabilidad del usuario)
- NO reemplaza herramientas de diagramación profesional
- NO incluye datos sensibles en diagramas
- Mantener diagramas simples y legibles
- Usar plantillas como punto de partida, personalizar según necesidad
- Validar que diagramas reflejan implementación real
- Actualizar diagramas cuando cambia la arquitectura
