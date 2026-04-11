# HireLoop Stabilization

## Core Value
A seamless, production-ready full-stack job platform where applicants can accurately view job listings, experience functional AI mock interviews, and access full user profiles without running into API rate limit constraints.

## Context
HireLoop is an existing full-stack AI-integrated campus recruitment platform. The core features have already been built (Vite/React client, Express/PostgreSQL/Prisma server). We are currently in a stabilization phase intended to resolve critical bugs and errors to prepare the application for real-world production usage. Primary issues include a broken job portal, failing AI mock interviews, overly aggressive API rate limits causing "too many requests" errors, and broken user profile displays.

## Requirements

### Validated
- ✓ Monorepo client/server architecture with React and Express — existing
- ✓ Database models and schema using PostgreSQL & Prisma — existing
- ✓ Core authenticated session flows (JWT/bcrypt) — existing
- ✓ Integration points laid out for AI APIs (OpenAI/Anthropic), Cloudinary, and Payment Gateways (Stripe/Razorpay) — existing

### Active
- [ ] Stabilize the **Job Portal** so available jobs load correctly and user flows execute without crashing.
- [ ] Fix the **AI Mock Interview** feature, ensuring smooth frontend state updates and proper backend endpoint functionality.
- [ ] Resolve **Rate Limiting** "too many requests" errors by appropriately configuring rate limiters on AI and general API endpoints.
- [ ] Fix the **User Profile** functionality so that the entire user profile renders fully without errors.
- [ ] Improve general application error handling to produce resilient UI states and structured backend responses.

### Out of Scope
- Building entirely new feature modules (focus is strictly on stabilizing what is already built).
- Redesigning the core user interface aesthetics (UI/UX tweaks belong only to repairing broken flows).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus exclusively on stabilization | Real world usage is blocked by existing bugs. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-11 after initialization*
