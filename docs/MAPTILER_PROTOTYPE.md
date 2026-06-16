# MapTiler Integration - Prototipo de Alta Precisión

## 📋 Descripción

Este prototipo valida la integración de **MapTiler** como solución de mapas de alta precisión para el proyecto BeanAuditorApp. El objetivo es demostrar que podemos distinguir puntos separados por **0.5 metros** utilizando zoom nivel 22.

## 🎯 Requisitos Cumplidos

| Requisito | Valor | Estado |
|-----------|-------|--------|
| Distancia mínima distinguible | 0.5m | ✅ Cumplido |
| Zoom máximo soportado | 22+ | ✅ Cumplido |
| Resolución en zoom 22 | ~3.7cm/píxel | ✅ Cumplido |
| Soporte React Native | MapLibre RN | ✅ Cumplido |
| Licencia | BSD-3-Clause | ✅ Open Source |

## 🚀 Instalación

### 1. Obtener API Key de MapTiler

1. Ve a [MapTiler Cloud](https://cloud.maptiler.com/account/keys/)
2. Crea una cuenta gratuita
3. Genera una API key
4. Copia la key

### 2. Configurar Variable de Entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```bash
MAPTILER_API_KEY=tu_api_key_aqui
```

### 3. Instalar Dependencias

Las dependencias ya están instaladas en `package.json`:

```bash
npm install
```

Dependencias agregadas:
- `@maptiler/sdk` - SDK para web
- `@maplibre/maplibre-react-native` - SDK para React Native

### 4. Configurar iOS (solo la primera vez)

```bash
cd ios && pod install && cd ..
```

## 🧪 Uso del Prototipo

### Acceder a la Pantalla de Prueba

1. Inicia la aplicación:
   ```bash
   # Web
   npm run web
   
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

2. Navega a la pestaña **"MapTiler Test"** en la barra de navegación inferior

3. La pantalla mostrará:
   - Un mapa interactivo con controles de zoom
   - Información de resolución en tiempo real
   - Dos puntos de prueba separados por ~0.5m
   - Controles para cambiar entre Street/Satellite/Hybrid

### Validar Precisión

1. **Zoom al máximo**: Usa el botón `+` hasta llegar a zoom 22
2. **Verifica la resolución**: Debe mostrar `~3.7cm/pixel`
3. **Observa los puntos**: Los dos puntos de prueba deben ser claramente distinguibles
4. **Cambia el tipo de mapa**: Prueba Street, Satellite e Hybrid

## 📊 Especificaciones Técnicas

### Niveles de Zoom y Resolución

| Zoom | m/píxel (ecuador) | Equivalencia | ¿Visible 0.5m? |
|------|-------------------|--------------|----------------|
| 18 | ~0.597m | 60cm | ❌ No |
| 19 | ~0.299m | 30cm | ✅ Sí |
| 20 | ~0.149m | 15cm | ✅ Sí |
| 21 | ~0.075m | 7.5cm | ✅ Excelente |
| 22 | ~0.037m | 3.7cm | ✅ Excelente |

### Estilos de Mapa Disponibles

- **Street** (`streets-v2`): Mapa de calles estándar
- **Satellite** (`satellite`): Imágenes satelitales
- **Hybrid** (`hybrid`): Satélite + etiquetas
- **Outdoor** (`outdoor-v2`): Para actividades al aire libre
- **Basic** (`basic-v2`): Minimalista
- **Bright** (`bright-v2`): Alto contraste
- **DataViz** (`dataviz`): Visualización de datos
- **Topo** (`topo-v2`): Topográfico
- **Voyager** (`voyager-v2`): Elegante minimalista

## 🏗️ Arquitectura

### Archivos Creados

```
src/
├── infrastructure/
│   └── config/
│       └── maptiler.config.ts          # Configuración centralizada
├── presentation/
│   ├── components/
│   │   └── MapTilerPrototype.tsx       # Componente prototipo
│   └── screens/
│       └── MapTilerTestScreen.tsx      # Pantalla de prueba
└── docs/
    └── MAPTILER_PROTOTYPE.md           # Esta documentación
```

### Flujo de Datos

```
MapTilerTestScreen
    ↓
MapTilerPrototype
    ↓
├── Web: @maptiler/sdk (MapTiler SDK JS)
└── Native: @maplibre/maplibre-react-native
    ↓
MapTiler Cloud API (tiles vectoriales)
```

## 💰 Costos Estimados

### Plan Gratuito (Free)
- ✅ 100K requests/mes
- ✅ 5K sessions/mes
- ✅ 100 MB de hosting
- ✅ Suficiente para desarrollo y pruebas

### Plan Flex ($25/mes)
- ✅ 500K requests/mes
- ✅ 25K sessions/mes
- ✅ 10 GB de hosting
- ✅ Uso comercial permitido

### Estimación para Producción

**Escenario**: 100 usuarios activos/día
- 5 sesiones/usuario/día
- 30 días/mes
- **Total**: 15,000 sessions/mes

**Resultado**: ✅ Plan gratuito es suficiente

## 🔒 Seguridad

### Protección de API Key

1. **Nunca commitear la API key** en el repositorio
2. Usar variables de entorno (`.env`)
3. Configurar restricciones de dominio en MapTiler Cloud:
   - Ve a [MapTiler Cloud](https://cloud.maptiler.com/account/keys/)
   - Edita tu API key
   - Agrega dominios permitidos (ej: `tudominio.com`)

### Monitoreo de Uso

```typescript
// Ejemplo de monitoreo de uso de API
const checkUsage = async () => {
  const response = await fetch(
    `https://api.maptiler.com/account/usage?key=${API_KEY}`
  );
  const usage = await response.json();
  
  if (usage.percentage > 80) {
    console.warn('⚠️ Cerca del límite de uso de API');
  }
};
```

## 🐛 Troubleshooting

### Problema: "API key not configured"

**Solución**: 
```bash
# Verificar que .env existe y tiene la key
cat .env | grep MAPTILER_API_KEY

# Reiniciar el servidor después de agregar la key
npm run web  # o npm run android/ios
```

### Problema: Tiles no cargan en zoom alto

**Solución**:
- Verificar que la API key es válida
- Comprobar conexión a internet
- Revisar consola del navegador para errores 401/403

### Problema: MapLibre no carga en iOS

**Solución**:
```bash
# Reinstalar pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Limpiar cache de Xcode
xcrun simctl erase all
```

### Problema: Performance lento en zoom alto

**Solución**:
- Reducir `maxZoom` a 20 si no necesitas 3.7cm/pixel
- Habilitar caching de tiles
- Optimizar número de markers en pantalla

## 📈 Próximos Pasos

### Fase 1: Validación (Actual)
- [x] Crear prototipo básico
- [x] Validar zoom 22
- [x] Verificar resolución 0.5m
- [ ] Pruebas con usuarios reales

### Fase 2: Migración
- [ ] Migrar `MapCanvas.web.tsx` a MapTiler
- [ ] Migrar `MapCanvas.native.tsx` a MapLibre RN
- [ ] Migrar clustering y markers
- [ ] Actualizar tests

### Fase 3: Optimización
- [ ] Implementar lazy loading
- [ ] Optimizar performance
- [ ] Configurar monitoreo de API
- [ ] Documentar APIs nuevas

## 🔗 Recursos

- [MapTiler Documentation](https://docs.maptiler.com/)
- [MapTiler SDK JS](https://docs.maptiler.com/sdk-js/)
- [MapLibre React Native](https://maplibre.org/maplibre-react-native/)
- [MapTiler Cloud Dashboard](https://cloud.maptiler.com/)
- [MapTiler Pricing](https://www.maptiler.com/cloud/pricing/)

## 📝 Notas

- Este prototipo es para **validación técnica** únicamente
- La migración completa se realizará después de validar el prototipo
- Mantener la implementación actual (Leaflet) como fallback
- Documentar cualquier problema encontrado durante las pruebas

---

**Última actualización**: 2026-06-15  
**Versión**: 1.0.0  
**Estado**: 🟢 Prototipo listo para pruebas
