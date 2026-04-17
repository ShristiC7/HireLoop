# 🚀 Deploying HireLoop to Render

This guide provides a step-by-step walkthrough to deploy the HireLoop monorepo to [Render](https://render.com). Since HireLoop is built as a TypeScript monorepo where the backend serves the frontend, it is deployed as a single **Web Service**.

---

## 📋 Prerequisites

Before you begin, ensure you have:
1. A **GitHub** account with the HireLoop repository pushed.
2. A **Supabase** project (for your PostgreSQL database).
3. An **OpenAI** API key (for the AI Resume Builder).
4. A **Google Cloud** project (for Google OAuth login).

---

## 🛠️ Step 1: Prepare Your External Services

### 1. Database (Supabase)
1. Go to your Supabase project settings.
2. Connection string: `postgresql://postgres.[ref]:[password]@[host]:6543/postgres`.
3. **Important**: Use the "Transaction" or "Session" pooler port (usually `6543`) rather than the direct port (`5432`) to prevent connection limit issues on Render.

### 2. Authentication (Google Cloud)
1. In Google Cloud Console, add your future Render URL (e.g., `https://hireloop-demo.onrender.com`) to the **Authorized JavaScript Origins**.
2. Add `https://hireloop-demo.onrender.com/api/oauth/google/callback` to **Authorized Redirect URIs**.

---

## ☁️ Step 2: Create a Web Service on Render

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.

### ⚙️ Basic Settings
- **Name**: `hireloop` (or your choice).
- **Environment**: `Node`.
- **Region**: Select the one closest to your users.
- **Branch**: `main`.

### 🏗️ Build & Start Settings
- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm run start`

---

## 🔑 Step 3: Configure Environment Variables

Click the **Environment** tab in your Render service and add the following variables from your `.env` file:

| Variable | Recommended Value / Source |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render's default) |
| `DATABASE_URL` | Your Supabase connection string. |
| `SESSION_SECRET` | A long random string. |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console. |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | From OpenAI Dashboard. |
| `FRONTEND_URL` | Your Render URL (e.g., `https://hireloop.onrender.com`). |
| `VITE_API_URL` | `/api` (This ensures the frontend talks to its own host). |

> [!TIP]
> **Pro Tip**: Use the **"Secret File"** feature on Render to upload your entire `.env` file at once if you prefer, but adding them manually in the dashboard is the standard production approach.

---

## 🧪 Step 4: Verification

Once the build finishes and the service status turns **"Live"**:
1. Open your Render URL.
2. Sign in with a demo account or use Google Sign-in.
3. Navigate to the **Resume Builder** and verify the AI optimization works.
4. Try uploading/saving a resume changes to ensure DB persistence.

---

## 🔧 Troubleshooting

- **Build Fails (Memory)**: pnpm is efficient, but if the build hangs, ensure you are using at least a **Starter** instance (not Free) as the Free tier has limited RAM for large TypeScript builds.
- **CORS Errors**: Double-check `FRONTEND_URL` exactly matches the URL in your browser (no trailing slash).
- **Port Conflict**: Render automatically manages the `PORT` variable. Do not hardcode `3001` in your production scripts.
