const { buildPrompt } = require('./simulate_security_flow')
const { mockSecurityAgentResponse } = require('./simulate_security_flow')
const { renderTemplate } = require('./create_pr_comment_from_response')
const fs = require('fs')

async function runSimulation(payload) {
  // 1. build prompt
  const prompt = buildPrompt(payload)
  fs.writeFileSync('.opencode/tmp/last_security_prompt.txt', prompt)

  // 2. invoke security agent (mocked here)
  const response = mockSecurityAgentResponse()
  fs.writeFileSync('.opencode/tmp/last_security_response.json', JSON.stringify(response, null, 2))

  // 3. render PR comment
  const comment = renderTemplate(response)
  fs.writeFileSync('.opencode/tmp/security_pr_comment.md', comment)

  return { prompt, response, comment }
}

module.exports = { runSimulation }
