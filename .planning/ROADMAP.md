# Roadmap

## Breakdown
- **2 Phases** 
- **11 Requirements Mapped**
- **100% Coverage** 

## Phase 1: API & System Integrity
**Goal:** Fix rate limiting rules, express route ordering conflicts, and backend payload deliveries to unblock frontend interfaces.
**Requirements:** JOB-03, RATE-01, RATE-02, RATE-03, USER-01, MOCK-02

### Success Criteria
1. Rate-limiting middleware is configured uniquely for AI endpoints vs standard API requests.
2. Route ordering for the job endpoints (`/api/jobs/...`) no longer crashes or swallows valid endpoints.
3. User profile API query fetches fully populated relational data (Prisma `include` correctly executed).
4. AI endpoint properly relays requests without payload format drops or internal server errors.

**UI hint**: no

---

## Phase 2: Frontend Resilience & Flows
**Goal:** Repair React state issues within the Job Portal, Mock Interview, and User Profile components to properly reflect backend data and handle limits gracefully.
**Requirements:** JOB-01, JOB-02, MOCK-01, MOCK-03, USER-02

### Success Criteria
1. Job Portal correctly lists jobs and allows viewing details without blank loading screens.
2. User profile displays all fetched data completely without "undefined" rendering errors.
3. AI Mock Interview UI successfully manages the conversation state loop, displaying responses correctly.
4. If rate limit is hit, application gracefully informs the user rather than failing silently or crashing.

**UI hint**: yes
