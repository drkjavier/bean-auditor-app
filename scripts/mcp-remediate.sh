#!/bin/bash
# script: scripts/mcp-remediate.sh
# Usa el MCP de React Native ya configurado en OpenCode.

set -euo pipefail

print_usage() {
  printf 'Uso: %s <comando_mcp> [opciones]\n' "$0" >&2
  printf 'Comandos soportados por el MCP actual:\n' >&2
  printf '  analyze_codebase_comprehensive\n' >&2
  printf '  analyze_codebase_performance\n' >&2
  printf '  analyze_component\n' >&2
  printf '  analyze_test_coverage\n' >&2
  printf '  analyze_testing_strategy\n' >&2
  printf '  architecture_advice\n' >&2
  printf '  check_for_updates\n' >&2
  printf '  debug_issue\n' >&2
  printf '  generate_component_test\n' >&2
  printf '  get_version_info\n' >&2
  printf '  optimize_performance\n' >&2
  printf '  refactor_component\n' >&2
  printf '  remediate_code\n' >&2
  printf 'Alias soportado: analyze_codebase_accessibility -> analyze_codebase_comprehensive\n' >&2
}

if [ "$#" -lt 1 ]; then
  print_usage
  exit 1
fi

requested_command="$1"
shift

tool_suffix="$requested_command"

case "$requested_command" in
  analyze_codebase_accessibility)
    tool_suffix="analyze_codebase_comprehensive"
    ;;
  analyze_codebase_comprehensive|analyze_codebase_performance|analyze_component|analyze_test_coverage|analyze_testing_strategy|architecture_advice|check_for_updates|debug_issue|generate_component_test|get_version_info|optimize_performance|refactor_component|remediate_code)
    ;;
  *)
    printf 'Comando MCP no soportado por la version actual: %s\n' "$requested_command" >&2
    print_usage
    exit 1
    ;;
esac

arguments_text='(sin argumentos)'
if [ "$#" -gt 0 ]; then
  arguments_text="$*"
fi

prompt=$(printf '%s\n%s\n%s\n%s\n%s' \
  "Usa exclusivamente la herramienta MCP \`react-native-mcp_${tool_suffix}\` del servidor \`react-native-mcp\`." \
  "Comando solicitado: \`${requested_command}\`." \
  "Argumentos CLI recibidos: ${arguments_text}." \
  "Si algun flag usa formato \`--clave=valor\`, conviertelo al schema equivalente de la herramienta sin inventar datos." \
  'Devuelve solo el resultado final de la herramienta.')

opencode run --agent frontend-agent -- "$prompt"
