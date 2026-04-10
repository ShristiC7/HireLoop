import { z } from "zod";

export const updateRecruiterProfileSchema = z.object({
    body: z.object({
        firstName: z.string().trim().min(1).optional(),
        lastName: z.string().trim().min(1).optional(),
        phone: z.string().trim().optional(),
        designation: z.string().trim().optional(),
        companyName: z.string().trim().min(2).optional(),
        companyWebsite: z.string().url().optional().nullable(),
        companySize: z
            .enum(["1-10", "11-50", "51-200", "201-500", "500-1000", "1000+"])
            .optional(),
        industry: z.string().trim().optional(),
        companyDescription: z.string().trim().max(1000).optional(),
    }),
});