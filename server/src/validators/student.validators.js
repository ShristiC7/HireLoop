import { z } from "zod";

// ── Profile Update ────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
    body: z.object({
        firstName: z.string().trim().min(1).optional(),
        lastName: z.string().trim().min(1).optional(),
        phone: z.string().trim().optional(),
        gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
        dateOfBirth: z.string().optional().nullable(),
        college: z.string().trim().min(1).optional(),
        department: z.string().trim().min(1).optional(),
        degree: z.string().trim().min(1).optional(),
        graduationYear: z.number().int().min(2020).max(2035).optional(),
        cgpa: z.number().min(0).max(10).optional().nullable(),
        rollNumber: z.string().trim().optional(),
        skills: z.array(z.string().trim().min(1)).max(30).optional(),
        bio: z.string().trim().max(500).optional(),
        linkedinUrl: z.string().url().optional().nullable(),
        githubUrl: z.string().url().optional().nullable(),
        portfolioUrl: z.string().url().optional().nullable(),
    }),
});

// ── Job Application ───────────────────────────────────────────────────────────
export const applyJobSchema = z.object({
    body: z.object({
        coverLetter: z.string().trim().max(2000).optional(),
        resumeId: z.string().uuid().optional(),
    }),
});

// ── Resume Builder Save ───────────────────────────────────────────────────────
export const resumeBuilderSchema = z.object({
    body: z.object({
        title: z.string().trim().min(1).max(100).optional(),
        builderData: z.any().optional(),
    }),
});

// ── Pagination Query ──────────────────────────────────────────────────────────
export const listQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        status: z
            .enum(["APPLIED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFER", "REJECTED"])
            .optional(),
    }),
});

// ── Job Browse Query ──────────────────────────────────────────────────────────
export const jobQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("12"),
        search: z.string().optional(),
        jobType: z.enum(["Full-time", "Part-time", "Internship", "Contract"]).optional(),
        location: z.string().optional(),
        isRemote: z.enum(["true", "false"]).optional(),
        branch: z.string().optional(),
        skills: z.string().optional(),
        minCgpa: z.string().optional(),
        sortBy: z.enum(["createdAt", "deadline", "title"]).optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
    }),
});