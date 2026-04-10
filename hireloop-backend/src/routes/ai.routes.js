import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import {
    analyzeResumeEndpoint, getResumeAnalyses, matchResumeToJobEndpoint,
    generateCoverLetterEndpoint, startMockInterview, submitAnswer,
    finishMockInterview, getMockInterviewHistory, getMockInterview,
} from "../controllers/ai.controller.js";

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// AI-specific rate limiter: 20 calls/hour for free, unlimited for premium
const aiLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { success: false, message: "AI usage limit reached. Upgrade to Premium.", code: "AI_RATE_LIMIT" },
});

// Resume AI — Students only
router.post("/resume/analyze",
    authorize("STUDENT"), aiLimit,
    validate(z.object({
        body: z.object({
            resumeId: z.string().uuid(),
            jobId: z.string().uuid().optional(),
        })
    })),
    analyzeResumeEndpoint
);
router.get("/resume/analyses", authorize("STUDENT"), getResumeAnalyses);
router.post("/resume/match",
    authorize("STUDENT"), aiLimit,
    validate(z.object({
        body: z.object({
            resumeId: z.string().uuid(),
            jobId: z.string().uuid(),
        })
    })),
    matchResumeToJobEndpoint
);

// Cover Letter
router.post("/cover-letter",
    authorize("STUDENT"), aiLimit,
    validate(z.object({
        body: z.object({
            resumeId: z.string().uuid(),
            jobId: z.string().uuid(),
        })
    })),
    generateCoverLetterEndpoint
);

// Mock Interview
router.post("/mock-interview/start",
    authorize("STUDENT"), aiLimit,
    validate(z.object({
        body: z.object({
            jobRole: z.string().min(2).max(100),
            jobId: z.string().uuid().optional(),
            resumeId: z.string().uuid().optional(),
            questionCount: z.number().int().min(3).max(10).optional(),
        })
    })),
    startMockInterview
);
router.post("/mock-interview/answer",
    authorize("STUDENT"), aiLimit,
    validate(z.object({
        body: z.object({
            sessionId: z.string().uuid(),
            questionIndex: z.number().int().min(0),
            answer: z.string().min(1).max(3000),
        })
    })),
    submitAnswer
);
router.post("/mock-interview/finish",
    authorize("STUDENT"),
    validate(z.object({ body: z.object({ sessionId: z.string().uuid() }) })),
    finishMockInterview
);
router.get("/mock-interview/history", authorize("STUDENT"), getMockInterviewHistory);
router.get("/mock-interview/:interviewId", authorize("STUDENT"), getMockInterview);

export default router;