# Ejemplos de uso del MCP de React Native para el agente frontend

Estos ejemplos permiten al **agente frontend** ejecutar acciones avanzadas sobre el código React Native usando el MCP instalado, a través del flujo universal basado en `scripts/mcp-remediate.sh`.

---

## 1. Remediación experta de LoginScreen

```sh
opencode bash scripts/mcp-login-remediate.sh
```

---

## 2. Remediación de otro componente

```sh
COMPONENT_NAME="RegisterScreen" ./scripts/mcp-login-remediate.sh
# O edita el nombre en el script antes de ejecutar
```

---

## 3. Refactorización avanzada de componente

```sh
opencode bash scripts/mcp-remediate.sh refactor_component \
  --target_component=LoginScreen \
  --refactor_type=comprehensive \
  --include_tests=true
```

---

## 4. Auditoría de seguridad y rendimiento global

```sh
opencode bash scripts/mcp-remediate.sh analyze_codebase_comprehensive \
  --analysis_types=security,performance
```

---

## 5. Generar pruebas automáticas para LoginScreen

```sh
opencode bash scripts/mcp-remediate.sh generate_component_test \
  --component_name=LoginScreen \
  --test_type=comprehensive
```

---

## 6. Actualización y auditoría de dependencias

```sh
opencode bash scripts/mcp-remediate.sh upgrade_packages --update_level=minor
opencode bash scripts/mcp-remediate.sh audit_packages --auto_fix=true
```

---

## 7. Flujo genérico de acción MCP

```sh
opencode bash scripts/mcp-remediate.sh <comando_MCP> [opciones]
```

Por ejemplo, para analizar accesibilidad:
```sh
opencode bash scripts/mcp-remediate.sh analyze_codebase_accessibility
```

---

**El agente frontend debe usar estos flujos según la necesidad del análisis/respuesta al usuario, sin requerir instrucciones personalizadas caso por caso.**
