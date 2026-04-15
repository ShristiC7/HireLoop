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

router.post("/students/sync-github", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student || !student.githubUrl) {
    res.status(400).json({ error: "GitHub URL not set in profile" });
    return;
  }

  try {
    const username = student.githubUrl.split("/").pop();
    if (!username) throw new Error("Invalid GitHub URL");

    // Fetch user repos from GitHub
    const githubRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
    if (!githubRes.ok) throw new Error("GitHub user not found or rate limited");
    
    const repos = await githubRes.json() as any[];
    
    // Extract languages and projects
    const languages = new Set<string>();
    const projects: any[] = [];

    repos.forEach(repo => {
      if (repo.language) languages.add(repo.language);
      projects.push({
        title: repo.name,
        description: repo.description ?? `GitHub Repository: ${repo.name}`,
        link: repo.html_url,
        technologies: repo.language ? [repo.language] : [],
      });
    });

    const newSkills = Array.from(new Set([...student.skills, ...Array.from(languages)]));

    // Update Student Table (Skills)
    await db.update(studentsTable)
      .set({ skills: newSkills })
      .where(eq(studentsTable.id, student.id));

    // Update Resume Table (Projects)
    const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, student.id));
    if (resume) {
      const existingProjects = (resume.projects as any[]) || [];
      const mergedProjects = [...existingProjects];
      
      projects.forEach(p => {
        if (!mergedProjects.some(ep => ep.title === p.title)) {
          mergedProjects.push(p);
        }
      });

      await db.update(resumesTable)
        .set({ projects: mergedProjects, lastUpdated: new Date() })
        .where(eq(resumesTable.id, resume.id));
    }

    res.json({ message: "GitHub sync successful", addedProjects: projects.length, addedSkills: languages.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to sync GitHub" });
  }
});

export default router;
