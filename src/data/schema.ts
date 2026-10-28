import { z } from 'zod'

export const LANGUAGES = ['python', 'javascript', 'java', 'sql'] as const
export type Language = (typeof LANGUAGES)[number]

export const PACKS = ['ai', 'backend', 'traps', 'data'] as const
export type Pack = (typeof PACKS)[number]

export const PACK_LABEL: Record<Pack, string> = {
  ai: 'AI / LLM apps',
  backend: 'Backend services',
  traps: 'Interview traps',
  data: 'Data & SQL',
}

export const CATEGORIES = [
  'race-condition',
  'missing-timeout',
  'unbounded-growth',
  'float-money',
  'timezone',
  'pagination-off-by-one',
  'n-plus-one',
  'sql-injection',
  'missing-idempotency',
  'resource-leak',
  'swallowed-exception',
  'shared-state',
  'cache-stampede',
  'integer-overflow',
  'unvalidated-input',
  'check-then-act',
  'logging-secrets',
  'blocking-async',
  'redos',
  'toctou',
  'prompt-injection',
  'unbounded-cost',
  'untrusted-llm-output',
  'context-overflow',
  'broken-equality',
  'null-handling',
  'type-coercion',
  'async-misuse',
  'data-leak',
  'blocking-lock',
  'index-bypass',
  'logic-error',
] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<Category, string> = {
  'race-condition': 'Race condition',
  'missing-timeout': 'Missing timeout',
  'unbounded-growth': 'Unbounded growth / leak',
  'float-money': 'Float money math',
  timezone: 'Timezone / DST',
  'pagination-off-by-one': 'Pagination bugs',
  'n-plus-one': 'N+1 query',
  'sql-injection': 'SQL injection',
  'missing-idempotency': 'Missing idempotency / retries',
  'resource-leak': 'Resource leak',
  'swallowed-exception': 'Swallowed exception',
  'shared-state': 'Mutable / shared state',
  'cache-stampede': 'Cache stampede',
  'integer-overflow': 'Integer overflow',
  'unvalidated-input': 'Unvalidated input',
  'check-then-act': 'Non-atomic check-then-act',
  'logging-secrets': 'Logging secrets / PII',
  'blocking-async': 'Blocking call in async code',
  redos: 'Regex ReDoS',
  toctou: 'Time-of-check / time-of-use',
  'prompt-injection': 'Prompt injection',
  'unbounded-cost': 'Unbounded cost',
  'untrusted-llm-output': 'Trusting LLM output',
  'context-overflow': 'Context window overflow',
  'broken-equality': 'Broken equality / hashing',
  'null-handling': 'Null / undefined handling',
  'type-coercion': 'Type coercion',
  'async-misuse': 'Async misuse',
  'data-leak': 'Cross-user data leak',
  'blocking-lock': 'Long-held lock',
  'index-bypass': 'Index bypass / full scan',
  'logic-error': 'Operator precedence / logic',
}

export const BLAST = ['money', 'data-loss', 'data-integrity', 'outage', 'security', 'cost', 'privacy'] as const
export type Blast = (typeof BLAST)[number]

export const reasonSchema = z.object({
  id: z.string(),
  text: z.string().min(10),
  correct: z.boolean(),
})

export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z]+-[a-z0-9-]+-\d{3}$/),
    pack: z.enum(PACKS),
    language: z.enum(LANGUAGES),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    severity: z.enum(['SEV1', 'SEV2', 'SEV3']),
    category: z.enum(CATEGORIES),
    context: z.string().min(5),
    title: z.string().min(3),
    code: z.string(),
    bugLine: z.number().int().min(1),
    reasons: z.array(reasonSchema).length(4),
    productionImpact: z.string().min(20),
    interviewNote: z.string().optional(),
    blastRadius: z.array(z.enum(BLAST)).min(1),
    fixedCode: z.string(),
  })
  .superRefine((q, ctx) => {
    const lines = q.code.split('\n').length
    if (lines < 8 || lines > 20)
      ctx.addIssue({ code: 'custom', message: `snippet has ${lines} lines (need 8–20)` })
    if (q.bugLine > lines) ctx.addIssue({ code: 'custom', message: `bugLine ${q.bugLine} > ${lines} lines` })
    if (q.reasons.filter((r) => r.correct).length !== 1)
      ctx.addIssue({ code: 'custom', message: 'need exactly one correct reason' })
  })

export type Question = z.infer<typeof questionSchema>
export const questionsSchema = z.array(questionSchema)
