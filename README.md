# 🚀 HireLoop — End-to-End Campus Recruitment Portal
(#26ENHL3: Problem Statement 3)

HireLoop is a full-stack **AI-powered campus placement management platform** designed to streamline recruitment workflows between **students, recruiters, and college placement cells**.

The platform digitizes the entire placement lifecycle — from resume creation and job applications to AI interview preparation and placement analytics — within a single ecosystem.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [AI Capabilities](#-ai-capabilities)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Modules](#-api-modules)
- [Future Enhancements](#-future-enhancements)

---

## 🧠 Overview

**HireLoop** connects three stakeholders involved in campus hiring:

- 🎓 Students preparing for placements
- 🏢 Companies recruiting talent
- 🏫 Placement Cells managing recruitment

It combines a traditional placement portal with modern AI features such as:

- Resume analysis
- Interview simulations
- Job matching intelligence
- Automated placement analytics

---

## ✨ Key Features

### 👩‍🎓 Student Portal
- Profile creation and management
- Resume builder with downloadable PDF
- AI Resume Analyzer (ATS scoring & suggestions)
- One-click job applications
- Application status tracking
- AI Mock Interview preparation
- Smart job recommendations
- Cover letter auto-generation
<img width="1915" height="991" alt="image" src="https://github.com/user-attachments/assets/672867d5-4259-4939-90c1-27953f3296f3" />


---

### 🏢 Recruiter Portal
- Company registration & onboarding
- Job posting with eligibility filters
- Applicant filtering (skills, CGPA, branch)
- Candidate shortlisting
- Interview scheduling
- Automated email notifications


---

### 🏫 Placement Cell Dashboard
- Recruiter approval system
- Placement analytics dashboard
- Student placement statistics
- Downloadable placement reports
- Announcement board for students

---

### 💳 Payments
- Company job listing fee (sandbox payment)
- Student premium subscription:
  - Unlimited AI interviews
  - Priority recruiter visibility

---

## 🤖 AI Capabilities

- Resume ATS scoring
- Resume ↔ Job Description matching
- Keyword gap analysis
- AI-generated cover letters
- Mock interview evaluation & feedback
- Smart job recommendation engine

---

## 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Next.js / React |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | JWT + Role-Based Access |
| AI Integration | LLM APIs |
| File Storage | Cloud Storage |
| Payments | Stripe / Razorpay Sandbox |

---

## 🏗 System Architecture
```

Client (Next.js)
│
▼
Backend API (Node.js + Express)
│
├── Authentication Service
├── Resume Service
├── AI Processing Service
├── Job & Application Service
└── Payment Service
│
▼
Database (PostgreSQL)
│
▼
AI APIs / External Services

```
---
## Architecture overview
```
┌─────────────────────────────────────────────────────────┐
│                   Client Layer                          │
│          Next.js 14 (App Router) + Tailwind CSS         │
│    Student Portal │ Recruiter Portal │ Admin Dashboard  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────┐
│                   API Gateway Layer                     │
│          Node.js + Express   |   Rate Limiter           │
│          JWT Middleware       |   Role Guard             │
└──────┬───────────┬───────────┬───────────┬──────────────┘
       │           │           │           │
┌──────▼───┐ ┌────▼────┐ ┌───▼───┐ ┌────▼──────┐
│ Auth     │ │ Student │ │ Job & │ │ AI        │
│ Service  │ │ Service │ │ App   │ │ Service   │
│          │ │         │ │ Svc   │ │           │
└──────────┘ └─────────┘ └───────┘ └───────────┘
       │           │           │           │
┌──────▼───┐ ┌────▼────┐ ┌───▼───┐ ┌────▼──────┐
│ Recruiter│ │ Resume  │ │Payment│ │ Admin     │
│ Service  │ │ Service │ │ Svc   │ │ Service   │
└──────────┘ └─────────┘ └───────┘ └───────────┘
                           │
              ┌────────────▼────────────┐
              │     Data Layer          │
              │  PostgreSQL (Primary)   │
              │  Redis (Cache/Sessions) │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   External Services     │
              │  OpenAI API  │ Stripe   │
              │  Cloud CDN   │ Nodemailer│
              └─────────────────────────┘

 ```
## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/ShristiC7/HireLoop.git
cd HireLoop
```
### 2️⃣ Install Dependencies
Backend

```bash
cd server
npm install

```
Frontend

```bash
cd client
npm install

```
### 3️⃣ Run Development Servers

Backend:

```bash
npm run dev

```
Frontend:

```bash
npm run dev

```
---
### 🔐 Environment Variables

Create a .env file in the server directory:

```bash
PORT=5000
DATABASE_URL=
JWT_SECRET=
OPENAI_API_KEY=
PAYMENT_SECRET_KEY=
CLOUD_STORAGE_KEY=

```
---
## 📁 Project Structure
```
HireLoop/
│
├── client/                 # Frontend (Next.js)
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── styles/
│
├── server/                 # Backend (Node.js)
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   └── utils/
│
└── README.md
```
---
## 🔌 API Modules

- Authentication API  
- Student Profile API  
- Resume Builder API  
- Job Management API  
- Application Tracking API  
- Interview Scheduling API  
- AI Analysis API  
- Payment API  
- Admin Analytics API  

---

## 🚀 Future Enhancements

- Video interview analysis (AI)
- Skill gap prediction engine
- Multi-college SaaS support
- Recruiter AI auto-shortlisting
- Placement performance forecasting
- Mobile application
Placement performance forecasting
Mobile application
