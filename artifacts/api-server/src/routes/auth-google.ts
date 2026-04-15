import { Router, type IRouter } from "express";
import { OAuth2Client } from "google-auth-library";
import { db, usersTable, studentsTable, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";
import { JWT_SECRET } from "./auth";

const router: IRouter = Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/v1/auth/google/callback"
);

function signToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

// Route to start the Google OAuth flow
router.get("/auth/google", (req, res) => {
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(url);
});

// Callback route where Google redirects after successful login
router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("No code provided");
    return;
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).send("Invalid Google token payload");
      return;
    }

    const email = payload.email;
    const name = payload.name || "Google User";
    const googleId = payload.sub;

    // 1. Check if user exists
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (!user) {
      // 2. Create new user if not found (Default to student role)
      [user] = await db.insert(usersTable).values({
        email,
        name,
        role: "student",
        googleId,
        // passwordHash is nullable now
      }).returning();

      // 3. Initialize student profile
      const [student] = await db.insert(studentsTable).values({
        userId: user.id,
        name,
        email,
        branch: "CSE", // Default
        batch: "2025", // Default
        cgpa: 0,
        skills: [],
        placementStatus: "unplaced",
      }).returning();

      // 4. Initialize resume
      await db.insert(resumesTable).values({
        studentId: student.id,
        summary: "",
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: [],
        atsScore: 0,
      });

      logger.info({ userId: user.id, email }, "New user created via Google OAuth");
    } else if (!user.googleId) {
      // Link existing account to Google if not already linked
      await db.update(usersTable).set({ googleId }).where(eq(usersTable.id, user.id));
      logger.info({ userId: user.id, email }, "Linked existing account to Google OAuth");
    }

    // 5. Generate HireLoop JWT
    const token = signToken(user.id, user.role);

    // 6. Redirect back to frontend callback page with the token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    logger.error(err, "Google OAuth Callback failed");
    res.status(500).send("Authentication failed");
  }
});

export default router;
