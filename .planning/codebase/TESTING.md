# TESTING.md — Test Structure & Practices

## Current State: No Tests Exist

No test files, test configuration, or test runner found anywhere in the codebase.

### Evidence
- No `*.test.ts`, `*.spec.ts`, `*.test.tsx`, `*.spec.tsx` files
- No `vitest.config.*`, `jest.config.*`, or `playwright.config.*`
- No test-related scripts in any `package.json`
- No `__tests__` directories
- No test dependencies in any `package.json`

## What Should Be Tested (Gaps)

### Critical Backend Tests Needed
| Endpoint | Priority | Type |
|----------|----------|------|
| `POST /api/auth/register` | HIGH | Unit + Integration |
| `POST /api/auth/login` | HIGH | Unit + Integration |
| `GET /api/auth/me` | HIGH | Unit |
| `requireAuth` middleware | HIGH | Unit |
| `requireRole` middleware | HIGH | Unit |
| `POST /api/jobs` (recruiter) | HIGH | Integration |
| `PATCH /api/jobs/:id/approve` (admin) | HIGH | Integration |
| `POST /api/applications` | HIGH | Integration |
| `PATCH /api/applications/:id/status` | MEDIUM | Integration |
| `POST /api/ai/analyze-resume` | MEDIUM | Integration (mock OpenAI) |
| `POST /api/payments/process` | MEDIUM | Integration |

### Critical Frontend Tests Needed
| Component | Priority | Type |
|-----------|----------|------|
| `AuthContext` / `useAuth` | HIGH | Unit |
| `Login.tsx` flow | HIGH | Integration |
| `Register.tsx` flow | HIGH | Integration |
| `StudentDashboard` data loading | MEDIUM | Integration |
| `AIInterview.tsx` state machine | HIGH | Unit |
| `SkillRadar.tsx` radar calculation | MEDIUM | Unit |

## Recommended Test Stack
```
Backend:
  vitest           — test runner (ESM-native, matches existing TS setup)
  supertest        — HTTP integration tests for Express routes
  @vitest/coverage-v8 — coverage reporting

Frontend:
  vitest + @testing-library/react — component tests
  @testing-library/user-event     — user interaction simulation
  msw (Mock Service Worker)       — API mocking (in onlyBuiltDependencies)
```

## Recommended Test Structure
```
artifacts/api-server/
└── src/
    └── __tests__/
        ├── auth.test.ts
        ├── jobs.test.ts
        ├── applications.test.ts
        └── ai.test.ts

artifacts/hireloop/
└── src/
    └── __tests__/
        ├── AuthContext.test.tsx
        ├── Login.test.tsx
        └── AIInterview.test.tsx
```

## CI/CD
No CI/CD pipeline configured. No GitHub Actions, no `.github/` directory visible.
