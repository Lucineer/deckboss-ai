# CLAUDE.md — Deckboss.ai

Cellular Agent Spreadsheet — a Cloudflare Worker where cells are AI agents and the spreadsheet IS the runtime.

Part of the **Cocapn ecosystem** (cocapn.ai). GitHub org: **Lucineer**.

## Purpose

Deckboss is a spreadsheet-native AI environment. Each cell can be an AI agent that reasons, calls LLMs, and interacts with other cells. The spreadsheet grid doubles as both the UI and the computation runtime. Users bring their own LLM API keys (BYOK) and route requests through a unified interface supporting 7 providers.

## Architecture

```
User Browser
  └── Inline HTML/JS (served from worker.ts)
        ├── Spreadsheet UI (Univer-based)
        ├── Formula engine + cell type system
        ├── Data visualization layer
        └── Plugin system + conditional formatting
Cloudflare Worker (src/worker.ts)
  ├── Routes: /health, /setup, /api/chat, /api/byok, /public/*
  ├── BYOK Module (src/lib/byok.ts)
  │     ├── Config discovery chain
  │     └── 7 LLM provider adapters
  └── KV Binding: DECKBOSS_MEMORY
```

**Data flow:** Browser → Worker routes → BYOK module → External LLM APIs. Cell state lives in the browser; AI calls go through the worker's `/api/chat` endpoint.

## Key Commands

```bash
wrangler dev          # Local development server
wrangler deploy       # Deploy to Cloudflare Workers
git push              # Push to GitHub (triggers deployment if CI configured)
wrangler kv:key list  # Inspect DECKBOSS_MEMORY namespace
```

No build step. TypeScript runs directly via Cloudflare's runtime.

## Code Style and Conventions

- **TypeScript** throughout, strict mode
- **No build step** — deployed with wrangler directly
- **All HTML is inline** in worker.ts (no ASSETS binding, no static files)
- **Zero runtime dependencies** for MVP — no node_modules needed
- **BYOK config discovery chain:** URL params → Auth header → Cookie → KV → fail
- **Theme:** spreadsheet aesthetic, accent color `#58a6ff`, brand colors: blue-coral
- **Commits** attributed to "Author: Superinstance"
- **16 TypeScript files** — keep it lean, every file earns its place
- Prefer inline implementations over abstractions for MVP phase
- Error messages should be user-facing and actionable

## Testing Approach

- Manual testing via `wrangler dev` and browser
- `/health` endpoint for smoke tests
- BYOK module tested against each provider's API shape
- No automated test framework in place yet for MVP

## Important File Paths

| Path | Purpose |
|---|---|
| `src/worker.ts` | Cloudflare Worker entry point, all routes, inline HTML |
| `src/lib/byok.ts` | BYOK LLM routing, 7 providers, config discovery (503 lines) |
| `wrangler.toml` | Worker config, KV bindings, routes |
| `DECKBOSS_MEMORY` | KV namespace for persistent config/state |

## What NOT to Change

- **BYOK module structure** (`src/lib/byok.ts`) — the config discovery chain is carefully ordered and tested against all 7 providers
- **Inline HTML pattern** in worker.ts — no ASSETS binding, no static file serving; this is intentional for the single-file-worker architecture
- **Zero dependency constraint** for MVP — don't add npm packages without strong justification
- **Cell-as-agent abstraction** — cells ARE the runtime; don't separate computation from the grid

## How to Add New Features

1. **New module:** Create `src/lib/your-module.ts`
2. **Import** it in `src/worker.ts`
3. **Add route** to the worker's fetch handler (follow existing pattern)
4. **Wire UI** by adding to the inline HTML/JS in worker.ts
5. **Test** with `wrangler dev`

Example route pattern:
```typescript
if (url.pathname === '/api/your-endpoint') {
  return handleYourThing(request, env);
}
```

For new cell types or formula functions, extend the formula engine and register in the cell type system.

## Deployment

```bash
wrangler deploy
```

Requirements:
- Cloudflare account with Workers enabled
- KV namespace `DECKBOSS_MEMORY` bound in wrangler.toml
- No secrets needed at deploy time — users provide their own API keys via BYOK

## Ecosystem Links

- **cocapn.ai** — parent ecosystem
- **Lucineer** — GitHub organization (github.com/Lucineer)
- Other `*log.ai` repos in the Cocapn ecosystem follow similar patterns: Cloudflare Workers, BYOK, inline HTML, zero dependencies

## Project Stats

- 16 TypeScript files
- ~503 lines in BYOK module alone
- 7 LLM providers supported
- Single Cloudflare Worker deployment
- Accent: `#58a6ff`

---

*Cells are AI agents. The spreadsheet IS the runtime.*
