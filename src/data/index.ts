import { questionsSchema, type Question } from './schema'
import ai from './questions/ai.json'
import backend from './questions/backend.json'
import traps from './questions/traps.json'
import data from './questions/data.json'

// Validated at load time: a malformed question fails loudly instead of mid-round.
export const QUESTIONS: Question[] = questionsSchema.parse([...ai, ...backend, ...traps, ...data])
