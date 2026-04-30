#!/bin/bash
# Remedia el componente LoginScreen usando MCP de React Native

COMPONENT_NAME="LoginScreen"

npx @mrnitro360/react-native-mcp-guide remediate_code \
    --target_component="$COMPONENT_NAME" \
    --remediation_level=expert \
    --add_comments=true
