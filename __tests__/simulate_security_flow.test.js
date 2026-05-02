const { buildPrompt, mockSecurityAgentResponse, generatePRComment } = require('../.opencode/scripts/simulate_security_flow')
const fs = require('fs')

test('builds destiled prompt and parses mock response', () => {
  const prompt = buildPrompt({
    objective: 'Implementar LoginScreen con persistencia de sesión',
    scope: 'src/presentation/screens/LoginScreen.tsx, src/state/authStore.ts',
    flow: 'login -> guardar token -> guard navegación a Home',
    sensitive: 'token de acceso (Bearer token)',
    mechanisms: 'Zustand, AsyncStorage, react-navigation guards',
    risks: 'persistencia insegura del token, exposición de pantallas privadas',
    deliverable: 'aprobar con recomendaciones'
  })

  expect(prompt).toMatch(/Objetivo: Implementar LoginScreen/)
  expect(prompt.split('\n').length).toBeLessThanOrEqual(12)

  const response = mockSecurityAgentResponse()
  expect(response.overall).toBe('adjust')
  expect(Array.isArray(response.findings)).toBe(true)

  const comment = generatePRComment(response)
  expect(comment).toMatch(/Revisión de seguridad ejecutada/)
  expect(comment).toMatch(/Migrar almacenamiento de token/)

  // write files to tmp to assert script behavior
  if (!fs.existsSync('.opencode/tmp')) fs.mkdirSync('.opencode/tmp', { recursive: true })
  fs.writeFileSync('.opencode/tmp/security_prompt.txt', prompt)
  fs.writeFileSync('.opencode/tmp/security_review_comment.md', comment)

  const written = fs.readFileSync('.opencode/tmp/security_review_comment.md', 'utf8')
  expect(written).toContain('Acciones requeridas')
})
