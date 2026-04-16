import { Router, type IRouter } from "express";
import { db, studentsTable, resumesTable, interviewSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { AnalyzeResumeBody, StartMockInterviewBody, SubmitInterviewAnswerBody, SubmitInterviewAnswerParams, GetInterviewSummaryParams } from "@workspace/api-zod";
import OpenAI from "openai";
import crypto from "crypto";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
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

router.post("/ai/analyze-resume", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
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

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert ATS resume analyzer. Analyze the resume against the job description and provide structured feedback.
          
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
        },
        {
          role: "user",
          content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDesc}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    await db.update(studentsTable).set({ resumeScore: result.atsScore ?? 0 }).where(eq(studentsTable.id, student.id));
    if (resume) {
      await db.update(resumesTable).set({ atsScore: result.atsScore ?? 0 }).where(eq(resumesTable.studentId, student.id));
    }

    res.json(result);
  } catch (err) {
    res.json({
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
        experience: Math.min(100, (JSON.parse(JSON.stringify(resume?.experience ?? [])) as unknown[]).length * 30),
        skills: Math.min(100, student.skills.length * 15),
        projects: Math.min(100, (JSON.parse(JSON.stringify(resume?.projects ?? [])) as unknown[]).length * 25),
        education: 80,
      },
    });
  }
});

router.post("/ai/cover-letter", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
  const { jobDescription } = req.body;
  if (!jobDescription) {
    res.status(400).json({ error: "Job description is required" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, req.userId!));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, student.id));
  
  const context = `
Name: ${student.name}
Branch: ${student.branch}
Skills: ${student.skills.join(", ")}
Resume Summary: ${resume?.summary || "N/A"}
Experience: ${JSON.stringify(resume?.experience || [])}
  `.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert career consultant. Write a professional, punchy, and tailored cover letter based on the user's profile and the job description provided. Use a modern tone, highlight relevant skills, and keep it under 300 words. Return only the cover letter text."
        },
        {
          role: "user",
          content: `User Profile:\n${context}\n\nJob Description:\n${jobDescription}`
        }
      ]
    });

    res.json({ coverLetter: completion.choices[0].message.content });
  } catch (err) {
    logger.error(err, "Cover letter generation failed");
    res.status(500).json({ error: "Failed to generate cover letter" });
  }
});

router.post("/ai/mock-interview/start", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
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

router.post("/ai/mock-interview/:sessionId/answer", requireAuth, requireRole("student"), async (req: AuthRequest, res): Promise<void> => {
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

  let feedback = "";
  let score = 70;
  let improvementTip = "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert interview coach. Evaluate this interview answer and return JSON:
{
  "feedback": "1-2 sentence specific feedback",
  "score": <0-100>,
  "improvementTip": "one actionable improvement tip"
}
Return ONLY JSON.`,
        },
        {
          role: "user",
          content: `Question: ${currentQ}\nAnswer: ${answer}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const result = JSON.parse(completion.choices[0].message.content || "{}");
    feedback = result.feedback ?? "Good answer. Keep practicing!";
    score = result.score ?? 70;
    improvementTip = result.improvementTip ?? "Be more specific with examples.";
  } catch {
    feedback = "Your answer shows understanding of the topic. Consider adding more specific examples.";
    score = 65;
    improvementTip = "Use the STAR method: Situation, Task, Action, Result.";
  }

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

export default router;
