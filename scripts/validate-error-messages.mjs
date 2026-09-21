import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const sourceRoot = join(process.cwd(), 'src')
const violations = []
const forbiddenPattern = /ElMessage\.error\([^\n]*(?:\b(?:e|err|error)\?\.|response\?\.|\.message)/

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      visit(path)
      continue
    }
    if (!/\.(?:js|vue)$/.test(entry.name) || path.endsWith('adminErrorMessage.js')) {
      continue
    }
    readFileSync(path, 'utf8').split(/\r?\n/).forEach((line, index) => {
      if (forbiddenPattern.test(line)) {
        violations.push(`${path}:${index + 1}`)
      }
    })
  }
}

visit(sourceRoot)
if (violations.length > 0) {
  console.error('禁止直接展示异常或后端 message：')
  violations.forEach((value) => console.error(value))
  process.exit(1)
}

console.log('Admin error message validation passed.')
