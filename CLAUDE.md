# CLAUDE.md — Synap Architecture Reference

Read this file at the start of every session. Do not deviate from these rules.

---

## Hard Constraints

### 1. No external AI APIs. Ever.
Never use any external AI API — OpenAI, Anthropic, Cohere, or any other. No API keys. No SDKs. No exceptions. This applies to every phase including future ones. Synap uses the user's own existing browser sessions via the Chrome extension — that is the entire point. Any route that calls an external AI API is a bug and must be fixed immediately.

### 2. The extension is a generic browser controller.
Adding a new AI = one new entry in `AI_SELECTORS` in `apps/extension/src/shared/constants.ts`. No other code should need to change. Never hardcode a list of supported AIs anywhere in the codebase. The UI, controllers, and routing must all derive from the single `AI_PROVIDERS` source of truth in `packages/types/src/ai.ts`.

### 3. No building ahead of phases.
Never write code for a future phase even if it seems helpful. Write a stub or a `// TODO Phase N:` comment instead.

---

## Preferred Working Style

Before writing any code:
1. **Analyse** — read all relevant files, understand existing patterns, find what can be reused.
2. **Plan** — enter planning mode, ask as many clarifying questions as needed. The more questions the better. Do not assume anything you can ask about.
3. **Code** — only after the plan is approved.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm |
| Web app | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS (no shadcn, no component library) |
| Client state | Zustand + TanStack Query |
| Extension | Chrome MV3 + Vite + @crxjs/vite-plugin |
| Database | Supabase (Postgres + RLS + Auth + Realtime) |
| Deployment | Render (web app) + GoDaddy domain + Chrome Web Store |

---

## Phase Status

| Phase | Goal | Status |
|---|---|---|
| 0 | Monorepo foundation | ✅ DONE |
| 1 | Auth + DB (Supabase, 5 migrations, login page) | ✅ DONE |
| 2 | Extension foundation — PING/PONG | ✅ DONE |
| 3 | Tab automation — ChatGPT responds in Synap | ✅ DONE |
| 3b | Claude tab automation — test + fix selectors against live Claude.ai DOM | pending |
| 4 | Chat UI polish | ✅ DONE |
| 5 | Memory UI — manage facts, fix OpenAI stub, fix provider list | ✅ DONE |
| 6 | Context switch — extension asks current AI to summarise, injects into new AI | pending |
| 7 | Floating sidebar — chrome.sidePanel quick-access UI | pending |
| 8 | Launch prep — Render deploy, GoDaddy domain, Chrome Web Store submission | pending |

---

## Architecture Notes

### Memory injection (Phase 5)
`buildMemoryPrefix()` in `apps/web/src/app/api/conversations/[id]/messages/route.ts` fetches active `memory_facts` rows and prepends them to the first message of each conversation. No API key needed — it's just a DB query.

### Context switch stub (Phase 6 pending)
`apps/web/src/app/api/conversations/[id]/summarize/route.ts` is currently a stub: it updates `current_ai` and resets `memory_injected` but inserts no summary. Phase 6 will use the extension to ask the current AI to summarise, capture the response, and inject it as a system message.

### Key source-of-truth files
- `packages/types/src/ai.ts` — `AIProvider`, `AI_PROVIDERS`
- `apps/extension/src/shared/constants.ts` — `AI_SELECTORS` (one entry per AI)
- `packages/db/src/database.types.ts` — generated Supabase types

### Extension ID (dev)
`lnenlcbabfgbjojoennilhknnhfohhhb`

### Supabase project
ID: `pxltdkohbewkgfpiepgk` / Region: `eu-west-1`

### Known TypeScript note
`typescript: { ignoreBuildErrors: true }` is set in `next.config.ts` due to a `@supabase/ssr@0.5.2` / `supabase-js@2.103.x` generics mismatch. Runtime is correct; only library types mismatch.
