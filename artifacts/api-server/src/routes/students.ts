import { Router, type IRouter } from "express";
import { db, studentsTable, resumesTable, applicationsTable, jobsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { UpdateStudentProfileBody, UpdateResumeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/students/profile", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const appsResult = await db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.studentId, student.id));
  const totalApps = Number(appsResult[0]?.count ?? 0);

  res.json({
    ...student,
    totalApplications: totalApps,
    shortlisted: 0,
    offers: 0,
  });
});

router.put("/students/profile", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateStudentProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const updateData = parsed.data;
  const fieldsWithValues = Object.entries(updateData).filter(([, v]) => v !== undefined);
  const completeness = Math.min(100, 20 + fieldsWithValues.length * 10);

  const [updated] = await db.update(studentsTable)
    .set({ ...updateData, profileCompleteness: completeness })
    .where(eq(studentsTable.id, student.id))
    .returning();

  res.json({ ...updated, totalApplications: 0, shortlisted: 0, offers: 0 });
});

router.get("/students/resume", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  let [resume] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, student.id));
  if (!resume) {
    const [newResume] = await db.insert(resumesTable).values({
      studentId: student.id,
      summary: "",
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      atsScore: 0,
    }).returning();
    resume = newResume;
  }

  res.json(resume);
});

router.put("/students/resume", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const data = parsed.data;
  const skillCount = (data.experience?.length ?? 0) + (data.projects?.length ?? 0);
  const atsScore = Math.min(100, 20 + skillCount * 15 + (data.summary ? 10 : 0) + (data.certifications?.length ?? 0) * 5);

  const [existing] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, student.id));
  let updated;
  if (existing) {
    [updated] = await db.update(resumesTable)
      .set({ ...data, atsScore, lastUpdated: new Date() })
      .where(eq(resumesTable.studentId, student.id))
      .returning();
  } else {
    [updated] = await db.insert(resumesTable)
      .values({ studentId: student.id, ...data, atsScore, experience: data.experience ?? [], education: data.education ?? [], projects: data.projects ?? [], certifications: data.certifications ?? [], languages: data.languages ?? [], summary: data.summary ?? "" })
      .returning();
  }

  await db.update(studentsTable).set({ resumeScore: atsScore }).where(eq(studentsTable.id, student.id));

  res.json(updated);
});

export default router;
