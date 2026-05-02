## Revisión de seguridad ejecutada — overall: adjust (confianza: alta)

**Resumen:** Revisión de seguridad para LoginScreen y authStore: persistencia insegura detectada.

**Acciones requeridas:**
**1.** [high] Migrar almacenamiento de token: usar almacenamiento seguro (Keychain/EncryptedSharedPreferences). Evitar persistir refresh tokens. (archivo: src/state/authStore.ts)
**2.** [medium] Agregar validación robusta en cliente y límites de intentos en servidor; sanitizar inputs. (archivo: src/presentation/screens/LoginScreen.tsx)

**Notas:** Si quieres recomendaciones de código exactas, proporciona el fragmento de authStore.