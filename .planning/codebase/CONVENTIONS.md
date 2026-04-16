# CONVENTIONS.md — Code Style & Patterns

## TypeScript Style
- Strict TypeScript across all packages (`strict: true`)
- ESM modules (`"type": "module"`)
- Zod v3 for all runtime validation (request body, query params)
- `drizzle-zod` for DB schema-derived types
- No `any` — use `unknown` then narrow

## Backend Conventions

### Route Pattern
All routes follow this structure:
```typescript
router.METHOD("/resource", requireAuth, requireRole("role"), async (req: AuthRequest, res): Promise<void> => {
  // 1. Validate input with Zod
  const parsed = SomeZodSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  
  // 2. Business logic + DB queries
  const [result] = await db.select().from(table).where(eq(table.field, value));
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  
  // 3. Return JSON
  res.json(result);
});
```

### Error Handling
- Early returns with `res.status(N).json({ error: "..." })` — no thrown errors in routes
- Non-critical operations (email) wrapped in `try/catch {}` with empty catch
- AI calls always have a `fallback` object passed to `callAI()` — never fail user-facing

### Auth on Routes
- Public: no middleware
- Authenticated: `requireAuth`
- Role-gated: `requireAuth, requireRole("student")` — always both in sequence

### DB Queries
- Drizzle ORM (`db.select().from(table).where(...)`)
- Destructure first result: `const [result] = await db.select()...`
- Insert with `.returning()` to get the created record
- N+1 pattern used in some places (e.g., enrichJobWithCount called in `Promise.all`) — acceptable at this scale

## Frontend Conventions

### Component Structure
```typescript
// Page/component export at top
export default function ComponentName() {
  // 1. Hooks (auth, query, state)
  const { user, token } = useAuth();
  
  // 2. Event handlers (handle* prefix)
  
  // 3. Render
  return <DashboardLayout>...</DashboardLayout>;
}
```

### API Calls
- TanStack Query for GET (auto-caching, refetch)
- Direct `fetch` with `Authorization: Bearer` header for mutations
- API base URL from `import.meta.env.VITE_API_URL` or relative `/api`

### Styling
- Tailwind CSS v4 utility classes
- `cn()` (clsx + tailwind-merge) for conditional classes
- shadcn/ui component variants via `class-variance-authority`
- CSS variables for theming in `src/index.css` (dark mode tokens)

### Routing
- wouter `<Switch>` + `<Route>` (lightweight, no nested layouts)
- Auth redirect done manually in each protected page with `useLocation`
- Role-based routing enforced client-side (backend also enforces)

## Shared Library Conventions

### `lib/api-zod`
- Export one Zod schema per request type
- Naming: `{Action}{Resource}Body`, `{Action}{Resource}Params`, `{Action}{Resource}Query`
- Example: `CreateJobBody`, `GetJobParams`, `ListJobsQueryParams`

### `lib/db`
- `index.ts` re-exports every table and the `db` client
- Schema files export: table, insertSchema, and TypeScript types
- Enum naming: `{name}Enum` for pgEnum, `{name}StatusEnum` for status enums

## Environment Variables
- All vars documented in `.env.example`
- Backend uses `process.env.*` directly (no dotenv wrapper shown)
- Frontend uses `import.meta.env.VITE_*` for Vite-exposed vars
