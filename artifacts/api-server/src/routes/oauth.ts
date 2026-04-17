import { Router, type IRouter } from "express";
import { db, usersTable, studentsTable, recruitersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";

const router: IRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "mock-client-id";
const DEFAULT_ROLE = "student";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const GoogleAuthBody = z.object({
  credential: z.string(),
  role: z.enum(["student", "recruiter", "admin"]).optional(),
});

router.post("/oauth/google", async (req, res): Promise<void> => {
  const parsed = GoogleAuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: parsed.data.credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(400).json({ error: "Invalid Google token payload" });
      return;
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || "Google User";
    const requestedRole = parsed.data.role || DEFAULT_ROLE;
    
    // Find existing user
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (!user) {
      // Create new user if not exists
      [user] = await db.insert(usersTable).values({
        email,
        passwordHash: "", // No password for OAuth users
        name,
        role: requestedRole,
      }).returning();

      // Create linked profile
      if (requestedRole === "student") {
        await db.insert(studentsTable).values({
          userId: user.id,
          name: name,
          branch: "Other", // Default branch
          batch: new Date().getFullYear().toString(),
          cgpa: 0,
        });
      } else if (requestedRole === "recruiter") {
        await db.insert(recruitersTable).values({
          userId: user.id,
          name: name,
          company: "Pending Setup",
          email: email,
        });
      }
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const JWT_SECRET = process.env.SESSION_SECRET || "hireloop-secret-key-dev-only";
    const authToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });

    res.json({ token: authToken, role: user.role });
  } catch (error) {
    console.error("Google verify error:", error);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

export default router;
