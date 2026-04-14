import { Router, type IRouter } from "express";
import { db, recruitersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { UpdateRecruiterProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/recruiters/profile", requireAuth, requireRole("recruiter"), async (req: AuthRequest, res): Promise<void> => {
  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }
  res.json(recruiter);
});

router.put("/recruiters/profile", requireAuth, requireRole("recruiter"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateRecruiterProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  const [updated] = await db.update(recruitersTable)
    .set(parsed.data)
    .where(eq(recruitersTable.id, recruiter.id))
    .returning();

  res.json(updated);
});

export default router;
