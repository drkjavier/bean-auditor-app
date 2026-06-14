---
name: nfc-integration
description: >
  Guía la integración de funcionalidades NFC en React Native: lectura, escritura, bloqueo por PIN y bloqueo definitivo.
  Trigger: Al implementar cualquier operación NFC en la app.
license: MIT
compatibility: opencode
---
# NFC Integration

## Propósito
Guiar la implementación de funcionalidades NFC en BeanAuditorApp, siguiendo el roadmap progresivo: lectura → escritura → bloqueo por PIN → bloqueo definitivo.

## Cuándo usarlo
- Al implementar lectura de NFC cards.
- Al implementar escritura de datos en NFC cards.
- Al implementar bloqueo por PIN de NFC cards.
- Al implementar bloqueo definitivo de NFC cards.
- Al gestionar permisos NFC en Android/iOS.
- Al diseñar UIs para operaciones NFC (estados de carga, errores, éxito).

## Alcance
- **Solo native** — NFC no funciona en web. Los archivos usan extensión `.native.ts` / `.native.tsx`.
- Librería recomendada: `react-native-nfc-manager` (pendiente de instalar).
- Flujos NFC: lectura, escritura, bloqueo por PIN, bloqueo definitivo.
- Permisos NFC nativos (Android Manifest, iOS Entitlements).
- Manejo de errores NFC específicos.
- Integración con UI (estados, feedback, abort de operación).
- No cubre web — requiere shim vacío si se importa desde código compartido.

## Patrón principal

### Roadmap de implementación

| Fase | Operación | Complejidad |
|------|-----------|-------------|
| 1 | Lectura de NFC card (UID, NDEF) | Baja |
| 2 | Escritura de datos en NFC card | Media |
| 3 | Bloqueo por PIN | Alta |
| 4 | Bloqueo definitivo (irreversible) | Alta |

### Estructura de un servicio NFC

```typescript
// src/data/nfc/nfcService.native.ts
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

// Inicializar al inicio de la app
export const initNfc = async (): Promise<boolean> => {
  try {
    const supported = await NfcManager.isSupported();
    if (!supported) return false;
    await NfcManager.start();
    return true;
  } catch {
    return false;
  }
};

// Lectura de NFC card
export const readNfcTag = async (): Promise<{ uid: string; tech: string } | null> => {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    if (!tag) return null;
    return { uid: tag.id, tech: tag.techTypes?.[0] || 'unknown' };
  } catch (err) {
    // Manejar errores específicos de NFC
    if (err instanceof Error && err.message.includes('cancelled')) return null;
    throw err;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
};
```

### Web shim para NFC (`src/web-shims/react-native-nfc-manager.js`)

```javascript
export default {
  isSupported: async () => false,
  start: async () => {},
  stop: async () => {},
  requestTechnology: async () => { throw new Error('NFC not available on web'); },
  getTag: async () => null,
  cancelTechnologyRequest: async () => {},
  // ... otros métodos según necesidad
};
```

### Patrón de UI para operaciones NFC

```typescript
// Estados de una operación NFC
type NfcOperationState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

// En el componente
const [nfcState, setNfcState] = useState<NfcOperationState>('idle');
const [nfcError, setNfcError] = useState<string | null>(null);

const handleScan = async () => {
  setNfcState('scanning');
  setNfcError(null);
  try {
    const tag = await readNfcTag();
    if (!tag) {
      setNfcState('idle'); // usuario canceló
      return;
    }
    setNfcState('processing');
    // Procesar tag...
    setNfcState('success');
  } catch (err) {
    setNfcState('error');
    setNfcError(err instanceof Error ? err.message : 'Error NFC desconocido');
  }
};
```

### Permisos NFC

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

**iOS**: Requiere entitlement `com.apple.developer.nfc.readersession.formats` en `Info.plist` y habilitación en Apple Developer.

### Errores NFC comunes

| Error | Causa | Acción |
|-------|-------|--------|
| `NFC not supported` | Dispositivo sin NFC | Mostrar mensaje, ofrecer alternativa |
| `NFC turned off` | NFC desactivado en Settings | Guiar al usuario a activarlo |
| `Tag lost` | Card retirada antes de completar | Reintentar, mostrar instructions |
| `cancelled` | Usuario canceló la operación | Estado idle, sin error |
| `timeout` | Card no respondió | Reintentar, verificar card |

## Restricciones
- **Solo** archivos `.native.ts` / `.native.tsx` — NFC no funciona en web.
- Requiere **web shim** en `src/web-shims/` si el módulo se importa desde código compartido.
- **Permisos explícitos** — nunca asumir que el usuario ha concedido permisos NFC.
- **No bloquear UI** durante operaciones NFC — usar estados de loading y AbortController si aplica.
- **Manejar siempre** `cancelTechnologyRequest()` en `finally` para evitar requests pendientes.
- **Fase 4 (bloqueo definitivo)** requiere confirmación explícita del usuario (doble confirmación).
- Instalar `react-native-nfc-manager` antes de implementar: `npm install react-native-nfc-manager`.
