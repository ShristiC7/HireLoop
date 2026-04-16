# STRUCTURE.md — Directory Layout

## Root
```
HireLoop-Platform/
├── .env.example              # All env vars documented
├── .gitignore
├── .replit                   # ⚠️ Replit config — to remove
├── .replitignore             # ⚠️ Replit ignore — to remove
├── replit.md                 # ⚠️ Replit docs — to remove
├── package.json              # Root workspace (typecheck + prettier)
├── pnpm-workspace.yaml       # Workspace config + catalog
├── tsconfig.base.json        # Shared TS config
├── tsconfig.json             # Root TS references
├── attached_assets/          # PRD, Architecture Guide docs
│   ├── HireLoop_Master_PRD_(1)_*.docx
│   ├── HireLoop_Frontend_Architecture_Guide_*.docx
│   ├── HireLoop_Complete_Project_Reference_*.docx
│   └── Pasted-HireLoop-Project-Requirements-Document-PRD-*.txt
├── artifacts/                # Deployable applications
│   ├── api-server/           # Express REST API
│   ├── hireloop/             # React SPA (main frontend)
│   └── mockup-sandbox/       # UI mockup sandbox (dev only)
├── lib/                      # Shared packages
│   ├── api-client-react/     # Type-safe React query hooks
│   ├── api-spec/             # API type definitions
│   ├── api-zod/              # Shared Zod schemas
│   └── db/                   # Drizzle ORM + schema
└── scripts/                  # Build/utility scripts
```

## Backend: `artifacts/api-server/`
```
src/
├── app.ts                    # Express app setup (cors, pino, JSON)
├── index.ts                  # Server start (listen on PORT)
├── lib/
│   └── logger.ts             # pino logger instance
├── middlewares/
│   └── auth.ts               # requireAuth, requireRole, AuthRequest type
├── routes/
│   ├── index.ts              # Router aggregator
│   ├── health.ts             # GET /api/health
│   ├── auth.ts               # POST /register, /login, /logout, GET /me
│   ├── students.ts           # GET/PUT student profile, CGPA etc.
│   ├── recruiters.ts         # GET/PUT recruiter profile
│   ├── jobs.ts               # CRUD jobs, approval workflow
│   ├── applications.ts       # Apply, list, status update
│   ├── ai.ts                 # All AI endpoints (resume, interview, etc.)
│   ├── announcements.ts      # Admin announcements
│   ├── dashboard.ts          # Dashboard stats aggregations
│   ├── payments.ts           # Mock payment processing
│   ├── admin.ts              # Admin: recruiters, students mgmt
│   └── admin/
│       └── reports.ts        # CSV export endpoints
└── services/
    └── email.ts              # Resend email service
```

## Frontend: `artifacts/hireloop/`
```
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Router (wouter) + providers
├── index.css                 # Tailwind + CSS variables (dark theme)
├── context/
│   └── AuthContext.tsx       # useAuth(), AuthProvider
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx  # Sidebar + content wrapper
│   │   └── Sidebar.tsx          # Role-aware nav sidebar
│   └── ui/                      # shadcn/ui components (button, badge etc.)
├── pages/
│   ├── Landing.tsx              # Public landing page
│   ├── Login.tsx                # Student/recruiter login
│   ├── Register.tsx             # Registration
│   ├── AdminLogin.tsx           # Admin-specific login
│   ├── not-found.tsx            # 404
│   ├── student/
│   │   ├── Dashboard.tsx        # Student home
│   │   ├── Profile.tsx          # Profile editor
│   │   ├── Resume.tsx           # Resume builder (structured)
│   │   ├── AIResume.tsx         # AI resume analysis
│   │   ├── AIInterview.tsx      # Mock interview UI (29KB)
│   │   ├── Jobs.tsx             # Job board + apply
│   │   ├── Applications.tsx     # My applications tracker
│   │   ├── Recommendations.tsx  # AI job recommendations
│   │   ├── SkillRadar.tsx       # Skill gap radar chart
│   │   ├── CoverLetter.tsx      # AI cover letter generator
│   │   └── Premium.tsx          # Premium subscription page
│   ├── recruiter/
│   │   ├── Dashboard.tsx        # Recruiter home stats
│   │   ├── Jobs.tsx             # My jobs + applicant management
│   │   ├── PostJob.tsx          # Job posting form
│   │   ├── Payment.tsx          # Listing fee payment
│   │   └── Profile.tsx          # Recruiter profile
│   └── admin/
│       ├── Dashboard.tsx        # Admin overview
│       ├── Students.tsx         # All students directory
│       ├── Recruiters.tsx       # Recruiter approval
│       ├── Jobs.tsx             # All jobs management
│       ├── Placements.tsx       # Placement status management
│       └── Announcements.tsx    # System announcements
└── hooks/ lib/                  # (minimal, likely query helpers)
```

## Database: `lib/db/`
```
src/
├── index.ts                  # DB client + all table re-exports
└── schema/
    ├── index.ts              # Schema barrel export
    ├── users.ts              # users table (id, email, passwordHash, role)
    ├── students.ts           # students + placementStatusEnum
    ├── recruiters.ts         # recruiters (company, isApproved)
    ├── jobs.ts               # jobs + jobTypeEnum + jobStatusEnum
    ├── applications.ts       # applications + applicationStatusEnum
    ├── resumes.ts            # resumes (summary, experience[], projects[])
    ├── interview_sessions.ts # interview_sessions (sessionId, QA pairs)
    ├── payments.ts           # payments (type, status, transactionId)
    └── announcements.ts      # announcements (title, content, createdBy)
```

## Naming Conventions
- Files: `PascalCase.tsx` for React components, `camelCase.ts` for modules
- DB tables: snake_case names, camelCase in TypeScript
- Routes: `/api/{resource}` REST style
- Exports: named exports preferred, default for route/page modules
