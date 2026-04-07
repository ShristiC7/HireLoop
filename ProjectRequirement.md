# HireLoop — Product Requirements Document

**Authors:**Universe of Innovation 

---

## 1. Executive Summary

HireLoop is an end-to-end, AI-powered campus recruitment portal that digitizes the full placement lifecycle for three stakeholder groups: **students**, **recruiting companies**, and **college placement cells**. The platform eliminates fragmented, spreadsheet-driven workflows and replaces them with a single intelligent ecosystem that covers resume building, AI-driven preparation, job applications, recruiter workflows, and institutional analytics.

**Problem in one line:** Campus hiring is still managed through email chains, Excel sheets, and disconnected portals — costing students preparation quality, recruiters screening efficiency, and placement cells their sanity.

**Solution in one line:** A unified, role-aware platform where students prepare, apply, and interview — all powered by AI — while recruiters filter and hire, and placement cells govern and report.

---

## 2. Goals & Success Metrics

### 2.1 Product Goals

| # | Goal | Rationale |
|---|------|-----------|
| G1 | Reduce student-to-offer time by 30% | Streamlined applications + AI prep reduce wasted effort |
| G2 | Increase recruiter shortlist accuracy by 40% | AI scoring and rich filtering surface better candidates |
| G3 | Eliminate placement cell manual reporting | Automated dashboards replace spreadsheet churn |
| G4 | Achieve >80% application completion rate | Guided UX removes friction points |
| G5 | Enable same-day onboarding for all three user roles | Role-specific flows from signup to first action |

### 2.2 Key Performance Indicators (KPIs)

| KPI | Target | Measurement Method |
|-----|--------|-------------------|
| Application completion rate | ≥ 80% | Events: started vs. submitted |
| Recruiter shortlist-to-hire ratio | ≥ 40% improvement vs. baseline | Tracked per job posting |
| ATS score improvement after suggestions | ≥ 15 points avg. | Pre/post resume upload |
| Student DAU engagement | 60% of registered students | Login + action events |
| Admin dashboard usage | Weekly active (every admin) | Session tracking |
| AI mock interview completion | ≥ 70% of started sessions | Session state |
| Time-to-post for recruiter | < 10 minutes | From signup to published job |
| Placement report generation time | < 30 seconds | Server-side benchmark |

---

## 3. User Personas

### 3.1 Persona A — The Final-Year Student

**Name:** Priya Sharma  
**Context:** Final-year CS student, anxious about placements, unsure if her resume is recruiter-ready  
**Goals:** Build a strong resume, understand her job fit, practice interviews, track every application  
**Frustrations:** No feedback on resumes, no centralised application tracker, mock interview resources are generic  
**Technical comfort:** High — uses GitHub, LinkedIn, familiar with web apps  

### 3.2 Persona B — The Campus Recruiter

**Name:** Arjun Mehta, Talent Acquisition Lead  
**Context:** Hiring for a mid-size software company, visits 8–10 campuses per season  
**Goals:** Post roles quickly, filter noise, shortlist efficiently, schedule without email overhead  
**Frustrations:** Low-quality applicant pools, repetitive screening, poor communication tooling  
**Technical comfort:** Medium — uses ATS at corporate level but expects simpler campus tools  

### 3.3 Persona C — The Placement Officer

**Name:** Dr. Sunita Rao, Placement Cell Head  
**Context:** Manages placements for 800 students across engineering and management departments  
**Goals:** Ensure data integrity, generate reports for the Dean, maintain student–company relationships  
**Frustrations:** Manual report compilation, no single source of truth, inability to track real-time placement numbers  
**Technical comfort:** Low-to-medium — prefers dashboards over raw data  

---

## 4. Functional Requirements

### 4.1 Authentication & Roles

**FR-AUTH-01:** Users must register with a valid institutional email address (student) or official company domain (recruiter).  
**FR-AUTH-02:** Three role types are supported: `STUDENT`, `RECRUITER`, `ADMIN`. Roles are assigned at signup and enforced via JWT + RBAC middleware.  
**FR-AUTH-03:** Email verification is mandatory before first login.  
**FR-AUTH-04:** Admin accounts can only be provisioned directly — no self-registration for the admin role.  
**FR-AUTH-05:** Session tokens expire after 24 hours with refresh token support (7-day window).  
**FR-AUTH-06:** Password reset via email OTP.

---

### 4.2 Student Module

#### 4.2.1 Profile Management

**FR-STU-01:** Students must complete a structured profile covering: personal info, academic details (CGPA, batch, branch), skills (freeform + from a curated list), projects, certifications, and social links.  
**FR-STU-02:** Profile completeness score is displayed as a progress bar with specific missing-field prompts.  
**FR-STU-03:** Profile photo upload, stored in cloud object storage, max 2 MB, JPG/PNG.

#### 4.2.2 Resume Builder

**FR-STU-04:** Three pre-designed resume templates selectable from a gallery.  
**FR-STU-05:** Resume sections: Summary, Education, Work Experience, Projects, Skills, Certifications, Achievements.  
**FR-STU-06:** Each section is editable via a structured form with rich text support (bold, lists) for descriptions.  
**FR-STU-07:** Resume preview updates in real time alongside the form.  
**FR-STU-08:** Export as PDF, server-side rendered with consistent formatting.  
**FR-STU-09:** Students can store up to 3 different resume versions.  

#### 4.2.3 AI Resume Analyser

**FR-STU-10:** Students upload a resume (PDF or DOCX, max 5 MB).  
**FR-STU-11:** System extracts text using NLP-based parsing.  
**FR-STU-12:** The AI engine returns: ATS score (0–100), missing keyword list, structure feedback (section completeness), grammar and clarity flags, and quantification suggestions.  
**FR-STU-13:** Optionally, a student can paste a job description to receive a **resume–JD match score** (percentage).  
**FR-STU-14:** The system highlights matched vs. unmatched keywords side by side.  
**FR-STU-15:** Analysis results are saved to the student's profile for reference.

#### 4.2.4 Job Applications

**FR-STU-16:** Students can view all open job listings filtered by eligibility (their own CGPA and branch determine visibility).  
**FR-STU-17:** One-click apply attaches the student's active resume automatically.  
**FR-STU-18:** Students can optionally upload a custom resume or cover letter per application.  
**FR-STU-19:** Duplicate application prevention: each student can apply once per job.  
**FR-STU-20:** Application submission confirmation via in-app notification and email.

#### 4.2.5 Application Status Tracker

**FR-STU-21:** Applications are tracked across a defined pipeline:  
`Applied → Shortlisted → Interview Scheduled → Offer Extended → Offer Accepted / Rejected`  
**FR-STU-22:** Status changes trigger real-time in-app notifications and email updates.  
**FR-STU-23:** The tracker displays company name, role, applied date, and current status in a kanban-style or list view.  
**FR-STU-24:** Students receive a timeline of status change events per application.

#### 4.2.6 AI Mock Interview

**FR-STU-25:** Students select a role category (e.g., Software Engineer, Data Analyst, Product Manager).  
**FR-STU-26:** The system generates 8–12 role-appropriate questions mixing: technical concepts, behavioural (STAR format), and situational prompts.  
**FR-STU-27:** Students type or record answers per question (text mode for MVP; audio planned in v2).  
**FR-STU-28:** AI evaluates each answer on: semantic relevance, keyword coverage, answer structure, and clarity score.  
**FR-STU-29:** A session summary report is generated with per-question scores and improvement suggestions.  
**FR-STU-30:** Premium students get unlimited sessions; free-tier students get 3 sessions/month.

#### 4.2.7 Smart Job Recommendations

**FR-STU-31:** The recommendation engine ingests: student skills, resume keywords, CGPA, branch, and past application behaviour.  
**FR-STU-32:** Recommended jobs are surfaced on the student home feed ranked by match score.  
**FR-STU-33:** Match reasoning is displayed ("Based on your Python and ML skills").

#### 4.2.8 Cover Letter Generator

**FR-STU-34:** Students provide their resume + a job description as input.  
**FR-STU-35:** The AI generates a structured cover letter draft (~250–350 words) customised to the JD.  
**FR-STU-36:** Students can edit the draft inline and download as PDF or copy to clipboard.

---

### 4.3 Recruiter Module

#### 4.3.1 Company Onboarding

**FR-REC-01:** Recruiter registers with company name, official domain email, company type, and company size.  
**FR-REC-02:** Registration is held in a pending state until approved by a placement cell admin.  
**FR-REC-03:** Approval notification is sent via email; rejection includes a reason field.

#### 4.3.2 Job Posting

**FR-REC-04:** Recruiters post jobs with: role title, job description (rich text), required skills, eligibility criteria (minimum CGPA, eligible branches, batch year range), location, salary range, and application deadline.  
**FR-REC-05:** Job posts are only visible to eligible students after admin approval.  
**FR-REC-06:** Recruiters pay a listing fee (sandbox payment) before a job is submitted for admin review.  
**FR-REC-07:** Recruiters can edit job posts before the application deadline; the edit triggers re-review if criteria change.  
**FR-REC-08:** Recruiters can close a job posting early.

#### 4.3.3 Applicant Dashboard

**FR-REC-09:** Recruiters view all applicants per job with the following data columns: name, CGPA, branch, batch, resume score (AI), applied date, and current status.  
**FR-REC-10:** Filters available: CGPA range, branch (multi-select), batch year, skill keywords, AI resume score range.  
**FR-REC-11:** Sort by: CGPA (asc/desc), resume score (asc/desc), applied date.  
**FR-REC-12:** Recruiter can view individual student profiles and download resumes.

#### 4.3.4 Shortlisting & Scheduling

**FR-REC-13:** Recruiters can shortlist one or many applicants via bulk action checkboxes.  
**FR-REC-14:** Status updates (shortlist, reject, schedule interview) trigger automated email notifications to students.  
**FR-REC-15:** Interview scheduling: recruiter selects date/time slots; students receive an email with details.  
**FR-REC-16:** Recruiter can annotate individual applicants with private notes.

---

### 4.4 Placement Cell (Admin) Module

#### 4.4.1 Company & Recruiter Management

**FR-ADM-01:** Admin reviews pending recruiter registrations with company details.  
**FR-ADM-02:** Approve or reject with a reason; rejected companies can reapply after 30 days.  
**FR-ADM-03:** Admin can revoke recruiter access at any time.

#### 4.4.2 Analytics Dashboard

**FR-ADM-04:** Dashboard shows: total students registered, total placed, placement percentage by branch and batch, average CTC offered, total active companies, total job postings, pending/approved/rejected applications breakdown.  
**FR-ADM-05:** Charts for: monthly placement trends, branch-wise placement %, top hiring companies.  
**FR-ADM-06:** Data refreshes in near-real-time (max 5-minute delay).

#### 4.4.3 Report Generation

**FR-ADM-07:** Admin can generate reports filtered by: batch year, branch, company, date range.  
**FR-ADM-08:** Report types: Placement Summary, Company-wise Hiring, Branch-wise Statistics, Offer Comparison.  
**FR-ADM-09:** Reports are exportable as PDF and CSV.  
**FR-ADM-10:** Report generation must complete within 30 seconds for data sets up to 5,000 students.

#### 4.4.4 Announcement Board

**FR-ADM-11:** Admin can post announcements visible to all students or targeted by branch/batch.  
**FR-ADM-12:** Announcements support: title, body (rich text), urgency level (info / warning / critical), expiry date.  
**FR-ADM-13:** Students receive push (in-app) and email notifications for new announcements.  
**FR-ADM-14:** Announcements archive automatically after their expiry date.

---

### 4.5 Payment Module

**FR-PAY-01:** Recruiter Job Listing Fee: collected via sandbox checkout (Stripe/Razorpay) before a job is submitted.  
**FR-PAY-02:** Student Premium Subscription: monthly or annual plan, unlocks unlimited AI mock interviews + priority recruiter feed placement.  
**FR-PAY-03:** Payment receipts are emailed automatically.  
**FR-PAY-04:** Failed payments result in a retry prompt; after 3 failures, the action is blocked.  
**FR-PAY-05:** Subscription management: students can cancel, downgrade, and view billing history.  
**FR-PAY-06:** All payment data is handled via Stripe/Razorpay — no card data stored on HireLoop servers.  
**FR-PAY-07:** Webhooks handle async payment status updates.

---

## 5. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Dashboard load time | < 2 seconds (P95) |
| Performance | AI analysis response time | < 8 seconds |
| Performance | Report generation | < 30 seconds |
| Security | Authentication | JWT + RBAC, HTTPS enforced |
| Security | OWASP Top 10 | Full compliance |
| Security | File uploads | Virus scanning + type validation |
| Availability | Platform uptime | 99% SLA |
| Scalability | Concurrent users | Support 500 simultaneous users (Phase 1) |
| Scalability | Architecture | Multi-tenant ready for Phase 2 |
| Accessibility | WCAG 2.1 | Level AA compliance |
| Data Privacy | Student data | DPDP Act compliance (India) |
| AI Rate Limiting | Per-user AI calls | Throttled at service layer |

---

## 6. MVP Scope

The following constitute the **Hackathon MVP**:

- Authentication with all three roles
- Student profile + resume upload
- Resume AI analysis (ATS scoring + suggestions)
- Job posting by recruiters
- One-click apply system
- Application status tracker (basic pipeline)
- Admin dashboard (key metrics)
- Company approval workflow
- Announcement board (basic)

**Phase 2 additions:**
- AI mock interview (full session + evaluation)
- Payment integration
- Smart job recommendation engine
- Cover letter generator
- Resume builder with PDF export
- Placement report downloads

---

## 7. Constraints & Assumptions

- **AI costs** are managed via per-user usage limits; premium users have relaxed limits.
- **Fake recruiters** are mitigated by admin approval gating.
- **Resume parsing errors** have a manual-edit fallback path.
- The system assumes a single college per deployment in Phase 1.
- All AI calls go to external LLM APIs (OpenAI or equivalent); no on-device inference.

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI API latency degrades UX | Medium | High | Async job queue; skeleton loaders; cached results |
| Fake recruiter registrations | Medium | High | Admin approval gate + domain verification |
| Resume parsing failure | High | Medium | Fallback to manual entry + error logging |
| Payment gateway downtime | Low | High | Webhook retry logic; graceful error UI |
| Student data breach | Low | Critical | Encrypted storage, audit logs, RBAC |
| High AI cost from abuse | Medium | Medium | Rate limiting + premium tier throttling |

---

## 9. Launch Strategy

1. **Pilot:** Deploy to one engineering college (300–500 students, 10–20 recruiters)
2. **Iterate:** Collect placement data, AI scoring accuracy feedback, and UX pain points
3. **Expand:** Add multi-college SaaS support with tenant isolation
4. **Monetise:** Recruiter listing fees + student premium subscriptions at scale

---

*End of Product Requirements Document*
