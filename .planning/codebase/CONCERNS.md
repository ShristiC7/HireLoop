# CONCERNS.md — Technical Debt, Bugs & Risk Areas

## 🔴 Critical Issues

### 1. Replit Platform Coupling
**Files**: `vite.config.ts`, `package.json` (hireloop + mockup-sandbox), `pnpm-workspace.yaml`
**Issue**: `vite.config.ts` REQUIRES `PORT` and `BASE_PATH` env vars — throws hard errors on startup without them. These were Replit-injected. Running locally will fail unless you set these manually.
```typescript
// vite.config.ts lines 9–27
if (!rawPort) throw new Error("PORT environment variable is required");
if (!basePath) throw new Error("BASE_PATH environment variable is required");
```
**Fix**: Make PORT and BASE_PATH optional with sensible defaults for local dev.

### 2. No Real Payment Processing
**File**: `artifacts/api-server/src/routes/payments.ts`
**Issue**: Payment endpoint accepts card details, waits 800ms, and inserts a `completed` record. Card data is partially handled server-side (cardNumber, cardCVV, cardExpiry). Sending real card data to a mock endpoint is a PCI violation in production.
**Fix**: Integrate real Stripe Checkout or Payment Intents. Never handle raw card numbers on your server.

### 3. All Card Data Sent to Backend
**File**: `artifacts/api-server/src/routes/payments.ts` lines 69–84
**Issue**: Frontend sends raw `cardNumber`, `cardExpiry`, `cardCvv` in the POST body. Even in a mock, this trains a bad pattern.
**Fix**: Use Stripe.js on the frontend to tokenize before any server call.

### 4. No Google OAuth Despite ENV Vars
**Env**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
**Issue**: Env vars are documented but no implementation exists. The feature checklist lists "Google OAuth Login" as a required feature.
**Fix**: Implement passport-google-oauth20 or a manual PKCE flow.

### 5. WebSockets Listed as Feature But Not Implemented
**Issue**: Feature checklist requires "real-time notifications" via WebSockets. Zero WebSocket code exists.
**Fix**: Implement ws or socket.io for application status change notifications.

---

## 🟡 Medium Risk

### 6. N+1 Database Queries
**File**: `artifacts/api-server/src/routes/ai.ts` lines 401–404, `routes/jobs.ts` lines 39, 77
**Issue**: `enrichJobWithCount` called inside `Promise.all(jobs.map(...))` — one DB query per job. Similarly, smart shortlist fetches each student separately in a loop.
**Fix**: Use Drizzle joins or batch queries.

### 7. No Input Sanitization on AI Prompts
**File**: `artifacts/api-server/src/routes/ai.ts`
**Issue**: Student name, branch, resume content are interpolated directly into OpenAI prompts without sanitization. Prompt injection possible.
**Fix**: Sanitize/truncate user inputs before embedding in prompts.

### 8. JWT Secret Fallback Hard-coded
**File**: `artifacts/api-server/src/routes/auth.ts` line 11
```typescript
const JWT_SECRET = process.env.SESSION_SECRET || "hireloop-secret-key";
```
**Issue**: Ships with a known fallback secret. Any deployment without `SESSION_SECRET` set uses a public key.
**Fix**: Throw an error if `SESSION_SECRET` is not set in production.

### 9. Admin Account Has No Registration Flow
**Issue**: `admin` role exists in the `userRoleEnum` but there's no way to create an admin via the API. Requires direct DB insertion. No admin seed script found.
**Fix**: Create a seed script or a secure admin creation mechanism.

### 10. Resume Builder Stores JSON Arrays in Text Columns
**File**: `lib/db/src/schema/resumes.ts`
**Issue**: `experience`, `education`, `projects` are likely stored as `jsonb` or text arrays. Need to verify actual column types — if text, JSON.stringify/parse pattern is fragile.
**Fix**: Use `jsonb` column type for structured JSON data in Drizzle.

---

## 🟢 Low Risk / Code Quality

### 11. No Error Boundary in React App
**File**: `artifacts/hireloop/src/App.tsx`
**Issue**: No `<ErrorBoundary>` wrapping the router. Any component crash brings down the whole app.

### 12. Empty Catch Blocks
**Files**: Multiple route files
**Issue**: `catch { /* email non-critical */ }` silently swallows errors. Errors should at minimum be logged.

### 13. `any` Casts in AI Route
**File**: `artifacts/api-server/src/routes/ai.ts` lines 129, 158
**Issue**: `as unknown[]` and `as typeof fallback` casts bypass type safety around AI response parsing.

### 14. Replit-Specific Comments in UI Components
**Files**: `components/ui/button.tsx`, `components/ui/badge.tsx`
**Issue**: Comments like `// @replit: no hover` indicate UI was tuned for Replit's theme. May look different in standalone deployment.

### 15. No Loading/Skeleton States Verified
**Issue**: LLM-powered endpoints (resume analysis, interview) can take 5–15 seconds. Need to verify all pages show proper loading states.

### 16. `mockup-sandbox` Artifact Has No Clear Purpose
**File**: `artifacts/mockup-sandbox/`
**Issue**: Unclear if this is for dev/design exploration or will be shipped. Should be excluded from production builds.

### 17. No HTTP Rate Limiting
**Issue**: No rate limiting middleware on AI endpoints which proxy to paid OpenAI API. A malicious user could cause significant API cost.
**Fix**: Add `express-rate-limit` especially on `/api/ai/*` routes.
