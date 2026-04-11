<!-- GSD:project-start source:PROJECT.md -->
## Project

**HireLoop Stabilization**

**Core Value:** A seamless, production-ready full-stack job platform where applicants can accurately view job listings, experience functional AI mock interviews, and access full user profiles without running into API rate limit constraints.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Frontend (Client)
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, PostCSS, Radix UI primitives, shadcn/ui components
- **State Management & Fetching**: React Query, React Hook Form
- **Routing**: React Router DOM (v6 frontend)
- **Validation**: Zod
- **Other utilities**: lucide-react (icons), date-fns, recharts (visualizations)
## Backend (Server)
- **Core**: Node.js, Express (ES Modules)
- **Database**: PostgreSQL with Prisma ORM
- **Security**: bcryptjs, jsonwebtoken (JWT), helmet, cors, express-rate-limit
- **AI/LLM**: `@anthropic-ai/sdk`, `openai` for resume parsing or interview simulation
- **Document Processing**: `pdf-parse`
- **File Uploads**: multer, cloudinary, multer-storage-cloudinary
- **Payment Processing**: razorpay, stripe
- **Logging/Monitoring**: winston, morgan
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Code Style**: ESLint configured on both client and server for linting and enforcing code standards.
- **Language**: TypeScript is strictly used on the client (`.ts`, `.tsx`); JavaScript using ES modules (`type: module`) is used on the server (`.js`).
- **Package Management**: Both applications are typically run from the root workspace using tools like `concurrently` (e.g. `npm run dev` at the root starts both dev servers).
- **Styling**: Utility-first styling via Tailwind CSS is standard on the frontend, using Radix primitives.
- **Environment Variables**: `.env` files are used for both client (`VITE_` prefixed variables) and server (`PORT`, `DATABASE_URL`, API keys).
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Top-Level Architecture
- **Client**: Single Page App built with Vite, React, and TypeScript. Uses Context API and React Query for managing state and server data caching.
- **Server**: RESTful JSON API using Node.js and Express. Implements an MVC-like pattern (Routes -> Controllers -> Services).
- **Database Layer**: Prisma ORM interacting with PostgreSQL. Includes a seeding mechanism (`prisma/seed.js`).
## Communication
- Client communicates with the Server exclusively through REST HTTP calls.
- Server acts as an intermediary, connecting to the PostgreSQL database, AI APIs, Cloudinary blob storage, and Payment gateways.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
