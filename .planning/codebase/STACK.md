# STACK.md — HireLoop Technology Stack

## Runtime & Language
- **Language**: TypeScript 5.9 (strict, ESNext target)
- **Package Manager**: pnpm (workspace monorepo, v9+)
- **Node.js**: ESM (`"type": "module"`)

## Backend (`artifacts/api-server`)
| Layer | Technology |
|-------|-----------|
| Framework | Express v5 |
| Language | TypeScript + ESM |
| Build | esbuild (via `build.mjs`) |
| Logging | pino + pino-http |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod v3 (via `@workspace/api-zod`) |
| AI | OpenAI SDK v6 (`gpt-4o-mini`) |
| Email | Resend (via `artifacts/api-server/src/services/email.ts`) |
| Payment | Custom mock processor (Stripe env vars present but SDK not wired) |

## Frontend (`artifacts/hireloop`)
| Layer | Technology |
|-------|-----------|
| Framework | React 19.1 + Vite 7 |
| Routing | wouter v3 |
| State (server) | TanStack React Query v5 |
| Styling | Tailwind CSS v4 + tw-animate-css |
| UI Components | Radix UI (full suite) + shadcn/ui pattern |
| Icons | Lucide React + React Icons |
| Forms | React Hook Form + @hookform/resolvers |
| Charts | Recharts |
| Animations | Framer Motion |
| Date Handling | date-fns |
| Theme | next-themes |

## Database (`lib/db`)
| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle ORM v0.45 |
| Schema | drizzle-zod for schema inference |
| Migrations | drizzle-kit |
| Connection | `SUPABASE_DATABASE_URL` env var |

## Shared Libraries
- `lib/db` — Drizzle schema + DB client exports
- `lib/api-zod` — Shared Zod validation schemas (request bodies, params)
- `lib/api-client-react` — Type-safe React hooks for API calls
- `lib/api-spec` — API specification types

## Key Config Files
- `pnpm-workspace.yaml` — Workspace packages + catalog dependencies
- `tsconfig.base.json` — Base TS config 
- `.env.example` — All required environment variables
- `artifacts/hireloop/vite.config.ts` — Frontend Vite config
- `artifacts/api-server/build.mjs` — Backend esbuild config

## Replit Artifacts (TO REMOVE)
- `@replit/vite-plugin-cartographer` — Only loads when `REPL_ID` is set
- `@replit/vite-plugin-dev-banner` — Only loads when `REPL_ID` is set
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay
- `.replit` — Replit run configuration file
- `pnpm-workspace.yaml` excludes `@replit/*` from minimum release age check
- `vite.config.ts` conditionally loads Replit plugins only when `REPL_ID !== undefined`
- PORT and BASE_PATH env vars required by vite.config.ts (Replit-injected)
