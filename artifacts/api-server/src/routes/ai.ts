import { Router, type IRouter } from "express";
import { db, studentsTable, resumesTable, interviewSessionsTable, jobsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { AnalyzeResumeBody, StartMockInterviewBody, SubmitInterviewAnswerBody, SubmitInterviewAnswerParams, GetInterviewSummaryParams } from "@workspace/api-zod";
import { aiRateLimiter } from "../middlewares/rateLimiter";
import OpenAI from "openai";
import crypto from "crypto";
import { z } from "zod";

const router: IRouter = Router();

function sanitizeInput(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>?/gm, "").slice(0, 5000); // strip HTML and limit length
}

const OptimizeResumeContentBody = z.object({
  content: z.string().min(10, "Minimum 10 characters required for optimization"),
  section: z.string().optional(),
});

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy",
});

const INTERVIEW_QUESTIONS: Record<string, string[]> = {
  default: [
    "Tell me about yourself and your background.",
    "What are your greatest strengths and how do they apply to this role?",
    "Describe a challenging project you worked on and how you handled it.",
    "Where do you see yourself in 5 years?",
    "Why are you interested in this position?",
  ],
  "software engineer": [
    "Explain the difference between a stack and a queue.",
    "How would you optimize a slow database query?",
    "Tell me about a complex technical problem you solved.",
    "What is RESTful API design and why is it important?",
    "How do you approach code reviews?",
  ],
  "data scientist": [
    "Explain the bias-variance tradeoff.",
    "How would you handle missing data in a dataset?",
    "What's the difference between supervised and unsupervised learning?",
    "Describe a data project you worked on from start to finish.",
    "How do you evaluate model performance?",
  ],
  "product manager": [
    "How do you prioritize features when you have limited resources?",
    "Describe a product you recently used and how you'd improve it.",
    "How do you measure the success of a product launch?",
    "Tell me about a time you had to say no to a stakeholder.",
    "Walk me through how you would define a product roadmap.",
  ],
  "frontend developer": [
    "What is the difference between React state and props?",
    "How does the browser render a web page?",
    "Explain the concept of lazy loading and when to use it.",
    "What are web accessibility best practices?",
    "How do you optimize the performance of a React application?",
  ],
};

function getQuestions(role: string): string[] {
  const normalized = role.toLowerCase();
  for (const key of Object.keys(INTERVIEW_QUESTIONS)) {
    if (normalized.includes(key)) {
      return INTERVIEW_QUESTIONS[key];
    }
  }
  return INTERVIEW_QUESTIONS.default;
}

async function callAI(systemPrompt: string, userContent: string, fallback: unknown): Promise<unknown> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });
    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    return fallback;
  }
}

router.post("/ai/analyze-resume", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, student.id));
  if (!resume) {
    res.status(404).json({ error: "Resume not found. Please build your resume first." });
    return;
  }

  const resumeText = `
Name: ${student.name}
Branch: ${student.branch}, CGPA: ${student.cgpa}
Skills: ${student.skills.join(", ")}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience)}
Education: ${JSON.stringify(resume.education)}
Projects: ${JSON.stringify(resume.projects)}
Certifications: ${resume.certifications.join(", ")}
  `.trim();

  const jobDesc = parsed.data.jobDescription || "General software engineering role";

  const fallback = {
    atsScore: Math.min(100, 40 + student.skills.length * 5),
    matchPercentage: 60,
    keywordGaps: ["Docker", "Kubernetes", "CI/CD", "System Design"],
    suggestions: [
      "Add more quantifiable achievements to your experience section",
      "Include relevant keywords from the job description",
      "Expand your projects section with tech stack details",
      "Add a professional summary tailored to the role",
    ],
    strengths: [
      "Good educational background",
      "Relevant technical skills listed",
      "Project experience demonstrated",
    ],
    sectionScores: {
      summary: resume?.summary ? 70 : 20,
      experience: Math.min(100, (resume?.experience as unknown[]).length * 30),
      skills: Math.min(100, student.skills.length * 15),
      projects: Math.min(100, (resume?.projects as unknown[]).length * 25),
      education: 80,
    },
  };

  const result = await callAI(
    `You are an expert ATS resume analyzer. Analyze the resume against the job description and provide structured feedback.
Return a JSON object with these exact fields:
{
  "atsScore": <number 0-100>,
  "matchPercentage": <number 0-100>,
  "keywordGaps": ["keyword1", "keyword2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "strengths": ["strength1", "strength2", ...],
  "sectionScores": {
    "summary": <0-100>,
    "experience": <0-100>,
    "skills": <0-100>,
    "projects": <0-100>,
    "education": <0-100>
  }
}
Be honest and specific. Return ONLY the JSON, no other text.`,
    `Resume:\n${sanitizeInput(resumeText)}\n\nJob Description:\n${sanitizeInput(jobDesc)}`,
    fallback
  ) as typeof fallback;

  await db.update(studentsTable).set({ resumeScore: (result as { atsScore: number }).atsScore ?? 0 }).where(eq(studentsTable.id, student.id));
  if (resume) {
    await db.update(resumesTable).set({ atsScore: (result as { atsScore: number }).atsScore ?? 0 }).where(eq(resumesTable.studentId, student.id));
  }

  res.json(result);
});

router.post("/ai/cover-letter", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const { jobId, customNote } = req.body;

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, student.id));

  let jobContext = "General software engineering role at a top company.";
  if (jobId) {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, Number(jobId)));
    if (job) {
      jobContext = `Job Title: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description}\nRequired Skills: ${job.skills.join(", ")}`;
    }
  }

  const resumeContext = `
Name: ${student.name}
Branch: ${student.branch}, CGPA: ${student.cgpa}
Skills: ${student.skills.join(", ")}
Summary: ${resume?.summary ?? ""}
Experience: ${JSON.stringify(resume?.experience ?? [])}
Projects: ${JSON.stringify(resume?.projects ?? [])}
  `.trim();

  const result = await callAI(
    `You are a professional cover letter writer. Write a compelling, personalized cover letter for a student applying for a job.
Return a JSON object with:
{
  "coverLetter": "<full cover letter text with proper paragraphs>",
  "subject": "<email subject line>"
}
The cover letter should be 3-4 paragraphs, professional but warm, and specifically reference the job and company.
Return ONLY the JSON.`,
    `Student Profile:\n${sanitizeInput(resumeContext)}\n\nJob:\n${sanitizeInput(jobContext)}${customNote ? `\n\nAdditional context: ${sanitizeInput(customNote)}` : ""}`,
    {
      coverLetter: `Dear Hiring Manager,\n\nI am writing to express my strong interest in this position. As a ${student.branch} student with a CGPA of ${student.cgpa} and expertise in ${student.skills.slice(0, 3).join(", ")}, I am confident that my skills align well with your requirements.\n\nThroughout my academic journey, I have developed strong technical foundations and practical experience through projects and internships. My passion for technology and continuous learning makes me an ideal candidate for this role.\n\nI am excited about the opportunity to contribute to your team and grow as a professional. I would welcome the chance to discuss how my background and skills can benefit your organization.\n\nThank you for considering my application. I look forward to hearing from you.\n\nSincerely,\n${student.name}`,
      subject: `Application for Position - ${student.name}`,
    }
  );

  res.json(result);
});

router.post("/ai/recommendations", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const allJobs = await db.select().from(jobsTable).where(eq(jobsTable.status, "active"));

  const eligibleJobs = allJobs.filter(job => {
    const cgpaOk = student.cgpa >= job.minCgpa;
    const branchOk = job.eligibleBranches.length === 0 || job.eligibleBranches.includes(student.branch);
    return cgpaOk && branchOk;
  });

  if (eligibleJobs.length === 0) {
    res.json({ recommendations: [], message: "No eligible jobs found. Update your profile to see recommendations." });
    return;
  }

  const studentSkillsLower = student.skills.map(s => s.toLowerCase());

  const scored = eligibleJobs.map(job => {
    const jobSkillsLower = job.skills.map((s: string) => s.toLowerCase());
    const matchedSkills = jobSkillsLower.filter((s: string) => studentSkillsLower.includes(s));
    const skillScore = jobSkillsLower.length > 0 ? (matchedSkills.length / jobSkillsLower.length) * 100 : 50;
    const cgpaBonus = student.cgpa >= 8.5 ? 10 : student.cgpa >= 7.5 ? 5 : 0;
    const totalScore = Math.round(skillScore + cgpaBonus);
    const missingSkills = jobSkillsLower.filter((s: string) => !studentSkillsLower.includes(s));
    return { ...job, matchScore: Math.min(100, totalScore), matchedSkills, missingSkills };
  });

  const sorted = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  res.json({ recommendations: sorted });
});

router.post("/ai/skill-radar", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const { jobIds } = req.body;

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    res.status(400).json({ error: "Provide 1-3 job IDs" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const jobs = await db.select().from(jobsTable).where(inArray(jobsTable.id, jobIds.slice(0, 3).map(Number)));

  const allRequiredSkills: string[] = [];
  jobs.forEach(job => {
    job.skills.forEach((s: string) => {
      if (!allRequiredSkills.includes(s)) allRequiredSkills.push(s);
    });
  });

  const topSkills = allRequiredSkills.slice(0, 8);
  const studentSkillsLower = student.skills.map(s => s.toLowerCase());

  const radarData = topSkills.map(skill => {
    const hasSkill = studentSkillsLower.includes(skill.toLowerCase());
    const partialMatch = !hasSkill && studentSkillsLower.some(s => s.includes(skill.toLowerCase().split(" ")[0]));
    return {
      skill,
      studentLevel: hasSkill ? 90 : partialMatch ? 45 : 10,
      requiredLevel: 80,
      status: hasSkill ? "strong" : partialMatch ? "partial" : "missing",
    };
  });

  const overallMatch = topSkills.length > 0
    ? Math.round(radarData.filter(r => r.status === "strong").length / topSkills.length * 100)
    : 0;

  res.json({
    radarData,
    jobs: jobs.map(j => ({ id: j.id, title: j.title, company: j.company })),
    overallMatch,
    missingSkills: radarData.filter(r => r.status === "missing").map(r => r.skill),
    partialSkills: radarData.filter(r => r.status === "partial").map(r => r.skill),
  });
});

router.post("/ai/learning-roadmap", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const { skill } = req.body;

  if (!skill) {
    res.status(400).json({ error: "Skill is required" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const result = await callAI(
    `You are an expert learning coach. Create a practical 4-week learning roadmap for a student to learn a specific skill.
Return JSON with:
{
  "skill": "<skill name>",
  "overview": "<2-3 sentence overview>",
  "weeks": [
    {
      "week": 1,
      "title": "<week theme>",
      "goals": ["goal1", "goal2"],
      "resources": [
        {"title": "<resource name>", "url": "<url>", "type": "video|article|course", "duration": "<time estimate>"},
        {"title": "<resource name>", "url": "<url>", "type": "video|article|course", "duration": "<time estimate>"}
      ],
      "project": "<mini project or exercise>"
    }
  ],
  "estimatedHours": <total hours 20-60>
}
Use only free resources (YouTube, freeCodeCamp, official docs, etc). Return ONLY JSON.`,
    `Student background: ${sanitizeInput(student.branch)} student, CGPA ${student.cgpa}, existing skills: ${sanitizeInput(student.skills.join(", "))}\n\nSkill to learn: ${sanitizeInput(skill)}`,
    {
      skill,
      overview: `${skill} is an essential skill for modern software development. This roadmap will take you from basics to practical implementation over 4 weeks.`,
      weeks: [
        {
          week: 1, title: "Fundamentals",
          goals: [`Understand ${skill} core concepts`, "Set up your development environment"],
          resources: [
            { title: `${skill} Crash Course`, url: "https://youtube.com", type: "video", duration: "3 hours" },
            { title: `Official ${skill} Documentation`, url: "https://developer.mozilla.org", type: "article", duration: "2 hours" },
          ],
          project: `Build a simple ${skill} hello-world project`,
        },
        {
          week: 2, title: "Core Concepts",
          goals: ["Learn intermediate concepts", "Build small projects"],
          resources: [
            { title: `${skill} Deep Dive`, url: "https://freecodecamp.org", type: "course", duration: "5 hours" },
            { title: "Practice exercises", url: "https://exercism.org", type: "course", duration: "3 hours" },
          ],
          project: "Build a to-do app using the skill",
        },
        {
          week: 3, title: "Advanced Topics",
          goals: ["Apply to real-world problems", "Learn best practices"],
          resources: [
            { title: "Advanced Tutorial Series", url: "https://youtube.com", type: "video", duration: "4 hours" },
            { title: "Community forums and Stack Overflow", url: "https://stackoverflow.com", type: "article", duration: "2 hours" },
          ],
          project: "Build a full feature using the skill",
        },
        {
          week: 4, title: "Portfolio Project",
          goals: ["Build a complete project", "Prepare for interviews"],
          resources: [
            { title: "Interview questions guide", url: "https://leetcode.com", type: "course", duration: "3 hours" },
            { title: "GitHub portfolio tips", url: "https://github.com", type: "article", duration: "1 hour" },
          ],
          project: `Build a portfolio-worthy ${skill} project`,
        },
      ],
      estimatedHours: 28,
    }
  );

  res.json(result);
});

router.post("/ai/smart-shortlist/:jobId", requireAuth, requireRole("recruiter"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId as string, 10);
  const { targetCount = 5 } = req.body;

  const { applicationsTable, studentsTable: st } = await import("@workspace/db");

  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.jobId, jobId));
  if (apps.length === 0) {
    res.json({ shortlist: [], message: "No applicants found for this job." });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const studentIds = Array.from(new Set(apps.map(a => a.studentId)));
  const students = await db.select().from(st).where(inArray(st.id, studentIds));
  const studentMap = new Map(students.map(s => [s.id, s]));

  const enriched = apps.map((app) => {
    const student = studentMap.get(app.studentId);
    return { ...app, student };
  });

  const jobSkillsLower = job.skills.map((s: string) => s.toLowerCase());

  const scored = enriched.map(({ student, ...app }) => {
    if (!student) return { ...app, student, aiScore: 0, reason: "Profile incomplete" };
    const studentSkillsLower = student.skills.map(s => s.toLowerCase());
    const matchedSkills = jobSkillsLower.filter((s: string) => studentSkillsLower.includes(s));
    const skillScore = jobSkillsLower.length > 0 ? (matchedSkills.length / jobSkillsLower.length) * 60 : 30;
    const cgpaScore = Math.min(40, (student.cgpa / 10) * 40);
    const resumeScore = (student.resumeScore / 100) * 20;
    const aiScore = Math.round(skillScore + cgpaScore + resumeScore * 0.2);
    const reason = matchedSkills.length > 0
      ? `Matches ${matchedSkills.length}/${jobSkillsLower.length} required skills. CGPA: ${student.cgpa}`
      : `CGPA: ${student.cgpa}. Consider for general aptitude.`;
    return { ...app, student, aiScore, reason };
  });

  const sorted = scored.sort((a, b) => b.aiScore - a.aiScore).slice(0, targetCount);
  res.json({ shortlist: sorted, totalApplicants: apps.length });
});

router.post("/ai/mock-interview/start", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const parsed = StartMockInterviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const sessionId = crypto.randomUUID();
  const questions = getQuestions(parsed.data.role);
  const firstQuestion = questions[0];

  const [session] = await db.insert(interviewSessionsTable).values({
    sessionId,
    studentId: student.id,
    role: parsed.data.role,
    level: parsed.data.level ?? "fresher",
    status: "active",
    currentQuestion: firstQuestion,
    questionNumber: 1,
    totalQuestions: questions.length,
    questionAnswers: [],
    overallScore: null,
    communicationScore: null,
    technicalScore: null,
  }).returning();

  res.json({
    sessionId: session.sessionId,
    role: session.role,
    level: session.level,
    status: session.status,
    currentQuestion: session.currentQuestion,
    questionNumber: session.questionNumber,
    totalQuestions: session.totalQuestions,
    startedAt: session.startedAt,
    completedAt: null,
    overallScore: null,
  });
});

router.post("/ai/mock-interview/:sessionId/answer", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = SubmitInterviewAnswerParams.safeParse({ sessionId: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const parsed = SubmitInterviewAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.sessionId, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status === "completed") {
    res.status(400).json({ error: "Interview already completed" });
    return;
  }

  const questions = getQuestions(session.role);
  const currentQ = session.currentQuestion ?? "";
  const answer = parsed.data.answer;

  const aiResult = await callAI(
    `You are an expert interview coach. Evaluate this interview answer and return JSON:
{
  "feedback": "1-2 sentence specific feedback",
  "score": <0-100>,
  "improvementTip": "one actionable improvement tip"
}
Return ONLY JSON.`,
    `Question: ${sanitizeInput(currentQ)}\nAnswer: ${sanitizeInput(answer)}`,
    {
      feedback: "Your answer shows understanding of the topic. Consider adding more specific examples.",
      score: 65,
      improvementTip: "Use the STAR method: Situation, Task, Action, Result.",
    }
  ) as { feedback: string; score: number; improvementTip: string };

  const { feedback, score, improvementTip } = aiResult;

  const existingQAs = session.questionAnswers as { question: string; answer: string; score: number; feedback: string }[];
  const updatedQAs = [...existingQAs, { question: currentQ, answer, score, feedback }];

  const nextQNum = session.questionNumber + 1;
  const isComplete = nextQNum > session.totalQuestions;

  let overallScore: number | null = null;
  if (isComplete) {
    overallScore = Math.round(updatedQAs.reduce((sum, qa) => sum + qa.score, 0) / updatedQAs.length);
  }

  const nextQuestion = isComplete ? undefined : questions[nextQNum - 1];

  await db.update(interviewSessionsTable).set({
    questionAnswers: updatedQAs,
    questionNumber: Math.min(nextQNum, session.totalQuestions),
    currentQuestion: nextQuestion ?? session.currentQuestion,
    status: isComplete ? "completed" : "active",
    completedAt: isComplete ? new Date() : null,
    overallScore: isComplete ? overallScore : null,
    communicationScore: isComplete ? Math.round(overallScore! * 0.6) : null,
    technicalScore: isComplete ? Math.round(overallScore! * 0.8) : null,
  }).where(eq(interviewSessionsTable.sessionId, params.data.sessionId));

  res.json({
    feedback,
    score,
    improvementTip,
    nextQuestion: isComplete ? undefined : nextQuestion,
    isComplete,
  });
});

router.get("/ai/mock-interview/:sessionId/summary", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = GetInterviewSummaryParams.safeParse({ sessionId: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const [session] = await db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.sessionId, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const qas = session.questionAnswers as { question: string; answer: string; score: number; feedback: string }[];
  const overall = session.overallScore ?? Math.round(qas.reduce((s, q) => s + q.score, 0) / Math.max(qas.length, 1));

  res.json({
    sessionId: session.sessionId,
    role: session.role,
    communicationScore: session.communicationScore ?? Math.round(overall * 0.6),
    technicalScore: session.technicalScore ?? Math.round(overall * 0.8),
    overallScore: overall,
    strengths: ["Clear communication", "Technical knowledge demonstrated", "Good problem-solving approach"],
    improvements: ["Add more specific examples", "Improve technical depth", "Practice structured responses (STAR method)"],
    questionAnswers: qas,
  });
});

router.get("/ai/interview-sessions", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.json([]);
    return;
  }

  const sessions = await db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.studentId, student.id));
  res.json(sessions.map(s => ({
    sessionId: s.sessionId,
    role: s.role,
    level: s.level,
    status: s.status,
    currentQuestion: s.currentQuestion,
    questionNumber: s.questionNumber,
    totalQuestions: s.totalQuestions,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    overallScore: s.overallScore,
  })));
});

router.post("/ai/optimize-resume-content", requireAuth, requireRole("student"), aiRateLimiter, async (req: AuthRequest, res): Promise<void> => {
  const parsed = OptimizeResumeContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, section = "experience" } = parsed.data;

  const systemPrompt = `You are a professional resume writer and career coach.
Your task is to rewrite the provided ${section} content to be more professional, impactful, and ATS-friendly.
Guidelines:
- Use strong action verbs (e.g., Developed, Managed, Spearheaded).
- Quantify achievements if possible (e.g., increased efficiency by 20%).
- Keep it concise and professional.
- Return ONLY a JSON object with a single "optimizedContent" field.
- If it's a list of experience points, ensure they are formatted as a cohesive professional description.`;

  const result = await callAI(
    systemPrompt,
    `Content to optimize:\n${sanitizeInput(content)}`,
    { optimizedContent: content }
  ) as { optimizedContent: string };

  res.json(result);
});

export default router;
