# PROD BREAK

Spot the line that will break in production — then say why. 5 tickets per round, 30 seconds each.

```bash
npm install
npm run dev        # play at http://localhost:5173
npm test           # scoring, timer, selection, game-flow tests
npm run validate   # schema, unique ids, syntax-check every snippet (py_compile / node --check / javac)
npm run build
```

## Question packs (`src/data/questions/*.json`)

| file | pack | focus |
| --- | --- | --- |
| `ai.json` | AI / LLM apps | prompt injection, agent loops, retries, cost, context limits, PII in logs |
| `backend.json` | Backend services | idempotency, races, N+1, timeouts, stampedes, leaks, webhooks, timezones |
| `traps.json` | Interview traps | mutable defaults, `Integer ==`, `equals` w/o `hashCode`, `forEach(async)`, `Decimal(float)` … |
| `data.json` | Data & SQL | injection, `NOT IN` + NULL, LEFT JOIN + WHERE, lost updates, locking migrations … |

Add a question: append to a pack file following `src/data/schema.ts`, then `npm run validate`.
