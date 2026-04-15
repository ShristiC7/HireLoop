# HireLoop — Product Requirements Document
**Version:** 2.1  
**Status:** Active  
**Date:** April 2026  
**Authors:** HireLoop Engineering Team  

### Changelog
| Version | Date | Changes |
|---|---|---|
| 2.0 | April 2026 | Initial v2.0 release — gap analysis, 10 new AI/fullstack features |
| 2.1 | April 2026 | Added FR-107 Google OAuth, FR-108 Admin sign-in visibility, FR-109 Mobile responsiveness, FR-110 Skills input UX, BUG-001 Profile update fix |

---

## 1. Executive Summary

HireLoop v1.0 is a live, production-grade campus recruitment platform connecting students, recruiters, and placement cells through an AI-powered workflow. The platform successfully delivers core features: AI mock interviews, ATS resume analysis, resume builder, job board, application tracking, recruiter dashboards, and admin analytics.

**v2.1 objectives (immediate sprint — added April 2026):**
- Google OAuth sign-in alongside existing email/password auth
- Admin/Placement Cell login option visible on the sign-in page
- Full mobile responsiveness across all pages and viewports
- Functional skills tag input in student profile
- Fix confirmed profile update bug (BUG-001)

**v2.0 objectives:**
- Close all v1.0 gaps (15 features planned but not shipped)
- Add 10 new differentiating AI and fullstack features
- Establish HireLoop as the most technically capable campus recruitment platform available

---

## 2. Current State — v1.0 (Production)

### What is live
| Module | Status | Notes |
|---|---|---|
| JWT auth with RBAC | ✅ Live | Student, Recruiter, Admin roles |
| AI Mock Interview | ✅ Live | Session flow, Q&A, scoring |
| AI Resume Analyzer (ATS) | ✅ Live | Score, missing keywords |
| Resume Builder | ✅ Live | Multi-step, structured data |
| Job Board | ✅ Live | Search, filters, pagination |
| Application Tracking | ✅ Live | Status pipeline |
| Recruiter Dashboard | ✅ Live | Basic metrics, applicant list |
| Admin Dashboard | ✅ Live | Platform-wide stats |
| PostgreSQL via Supabase | ✅ Live | Drizzle ORM |
| Deployed on Render | ✅ Live | CI/CD from GitHub |

### Known bugs (to be fixed in v2.1)
| ID | Description | Severity | Affected Users |
|---|---|---|---|
| BUG-001 | Profile update fails silently — changes not persisted | Critical | All students |

### What is missing (planned but not shipped)
| Feature | Impact |
|---|---|
| Admin/Placement cell login option on sign-in page | Critical — admins cannot find login entry point |
| Skills input UX (tag-based input) | Critical — profile completion blocked |
| Mobile responsiveness | Critical — majority of student users on mobile |
| Google OAuth | High — reduces signup friction by ~60% |
| Resume PDF export from builder | High — builder is incomplete without download |
| Cover letter generator UI | High — backend ready, no frontend |
| Smart job recommendations page | High — backend ready, no frontend |
| Announcement board (student-facing) | High — admin creates, no student view |
| Email notifications (all triggers) | High — partial wiring |
| Admin PDF/CSV report export | Medium |
| Resume template selection | Medium |
| Avg package analytics | Medium |
| Student premium subscription UI | Medium |
| Bulk interview scheduling | Medium |
| Year-over-year analytics comparison | Low |
| Multi-college SaaS onboarding | Low |

---

## 3. Product Vision

> Build the only campus recruitment platform where AI is a first-class citizen at every stage of the hiring lifecycle — not a bolted-on feature.

**Long-term goal:** Become the infrastructure layer for campus hiring in India, supporting skill-based hiring over resume bias, with predictive placement intelligence.

---

## 4. User Personas (Updated)

### Persona 1 — The Anxious Final-Year Student
**Name:** Priya, 21, B.Tech CSE, Tier-2 College  
**Context:** Placement season is 3 months away. She uses her phone 90% of the time. She already has a Google account and doesn't want to create another password.  
**Needs:** Fast sign-up, a mobile UI that actually works, ability to add her skills quickly.  
**Frustration:** Sign-up with email takes too long. Profile page looks broken on her phone. She can't figure out how to add skills.

### Persona 2 — The Overloaded Recruiter
**Name:** Rahul, 34, Technical Recruiter, Mid-size IT company  
**Context:** Posted a job at 3 colleges. 300 applications arrived in 48 hours. Must shortlist 20 by end of week.  
**Needs:** Fast filtering by CGPA and skills, ability to see AI-pre-scored candidates, bulk status updates, interview scheduling in the platform.  
**Frustration:** Spending 2 hours reading resumes to find 5 qualified candidates.  

### Persona 3 — The Data-Driven Placement Officer
**Name:** Dr. Meenakshi, 45, Placement Cell Head  
**Context:** Manages placements for 800 students. Cannot find the admin login on the sign-in page — only Student and Recruiter options are visible.  
**Needs:** Dedicated, discoverable admin entry point on the sign-in page, real-time dashboards, exportable reports.  
**Frustration:** Has to ask a developer every time she needs to log in to the admin dashboard.

---

## 5. Bug Reports

### BUG-001: Profile Update Not Persisting
**Severity:** Critical  
**Reported:** April 2026  
**Affected:** All student users  
**Status:** Fix required in v2.1 Sprint 0

**Description:**  
When a student fills in their profile form and clicks "Save" or "Update", the UI may show a success toast but the data is not saved to the database. On refresh, the profile reverts to its previous state.

**Steps to reproduce:**
1. Log in as a student
2. Navigate to Profile page
3. Update any field (e.g. phone number, bio, or CGPA)
4. Click Save/Update
5. Refresh the page
6. Observe: changes are gone

**Root cause investigation checklist:**
- [ ] Verify the frontend is sending the correct `Content-Type: application/json` header on the PUT/PATCH request
- [ ] Verify the request body contains the correct field names matching the backend schema (check for `firstName` vs `first_name` mismatches)
- [ ] Verify the auth token is being sent in the `Authorization: Bearer <token>` header
- [ ] Check server logs for 4xx errors being swallowed by the frontend
- [ ] Verify the backend `updateMyProfile` controller is calling `await db.update(...)` correctly and not missing the `await`
- [ ] Verify Drizzle ORM update query targets the correct `userId` from `req.user.id`
- [ ] Check if the issue is Drizzle returning the stale record instead of the updated one

**Fix acceptance criteria:**
- All profile fields (firstName, lastName, phone, bio, college, department, degree, graduationYear, cgpa, rollNumber, linkedinUrl, githubUrl, portfolioUrl) persist after save
- Success toast only shown after server confirms update (not optimistically)
- If update fails, error message from API displayed to user
- No regression on any other profile field

**Suggested fix approach:**
```typescript
// Ensure the PUT request body and headers are correct:
const response = await fetch(`/api/v1/student/profile`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenStore.get()}`,
  },
  credentials: 'include',
  body: JSON.stringify(profileData),  // must match backend field names exactly
});

// Only show success after confirmed:
if (response.ok) {
  const result = await response.json();
  toast.success('Profile updated successfully');
  setProfile(result.data);
} else {
  const error = await response.json();
  toast.error(error.message || 'Update failed');
}
```

---

## 6. Feature Requirements

### Phase 0 — v2.1: Immediate Fixes & UX (Sprint 0, 1 week)

These are shipped before any Phase 1 work. They are either critical bugs, zero-backend-change features, or UX issues blocking users from core workflows.

---

#### FR-107: Google OAuth Sign-In
**Priority:** Critical  
**Users affected:** Students, Recruiters  
**Sprint:** 0  

**Description:**  
Add "Continue with Google" as a sign-in and sign-up option alongside existing email/password auth. Students and recruiters can authenticate using their Google account without creating a separate password.

**Why now:** Google OAuth reduces sign-up drop-off by approximately 60% in comparable platforms. Most students already have a Google account from their college. Adding it requires no backend model changes — only a new auth strategy and a Google OAuth credential.

**Acceptance Criteria:**
- "Continue with Google" button appears on both the sign-in page and sign-up page, above or below the divider "— or —"
- Clicking opens the standard Google consent screen in a popup or redirect (redirect preferred for mobile)
- On first Google sign-in: user is asked to select their role (Student or Recruiter) if it's a new account — then profile is created
- On subsequent Google sign-ins: user is logged in directly
- If a user previously registered with the same email via email/password, Google login links to that existing account (no duplicate accounts)
- Access token and refresh token issued identically to email/password flow
- Google profile photo imported as avatar on first sign-in (can be changed later)
- Google sign-in does NOT create Admin accounts — Admin accounts are email/password only

**User flow:**
```
Sign-in page
    ↓ clicks "Continue with Google"
Google consent screen (Google-hosted)
    ↓ user approves
Redirect back to /auth/google/callback
    ↓
Is email in DB?
  Yes → log in → redirect to role dashboard
  No  → show "Select your role" step (Student / Recruiter)
       → create user + profile → redirect to onboarding
```

**Technical approach:**
- Backend: Passport.js `passport-google-oauth20` strategy
- Add `googleId` column to `users` table (nullable — email/password users have null)
- Add `GET /auth/google` route (initiates OAuth flow)
- Add `GET /auth/google/callback` route (handles redirect, issues tokens)
- Frontend: A button that navigates to `GET /api/v1/auth/google`
- Environment variables needed: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`

**Google Cloud Console setup (for developers):**
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs: `http://localhost:5000/api/v1/auth/google/callback` (dev) and your production URL
6. Copy Client ID and Client Secret to `.env`

**Database change:**
```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
-- password_hash can be null for Google-only accounts
```

**Security notes:**
- State parameter used to prevent CSRF in OAuth flow
- Google ID token verified server-side — never trust client-supplied Google ID
- Email from Google marked as verified automatically (Google already verifies)

---

#### FR-108: Admin / Placement Cell Login Option on Sign-In Page
**Priority:** Critical  
**Users affected:** Admin / Placement Cell officers  
**Sprint:** 0  

**Description:**  
The current sign-in page shows only "Student" and "Recruiter" as login options or role selectors. Admin/Placement Cell officers cannot find their entry point without developer help. This must be fixed by making the admin login discoverable.

**Current behaviour:** Admin officers navigate to `/login` and see no option for their role. They have been told to use the same login form but there is no indication it works for them.

**Expected behaviour:** Admin login is clearly accessible from the sign-in page, with appropriate visual treatment (more subtle than the main student/recruiter CTA, since it is a less-frequent action).

**Acceptance Criteria:**
- Sign-in page has a clearly labelled section or link for "Placement Cell / Admin" login
- The placement cell login either: (a) uses a role toggle/tab that adds "Admin" as a third option, or (b) has a separate "Admin login" link at the bottom of the page that navigates to `/admin/login`
- Admin login form accepts email + password only (no Google OAuth for admin)
- After successful admin login, user is redirected to `/admin/dashboard`
- The admin login entry point is visually secondary to Student/Recruiter (smaller, muted — not competing for attention since most visitors are students)
- If an admin enters credentials on the student/recruiter login form, they receive a clear message: "This account is for admin access. Please use the Admin login below."

**Recommended UI pattern — Option A (preferred): Bottom link**
```
[ Student ] [ Recruiter ]     ← primary tabs

[  Email  ]
[  Password  ]
[ Sign In ]
[ Continue with Google ]

────────────────────────────
Placement Cell / Admin?  →  Admin Login
```

**Recommended UI pattern — Option B: Three-tab toggle**
```
[ Student ] [ Recruiter ] [ Admin ]

(Admin tab shows email/password only, no Google button)
```

**Why Option A is preferred:** Keeps the primary user flow (students) visually clean. Admin logins are rare — one officer logs in once a day. Students sign in hundreds of times a day. The hierarchy of visual weight should match the hierarchy of frequency.

**Implementation notes:**
- No backend change needed — the existing `/auth/login` endpoint already works for all roles
- The role is determined by the user's role in the database, not by which form they used
- Frontend change only: add the link or tab and navigate to it

---

#### FR-109: Mobile Responsiveness
**Priority:** Critical  
**Users affected:** All users, especially students  
**Sprint:** 0  

**Description:**  
HireLoop must be fully usable on mobile devices (375px–768px viewport width). Campus students use their phones as their primary computing device. Recruiters review applicants from tablets during commutes. Currently several pages break, overflow, or become unusable below 768px.

**Scope — pages that must be fully responsive:**

| Page | Current Issue | Fix Required |
|---|---|---|
| Sign-in / Sign-up | Layout overflow on small screens | Stack form elements vertically, full-width inputs |
| Student Dashboard | Sidebar collapses badly | Hamburger menu, bottom nav, or collapsible drawer |
| Profile page | Multi-column form overflows | Single-column layout on mobile |
| Resume Builder | Multi-step form too wide | Full-width steps, swipe or bottom-nav between steps |
| Job Board | Card grid doesn't collapse | 1-column card list on mobile, filter as bottom sheet |
| Job Detail page | Sidebar layout breaks | Stack sections vertically |
| Applications Tracker | Table overflows horizontally | Card-based list view on mobile instead of table |
| Recruiter Dashboard | Chart widths overflow | Charts scale to container, x-axis labels rotate |
| Admin Analytics | Dense tables overflow | Horizontal scroll on table with sticky first column |
| Mock Interview | Question + answer layout stacks badly | Full-screen question, answer box full-width below |

**Breakpoints to support:**
```
xs: 375px  (iPhone SE, older Android)
sm: 390px  (iPhone 14)
md: 768px  (iPad, large phones landscape)
lg: 1024px (laptop)
xl: 1280px (desktop)
```

**Acceptance Criteria:**
- No horizontal scroll on any page at 375px viewport width (except tables with explicit scroll containers)
- Touch targets minimum 44×44px (buttons, nav links, form inputs)
- Navigation accessible without a mouse
- All forms submittable on mobile keyboard (no submit button hidden below viewport)
- Images and charts scale to container width (no fixed-width overflows)
- Text remains readable (minimum 16px body, 14px secondary) — no zoom required
- Tested on: Chrome Mobile (Android), Safari Mobile (iOS)

**Technical approach:**
- Tailwind CSS breakpoint prefixes: `sm:`, `md:`, `lg:` on all layout elements
- Replace any fixed-width containers with `w-full max-w-[size]` pattern
- Replace desktop tables with responsive card lists using `hidden md:table` / `md:hidden` pattern
- Navigation: implement a mobile drawer/hamburger using existing Shadcn `Sheet` component
- Charts (Recharts): wrap in `ResponsiveContainer width="100%"` — already supported by Recharts
- Bottom navigation bar for mobile (Student dashboard: Home, Jobs, Applications, Profile)

**Definition of done:** All listed pages pass Chrome DevTools mobile device emulation at 375px without horizontal scroll or overlapping elements.

---

#### FR-110: Skills Tag Input in Student Profile
**Priority:** Critical  
**Users affected:** Students  
**Sprint:** 0  

**Description:**  
The "Skills" field in the student profile currently has no functional input method. Students cannot add, edit, or remove skills. This directly blocks profile completion, which in turn blocks job recommendations and ATS analysis. This is a zero-backend change — the API already accepts `skills: string[]`.

**Current state:** The skills field renders as either an empty display or a plain text input that doesn't save as an array.

**Expected behaviour:** A tag-based skills input where:
- Student types a skill name and presses Enter or comma to add it as a tag
- Each tag displays with an × button to remove it
- Tags are stored as a string array and sent to `PUT /api/v1/student/profile` as `{ skills: ["React", "Python", ...] }`
- A dropdown of suggested common skills appears as the student types (filtered autocomplete)

**Acceptance Criteria:**
- Typing and pressing Enter or comma adds the typed text as a skill tag
- Pressing Backspace with empty input removes the last tag
- Clicking × on any tag removes that tag
- Tags are visually distinct (pill shape with background color)
- Autocomplete dropdown shows up to 8 suggestions from a curated list as user types
- Autocomplete filters case-insensitively ("reac" matches "React", "ReactJS")
- Skills array is sent correctly to the backend on profile save (not as a comma-separated string)
- Maximum 30 skills enforced with a counter shown (e.g. "12/30 skills added")
- Empty state shows placeholder: "Type a skill and press Enter..."
- On mobile: no comma trigger (comma is hard to type on mobile keyboards) — only Enter key and "Add" button

**Suggested skill autocomplete list (hardcoded, frontend only):**
```
Languages:  Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, Kotlin, Swift
Web:        React, Next.js, Vue.js, Angular, HTML, CSS, Tailwind CSS, Node.js, Express
Database:   SQL, PostgreSQL, MySQL, MongoDB, Redis, Supabase, Firebase
AI/ML:      Machine Learning, Deep Learning, TensorFlow, PyTorch, NLP, Computer Vision
Cloud:      AWS, Google Cloud, Azure, Docker, Kubernetes, CI/CD
Tools:      Git, GitHub, Linux, REST API, GraphQL, Figma, Postman
Soft skills: Communication, Teamwork, Problem Solving, Leadership, Agile
```

**Technical approach:**
- Use the `react-tag-input` package (1.7kB gzip) or build a custom implementation with a controlled array state
- Custom implementation (recommended — no new dependency):
  ```tsx
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [input, setInput] = useState('');

  const addSkill = (skill: string) => {
    const cleaned = skill.trim();
    if (cleaned && !skills.includes(cleaned) && skills.length < 30) {
      setSkills([...skills, cleaned]);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
    }
    if (e.key === 'Backspace' && input === '') {
      setSkills(skills.slice(0, -1));
    }
  };
  ```
- On profile save, include `skills` in the PUT request body alongside other profile fields

---

### Phase 1 — v1.1: Gap Closure (Sprint 1–2, 2 weeks)

#### FR-101: Resume PDF Export
**Priority:** Critical  
**User:** Student  
**Description:** A "Download PDF" button in the resume builder that generates a professionally formatted PDF from the builder data.  
**Acceptance Criteria:**
- PDF generates in under 3 seconds
- Output is print-ready, A4 format
- Includes all resume sections (education, experience, projects, skills, certifications)
- Student name appears in the PDF filename
- Works offline (client-side generation)

**Technical approach:** `@react-pdf/renderer` or `jspdf` + `html2canvas`. Pure frontend — no backend call needed.

#### FR-102: Cover Letter Generator UI
**Priority:** Critical  
**User:** Student  
**Description:** A modal/page where student selects their resume and a target job, and receives an AI-generated personalized cover letter.  
**Acceptance Criteria:**
- Student selects resume from dropdown (their existing resumes)
- Student selects a job from applied/bookmarked jobs
- "Generate" button calls existing backend endpoint `/ai/cover-letter`
- Output renders in a text editor (editable before copying)
- "Copy to clipboard" and "Use as cover letter when applying" buttons

#### FR-103: Smart Job Recommendations Page
**Priority:** Critical  
**User:** Student  
**Description:** A dedicated page showing AI-matched job recommendations based on the student's profile.  
**Acceptance Criteria:**
- Shows top 10 recommended jobs in a card grid
- Each card shows match reason ("Your React skills match 87% of requirements")
- Refreshes when student updates their profile or skills
- Empty state guides student to complete their profile

#### FR-104: Announcement Board
**Priority:** Critical  
**User:** Student  
**Description:** A notification panel visible on the student dashboard showing admin announcements.  
**Acceptance Criteria:**
- Pinned announcements appear at top with a pin icon
- Role-targeted announcements shown only to correct role
- Expired announcements hidden automatically
- Bell icon badge shows unread count
- Clicking marks announcement as read

#### FR-105: Email Notification Completion
**Priority:** Critical  
**Description:** Wire all application status changes to trigger email to the affected student.  
**Triggers:** Application received, Shortlisted, Interview scheduled, Offer extended, Application rejected.  
**Acceptance Criteria:**
- Email sent within 30 seconds of status change
- Email contains job title, company name, and next steps
- Unsubscribe link in footer
- Email templates match platform branding

#### FR-106: Admin CSV Report Export
**Priority:** Medium  
**User:** Admin  
**Description:** "Export CSV" button on admin analytics page that downloads placement data.  
**Acceptance Criteria:**
- Exports: student name, email, department, CGPA, status (placed/unplaced), company, role, package
- Filters (department, year) applied to export
- Filename format: `placement_report_2025_CSE.csv`
- No backend changes needed — client-side CSV generation from existing API data

---

### Phase 2 — v2.0: Core Differentiators (Sprint 3–5, 5 weeks)

#### FR-201: Real-Time Notifications (WebSocket)
**Priority:** High  
**User:** Student, Recruiter  
**Description:** Push notifications delivered in real-time using Socket.io, replacing the need to refresh.  
**Events:**
- `application:shortlisted` → Student sees confetti toast
- `application:interview_scheduled` → Calendar card appears on student dashboard
- `application:rejected` → Subtle notification, no animation
- `new:job_posted` → Toast for matching students (skill overlap ≥ 50%)
- `new:announcement` → Banner appears live on all student dashboards

**Acceptance Criteria:**
- Connection established on login, closed on logout
- Reconnects automatically on network drop
- Falls back to polling (every 30s) if WebSocket unavailable
- No duplicate notifications
- Notification history persisted in DB for 7 days

**Technical:** Socket.io v4, room-based (each user joins a room by their userId on connect).

#### FR-202: Voice-Based Mock Interview
**Priority:** High  
**User:** Student  
**Description:** An optional "Voice Mode" in the mock interview that uses the browser's Web Speech API to transcribe student's spoken answers.  
**Acceptance Criteria:**
- Toggle "Use voice" before starting session
- Microphone permission requested with clear explanation
- Live transcription shows in real-time as student speaks
- 30-second silence = auto-submit answer
- Fallback to typing if browser doesn't support Speech API
- Additional metrics shown: words-per-minute, filler word count ("um", "uh", "like")
- Works in Chrome, Edge (primary targets), degrades gracefully in Firefox

**Technical:** `window.SpeechRecognition` / `window.webkitSpeechRecognition`. Zero cost, zero dependencies.

#### FR-203: GitHub Profile Sync
**Priority:** High  
**User:** Student  
**Description:** One-click sync of student's GitHub profile to auto-populate resume builder projects and suggest skills.  
**Acceptance Criteria:**
- "Connect GitHub" button in profile settings
- OAuth flow (GitHub OAuth App — free)
- Pulls: top 6 repositories, primary language per repo, profile bio, contribution count
- Maps repos → Resume Builder "Projects" section (student can deselect before import)
- Maps languages → suggested skills (student confirms which to add)
- GitHub contribution badge appears on student's recruiter-visible profile
- Syncs can be refreshed manually

**Technical:** GitHub REST API, OAuth 2.0 with `repo:read` scope. Rate limit: 5,000 req/hour authenticated.

#### FR-204: Skill Gap Radar Chart
**Priority:** High  
**User:** Student  
**Description:** A visual radar chart comparing student's skills against requirements of saved/applied-to jobs.  
**Acceptance Criteria:**
- Accessible from student dashboard as "Skill Analysis" section
- Student selects up to 3 jobs to compare against
- Radar axes = top 8 skills required across selected jobs
- Student's proficiency level = 1.0 if skill listed, 0.0 if not
- Color-coded: green (strong match), amber (partial), red (missing)
- Clicking a gap skill triggers AI to generate a 1-week learning roadmap

**Technical:** Recharts `RadarChart` (already in project). No new dependencies.

#### FR-205: AI Learning Roadmap Generator
**Priority:** Medium  
**User:** Student  
**Description:** When a student clicks on a skill gap in the radar chart, AI generates a personalized 4-week learning roadmap.  
**Acceptance Criteria:**
- Roadmap displayed in a modal with week-by-week breakdown
- Each week: learning goal + 2–3 specific free resources (YouTube, official docs, free courses)
- "Save roadmap" saves it to student's dashboard for reference

#### FR-206: Recruiter AI Auto-Shortlisting
**Priority:** High  
**User:** Recruiter  
**Description:** A "Smart Shortlist" button on the applicant list that ranks all applicants and recommends the top N for shortlisting.  
**Acceptance Criteria:**
- Recruiter sets: "I want to shortlist top 20 candidates"
- System scores each applicant on: skill overlap (30%), CGPA normalized (20%), resume ATS score (25%), mock interview score if available (15%), profile completeness (10%)
- Results shown as ranked list with score and one-line AI reasoning per candidate
- "Apply shortlist" bulk-updates selected candidates to SHORTLISTED status

---

### Phase 3 — v2.5: Advanced AI Intelligence (Sprint 6–9, 6 weeks)

#### FR-301: Semantic Job Matching with Vector Embeddings
**Priority:** High  
**Description:** Replace keyword-based job recommendations with vector similarity search using pgvector.  
**Acceptance Criteria:**
- pgvector extension enabled on Supabase
- Job descriptions vectorized using `text-embedding-3-small` on creation
- Student resume/profile vectorized on each update
- Recommendation query: `ORDER BY job_embedding <-> student_embedding LIMIT 10`
- Response time: < 500ms for top-10 query

#### FR-302: Bias Detector + Blind Hiring Mode
**Priority:** Medium  
**Description:** Toggleable blind mode for recruiters hiding identifying information during initial review. Bias report generated after shortlisting.  
**What is hidden:** Student full name, profile photo, college name, gender.  
**What remains visible:** CGPA, skills, work experience, projects, ATS score.

#### FR-303: Placement Prediction Engine
**Priority:** Medium  
**Description:** ML model predicting student's probability of getting placed based on platform activity and profile data.  
**Output:** Probability score (0–100%) with confidence interval and top 3 influencing factors.

---

### Phase 4 — v3.0: Platform Maturity (Sprint 10–14, 8 weeks)

#### FR-401: In-Browser Code Assessment
**Priority:** Medium  
**Description:** Monaco Editor-based coding challenge module. Recruiters create challenges, students solve them in-browser with sandboxed execution.

#### FR-402: Deep Placement Analytics
**Priority:** High  
**User:** Admin  
**Description:** Comprehensive analytics with year-over-year comparisons, funnel charts, department breakdowns, package distribution, and company return rate.

#### FR-403: Progressive Web App (PWA)
**Priority:** Low  
**Description:** Service worker + manifest to make HireLoop installable on mobile with offline caching and push notifications.

---

## 7. Non-Functional Requirements

| Requirement | Target | Current State |
|---|---|---|
| API response time (P95) | < 300ms | ~450ms (estimated) |
| AI feature response time | < 5s | ~3–8s |
| Dashboard load time | < 2s | ~2.5s |
| Uptime SLA | 99.5% | Render free tier: ~99.2% |
| Concurrent users | 500 | Untested |
| Database connections | < 50 (Supabase free limit) | ~13 current pool |
| Mobile responsiveness | All pages (375px+) | Partial — FR-109 fixes this |
| Accessibility | WCAG 2.1 AA | Not audited |
| OWASP compliance | Top 10 addressed | JWT, CORS, rate limiting done |
| OAuth security | State param CSRF protection | Not yet (needed for FR-107, FR-203) |

---

## 8. Security Requirements

- All API endpoints require authentication except: job listing, register, login, health check, Google OAuth callback
- Role-based access enforced at both route and data level
- File uploads: PDF max 10MB, images max 5MB, MIME type validated server-side
- AI rate limiting: 20 calls/hour free users, unlimited premium
- Google OAuth: state parameter used to prevent CSRF; ID token verified server-side
- Admin accounts cannot be created via Google OAuth — email/password only
- Passwords: bcrypt hash, min 8 chars with complexity requirements
- Refresh tokens: stored in DB, revocable on logout, 7-day expiry
- Code execution sandbox (FR-401): no network, no filesystem write access, 5s timeout, 128MB memory limit

---

## 9. Success Metrics (KPIs)

### v2.1 Sprint 0 Metrics (to be measured after release)
| Metric | Target |
|---|---|
| Google OAuth sign-up rate (% of new users) | > 40% |
| Profile completion rate after skills input fix | > 65% |
| Mobile bounce rate reduction | -30% |
| BUG-001 zero recurrence | 100% (zero reports after fix) |

### Student Engagement
| Metric | v1.0 Baseline | v2.0 Target |
|---|---|---|
| Profile completion rate | — | > 75% |
| Mock interviews per active student | — | > 3/month |
| Resume ATS analyses per student | — | > 2/month |
| Job application rate | — | > 5 applications per active student |
| Daily active users (DAU) | — | 40% of registered students |

### AI Feature Effectiveness
| Metric | Target |
|---|---|
| ATS score improvement after 2nd analysis | +8 points average |
| Mock interview score improvement over sessions | +1.2 points average |
| Cover letter usage rate (% of applications) | > 30% |
| Job recommendation click-through rate | > 20% |

### Recruiter & Platform
| Metric | Target |
|---|---|
| Recruiter shortlist accuracy (placed/shortlisted) | > 60% |
| Time from application to shortlist decision | < 48 hours |
| Placement rate (offered/total students) | > 65% |
| Admin report export usage | Weekly |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google OAuth misconfigured (wrong callback URL) | High | High | Test on dev before prod; document exact Google Console setup steps |
| Admin login still missed by users after FR-108 | Medium | Medium | Add "Admin?" link in footer of every public page as fallback |
| Mobile layout regressions on new pages | High | Medium | Add mobile viewport check to PR review checklist |
| Skills array sent as string instead of array | Medium | High | Add Zod validation on frontend before submission |
| BUG-001 recurs after fix | Low | High | Add automated test: update profile, reload, assert fields persisted |
| OpenAI API cost spike | Medium | High | Rate limiting, caching AI responses for identical inputs |
| pgvector not supported on current Supabase plan | Low | Medium | Test before implementing; fallback to keyword matching |
| Code execution sandbox escape (FR-401) | Low | Critical | Isolated subprocess, no root, timeout + memory limits |
| GitHub OAuth rate limits | Low | Low | Store tokens, cache profile data for 24 hours |
| WebSocket drops in corporate networks | Medium | Low | Automatic fallback to polling |
| Model bias in placement prediction | Medium | High | Display confidence intervals, A/B test against actual outcomes |

---

## 11. Release Timeline

| Milestone | Target | Features |
|---|---|---|
| **v2.1 Sprint 0** | Week 1 | BUG-001 fix, FR-107 Google OAuth, FR-108 Admin login, FR-109 Mobile, FR-110 Skills input |
| **v1.1** | Week 3 | FR-101 through FR-106 (all original gap closures) |
| **v2.0 Alpha** | Week 7 | FR-201 (WebSocket), FR-202 (Voice), FR-203 (GitHub) |
| **v2.0 Beta** | Week 10 | FR-204 (Skill Radar), FR-205 (Roadmap), FR-206 (Auto-shortlist) |
| **v2.0 Release** | Week 12 | FR-301 (Semantic search), FR-302 (Blind hiring) |
| **v2.5** | Week 16 | FR-303 (Placement prediction), FR-402 (Deep analytics) |
| **v3.0** | Week 21 | FR-401 (Code assessment), FR-403 (PWA) |

---

## 12. Technical Debt to Address

1. **API response caching:** Add Redis or in-memory caching for: job listing (5-min TTL), analytics dashboard (1-hour TTL), ATS analysis results (24-hour TTL for same resume+job combo)
2. **Error boundaries:** Add React error boundaries on all dashboard pages to prevent full-page crashes
3. **TypeScript strictness:** Enable `strict: true` in tsconfig, resolve all type errors
4. **Database query optimization:** Add indexes on `applications.studentId`, `applications.jobId`, `jobs.status`
5. **AI prompt versioning:** Store prompts in config files, not hardcoded strings — enables A/B testing
6. **OAuth token cleanup:** Schedule a daily job to delete expired refresh tokens from DB

---

*End of HireLoop PRD v2.1*
