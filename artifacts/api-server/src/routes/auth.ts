import { Router, type IRouter } from "express";
import { db, usersTable, studentsTable, recruitersTable, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const JWT_SECRET = process.env.SESSION_SECRET || "hireloop-secret-key";

function signToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { email, password, name, role } = parsed.data;
  logger.info({ email, role }, "Registration attempt");

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    logger.warn({ email }, "Registration failed: Email already exists");
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, name, role }).returning();

  if (role === "student") {
    const [student] = await db.insert(studentsTable).values({
      userId: user.id,
      name,
      email,
      branch: "CSE",
      batch: "2025",
      cgpa: 0,
      skills: [],
      placementStatus: "unplaced",
    }).returning();

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
  } else if (role === "recruiter") {
    await db.insert(recruitersTable).values({
      userId: user.id,
      name,
      email,
      company: "Unknown Company",
      isApproved: false,
    });
  }

  const token = signToken(user.id, user.role);

  logger.info({ userId: user.id, email: user.email, role: user.role }, "New user registered successfully");

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  logger.info({ email }, "Login attempt");
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    logger.warn({ email }, "Login failed: User not found");
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcryptjs.compare(password, user.passwordHash);
  if (!valid) {
    logger.warn({ email }, "Login failed: Invalid password");
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id, user.role);

  logger.info({ userId: user.id, email: user.email }, "User logged in successfully");

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
    });
    logger.error({ error, stack: error instanceof Error ? error.stack : undefined }, "Auth payload verification error");
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
export { JWT_SECRET };
