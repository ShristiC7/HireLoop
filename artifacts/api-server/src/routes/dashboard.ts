import { Router, type IRouter } from "express";
import { db, studentsTable, recruitersTable, jobsTable, applicationsTable, resumesTable } from "@workspace/db";
import { eq, count, sql, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function predictCareerPaths(skills: string[], branch: string) {
  const s = skills.map(sk => sk.toLowerCase());
  const roles = [
    { title: "Frontend Engineer", keywords: ["react", "typescript", "javascript", "tailwind", "next.js", "css"] },
    { title: "Backend Engineer", keywords: ["node.js", "express", "postgresql", "java", "spring", "golang", "redis"] },
    { title: "Full Stack Developer", keywords: ["react", "node.js", "javascript", "sql", "fullstack", "next.js"] },
    { title: "Data Scientist", keywords: ["python", "machine learning", "tensorflow", "pytorch", "data", "pandas"] },
    { title: "DevOps Engineer", keywords: ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux"] },
    { title: "QA Automation", keywords: ["selenium", "cypress", "testing", "quality", "automation"] },
  ];

  return roles.map(role => {
    const matchCount = role.keywords.filter(k => s.includes(k)).length;
    let score = (matchCount / role.keywords.length) * 100;
    
    // Branch boost
    if (branch === "CSE" && ["Frontend Engineer", "Backend Engineer", "Full Stack Developer", "Data Scientist"].includes(role.title)) {
      score += 15;
    }

    return {
      title: role.title,
      match: Math.round(Math.min(score, 98)),
      relevance: score > 50 ? "high" : score > 20 ? "medium" : "low"
    };
  })
  .sort((a, b) => b.match - a.match)
  .slice(0, 3);
}

router.get("/dashboard/student", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.json({
      totalApplications: 0, shortlisted: 0, interviews: 0, offers: 0,
      resumeScore: 0, profileCompleteness: 20, recentApplications: [],
      recommendedJobs: [], placementReadiness: 20,
    });
    return;
  }

  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.studentId, student.id));
  const shortlisted = apps.filter(a => ["shortlisted", "interview", "offer"].includes(a.status)).length;
  const interviews = apps.filter(a => a.status === "interview").length;
  const offers = apps.filter(a => a.status === "offer").length;

  const recentApps = apps.slice(-5);
  const enrichedApps = await Promise.all(recentApps.map(async app => {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
    return { ...app, job: job ? { ...job, applicantCount: 0 } : undefined };
  }));

  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.status, "active")).limit(5);
  const enrichedJobs = jobs.map(j => ({ ...j, applicantCount: 0 }));

  const placementReadiness = Math.min(100, 
    student.profileCompleteness * 0.3 +
    student.resumeScore * 0.4 +
    (apps.length > 0 ? 30 : 0)
  );

  res.json({
    totalApplications: apps.length,
    shortlisted,
    interviews,
    offers,
    resumeScore: student.resumeScore,
    profileCompleteness: student.profileCompleteness,
    recentApplications: enrichedApps,
    recommendedJobs: enrichedJobs,
    placementReadiness: Math.round(placementReadiness),
    careerPathPredictions: predictCareerPaths(student.skills, student.branch),
  });
});

router.get("/dashboard/recruiter", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [recruiter] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, req.userId!));
  if (!recruiter) {
    res.json({ totalJobs: 0, activeJobs: 0, totalApplicants: 0, shortlistedCount: 0, offersExtended: 0, recentApplicants: [], jobStats: [] });
    return;
  }

  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.recruiterId, recruiter.id));
  const activeJobs = jobs.filter(j => j.status === "active");

  const jobStats = await Promise.all(jobs.slice(0, 5).map(async job => {
    const [totalResult] = await db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.jobId, job.id));
    const [shortlistedResult] = await db.select({ count: count() }).from(applicationsTable)
      .where(and(eq(applicationsTable.jobId, job.id), eq(applicationsTable.status, "shortlisted")));
    return {
      jobId: job.id,
      title: job.title,
      applicants: Number(totalResult?.count ?? 0),
      shortlisted: Number(shortlistedResult?.count ?? 0),
    };
  }));

  const totalApplicants = jobStats.reduce((s, j) => s + j.applicants, 0);
  const shortlistedCount = jobStats.reduce((s, j) => s + j.shortlisted, 0);

  const recentApplicants = await Promise.all(jobs.slice(0, 3).flatMap(async job => {
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.jobId, job.id)).limit(3);
    return Promise.all(apps.map(async app => {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, app.studentId));
      return { ...app, student: student ? { ...student, totalApplications: 0, shortlisted: 0, offers: 0 } : undefined };
    }));
  }));

  res.json({
    totalJobs: jobs.length,
    activeJobs: activeJobs.length,
    totalApplicants,
    shortlistedCount,
    offersExtended: 0,
    recentApplicants: (await recentApplicants).flat().slice(0, 5),
    jobStats,
  });
});

router.get("/dashboard/admin", requireAuth, async (_req, res): Promise<void> => {
  const [totalStudentsResult] = await db.select({ count: count() }).from(studentsTable);
  const [placedResult] = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.placementStatus, "placed"));
  const [totalJobsResult] = await db.select({ count: count() }).from(jobsTable);
  const [totalRecruitersResult] = await db.select({ count: count() }).from(recruitersTable).where(eq(recruitersTable.isApproved, true));

  const totalStudents = Number(totalStudentsResult?.count ?? 0);
  const placedStudents = Number(placedResult?.count ?? 0);
  const activeCompanies = Number(totalRecruitersResult?.count ?? 0);
  const totalJobs = Number(totalJobsResult?.count ?? 0);

  const placedStudentsList = await db.select().from(studentsTable).where(eq(studentsTable.placementStatus, "placed")).limit(5);

  const avgPackage = placedStudentsList.length > 0
    ? placedStudentsList.reduce((s, st) => s + (st.packageLpa ?? 0), 0) / placedStudentsList.length
    : 8.5;

  const highestPackage = placedStudentsList.reduce((max, st) => Math.max(max, st.packageLpa ?? 0), 12);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyTrend = months.map((month, i) => ({ month, placed: Math.floor(Math.random() * 20) + i * 3 }));

  res.json({
    totalStudents,
    placedStudents,
    activeCompanies,
    totalJobs,
    averagePackageLpa: avgPackage || 8.5,
    highestPackageLpa: highestPackage || 24,
    placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
    recentPlacements: placedStudentsList.map(s => ({ ...s, totalApplications: 0, shortlisted: 0, offers: 0 })),
    monthlyTrend,
  });
});

router.get("/dashboard/placement-stats", requireAuth, async (_req, res): Promise<void> => {
  const allStudents = await db.select().from(studentsTable);

  const branchMap: Record<string, { total: number; placed: number; packages: number[] }> = {};
  for (const s of allStudents) {
    if (!branchMap[s.branch]) branchMap[s.branch] = { total: 0, placed: 0, packages: [] };
    branchMap[s.branch].total++;
    if (s.placementStatus === "placed") {
      branchMap[s.branch].placed++;
      if (s.packageLpa) branchMap[s.branch].packages.push(s.packageLpa);
    }
  }

  const branchWise = Object.entries(branchMap).map(([branch, data]) => ({
    branch,
    total: data.total,
    placed: data.placed,
    rate: data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0,
    avgPackage: data.packages.length > 0 ? Math.round(data.packages.reduce((s, p) => s + p, 0) / data.packages.length * 10) / 10 : 0,
  }));

  const companyWise = [
    { company: "Google", hired: 3, avgPackage: 42 },
    { company: "Microsoft", hired: 5, avgPackage: 28 },
    { company: "Amazon", hired: 8, avgPackage: 22 },
    { company: "Infosys", hired: 15, avgPackage: 6 },
    { company: "TCS", hired: 20, avgPackage: 5 },
    { company: "Wipro", hired: 12, avgPackage: 5.5 },
  ];

  const packageDistribution = [
    { range: "< 5 LPA", count: 10 },
    { range: "5-10 LPA", count: 25 },
    { range: "10-15 LPA", count: 18 },
    { range: "15-20 LPA", count: 12 },
    { range: "20-30 LPA", count: 8 },
    { range: "> 30 LPA", count: 4 },
  ];

  res.json({ branchWise, companyWise, packageDistribution });
});

export default router;
