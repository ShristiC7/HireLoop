import { Router, type IRouter } from "express";
import { db, studentsTable, recruitersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { ApproveRecruiterBody, ApproveRecruiterParams, ListStudentsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/students", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = ListStudentsQueryParams.safeParse(req.query);
  const filters = parsed.success ? parsed.data : {};

  let students = await db.select().from(studentsTable);

  if (filters.branch) {
    students = students.filter(s => s.branch === filters.branch);
  }
  if (filters.placed !== undefined) {
    const isPlaced = filters.placed === true || filters.placed === "true" as unknown;
    students = students.filter(s => isPlaced ? s.placementStatus === "placed" : s.placementStatus !== "placed");
  }

  res.json(students.map(s => ({ ...s, totalApplications: 0, shortlisted: 0, offers: 0 })));
});

router.get("/admin/recruiters", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const recruiters = await db.select().from(recruitersTable);
  res.json(recruiters);
});

router.put("/admin/recruiters/:recruiterId/approve", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.recruiterId) ? req.params.recruiterId[0] : req.params.recruiterId;
  const params = ApproveRecruiterParams.safeParse({ recruiterId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid recruiter ID" });
    return;
  }

  const parsed = ApproveRecruiterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.id, params.data.recruiterId));
  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  const [updated] = await db.update(recruitersTable)
    .set({ isApproved: parsed.data.isApproved })
    .where(eq(recruitersTable.id, params.data.recruiterId))
    .returning();

  res.json(updated);
});

router.put("/admin/students/:studentId/placement", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const studentId = parseInt(req.params.studentId as string, 10);
  if (isNaN(studentId)) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }

  const { placementStatus, placedCompany, packageLpa } = req.body;

  if (!placementStatus || !["unplaced", "placed", "internship"].includes(placementStatus)) {
    res.status(400).json({ error: "Invalid placement status" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const updateData: Record<string, unknown> = { placementStatus };
  if (placedCompany !== undefined) updateData.placedCompany = placedCompany;
  if (packageLpa !== undefined) updateData.packageLpa = Number(packageLpa);

  const [updated] = await db.update(studentsTable)
    .set(updateData)
    .where(eq(studentsTable.id, studentId))
    .returning();

  res.json({ ...updated, totalApplications: 0, shortlisted: 0, offers: 0 });
});

export default router;
