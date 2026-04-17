import { Router, type IRouter } from "express";
import { db, applicationsTable, studentsTable, jobsTable, recruitersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { ApplyToJobBody, UpdateApplicationStatusBody, UpdateApplicationStatusParams, GetJobApplicationsParams } from "@workspace/api-zod";
import { sendEmail, applicationStatusEmail } from "../services/email";
import { wsManager } from "../lib/wsManager";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function enrichApplication(app: typeof applicationsTable.$inferSelect) {
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
  return { ...app, job: job ? { ...job, applicantCount: 0 } : undefined };
}

router.get("/applications", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.json([]);
    return;
  }

  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.studentId, student.id));
  const enriched = await Promise.all(apps.map(enrichApplication));
  res.json(enriched);
});

router.post("/applications", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = ApplyToJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const existing = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.studentId, student.id), eq(applicationsTable.jobId, parsed.data.jobId)));
  if (existing.length > 0) {
    res.status(400).json({ error: "Already applied to this job" });
    return;
  }

  const [app] = await db.insert(applicationsTable).values({
    studentId: student.id,
    jobId: parsed.data.jobId,
    status: "applied",
  }).returning();

  const enriched = await enrichApplication(app);

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (user && enriched.job) {
      await sendEmail({
        to: user.email,
        subject: `Application Received: ${enriched.job.title} at ${enriched.job.company}`,
        html: applicationStatusEmail("applied", enriched.job.title, enriched.job.company),
      });
    }
  } catch (error) { 
    logger.warn({ error }, "Failed to send application received email");
  }

  res.status(201).json(enriched);
});

router.put("/applications/:applicationId/status", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.applicationId) ? req.params.applicationId[0] : req.params.applicationId;
  const params = UpdateApplicationStatusParams.safeParse({ applicationId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const parsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, params.data.applicationId));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.interviewDate) updateData.interviewDate = new Date(parsed.data.interviewDate);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [updated] = await db.update(applicationsTable)
    .set(updateData)
    .where(eq(applicationsTable.id, params.data.applicationId))
    .returning();

  const enriched = await enrichApplication(updated);

  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, updated.studentId));
    if (student) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
      if (user && enriched.job) {
        if (wsManager) {
          wsManager.broadcastToUser(user.id, {
            type: "APPLICATION_STATUS_UPDATE",
            applicationId: enriched.id,
            jobTitle: enriched.job.title,
            company: enriched.job.company,
            status: parsed.data.status,
          });
        }
        await sendEmail({
          to: user.email,
          subject: `Application Update: ${enriched.job.title} at ${enriched.job.company}`,
          html: applicationStatusEmail(parsed.data.status, enriched.job.title, enriched.job.company),
        });
      }
    }
  } catch (error) {
    logger.warn({ error, applicationId: updated.id }, "Failed to send application status update email");
  }

  res.json(enriched);
});

router.get("/jobs/:jobId/applications", requireAuth, requireRole("recruiter"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetJobApplicationsParams.safeParse({ jobId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  const statusFilter = req.query.status as string | undefined;
  let appsQuery = db.select().from(applicationsTable).where(eq(applicationsTable.jobId, params.data.jobId)).$dynamic();

  if (statusFilter) {
    appsQuery = appsQuery.where(and(eq(applicationsTable.jobId, params.data.jobId), eq(applicationsTable.status, statusFilter as "applied" | "shortlisted" | "interview" | "offer" | "rejected")));
  }

  const apps = await appsQuery;
  const enriched = await Promise.all(apps.map(async (app) => {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, app.studentId));
    return {
      ...app,
      student: student ? { ...student, totalApplications: 0, shortlisted: 0, offers: 0 } : undefined,
    };
  }));

  res.json(enriched);
});

export default router;
