# ARCHITECTURE.md — System Architecture

## Pattern
**Monorepo** — pnpm workspace with clear separation of concerns across packages.

- Client-server architecture (SPA + REST API)
- Role-based access control (student | recruiter | admin)
- Shared type-safe contract via `lib/api-zod` and `lib/api-client-react`

## High-Level Layers

```
┌─────────────────────────────────────────────┐
│          Browser (React SPA)                │
│  artifacts/hireloop  (Vite + wouter)        │
│  - AuthContext (JWT in localStorage)        │
│  - Role-gated routes                        │
│  - TanStack Query for data fetching         │
└────────────────────┬────────────────────────┘
                     │ REST (Bearer JWT)
                     ▼
┌─────────────────────────────────────────────┐
│        API Server (Express v5)              │
│  artifacts/api-server  (ESM, esbuild)       │
│  - /api/* routes                            │
│  - requireAuth / requireRole middleware     │
│  - pino structured logging                  │
└──────┬──────────────────────┬───────────────┘
       │ Drizzle ORM           │ OpenAI SDK
       ▼                       ▼
┌─────────────┐      ┌────────────────────┐
│  Supabase   │      │   OpenAI API        │
│ PostgreSQL  │      │   (gpt-4o-mini)     │
└─────────────┘      └────────────────────┘
```

## Authentication Flow
1. User registers or logs in → `POST /api/auth/register` or `POST /api/auth/login`
2. Server returns `{ user, token }` — JWT signed with `SESSION_SECRET`
3. Frontend stores in `localStorage` (`hl_token`, `hl_user`)
4. All protected requests send `Authorization: Bearer <token>`
5. `requireAuth` middleware verifies JWT, attaches `userId` + `userRole` to request

## Role-Based Access
- **student** — Profile, Resume, Jobs, Applications, AI tools
- **recruiter** — Post jobs, view applicants, manage status, payment for listing fee
- **admin** — Approve recruiters, manage all jobs, view all students, export CSV, announcements
- Admin created via DB seed (no admin registration endpoint)

## Data Flow (Example: Student applies to job)
1. Student submits application → `POST /api/applications`
2. Server validates student exists and not already applied
3. Application inserted with status `"applied"`
4. Recruiter sees applicant in `/api/applications/job/:jobId`
5. Recruiter updates status → `PATCH /api/applications/:id/status`
6. Notification email sent to student via Resend

## Key Abstractions
- `requireAuth` / `requireRole()` — Auth guard middleware in `artifacts/api-server/src/middlewares/auth.ts`
- `callAI()` — Wrapper for OpenAI with JSON response parsing and fallback
- `enrichJobWithCount()` — Joins applicant count to every job response
- `AuthProvider` / `useAuth()` — React context for auth state
- `@workspace/db` — Single DB client + all table exports

## Package Dependency Graph
```
artifacts/hireloop
  ├── lib/api-client-react
  │     └── lib/api-zod
  └── [direct UI deps]

artifacts/api-server
  ├── lib/db
  └── lib/api-zod

lib/db (standalone schema + client)
lib/api-zod (standalone zod schemas)
lib/api-client-react (depends on api-zod)
```

## Entry Points
- **Frontend**: `artifacts/hireloop/src/main.tsx`
- **Backend**: `artifacts/api-server/src/index.ts` → `app.ts` → `routes/index.ts`
- **DB migrations**: `lib/db/drizzle.config.ts` (drizzle-kit)
