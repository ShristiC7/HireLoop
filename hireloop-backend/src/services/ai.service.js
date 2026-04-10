import OpenAI from "openai";
import pdfParse from "pdf-parse";
import fetch from "node-fetch"; // To download PDFs from Cloudinary URLs
import { logger } from "../config/logger.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Model Selection ───────────────────────────────────────────────────────────
// gpt-4o-mini: Fast and cheap — good for most tasks
// gpt-4o: Smarter — use for complex evaluation like mock interview scoring
const FAST_MODEL = "gpt-4o-mini";
const SMART_MODEL = "gpt-4o";

// ── Helper: JSON-safe chat call ───────────────────────────────────────────────
// Forces OpenAI to respond with valid JSON every time
async function chatJSON(messages, model = FAST_MODEL, maxTokens = 1500) {
    const response = await openai.chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" }, // Guarantees valid JSON output
        max_tokens: maxTokens,
        temperature: 0.3, // Lower = more consistent/deterministic responses
    });

    const text = response.choices[0].message.content;

    try {
        return JSON.parse(text);
    } catch {
        logger.error("OpenAI returned invalid JSON:", text);
        throw new Error("AI returned malformed response. Please try again.");
    }
}

// ── Helper: Text chat (not JSON) ──────────────────────────────────────────────
async function chatText(messages, model = FAST_MODEL, maxTokens = 1000) {
    const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.5,
    });
    return response.choices[0].message.content.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PDF TEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

export async function extractTextFromResumePdf(pdfUrlOrBuffer) {
    try {
        let buffer;

        if (typeof pdfUrlOrBuffer === "string") {
            // Download PDF from Cloudinary URL
            const response = await fetch(pdfUrlOrBuffer);
            if (!response.ok) throw new Error("Failed to download PDF.");
            buffer = Buffer.from(await response.arrayBuffer());
        } else {
            buffer = pdfUrlOrBuffer;
        }

        const data = await pdfParse(buffer);
        return data.text.trim();
    } catch (error) {
        logger.error("PDF extraction error:", error.message);
        throw new Error("Could not extract text from PDF. Ensure it's a valid, text-based PDF.");
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. RESUME ATS ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

export async function analyzeResume(resumeText, targetJobDescription = null) {
    const jobContext = targetJobDescription
        ? `\nTarget Job Description:\n${targetJobDescription}`
        : "\n(No specific job description provided — analyze generally)";

    const result = await chatJSON(
        [
            {
                role: "system",
                content: `You are an expert ATS (Applicant Tracking System) analyzer and career coach.
Analyze the given resume and return a detailed JSON report.
Be specific, actionable, and honest in your feedback.`,
            },
            {
                role: "user",
                content: `Analyze this resume and return a JSON object with EXACTLY this structure:

{
  "atsScore": <number 0-100>,
  "sections": {
    "contactInfo": { "present": <boolean>, "score": <0-10>, "issues": [<string>] },
    "summary": { "present": <boolean>, "score": <0-10>, "issues": [<string>] },
    "education": { "present": <boolean>, "score": <0-10>, "issues": [<string>] },
    "experience": { "present": <boolean>, "score": <0-10>, "issues": [<string>] },
    "skills": { "present": <boolean>, "score": <0-10>, "issues": [<string>] },
    "projects": { "present": <boolean>, "score": <0-10>, "issues": [<string>] }
  },
  "extractedSkills": [<string>],
  "missingKeywords": [<string>],
  "strengths": [<string>, max 5],
  "improvements": [<string>, max 5, specific and actionable],
  "grammarIssues": [<string>],
  "structureScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "matchScore": <number 0-100 or null if no JD provided>,
  "matchedKeywords": [<string>],
  "summary": "<2-3 sentence overall assessment>"
}

Resume Text:
${resumeText}
${jobContext}`,
            },
        ],
        SMART_MODEL,
        2000
    );

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RESUME ↔ JOB MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

export async function matchResumeToJob(resumeText, jobDescription, jobTitle) {
    return chatJSON(
        [
            {
                role: "system",
                content: "You are a technical recruiter who evaluates how well a candidate's resume matches a job description.",
            },
            {
                role: "user",
                content: `Match this resume against the job description and return:
{
  "matchScore": <number 0-100>,
  "matchedSkills": [<skills present in both resume and JD>],
  "missingSkills": [<skills in JD but not in resume>],
  "extraSkills": [<skills in resume not required by JD>],
  "experienceMatch": <"Under-qualified" | "Good fit" | "Over-qualified">,
  "recommendation": "<2-3 sentences on fit and what to improve>",
  "keyStrengths": [<string>, max 3],
  "gaps": [<string>, max 3]
}

Job Title: ${jobTitle}
Job Description: ${jobDescription}

Resume:
${resumeText}`,
            },
        ],
        SMART_MODEL
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. COVER LETTER GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateCoverLetter(resumeText, jobTitle, companyName, jobDescription) {
    const letter = await chatText(
        [
            {
                role: "system",
                content: `You are a professional career writer specializing in compelling, personalized cover letters.
Write in first person. Keep it to 3-4 paragraphs (under 350 words).
Be specific — reference actual skills/experiences from the resume and actual requirements from the JD.
Do NOT use generic filler phrases like "I am a passionate team player."`,
            },
            {
                role: "user",
                content: `Write a cover letter for this application:

Job Title: ${jobTitle}
Company: ${companyName}
Job Description: ${jobDescription}

Candidate's Resume:
${resumeText}

Format: Start with "Dear Hiring Manager," and end with "Sincerely, [Your Name]"`,
            },
        ],
        SMART_MODEL,
        600
    );

    return letter;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. MOCK INTERVIEW — GENERATE QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateInterviewQuestions(jobRole, resumeText = null, count = 5) {
    const resumeContext = resumeText
        ? `\nCandidate's Resume:\n${resumeText.slice(0, 2000)}` // truncate for cost
        : "";

    const result = await chatJSON(
        [
            {
                role: "system",
                content: `You are an experienced technical interviewer for ${jobRole} positions.
Generate a realistic mix of interview questions covering technical skills, behavioral aspects, and role-specific scenarios.`,
            },
            {
                role: "user",
                content: `Generate exactly ${count} interview questions for a ${jobRole} position.
${resumeContext ? "Personalize questions based on the candidate's resume." : ""}

Return JSON:
{
  "questions": [
    {
      "id": <number>,
      "question": "<question text>",
      "type": <"Technical" | "Behavioral" | "Situational" | "HR">,
      "difficulty": <"Easy" | "Medium" | "Hard">,
      "hints": ["<hint 1>", "<hint 2>"],
      "idealAnswerPoints": ["<key point 1>", "<key point 2>", "<key point 3>"]
    }
  ]
}
${resumeContext}`,
            },
        ],
        FAST_MODEL,
        1500
    );

    return result.questions || [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. MOCK INTERVIEW — EVALUATE ANSWER
// ═══════════════════════════════════════════════════════════════════════════════

export async function evaluateInterviewAnswer(question, answer, jobRole, questionType) {
    if (!answer || answer.trim().length < 10) {
        return {
            score: 0,
            feedback: "Answer is too short. Please provide a detailed response.",
            strengths: [],
            improvements: ["Provide a complete, detailed answer"],
            keywords: [],
        };
    }

    return chatJSON(
        [
            {
                role: "system",
                content: `You are an expert interviewer evaluating a candidate's answer for a ${jobRole} position.
Provide constructive, specific feedback. Be encouraging but honest.`,
            },
            {
                role: "user",
                content: `Evaluate this interview answer and return:
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": [<what the candidate did well, max 3 points>],
  "improvements": [<specific things to improve, max 3 points>],
  "keywords": [<relevant keywords used in the answer>],
  "missedPoints": [<important points the candidate should have mentioned>],
  "betterAnswerHint": "<brief hint on how to improve this specific answer>"
}

Question Type: ${questionType}
Question: ${question}
Candidate's Answer: ${answer}`,
            },
        ],
        SMART_MODEL
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. EXTRACT JOB KEYWORDS (run when recruiter posts a job)
// ═══════════════════════════════════════════════════════════════════════════════

export async function extractJobKeywords(jobTitle, jobDescription) {
    const result = await chatJSON(
        [
            {
                role: "system",
                content: "You are an expert at extracting technical and professional keywords from job postings.",
            },
            {
                role: "user",
                content: `Extract all relevant keywords from this job posting for ATS matching purposes.
Return:
{
  "technicalSkills": [<programming languages, frameworks, tools, technologies>],
  "softSkills": [<communication, leadership, etc.>],
  "qualifications": [<degrees, certifications, years of experience>],
  "responsibilities": [<key job duties as short phrases>],
  "allKeywords": [<complete flat list of all important keywords>]
}

Job Title: ${jobTitle}
Job Description: ${jobDescription}`,
            },
        ],
        FAST_MODEL
    );

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CALCULATE OVERALL MOCK INTERVIEW SCORE
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateInterviewSummary(jobRole, questionsAndAnswers) {
    const qaText = questionsAndAnswers
        .map((qa, i) => `Q${i + 1}: ${qa.question}\nA: ${qa.answer}\nScore: ${qa.score}/10`)
        .join("\n\n");

    return chatJSON(
        [
            {
                role: "system",
                content: `You are summarizing a complete mock interview session for a ${jobRole} position.`,
            },
            {
                role: "user",
                content: `Summarize this mock interview and return:
{
  "overallScore": <average score 0-10>,
  "grade": <"Excellent" | "Good" | "Average" | "Needs Improvement">,
  "strongestArea": "<what the candidate did best>",
  "weakestArea": "<what needs most improvement>",
  "overallFeedback": "<3-4 sentence comprehensive feedback>",
  "topRecommendations": ["<action item 1>", "<action item 2>", "<action item 3>"],
  "readinessLevel": <"Not Ready" | "Almost Ready" | "Ready" | "Highly Prepared">
}

Interview Q&A:
${qaText}`,
            },
        ],
        SMART_MODEL
    );
}