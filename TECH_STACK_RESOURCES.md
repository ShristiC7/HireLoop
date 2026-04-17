# 📚 HireLoop: Technical Stack & Implementation Guide

Welcome to the HireLoop core documentation. This document is designed for beginners and developers who want to understand **how** HireLoop works, **why** certain tools were chosen, and **how** each feature is implemented under the hood.

---

## 🏗️ 1. The Big Picture: Monorepo Architecture

HireLoop uses a **Monorepo** structure. 
- **What it is**: Instead of having separate folders for "frontend" and "backend," everything is in one project.
- **Tools**: We use **pnpm Workspaces**. 
- **The Payoff**: This allows the frontend and backend to share pieces of code (like data validation rules) easily. It makes the project easier to build, test, and deploy as a single unit.

---

## 🎨 2. The Frontend (The User Face)

### **React & Vite**
- **Why?** React is the industry standard for building "Single Page Applications" (SPAs). Vite is a newer build tool that makes development incredibly fast—you see your changes instantly.
- **Implementation**: The main app lives in `artifacts/hireloop/src`.

### **Tailwind CSS & Shadcn UI**
- **Why?** Writing manual CSS can be slow. Tailwind allows us to style components using "utility classes" directly in HTML. Shadcn UI provides accessible, beautiful components (like buttons, dialogs, and cards) out of the box.
- **Impact**: This is why HireLoop looks premium—high-quality components with consistent spacing and colors.

### **Framer Motion**
- **Why?** Static websites feel boring. Framer Motion adds smooth transitions and "micro-animations" (hover effects, fading in) that make the app feel alive and premium.

---

## ⚙️ 3. The Backend (The Brain)

### **Node.js & Express**
- **Why?** Node.js is fast and uses JavaScript, the same language as the frontend. Express is a "minimalist" framework that handles routing (sending you to the right page/data).
- **Implementation**: See the API routes in `artifacts/api-server/src/routes`.

### **JWT Authentication**
- **Why?** Traditional sessions can be complex. JSON Web Tokens (JWT) allow us to securely verify a user's identity via a signed "token" passed in the header.

---

## 🗄️ 4. Data & Logic (The Memory)

### **Supabase (PostgreSQL)**
- **Why?** It is a high-performance relational database. It’s perfect for HireLoop because we have complex relationships (Students have Resumes, Resumes belong to Users, Users apply to Jobs).

### **Drizzle ORM**
- **Why?** An "Object Relational Mapper" (ORM) lets us write database queries using JavaScript instead of raw SQL code. Drizzle is ultra-fast and gives us "type safety" (preventing errors before you even run the code).
- **Implementation**: Check `lib/db/src/schema` for the table definitions.

---

## 🤖 5. Key Feature Implementations

### **AI Resume Optimizer**
- **How it works**: The frontend sends the user's resume text to our backend. The backend cleans it up and sends a secret request to **OpenAI (GPT-4)** with a specific "prompt" (e.g., "Make this bullet point more professional"). 
- **Flow**: User Click -> Backend Secure Fetch -> OpenAI -> Optimized Result -> UI Update.

### **Google OAuth Login**
- **How it works**: We use the official Google Identity SDK. When you click "Login," Google gives us a signed "Credential." Our backend verifies this with Google's servers and, if valid, either logs you in or creates a new student account automatically.
- **Safety**: Your passwords are never shared—Google only tells us "Yes, this is valid user X."

---

## 💡 Why This Stack?

| Problem | Our Solution | Rationale |
| :--- | :--- | :--- |
| **Speed of Development** | Vite + pnpm + Tailwind | Minimizes "waiting" time and boilerplate. |
| **User Confidence** | Drizzle + TypeScript | Catches bugs during coding, not during use. |
| **Scalability** | PostgreSQL + Monorepo | Relational data is standard for serious platforms. |
| **User Experience** | Framer Motion + Shadcn | Provides a "consumer-grade" feel that users love. |

---

## 🚀 Learning Path for Beginners
If you want to modify this project, we recommend learning in this order:
1. **React Hooks** (`useState`, `useEffect`) — Found everywhere in `Resume.tsx`.
2. **Tailwind Classes** — Look at how we layout the Dashboards.
3. **Express Routes** — See how data flows from the frontend to the DB.
4. **Drizzle Queries** — Learn how we fetch jobs or students from the database.
