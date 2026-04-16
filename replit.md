# HireLoop — AI-Powered Campus Recruitment Platform

## Overview

HireLoop is a full-stack AI-powered campus recruitment web platform connecting students, recruiters, and placement cells. Built as a pnpm workspace monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (Supabase)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **AI**: OpenAI `gpt-4o-mini` via Replit AI Integrations
- **Email**: Resend (optional — gracefully skipped if no API key)

## Workspace Structure

```
artifacts/
  hireloop/        — React frontend (Vite)
  api-server/      — Express backend
  mockup-sandbox/  — Design sandbox (Vite)
lib/
  db/              — Shared Drizzle schema + DB client
  api-spec/        — OpenAPI specification
  api-zod/         — Generated Zod schemas
  api-client-react/ — Generated TanStack Query hooks
```

## User Roles

1. **Student** — Profile, resume builder, job search, AI tools, application tracking
2. **Recruiter** — Post jobs (requires payment), manage applicants, schedule interviews, AI shortlisting
3. **Admin** — Monitor placements, manage users, job approval, generate reports

## Features Implemented

### Authentication
- Role-based signup/login (student, recruiter, admin)
- JWT session management, password hashing
- Separate **Admin Login** page at `/admin-login`

### Student Module
- **Profile management** with academic data and interactive Skills Tag Input (autocomplete + custom tags + pill display + profile completeness meter)
- Resume builder with sections (summary, experience, education, projects, certs)
- **PDF export** via browser print API
- Job board with search and filters
- Application status tracking pipeline
- AI Resume Analyzer (ATS scoring, keyword gaps)
- **AI Mock Interview** — text mode and **voice mode** (Web Speech API: speech-to-text + text-to-speech + filler word counter)
- **Cover Letter Generator** (`/student/cover-letter`) — AI-generated from job + profile data
- **Smart Job Recommendations** (`/student/recommendations`) — AI-ranked job matches with fit score
- **Skill Gap Radar + Learning Roadmap** (`/student/skill-radar`) — radar chart visualization + personalized learning plan
- **Premium subscription** (sandbox payment — monthly ₹299, yearly ₹2,499)

### Recruiter Module
- Job posting with eligibility, salary, skills, and branch targeting
- **Payment gate** — recruiter must pay ₹999 listing fee before posting
- Applicant management with status pipeline
- **Interview scheduling** — date/time picker with notes
- **Skill-based applicant filtering** — filter by candidate skills
- **AI Smart Shortlist** — one-click AI analysis ranking all applicants by fit score with recommendation labels
- **Sandbox payment system** — simulated card payment for listing fees

### Admin Module
- Real-time placement analytics dashboard
- Student and recruiter management, recruiter approval
- **Job Approval workflow** — approve or reject pending job listings (`/admin/jobs`)
- Announcement board
- **CSV report downloads** — students, placements, and applications reports

### Email Notifications
- Application confirmation emails (student)
- Application status update emails
- Powered by Resend; gracefully skipped if `RESEND_API_KEY` is not set

### Mobile Responsiveness
- Sidebar hidden on mobile (md breakpoint)
- **Mobile bottom navigation bar** — role-specific tabs for all roles
- Content padded correctly for bottom nav (`pb-20 md:pb-6`)
- Grid layouts adapt to single-column on small screens

## API Routes

### AI Routes (`/api/ai/*`)
- `POST /ai/cover-letter` — Generate personalized cover letter
- `POST /ai/recommendations` — AI job recommendations for student
- `POST /ai/skill-radar` — Skill gap analysis + radar data
- `POST /ai/learning-roadmap` — Personalized learning roadmap
- `GET /ai/smart-shortlist/:jobId` — AI applicant ranking for recruiters

### Job Routes (additions)
- `GET /jobs/pending` — All pending-approval jobs (admin)
- `PATCH /jobs/:jobId/approve` — Approve a job listing (admin)
- `PATCH /jobs/:jobId/reject` — Reject a job listing (admin)
- New jobs created by recruiters default to `pending` status

## Database Tables

- `users` — auth, role
- `students` — academic info, placement status
- `recruiters` — company, approval status
- `resumes` — structured resume data
- `jobs` — listings with skills, eligibility, and status (active/closed/pending)
- `applications` — student-job tracking with status pipeline
- `announcements` — admin notices
- `interview_sessions` — AI mock interview sessions
- `payments` — payment records for listing fees and subscriptions

## Environment Variables

See `.env.example` for all required variables:
- `SUPABASE_DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` — AI features
- `RESEND_API_KEY` — Email notifications (optional)
- `EMAIL_FROM` — Sender email (optional)
- `JWT_SECRET` — Auth token signing
- `FRONTEND_URL` — Used in email links

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Demo Accounts

- **Student**: student@demo.com / demo123
- **Recruiter**: recruiter@demo.com / demo123
- **Admin**: admin@demo.com / demo123 (login via `/admin-login`)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
