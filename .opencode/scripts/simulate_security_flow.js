const mockSecurityAgentResponse = () => {
  return {
    summary: 'Revisión de seguridad para LoginScreen y authStore: persistencia insegura detectada.',
    findings: [
      {
        severity: 'high',
        location: 'src/state/authStore.ts',
        description: 'Uso de AsyncStorage sin cifrado para almacenar token de acceso.',
        impact: 'Token expuesto si el dispositivo es comprometido o por backups; riesgo de toma de sesión.',
        recommendation: 'Migrar a almacenamiento seguro (Keychain/EncryptedSharedPreferences). Evitar persistir refresh tokens.'
      },
      {
        severity: 'medium',
        location: 'src/presentation/screens/LoginScreen.tsx',
        description: 'Validación mínima del input (email/password) sin límites de intentos ni sanitización.',
        impact: 'Riesgo de inyección de datos y fuerza bruta.',
        recommendation: 'Agregar validación robusta en cliente y límites de intentos en servidor; sanitizar inputs.'
      }
    ],
    overall: 'adjust',
    confidence: 'alta',
    notes: 'Si quieres recomendaciones de código exactas, proporciona el fragmento de authStore.'
  }
}

const buildPrompt = ({ objective, scope, flow, sensitive, mechanisms, risks, deliverable }) => {
  const lines = [
    `Objetivo: ${objective}`,
    `Ámbito: ${scope}`,
    `Flujo: ${flow}`,
    `Datos sensibles: ${sensitive}`,
    `Mecanismos: ${mechanisms}`,
    `Riesgos a validar: ${risks}`,
    `Entregable esperado: ${deliverable}`
  ]
  // ensure max 12 lines
  return lines.slice(0, 12).join('\n')
}

const generatePRComment = (response) => {
  const header = `## Revisión de seguridad automatizada — overall: ${response.overall} (confianza: ${response.confidence})\n\n`
  const actions = response.findings.map((f, i) => `**${i + 1}.** [${f.severity}] ${f.recommendation} (archivo: ${f.location})`).join('\n')
  const body = `**Resumen:** ${response.summary}\n\n**Acciones requeridas:**\n${actions}\n\n**Notas:** ${response.notes}`
  return header + body
}

module.exports = { buildPrompt, mockSecurityAgentResponse, generatePRComment }
