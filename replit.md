# HireLoop — AI-Powered Campus Recruitment Platform

## Overview

HireLoop is a full-stack AI-powered campus recruitment web platform connecting students, recruiters, and placement cells. Built as a pnpm workspace monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **AI**: OpenAI API for resume analysis and mock interviews

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
2. **Recruiter** — Post jobs (requires payment), manage applicants, schedule interviews
3. **Admin** — Monitor placements, manage users, generate reports

## Features Implemented

### Authentication
- Role-based signup/login (student, recruiter, admin)
- JWT session management, password hashing

### Student Module
- Profile management with academic data and skills
- Resume builder with sections (summary, experience, education, projects, certs)
- **PDF export** via browser print API
- Job board with search and filters
- Application status tracking pipeline
- AI Resume Analyzer (ATS scoring, keyword gaps)
- AI Mock Interview (role-based questions, scoring, feedback)
- **Premium subscription** (sandbox payment — monthly ₹299, yearly ₹2,499)

### Recruiter Module
- Job posting with eligibility, salary, skills, and branch targeting
- **Payment gate** — recruiter must pay ₹999 listing fee before posting
- Applicant management with status pipeline
- **Interview scheduling** — date/time picker with notes when scheduling interviews
- **Skill-based applicant filtering** — filter by candidate skills
- **Sandbox payment system** — simulated card payment for listing fees

### Admin Module
- Real-time placement analytics dashboard
- Student and recruiter management, recruiter approval
- Announcement board
- **CSV report downloads** — students, placements, and applications reports

### Payment System (Sandbox)
- Recruiter listing fee: ₹999/listing (valid 30 days)
- Student premium monthly: ₹299/month
- Student premium yearly: ₹2,499/year
- Transaction history and validation
- No real charges — test environment

## Database Tables

- `users` — auth, role
- `students` — academic info, placement status
- `recruiters` — company, approval status
- `resumes` — structured resume data
- `jobs` — listings with skills and eligibility
- `applications` — student-job tracking with status pipeline
- `announcements` — admin notices
- `interview_sessions` — AI mock interview sessions
- `payments` — payment records for listing fees and subscriptions

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Demo Accounts

- **Student**: student@demo.com / demo123
- **Recruiter**: recruiter@demo.com / demo123
- **Admin**: admin@demo.com / demo123

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
