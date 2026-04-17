import { Router, type IRouter } from "express";
import { db, studentsTable, applicationsTable, jobsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router: IRouter = Router();

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
}

router.get("/admin/reports/students", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const students = await db
    .select({
      id: studentsTable.id,
      name: usersTable.name,
      email: usersTable.email,
      branch: studentsTable.branch,
      batch: studentsTable.batch,
      cgpa: studentsTable.cgpa,
      placementStatus: studentsTable.placementStatus,
      packageLpa: studentsTable.packageLpa,
      placedCompany: studentsTable.placedCompany,
    })
    .from(studentsTable)
    .innerJoin(usersTable, eq(usersTable.id, studentsTable.userId));

  const csv = toCSV(
    ["ID", "Name", "Email", "Branch", "Batch", "CGPA", "Placement Status", "Package (LPA)", "Company"],
    students.map(s => [s.id, s.name, s.email, s.branch, s.batch, s.cgpa, s.placementStatus, s.packageLpa, s.placedCompany])
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="students_report_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

router.get("/admin/reports/placements", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const placed = await db
    .select({
      name: usersTable.name,
      email: usersTable.email,
      branch: studentsTable.branch,
      batch: studentsTable.batch,
      cgpa: studentsTable.cgpa,
      packageLpa: studentsTable.packageLpa,
      placedCompany: studentsTable.placedCompany,
    })
    .from(studentsTable)
    .innerJoin(usersTable, eq(usersTable.id, studentsTable.userId))
    .where(eq(studentsTable.placementStatus, "placed"));

  const csv = toCSV(
    ["Name", "Email", "Branch", "Batch", "CGPA", "Package (LPA)", "Company"],
    placed.map(s => [s.name, s.email, s.branch, s.batch, s.cgpa, s.packageLpa, s.placedCompany])
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="placements_report_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

router.get("/admin/reports/applications", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const apps = await db
    .select({
      appId: applicationsTable.id,
      studentName: usersTable.name,
      branch: studentsTable.branch,
      jobTitle: jobsTable.title,
      company: jobsTable.company,
      status: applicationsTable.status,
      appliedAt: applicationsTable.appliedAt,
    })
    .from(applicationsTable)
    .innerJoin(studentsTable, eq(studentsTable.id, applicationsTable.studentId))
    .innerJoin(usersTable, eq(usersTable.id, studentsTable.userId))
    .innerJoin(jobsTable, eq(jobsTable.id, applicationsTable.jobId));

  const csv = toCSV(
    ["App ID", "Student Name", "Branch", "Job Title", "Company", "Status", "Applied At"],
    apps.map(a => [a.appId, a.studentName, a.branch, a.jobTitle, a.company, a.status, a.appliedAt?.toISOString() ?? ""])
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="applications_report_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

export default router;
