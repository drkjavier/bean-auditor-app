#!/bin/bash
# Remedia el componente LoginScreen usando el MCP ya configurado en OpenCode.

set -euo pipefail

COMPONENT_NAME="${COMPONENT_NAME:-LoginScreen}"
SCRIPT_DIR="$(dirname "$0")"

bash "$SCRIPT_DIR/mcp-remediate.sh" remediate_code \
    --target_component="$COMPONENT_NAME" \
    --remediation_level=expert \
    --add_comments=true
