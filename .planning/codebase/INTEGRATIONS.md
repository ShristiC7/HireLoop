# INTEGRATIONS.md — External Services & APIs

## Database: Supabase (PostgreSQL)
- **Env**: `SUPABASE_DATABASE_URL`
- **Driver**: Drizzle ORM with `postgres` adapter
- **Location**: `lib/db/src/index.ts`
- **Usage**: All persistent data — users, students, recruiters, jobs, applications, resumes, interview sessions, payments, announcements
- **Status**: ✅ Fully integrated

## AI: OpenAI API
- **Env**: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- **SDK**: `openai` v6
- **Model**: `gpt-4o-mini`
- **Location**: `artifacts/api-server/src/routes/ai.ts`
- **Features**:
  - Resume ATS analysis (`POST /api/ai/analyze-resume`)
  - Cover letter generation (`POST /api/ai/cover-letter`)
  - Job recommendations (`POST /api/ai/recommendations`)
  - Skill radar matrix (`POST /api/ai/skill-radar`)
  - Learning roadmap (`POST /api/ai/learning-roadmap`)
  - Mock interview start/answer/summary
  - Smart recruiter shortlist
- **Fallback**: All AI calls have hardcoded fallback responses if API fails
- **Status**: ✅ Integrated, graceful fallback

## Email: Resend
- **Env**: `RESEND_API_KEY`, `EMAIL_FROM`
- **Location**: `artifacts/api-server/src/services/email.ts`
- **Triggers**: Job approval/rejection notifications to recruiters, recruiter approval notifications
- **Status**: ✅ Integrated (non-critical, errors swallowed)

## Payment: Custom Mock (Stripe-ready)
- **Env**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Location**: `artifacts/api-server/src/routes/payments.ts`
- **Current State**: Mock processor — validates card format, inserts a `completed` payment record after 800ms delay. No real Stripe SDK calls.
- **Plans**: 
  - `listing_fee` = ₹999 (recruiter job posting)
  - `premium_monthly` = ₹299
  - `premium_yearly` = ₹2499
- **Status**: ⚠️ Mock only — Stripe not wired despite env vars in `.env.example`

## Authentication: JWT (local, no OAuth yet)
- **Env**: `SESSION_SECRET` / `JWT_SECRET`
- **Location**: `artifacts/api-server/src/routes/auth.ts`
- **Flow**: Register → bcrypt hash → JWT issued (7d expiry)
- **Storage**: `localStorage` (`hl_token`, `hl_user`) in the browser
- **Google OAuth**: Env vars present (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) but NOT implemented
- **GitHub OAuth**: Env vars present (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) but NOT implemented
- **Status**: ✅ Working JWT auth, ❌ Google/GitHub OAuth not implemented

## File Storage: Cloudinary (not implemented)
- **Env**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Status**: ❌ Not implemented (planned for PDF resume uploads)

## WebSockets (not implemented)
- Mentioned as "real-time engine" in feature checklist
- Zero WebSocket code found anywhere in codebase
- **Status**: ❌ Not implemented

## Replit Services (TO REMOVE)
- `@replit/vite-plugin-cartographer` — Replit code explorer plugin
- `@replit/vite-plugin-dev-banner` — Replit dev server banner
- `@replit/vite-plugin-runtime-error-modal` — Replit-styled error modal
- All are conditionally loaded only when `process.env.REPL_ID !== undefined`
- **Action**: Remove from `package.json` devDependencies, replace runtime-error-modal with standard Vite error handling
