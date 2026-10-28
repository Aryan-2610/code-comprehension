/* Validates the question bank. Run: npm run validate */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { questionSchema, type Question } from '../src/data/schema'

const dir = fileURLToPath(new URL('../src/data/questions/', import.meta.url))
const errors: string[] = []
const warnings: string[] = []
const all: Question[] = []

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as unknown[]
  raw.forEach((item, i) => {
    const r = questionSchema.safeParse(item)
    if (!r.success) {
      for (const issue of r.error.issues) errors.push(`${file}[${i}] ${issue.path.join('.')}: ${issue.message}`)
    } else all.push(r.data)
  })
}

// uniqueness
const ids = new Set<string>()
const codes = new Map<string, string>()
for (const q of all) {
  if (ids.has(q.id)) errors.push(`duplicate id ${q.id}`)
  ids.add(q.id)
  const norm = q.code.replace(/\s+/g, ' ').trim()
  if (codes.has(norm)) errors.push(`${q.id}: duplicate snippet of ${codes.get(norm)}`)
  codes.set(norm, q.id)
  if (q.code.trim() === q.fixedCode.trim()) errors.push(`${q.id}: fixedCode identical to code`)
}

// reason balance: the correct answer must not stand out by length
for (const q of all) {
  const lens = q.reasons.map((r) => r.text.length)
  const correct = q.reasons.find((r) => r.correct)!.text.length
  const others = q.reasons.filter((r) => !r.correct).map((r) => r.text.length)
  const maxOther = Math.max(...others)
  if (correct > maxOther * 1.15) warnings.push(`${q.id}: correct reason is much longer than distractors (${correct} vs ${maxOther})`)
  if (Math.max(...lens) / Math.min(...lens) > 1.4) warnings.push(`${q.id}: reason lengths uneven (${lens.join('/')})`)
}

// syntax checks
const tmp = mkdtempSync(join(tmpdir(), 'prodbreak-'))
const JAVA_IMPORTS = [
  'java.util.*', 'java.util.concurrent.*', 'java.text.*', 'java.time.*', 'java.time.format.*', 'javax.sql.DataSource',
  'java.sql.Connection', 'java.sql.PreparedStatement', 'java.sql.ResultSet', 'java.sql.SQLException',
].map((i) => `import ${i};`).join('\n')

function check(q: Question, label: string, code: string): void {
  try {
    if (q.language === 'python') {
      const f = join(tmp, 'snippet.py')
      writeFileSync(f, code)
      execFileSync('python3', ['-I', '-m', 'py_compile', f], { stdio: 'pipe' })
    } else if (q.language === 'javascript') {
      const f = join(tmp, 'snippet.js')
      writeFileSync(f, code)
      execFileSync('node', ['--check', f], { stdio: 'pipe' })
    } else if (q.language === 'java') {
      const d = mkdtempSync(join(tmp, 'j-'))
      writeFileSync(join(d, 'Snippet.java'), `${JAVA_IMPORTS}\n${code}\n`)
      execFileSync('javac', ['-d', d, join(d, 'Snippet.java')], { stdio: 'pipe' })
    } // sql: skipped
  } catch (e) {
    const msg = e instanceof Error && 'stderr' in e ? String((e as { stderr: Buffer }).stderr) : String(e)
    errors.push(`${q.id}: syntax error in ${label}\n${msg.split('\n').slice(0, 4).join('\n')}`)
  }
}
for (const q of all) {
  check(q, 'code', q.code)
  check(q, 'fixedCode', q.fixedCode)
}
rmSync(tmp, { recursive: true, force: true })

// distribution report
const count = <K extends string>(f: (q: Question) => K) => {
  const m: Record<string, number> = {}
  for (const q of all) m[f(q)] = (m[f(q)] ?? 0) + 1
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  ')
}
console.log(`\n${all.length} questions`)
console.log('pack      ', count((q) => q.pack))
console.log('language  ', count((q) => q.language))
console.log('difficulty', count((q) => String(q.difficulty) as 'x'))
console.log('severity  ', count((q) => q.severity))
console.log('category  ', count((q) => q.category))
const overCap = Object.entries(
  all.reduce<Record<string, number>>((m, q) => ((m[q.category] = (m[q.category] ?? 0) + 1), m), {}),
).filter(([, n]) => n > 8)
for (const [c, n] of overCap) errors.push(`category ${c} has ${n} questions (max 8)`)

if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n  ` + warnings.join('\n  '))
if (errors.length) {
  console.error(`\nErrors (${errors.length}):\n  ` + errors.join('\n  '))
  process.exit(1)
}
console.log('\n✔ all questions valid')
