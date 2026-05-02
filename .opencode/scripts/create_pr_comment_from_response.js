const fs = require('fs')
const path = require('path')

function renderTemplate(response) {
  const tpl = fs.readFileSync(path.join(__dirname, '..', 'templates', 'security_pr_comment.md'), 'utf8')
  let out = tpl.replace('{{overall}}', response.overall)
  out = out.replace('{{confidence}}', response.confidence)
  out = out.replace('{{summary}}', response.summary)
  out = out.replace('{{notes}}', response.notes)
  const findingsText = response.findings.map(f => `- [${f.severity}] ${f.recommendation} (archivo: ${f.location})`).join('\n')
  out = out.replace('{{#findings}}\n- [{{severity}}] {{recommendation}} (archivo: {{location}})\n{{/findings}}', findingsText)
  return out
}

module.exports = { renderTemplate }
