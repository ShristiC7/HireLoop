import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../config/database.js";
import { sendSuccess } from "../utils/response.js";
import { NotFound } from "../middleware/errorHandler.js";

const router = Router();

// GET /api/v1/resumes/:id/public
// Publicly viewable resume (for recruiter preview from applicant list)
// Returns limited data — no private info
router.get("/:id/public", authenticate, async (req, res) => {
    const resume = await prisma.resume.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            title: true,
            fileUrl: true,
            builderData: true,
            atsScore: true,
            createdAt: true,
            student: {
                select: {
                    firstName: true,
                    lastName: true,
                    department: true,
                    degree: true,
                    college: true,
                    cgpa: true,
                    skills: true,
                    linkedinUrl: true,
                    githubUrl: true,
                    portfolioUrl: true,
                },
            },
        },
    });

    if (!resume) throw NotFound("Resume not found.");

    sendSuccess(res, { data: resume });
});

export default router;