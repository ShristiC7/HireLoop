
import { z } from "zod";

export const createJobSchema = z.object({
    body: z.object({
        title: z.string().trim().min(3, "Job title must be at least 3 characters"),
        description: z.string().trim().min(5, "Job description must be at least 5 characters"),
        responsibilities: z.string().trim().optional(),
        requirements: z.string().trim().optional(),

        // Eligibility
        minCgpa: z.number().min(0).max(10).optional().nullable(),
        eligibleBranches: z.array(z.string()).optional().default([]),
        eligibleDegrees: z.array(z.string()).optional().default([]),
        graduationYear: z.number().int().min(2020).max(2035).optional().nullable(),

        // Details
        location: z.string().trim().optional(),
        isRemote: z.boolean().optional().default(false),
        jobType: z.enum(["Full-time", "Part-time", "Internship", "Contract"]).optional(),
        salary: z.string().trim().optional(),
        skills: z.array(z.string().trim()).optional().default([]),
        deadline: z.string().datetime().optional().nullable(),
        maxApplications: z.number().int().positive().optional().nullable(),
    }),
});

export const updateJobSchema = createJobSchema.deepPartial();

export const jobQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        search: z.string().optional(),
        jobType: z.enum(["Full-time", "Part-time", "Internship", "Contract"]).optional(),
        location: z.string().optional(),
        isRemote: z.enum(["true", "false"]).optional(),
        status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]).optional(),
        minSalary: z.string().optional(),
    }),
});