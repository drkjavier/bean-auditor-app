# Plan de implementación: Optimización UI Login

## Control del plan
- Estado: Pendiente
- Fecha: 2026-06-09
- Versión: 1.0
- Owner: frontend-agent

## Contexto
- Proyecto: BeanAuditorApp (React Native + Vite)
- Módulo/componente: LoginScreen
- Objetivo: Mejorar UX del login ocultando elementos innecesarios y ajustando espaciado/etiquetas
- Resumen del contexto: La pantalla de login actual muestra título, subtítulo y menú hamburguesa innecesarios. El espaciado entre campos y botón necesita optimización para mejor fluidez visual.

## Alcance
- Dentro del alcance: LoginScreen.tsx, AppLayout.tsx (opcional)
- Fuera del alcance: Navegación, autenticación, lógica de negocio, otros screens
- Restricciones: Mantener accesibilidad, no romper flujo de autenticación, consistencia visual

## Criterios de éxito
- Título "BeanAuditorApp" no visible en pantalla de login
- Menú hamburguesa no visible en pantalla de login
- Espaciado óptimo entre inputs y botón
- Botón muestra "Login" en lugar de "Entrar"
- Accesibilidad preservada (labels ARIA)

## Definición de listo
- LoginScreen.tsx identificado y revisado
- Componentes Header y AppLayout entendidos
- Estilos actuales documentados

## Definición de hecho
- Cambios implementados en LoginScreen.tsx
- Pruebas visuales en web, iOS y Android
- Accesibilidad verificada

## Supuestos
- El menú hamburguesa en Header se controla pasando onMenuPress
- El título en AppLayout se controla con prop title
- Los estilos se ajustan en StyleSheet de LoginScreen

## Dependencias
- Bloqueos previos: Ninguno
- Dependencias internas/externas: Ninguna
- Riesgo de cambio: Bajo (solo UI, sin lógica)

## Handoff
- Entrada requerida: Archivos LoginScreen.tsx, AppLayout.tsx
- Salida esperada: LoginScreen.tsx modificado con cambios UI
- Agente responsable: frontend-agent

## Base de datos
- Motor: N/A
- Impacto: Ninguno
- Cambios requeridos: Ninguno
- Script/migración: N/A
- Validación previa: N/A
- Rollback: N/A

## Backend
- Tecnologías/arquitectura: N/A
- Áreas afectadas: N/A
- Cambios requeridos: N/A
- Tareas atómicas: N/A
- Criterios de aceptación: N/A

## Integración backend/frontend
- Puntos de integración: N/A
- Contratos/APIs afectados: N/A
- Compatibilidad hacia atrás: N/A

## Frontend
- Tecnologías/arquitectura: React Native, StyleSheet
- Áreas afectadas: LoginScreen.tsx
- Cambios requeridos: Ocultar título, menú, ajustar espaciado, cambiar etiqueta botón

### Tareas atómicas

#### Tarea 1: Ocultar título del formulario
**Archivo:** `src/presentation/screens/LoginScreen.tsx`
**Cambio:** Eliminar las líneas 207-208 (título y subtítulo)
```tsx
// Eliminar:
<Text style={styles.title} accessibilityRole="header">BeanAuditorApp</Text>
<Text style={styles.subtitle}>Inicia sesión</Text>
```
**Justificación:** El título no es necesario en login, la app ya está identificada por el icono/nombre del dispositivo.

#### Tarea 2: Ocultar menú hamburguesa
**Archivo:** `src/presentation/screens/LoginScreen.tsx`
**Cambio:** No pasar prop `title` a AppLayout (línea 204)
```tsx
// Cambiar:
<AppLayout title="BeanAuditorApp">
// Por:
<AppLayout>
```
**Justificación:** Sin título ni onMenuPress, Header no renderizará el menú hamburguesa automáticamente.

#### Tarea 3: Ajustar espaciado entre inputs y botón
**Archivo:** `src/presentation/screens/LoginScreen.tsx`
**Cambios en StyleSheet:**
- `input.marginBottom`: 12 → 20
- `button.marginTop`: 8 → 24
- Agregar `marginTop: 32` al contenedor `.form`
**Estilo actual:**
```tsx
input: { marginBottom: 12 }
button: { marginTop: 8 }
form: { alignItems: 'center' }
```
**Estilo propuesto:**
```tsx
input: { marginBottom: 20 }
button: { marginTop: 24 }
form: { alignItems: 'center', marginTop: 32 }
```
**Justificación:** Mayor separación mejora legibilidad y reduce errores de toque accidental.

#### Tarea 4: Cambiar etiqueta del botón
**Archivo:** `src/presentation/screens/LoginScreen.tsx`
**Cambio:** Línea 243, cambiar texto del botón
```tsx
// Cambiar:
Entrar
// Por:
Login
```
**Justificación:** "Login" es más universal y corto, mejor para UX mobile.

#### Tarea 5: Actualizar accesibilidad del botón
**Archivo:** `src/presentation/screens/LoginScreen.tsx`
**Cambio:** Línea 242, actualizar accessibilityLabel
```tsx
// Cambiar:
accessibilityLabel={loading ? 'Ingresando...' : 'Entrar'}
// Por:
accessibilityLabel={loading ? 'Ingresando...' : 'Login'}
```
**Justificación:** Mantener consistencia entre texto visible y label de accesibilidad.

## CI/CD
- Flujos/reglas: N/A (cambios UI puros)
- Impacto: Ninguno
- Cambios requeridos: N/A
- Tareas atómicas: N/A

## Pruebas
- Estrategia: Pruebas visuales manuales en web, iOS y Android
- Casos críticos:
  - Verificar que título no aparece
  - Verificar que menú no aparece
  - Verificar espaciado correcto
  - Verificar botón dice "Login"
  - Verificar accesibilidad con lector de pantalla
- Validación manual: Abrir app → Login → Verificar UI
- Automatización: No aplica (UI visual)

## Despliegue y rollback
- Plan de despliegue: Incluir en próximo build
- Ventana/orden de release: Después de pruebas visuales
- Rollback: Revertir cambios en LoginScreen.tsx
- Señales de verificación post-deploy: Login funciona correctamente

## Arquitectura / diagramas
```
LoginScreen.tsx
├── AppLayout (sin title, sin onMenuPress)
│   └── Header (no renderiza menú ni título)
├── KeyboardAvoidingView
│   └── View.form
│       ├── Input (Usuario)
│       ├── Input (Contraseña)
│       ├── Button (Login)
│       └── ErrorBanner (opcional)
```

## Plan de ejecución
1. Tarea 1: Ocultar título (2 min)
2. Tarea 2: Ocultar menú (1 min)
3. Tarea 3: Ajustar espaciado (3 min)
4. Tarea 4: Cambiar etiqueta botón (1 min)
5. Tarea 5: Actualizar accesibilidad (1 min)

## Secuencia de trabajo
- Ejecutar tareas 1-2 en paralelo (son independientes)
- Ejecutar tareas 3-5 secuencialmente (dependen de archivos modificados)

## Priorización
- Prioridad general: Media
- Urgencia: Baja
- Estimación: 10 minutos

## Responsables / subagentes
- frontend-agent: Implementar cambios UI

## Riesgos y bloqueos
- **Riesgo bajo:** Cambios en UI pueden requerir ajustes en tests visuales
- **Bloqueos:** Ninguno identificado

## Validaciones
- Verificar en web (`npm run web`)
- Verificar en iOS (`npm run ios`)
- Verificar en Android (`npm run android`)
- Ejecutar lint (`npm run lint`)
- Verificar accesibilidad con VoiceOver/TalkBack

## Estado por bloque
- Base de datos: N/A
- Backend: N/A
- Frontend: Pendiente
- CI/CD: N/A

## Observabilidad
- Métricas/señales: Tasa de login exitoso (no debería cambiar)
- Logs/eventos a revisar: N/A
- Alertas esperadas: N/A

## Preguntas pendientes
- Ninguna

## Checklist de ejecución
- [ ] Contexto validado
- [ ] Dependencias revisadas
- [ ] Scripts/listos para aplicar
- [ ] Pruebas definidas
- [ ] Despliegue aprobado
- [ ] Rollback preparado

## Entregables
- LoginScreen.tsx modificado
- Documentación de cambios
