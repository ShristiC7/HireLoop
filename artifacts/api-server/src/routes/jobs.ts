import { Router, type IRouter } from "express";
import { db, jobsTable, recruitersTable, applicationsTable } from "@workspace/db";
import { eq, and, gte, ilike, count } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { CreateJobBody, ListJobsQueryParams, GetJobParams, UpdateJobParams, DeleteJobParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichJobWithCount(job: typeof jobsTable.$inferSelect) {
  const [result] = await db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.jobId, job.id));
  return { ...job, applicantCount: Number(result?.count ?? 0) };
}

router.get("/jobs", async (req, res): Promise<void> => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  const filters = parsed.success ? parsed.data : {};

  let query = db.select().from(jobsTable).$dynamic();

  const conditions = [];
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(jobsTable.status, filters.status as "active" | "closed" | "pending"));
  } else if (!filters.status) {
    conditions.push(eq(jobsTable.status, "active"));
  }
  if (filters.minCgpa !== undefined) {
    conditions.push(gte(jobsTable.minCgpa, Number(filters.minCgpa)));
  }
  if (filters.search) {
    conditions.push(ilike(jobsTable.title, `%${filters.search}%`));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const jobs = await query;
  const enriched = await Promise.all(jobs.map(enrichJobWithCount));
  res.json(enriched);
});

router.post("/jobs", requireAuth, requireRole("recruiter"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.status(404).json({ error: "Recruiter profile not found" });
    return;
  }

  const deadlineDate = new Date(parsed.data.deadline);
  const [job] = await db.insert(jobsTable).values({
    ...parsed.data,
    recruiterId: recruiter.id,
    deadline: deadlineDate,
    status: "active",
    eligibleBranches: parsed.data.eligibleBranches ?? [],
    skills: parsed.data.skills ?? [],
  }).returning();

  res.status(201).json({ ...job, applicantCount: 0 });
});

router.get("/jobs/:jobId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetJobParams.safeParse({ jobId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(await enrichJobWithCount(job));
});

router.put("/jobs/:jobId", requireAuth, requireRole("recruiter"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = UpdateJobParams.safeParse({ jobId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  const [existing] = await db.select().from(jobsTable).where(and(eq(jobsTable.id, params.data.jobId), eq(jobsTable.recruiterId, recruiter.id)));
  if (!existing) {
    res.status(404).json({ error: "Job not found or not yours" });
    return;
  }

  const deadlineDate = new Date(parsed.data.deadline);
  const [updated] = await db.update(jobsTable)
    .set({ ...parsed.data, deadline: deadlineDate })
    .where(eq(jobsTable.id, params.data.jobId))
    .returning();

  res.json(await enrichJobWithCount(updated));
});

router.delete("/jobs/:jobId", requireAuth, requireRole("recruiter"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = DeleteJobParams.safeParse({ jobId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(and(eq(jobsTable.id, params.data.jobId), eq(jobsTable.recruiterId, recruiter.id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  await db.delete(jobsTable).where(eq(jobsTable.id, params.data.jobId));
  res.json({ message: "Job deleted" });
});

export default router;
