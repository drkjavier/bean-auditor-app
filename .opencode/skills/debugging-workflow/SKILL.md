---
name: debugging-workflow
description: Flujo estructurado de diagnóstico y resolución de problemas para React Native y Vite. Proporciona checklist de diagnóstico, herramientas de debugging, patrones comunes y flujo de aislamiento. Trigger: Cuando enfrentas errores, crashes, problemas de rendimiento o comportamiento inesperado en la app.
license: MIT
compatibility: opencode
---

# Debugging Workflow

## Propósito
Flujo estructurado de diagnóstico y resolución de problemas para aplicaciones React Native + Vite. Reduce tiempo de debugging y mejora calidad de diagnósticos mediante un enfoque sistemático.

## Cuándo usarlo
- Al enfrentar errores, crashes o comportamiento inesperado
- Al diagnosticar problemas de rendimiento
- Al identificar la causa raíz de bugs
- Al decidir si usar MCP para debugging
- Al documentar problemas y soluciones

## Alcance
- **Cubre**: Flujo de diagnóstico, herramientas, patrones comunes, aislamiento de problemas
- **No cubre**: Soluciones específicas para cada bug (dependen del contexto)

## Flujo de diagnóstico estructurado

### Paso 1: Recopilar información
```
1. ¿Qué está pasando? (síntoma exacto)
2. ¿Cuándo ocurre? (pasos para reproducir)
3. ¿En qué plataforma? (iOS, Android, web, todas)
4. ¿Desde cuándo? (último cambio relacionado)
5. ¿Hay logs o mensajes de error?
6. ¿Afecta a todos los usuarios o solo algunos?
```

### Paso 2: Clasificar el problema
```
- Crash / Error → Ir a "Patrones de crashes"
- Performance → Ir a "Patrones de rendimiento"
- UI/Layout → Ir a "Patrones de UI"
- Navegación → Ir a "Patrones de navegación"
- Estado/Datos → Ir a "Patrones de estado"
- Network/API → Ir a "Patrones de red"
- Multiplataforma → Ir a "Patrones cross-platform"
```

### Paso 3: Aislar el problema
```
1. Reproduce el problema consistentemente
2. Identifica el componente/módulo afectado
3. Verifica cambios recientes (git log, git diff)
4. Comporta con versión anterior (si aplica)
5. Elimina variables una por una
6. Confirma la causa raíz antes de fix
```

### Paso 4: Diagnosticar con herramientas
```
- React DevTools → Componentes, props, estado, hooks
- Flipper (RN) → Network, layout, logs, database
- Console logs → console.log, console.warn, console.error
- React Native Debugger → Estado de Redux/Zustand, network
- Chrome DevTools (web) → Performance, network, console
- Xcode/Android Studio → Logs nativos, crashes
```

### Paso 5: Aplicar solución
```
1. Fix mínimo que resuelva la causa raíz
2. Valida que no introduce regresiones
3. Prueba en todas las plataformas afectadas
4. Documenta el problema y solución
5. Agrega test si es un bug crítico
```

## Patrones comunes

### Crashes
| Síntoma | Causa común | Solución |
|---------|-------------|----------|
| `undefined is not an object` | Acceso a propiedad de null/undefined | Optional chaining, validación de datos |
| `Invariant Violation` | Hook usado fuera de componente | Verificar que hook está dentro de functional component |
| `Maximum update depth exceeded` | setState en render sin condición | Mover a useEffect o condicional |
| `Module not found` | Import incorrecto o dependencia faltante | Verificar ruta, instalar dependencia |
| Crash nativo (iOS/Android) | API nativa no disponible | Verificar permisos, shims, Platform.OS |

### Rendimiento
| Síntoma | Causa común | Solución |
|---------|-------------|----------|
| Rerenders excesivos | Selectores amplios, props no memoizadas | useShallow, React.memo, useMemo |
| Lista lenta | ScrollView + map en lugar de FlatList | Migrar a FlatList con keyExtractor |
| Animación lenta | JS animation en lugar de native | useNativeDriver: true, Reanimated |
| Bundle grande | Imports completos en lugar de named | Tree-shaking, lazy loading, code splitting |
| Memory leak | Subscripciones sin cleanup | useEffect cleanup, AbortController |

### UI/Layout
| Síntoma | Causa común | Solución |
|---------|-------------|----------|
| Layout roto en web | API nativa sin shim web | Crear shim en src/web-shims/ |
| Flexbox no funciona | Diferencias RN vs CSS web | Verificar flexDirection default (column en RN) |
| Touch target pequeño | Botones < 44x44px | Aumentar padding o minDimensions |
| Contraste bajo | Colores hardcodeados | Usar theme.colors, verificar WCAG |

### Navegación
| Síntoma | Causa común | Solución |
|---------|-------------|----------|
| Pantalla no navega | Ruta no registrada | Verificar AppNavigator, deep links |
| Historial perdido | Navegación imperativa incorrecta | Usar navigation.reset o navigation.replace |
| Deep link no funciona | Linking configuration faltante | Configurar linking en AppNavigator |
| Guard no funciona | isLoggedIn no sincronizado | Verificar store Zustand, persistencia |

### Estado/Datos
| Síntoma | Causa común | Solución |
|---------|-------------|----------|
| Estado no actualiza | Mutación directa de estado | Crear nuevo objeto/array en setState |
| Rerender en cascada | Selector amplio en Zustand | Usar useShallow, selectores específicos |
| Datos stale | Closure stale en useEffect | Agregar dependencias al array |
| Persistencia no funciona | Middleware no configurado | Verificar persist() en create() |

### Network/API
| Síntoma | Causa común | Solución |
|---------|-------------|----------|
| Request falla | CORS (web), certificado (native) | Configurar proxy, verificar URL |
| Token expirado | Refresh token no implementado | Implementar refresh single-flight |
| Request duplicado | Falta AbortController | Cancelar requests anteriores |
| Timeout | Red lenta, servidor caído | Implementar retry logic, timeout |

### Cross-platform
| Síntoma | Causa común | Solución |
|---------|-------------|----------|
| Funciona en native, no en web | API nativa sin shim | Crear shim en src/web-shims/ |
| Funciona en web, no en native | Alias Vite no aplica en Metro | Verificar metro.config.js |
| Comportamiento divergente | Platform.OS no usado | Agregar conditional rendering |
| Extensiones incorrectas | .web.tsx no resuelve | Verificar vite.config.ts resolve.extensions |

## Uso de MCP para debugging

### Cuándo usar `react-native-mcp.debug_issue`
- Errores específicos de crash, performance, UI layout, navigation, state management, network o platform-specific
- Cuando no puedes identificar la causa raíz después de seguir el flujo
- Cuando necesitas sugerencias expertas de debugging

### Cuándo NO usar MCP
- Errores obvios (typos, imports faltantes)
- Problemas de lógica de negocio (eso es responsabilidad tuya)
- Ajustes menores de estilo o configuración

## Checklist de diagnóstico rápido

```
- [ ] ¿Puedo reproducir el problema consistentemente?
- [ ] ¿Identifiqué el componente/módulo afectado?
- [ ] ¿Revisé cambios recientes (git log)?
- [ ] ¿Verifiqué logs y mensajes de error?
- [ ] ¿Probé en todas las plataformas afectadas?
- [ ] ¿Aislé la causa raíz antes de fix?
- [ ] ¿El fix es mínimo y no introduce regresiones?
- [ ] ¿Documenté el problema y solución?
```

## Documentación de problemas

Cuando resuelvas un bug crítico, documenta:
```markdown
## Bug: [Título breve]
**Síntoma**: [Qué estaba pasando]
**Causa**: [Causa raíz]
**Solución**: [Qué se hizo para fix]
**Archivos afectados**: [Lista de archivos]
**Test agregado**: [Sí/No, cuál]
```

## Restricciones
- No aplicar fixes sin entender la causa raíz
- No ignorar errores o warnings sin justificación
- No modificar código nativo (ios/, android/) sin validar impacto
- No introducir dependencias nuevas sin evaluar bundle size
- Siempre probar en todas las plataformas afectadas
