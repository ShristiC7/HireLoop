import { Router } from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { prisma } from "../config/database.js";
import { sendSuccess } from "../utils/response.js";
import { NotFound, Forbidden } from "../middleware/errorHandler.js";

const router = Router();
router.use(authenticate);

// GET /api/v1/applications/:id
// Fetches a single application — accessible by the student who applied OR
// the recruiter who owns the job
router.get("/:id", async (req, res) => {
    const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
            student: {
                select: {
                    id: true, firstName: true, lastName: true,
                    department: true, degree: true, college: true,
                    cgpa: true, skills: true, avatarUrl: true,
                    linkedinUrl: true, githubUrl: true,
                    user: { select: { email: true } },
                },
            },
            job: {
                include: {
                    recruiter: {
                        select: { companyName: true, companyLogo: true, userId: true, id: true },
                    },
                },
            },
            resume: { select: { id: true, title: true, fileUrl: true, atsScore: true } },
            interviews: { orderBy: { scheduledAt: "asc" } },
        },
    });

    if (!application) throw NotFound("Application not found.");

    // Authorization: only the applying student OR the job's recruiter can view
    const isStudent =
        req.user.role === "STUDENT" &&
        application.student.user.email === req.user.email;

    const isRecruiter =
        req.user.role === "RECRUITER" &&
        application.job.recruiter.userId === req.user.id;

    const isAdmin = req.user.role === "ADMIN";

    if (!isStudent && !isRecruiter && !isAdmin) {
        throw Forbidden("You do not have permission to view this application.");
    }

    sendSuccess(res, { data: application });
});

export default router;