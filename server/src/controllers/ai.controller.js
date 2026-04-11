import { rateLimit } from "express-rate-limit";
import { prisma } from "../config/database.js";
import {
    extractTextFromResumePdf,
    analyzeResume,
    matchResumeToJob,
    generateCoverLetter,
    generateInterviewQuestions,
    evaluateInterviewAnswer,
    generateInterviewSummary,
    extractJobKeywords,
} from "../services/ai.service.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { BadRequest, NotFound, Forbidden } from "../middleware/errorHandler.js";

// ── AI-specific rate limiter (prevents expensive API abuse) ───────────────────
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 AI calls per hour for free users
    keyGenerator: (req) => req.user?.id || req.ip,
    skip: async (req) => {
        // Premium students get higher limits
        if (req.user?.role === "STUDENT") {
            const profile = await prisma.studentProfile.findUnique({
                where: { userId: req.user.id },
                select: { isPremium: true },
            });
            return profile?.isPremium === true;
        }
        return false;
    },
    message: {
        success: false,
        message: "AI usage limit reached. Upgrade to Premium for unlimited AI features.",
        code: "AI_RATE_LIMIT",
    },
});

// ── Helper: get student profile safely ────────────────────────────────────────
async function getStudentProfile(userId) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw NotFound("Student profile not found.");
    return profile;
}

// ── Helper: get resume text (from PDF URL or builder data) ────────────────────
async function getResumeText(resumeId, studentId) {
    const resume = await prisma.resume.findFirst({
        where: { id: resumeId, studentId },
    });
    if (!resume) throw NotFound("Resume not found.");

    if (resume.fileUrl) {
        return await extractTextFromResumePdf(resume.fileUrl);
    }

    if (resume.builderData) {
        // Convert builder JSON into readable text for AI
        return convertBuilderDataToText(resume.builderData);
    }

    throw BadRequest("Resume has no content to analyze. Please upload a PDF or use the resume builder.");
}

// ── Convert resume builder JSON → plain text for AI ──────────────────────────
function convertBuilderDataToText(data) {
    const parts = [];

    if (data.personalInfo) {
        const p = data.personalInfo;
        parts.push(`NAME: ${p.fullName || ""}`);
        parts.push(`EMAIL: ${p.email || ""} | PHONE: ${p.phone || ""}`);
        if (p.summary) parts.push(`\nSUMMARY:\n${p.summary}`);
    }

    if (data.education?.length) {
        parts.push("\nEDUCATION:");
        data.education.forEach((e) => {
            parts.push(`${e.degree} in ${e.field} — ${e.institution} (${e.startYear}-${e.endYear || "Present"})${e.cgpa ? ` | CGPA: ${e.cgpa}` : ""}`);
        });
    }

    if (data.experience?.length) {
        parts.push("\nEXPERIENCE:");
        data.experience.forEach((e) => {
            parts.push(`${e.role} at ${e.company} (${e.startDate} - ${e.isCurrent ? "Present" : e.endDate})\n${e.description}`);
        });
    }

    if (data.projects?.length) {
        parts.push("\nPROJECTS:");
        data.projects.forEach((p) => {
            parts.push(`${p.name}: ${p.description}${p.techStack?.length ? ` | Tech: ${p.techStack.join(", ")}` : ""}`);
        });
    }

    if (data.skills?.length) {
        parts.push(`\nSKILLS: ${data.skills.join(", ")}`);
    }

    if (data.certifications?.length) {
        parts.push("\nCERTIFICATIONS:");
        data.certifications.forEach((c) => {
            parts.push(`${c.name} — ${c.issuer}${c.date ? ` (${c.date})` : ""}`);
        });
    }

    return parts.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

export async function analyzeResumeEndpoint(req, res) {
    const { resumeId, jobId } = req.body;

    const profile = await getStudentProfile(req.user.id);
    const resumeText = await getResumeText(resumeId, profile.id);

    let jobDescription = null;
    let job = null;

    if (jobId) {
        job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { id: true, title: true, description: true, requirements: true },
        });
        if (job) {
            jobDescription = `${job.title}\n${job.description}\n${job.requirements || ""}`;
        }
    }

    // Run the AI analysis
    const analysisResult = await analyzeResume(resumeText, jobDescription);

    // Save analysis result to database
    const saved = await prisma.resumeAnalysis.create({
        data: {
            resumeId,
            studentId: profile.id,
            jobId: jobId || null,
            atsScore: analysisResult.atsScore,
            matchScore: analysisResult.matchScore || null,
            missingKeywords: analysisResult.missingKeywords || [],
            strengths: analysisResult.strengths || [],
            improvements: analysisResult.improvements || [],
            grammarIssues: analysisResult.grammarIssues || [],
            structureScore: analysisResult.structureScore || null,
            fullReport: analysisResult,
        },
    });

    // Update the resume's ATS score for quick display
    await prisma.resume.update({
        where: { id: resumeId },
        data: { atsScore: analysisResult.atsScore },
    });

    sendCreated(res, {
        message: "Resume analysis complete.",
        data: { analysisId: saved.id, ...analysisResult },
    });
}

// ── Get past analyses ─────────────────────────────────────────────────────────
export async function getResumeAnalyses(req, res) {
    const profile = await getStudentProfile(req.user.id);

    const analyses = await prisma.resumeAnalysis.findMany({
        where: { studentId: profile.id },
        include: {
            resume: { select: { title: true } },
            job: { select: { title: true, recruiter: { select: { companyName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    sendSuccess(res, { data: analyses });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME ↔ JOB MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

export async function matchResumeToJobEndpoint(req, res) {
    const { resumeId, jobId } = req.body;

    const profile = await getStudentProfile(req.user.id);
    const resumeText = await getResumeText(resumeId, profile.id);

    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { recruiter: { select: { companyName: true } } },
    });
    if (!job) throw NotFound("Job not found.");

    const jobDescription = `${job.title}\n${job.description}\n${job.requirements || ""}`;
    const result = await matchResumeToJob(resumeText, jobDescription, job.title);

    sendSuccess(res, {
        data: {
            jobTitle: job.title,
            company: job.recruiter.companyName,
            ...result,
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COVER LETTER GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateCoverLetterEndpoint(req, res) {
    const { resumeId, jobId } = req.body;

    const profile = await getStudentProfile(req.user.id);
    const resumeText = await getResumeText(resumeId, profile.id);

    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { recruiter: { select: { companyName: true } } },
    });
    if (!job) throw NotFound("Job not found.");

    const coverLetter = await generateCoverLetter(
        resumeText,
        job.title,
        job.recruiter.companyName,
        job.description
    );

    sendSuccess(res, {
        message: "Cover letter generated.",
        data: { coverLetter },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK INTERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

// Start a new session — generate questions
export async function startMockInterview(req, res) {
    const { jobRole, jobId, resumeId, questionCount = 5 } = req.body;

    const profile = await getStudentProfile(req.user.id);

    // Check premium limit for free users
    if (!profile.isPremium) {
        const interviewCount = await prisma.mockInterview.count({
            where: {
                studentId: profile.id,
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });
        if (interviewCount >= 3) {
            throw Forbidden(
                "Free users can do 3 mock interviews per month. Upgrade to Premium for unlimited sessions."
            );
        }
    }

    let resumeText = null;
    if (resumeId) {
        try {
            resumeText = await getResumeText(resumeId, profile.id);
        } catch {
            // Resume text is optional — questions will just be generic
        }
    }

    const questions = await generateInterviewQuestions(jobRole, resumeText, Math.min(questionCount, 10));

    // Save the session as "in progress" (completedAt is null)
    const session = await prisma.mockInterview.create({
        data: {
            studentId: profile.id,
            jobRole,
            jobId: jobId || null,
            resumeId: resumeId || null,
            questions: questions.map((q) => ({ ...q, answer: null, aiScore: null, aiFeedback: null })),
        },
    });

    sendCreated(res, {
        message: "Mock interview started.",
        data: {
            sessionId: session.id,
            jobRole,
            questions: questions.map(({ idealAnswerPoints, ...q }) => q), // hide ideal answers from student
        },
    });
}

// Submit a single answer and get immediate feedback
export async function submitAnswer(req, res) {
    const { sessionId, questionIndex, answer } = req.body;

    const profile = await getStudentProfile(req.user.id);

    const session = await prisma.mockInterview.findFirst({
        where: { id: sessionId, studentId: profile.id },
    });
    if (!session) throw NotFound("Interview session not found.");
    if (session.completedAt) throw BadRequest("This interview session is already completed.");

    const questions = session.questions;
    if (questionIndex < 0 || questionIndex >= questions.length) {
        throw BadRequest("Invalid question index.");
    }

    const question = questions[questionIndex];

    // Evaluate the answer with AI
    const evaluation = await evaluateInterviewAnswer(
        question.question,
        answer,
        session.jobRole,
        question.type
    );

    // Update the specific question's answer in the JSON array
    questions[questionIndex] = {
        ...question,
        answer,
        aiScore: evaluation.score,
        aiFeedback: evaluation,
    };

    // Save updated questions back to DB
    await prisma.mockInterview.update({
        where: { id: sessionId },
        data: { questions },
    });

    sendSuccess(res, {
        message: "Answer evaluated.",
        data: {
            questionIndex,
            score: evaluation.score,
            feedback: evaluation.feedback,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            betterAnswerHint: evaluation.betterAnswerHint,
        },
    });
}

// Finish the session — generate overall summary
export async function finishMockInterview(req, res) {
    const { sessionId } = req.body;

    const profile = await getStudentProfile(req.user.id);

    const session = await prisma.mockInterview.findFirst({
        where: { id: sessionId, studentId: profile.id },
    });
    if (!session) throw NotFound("Interview session not found.");
    if (session.completedAt) {
        return sendSuccess(res, {
            message: "Interview already completed.",
            data: {
                overallScore: session.overallScore,
                overallFeedback: session.overallFeedback,
                questions: session.questions,
            },
        });
    }

    const answeredQuestions = session.questions.filter((q) => q.answer);
    if (answeredQuestions.length === 0) {
        throw BadRequest("Please answer at least one question before finishing.");
    }

    // Generate overall summary from all Q&A pairs
    const summary = await generateInterviewSummary(
        session.jobRole,
        answeredQuestions.map((q) => ({
            question: q.question,
            answer: q.answer,
            score: q.aiScore || 0,
        }))
    );

    const overallScore = summary.overallScore || (
        answeredQuestions.reduce((sum, q) => sum + (q.aiScore || 0), 0) / answeredQuestions.length
    );

    const updated = await prisma.mockInterview.update({
        where: { id: sessionId },
        data: {
            overallScore,
            overallFeedback: JSON.stringify(summary),
            completedAt: new Date(),
        },
    });

    sendSuccess(res, {
        message: "Interview completed.",
        data: {
            sessionId: updated.id,
            jobRole: session.jobRole,
            overallScore,
            summary,
            questions: session.questions,
        },
    });
}

// Get past mock interview history
export async function getMockInterviewHistory(req, res) {
    const profile = await getStudentProfile(req.user.id);

    const interviews = await prisma.mockInterview.findMany({
        where: { studentId: profile.id },
        select: {
            id: true,
            jobRole: true,
            overallScore: true,
            overallFeedback: true,
            completedAt: true,
            createdAt: true,
            _count: { select: { questions: false } }, // questions is JSON, not a relation
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    // Add question count from the JSON array
    const withCount = await Promise.all(
        interviews.map(async (iv) => {
            const full = await prisma.mockInterview.findUnique({
                where: { id: iv.id },
                select: { questions: true },
            });
            const questions = full.questions;
            return {
                ...iv,
                questionCount: Array.isArray(questions) ? questions.length : 0,
                answeredCount: Array.isArray(questions)
                    ? questions.filter((q) => q.answer).length
                    : 0,
            };
        })
    );

    sendSuccess(res, { data: withCount });
}

// Get single mock interview detail
export async function getMockInterview(req, res) {
    const profile = await getStudentProfile(req.user.id);

    const interview = await prisma.mockInterview.findFirst({
        where: { id: req.params.interviewId, studentId: profile.id },
        include: {
            job: {
                select: { title: true, recruiter: { select: { companyName: true } } },
            },
        },
    });

    if (!interview) throw NotFound("Interview session not found.");

    // Parse feedback if stored as JSON string
    let overallFeedback = interview.overallFeedback;
    try {
        if (typeof overallFeedback === "string") {
            overallFeedback = JSON.parse(overallFeedback);
        }
    } catch { /* leave as string */ }

    sendSuccess(res, { data: { ...interview, overallFeedback } });
}