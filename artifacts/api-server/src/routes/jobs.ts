import { Router, type IRouter } from "express";
import { db, jobsTable, recruitersTable, applicationsTable, usersTable } from "@workspace/db";
import { eq, and, gte, ilike, count, ne, inArray, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { CreateJobBody, ListJobsQueryParams, GetJobParams, UpdateJobParams, DeleteJobParams } from "@workspace/api-zod";
import { sendEmail } from "../services/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function enrichJobsWithCounts(jobsList: typeof jobsTable.$inferSelect[]) {
  if (jobsList.length === 0) return [];
  const jobIds = jobsList.map(j => j.id);
  const counts = await db
    .select({ jobId: applicationsTable.jobId, count: count() })
    .from(applicationsTable)
    .where(inArray(applicationsTable.jobId, jobIds))
    .groupBy(applicationsTable.jobId);
    
  const countMap = new Map(counts.map(c => [c.jobId, Number(c.count)]));
  return jobsList.map(job => ({ ...job, applicantCount: countMap.get(job.id) ?? 0 }));
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
  const enriched = await enrichJobsWithCounts(jobs);
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
    status: "pending",
    eligibleBranches: parsed.data.eligibleBranches ?? [],
    skills: parsed.data.skills ?? [],
  }).returning();

  res.status(201).json({ ...job, applicantCount: 0 });
});

router.get("/jobs/mine", requireAuth, requireRole("recruiter"), async (req: AuthRequest, res): Promise<void> => {
  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.json([]);
    return;
  }

  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.recruiterId, recruiter.id));
  const enriched = await enrichJobsWithCounts(jobs);
  res.json(enriched);
});

router.get("/jobs/pending", requireAuth, requireRole("admin"), async (_req: AuthRequest, res): Promise<void> => {
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.status, "pending"));
  const enriched = await enrichJobsWithCounts(jobs);
  res.json(enriched);
});

router.patch("/jobs/:jobId/approve", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId as string, 10);
  const [job] = await db.update(jobsTable)
    .set({ status: "active" })
    .where(eq(jobsTable.id, jobId))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  try {
    const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.id, job.recruiterId));
    if (recruiter) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, recruiter.userId));
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `Job Approved: ${job.title}`,
          html: `<p>Your job posting <strong>${job.title}</strong> at <strong>${job.company}</strong> has been approved and is now live on HireLoop.</p><p>Students will now be able to view and apply to your posting.</p>`,
        });
      }
    }
  } catch (error) {
    logger.warn({ error, jobId }, "Failed to send job approval email");
  }

  res.json((await enrichJobsWithCounts([job]))[0]);
});

router.patch("/jobs/:jobId/reject", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId as string, 10);
  const { reason } = req.body;

  const [job] = await db.update(jobsTable)
    .set({ status: "closed" })
    .where(eq(jobsTable.id, jobId))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  try {
    const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.id, job.recruiterId));
    if (recruiter) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, recruiter.userId));
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `Job Posting Rejected: ${job.title}`,
          html: `<p>Your job posting <strong>${job.title}</strong> at <strong>${job.company}</strong> has been rejected.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}<p>Please review the posting and resubmit after making necessary changes.</p>`,
        });
      }
    }
  } catch (error) {
    logger.warn({ error, jobId }, "Failed to send job rejection email");
  }

  res.json((await enrichJobsWithCounts([job]))[0]);
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

  const [enriched] = await enrichJobsWithCounts([job]);
  res.json(enriched);
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

  const [enriched] = await enrichJobsWithCounts([updated]);
  res.json(enriched);
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
