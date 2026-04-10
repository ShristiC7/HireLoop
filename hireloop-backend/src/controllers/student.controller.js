import { prisma } from "../config/database.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { NotFound, BadRequest, Forbidden, Conflict } from "../middleware/errorHandler.js";

// ── Get own profile ───────────────────────────────────────────────────────────
export async function getMyProfile(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
        include: {
            resumes: {
                select: { id: true, title: true, isDefault: true, atsScore: true, createdAt: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!profile) throw NotFound("Student profile not found.");
    sendSuccess(res, { data: profile });
}

// ── Update profile ────────────────────────────────────────────────────────────
export async function updateMyProfile(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!profile) throw NotFound("Student profile not found.");

    const updated = await prisma.studentProfile.update({
        where: { userId: req.user.id },
        data: {
            ...req.body,
            // Parse dateOfBirth string to Date object if provided
            dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
        },
    });

    sendSuccess(res, { message: "Profile updated.", data: updated });
}

// ── Upload avatar ─────────────────────────────────────────────────────────────
// req.file is set by multer middleware (defined in routes file)
export async function uploadAvatar(req, res) {
    if (!req.file) throw BadRequest("No image file provided.");

    const updated = await prisma.studentProfile.update({
        where: { userId: req.user.id },
        data: { avatarUrl: req.file.path }, // Cloudinary URL
    });

    sendSuccess(res, {
        message: "Avatar updated.",
        data: { avatarUrl: updated.avatarUrl },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUME MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// ── List all resumes ──────────────────────────────────────────────────────────
export async function getMyResumes(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!profile) throw NotFound("Profile not found.");

    const resumes = await prisma.resume.findMany({
        where: { studentId: profile.id },
        orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, { data: resumes });
}

// ── Get single resume ─────────────────────────────────────────────────────────
export async function getResumeById(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const resume = await prisma.resume.findFirst({
        where: { id: req.params.resumeId, studentId: profile.id },
        include: {
            analyses: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    if (!resume) throw NotFound("Resume not found.");
    sendSuccess(res, { data: resume });
}

// ── Create resume (builder data) ──────────────────────────────────────────────
export async function createResume(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!profile) throw NotFound("Profile not found.");

    const { title, isDefault, builderData } = req.body;

    // If this is set as default, unset all other defaults first
    if (isDefault) {
        await prisma.resume.updateMany({
            where: { studentId: profile.id },
            data: { isDefault: false },
        });
    }

    const resume = await prisma.resume.create({
        data: {
            studentId: profile.id,
            title,
            isDefault: isDefault || false,
            builderData: builderData || {},
        },
    });

    sendCreated(res, { message: "Resume created.", data: resume });
}

// ── Update resume builder data ─────────────────────────────────────────────────
export async function updateResume(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const existing = await prisma.resume.findFirst({
        where: { id: req.params.resumeId, studentId: profile.id },
    });
    if (!existing) throw NotFound("Resume not found.");

    const { title, isDefault, builderData } = req.body;

    if (isDefault) {
        await prisma.resume.updateMany({
            where: { studentId: profile.id, NOT: { id: existing.id } },
            data: { isDefault: false },
        });
    }

    const updated = await prisma.resume.update({
        where: { id: existing.id },
        data: {
            ...(title && { title }),
            ...(isDefault !== undefined && { isDefault }),
            ...(builderData && { builderData }),
        },
    });

    sendSuccess(res, { message: "Resume updated.", data: updated });
}

// ── Upload resume PDF ─────────────────────────────────────────────────────────
export async function uploadResumePDF(req, res) {
    if (!req.file) throw BadRequest("No PDF file provided.");

    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const existing = await prisma.resume.findFirst({
        where: { id: req.params.resumeId, studentId: profile.id },
    });
    if (!existing) throw NotFound("Resume not found.");

    // Delete old PDF from Cloudinary if it exists
    if (existing.filePublicId) {
        await deleteFromCloudinary(existing.filePublicId, "raw").catch(() => { });
    }

    const updated = await prisma.resume.update({
        where: { id: existing.id },
        data: {
            fileUrl: req.file.path,
            filePublicId: req.file.filename, // Cloudinary public_id
        },
    });

    sendSuccess(res, {
        message: "Resume PDF uploaded.",
        data: { fileUrl: updated.fileUrl },
    });
}

// ── Delete resume ─────────────────────────────────────────────────────────────
export async function deleteResume(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const resume = await prisma.resume.findFirst({
        where: { id: req.params.resumeId, studentId: profile.id },
    });
    if (!resume) throw NotFound("Resume not found.");

    // Delete PDF from Cloudinary
    if (resume.filePublicId) {
        await deleteFromCloudinary(resume.filePublicId, "raw").catch(() => { });
    }

    await prisma.resume.delete({ where: { id: resume.id } });
    sendSuccess(res, { message: "Resume deleted." });
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── Apply to a job ────────────────────────────────────────────────────────────
export async function applyToJob(req, res) {
    const { resumeId, coverLetter } = req.body;
    const { jobId } = req.params;

    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!profile) throw NotFound("Student profile not found.");

    // Check job exists and is active
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw NotFound("Job not found.");
    if (job.status !== "ACTIVE") throw BadRequest("This job is no longer accepting applications.");
    if (job.deadline && new Date(job.deadline) < new Date()) {
        throw BadRequest("The application deadline has passed.");
    }

    // Check eligibility
    if (job.minCgpa && profile.cgpa && profile.cgpa < job.minCgpa) {
        throw Forbidden(`Minimum CGPA required: ${job.minCgpa}. Your CGPA: ${profile.cgpa}`);
    }
    if (job.eligibleBranches.length > 0 && !job.eligibleBranches.includes(profile.department)) {
        throw Forbidden(`Your branch (${profile.department}) is not eligible for this job.`);
    }
    if (job.graduationYear && profile.graduationYear !== job.graduationYear) {
        throw Forbidden(`Only ${job.graduationYear} batch students can apply.`);
    }

    // Check if already applied (unique constraint in DB handles this, but give better message)
    const existing = await prisma.application.findFirst({
        where: { studentId: profile.id, jobId },
    });
    if (existing) throw Conflict("You have already applied to this job.");

    // Validate resume belongs to this student
    if (resumeId) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, studentId: profile.id },
        });
        if (!resume) throw BadRequest("Invalid resume selected.");
    }

    // Check max applications limit
    if (job.maxApplications) {
        const count = await prisma.application.count({ where: { jobId } });
        if (count >= job.maxApplications) {
            throw BadRequest("This job has reached its maximum number of applications.");
        }
    }

    const application = await prisma.application.create({
        data: {
            studentId: profile.id,
            jobId,
            resumeId: resumeId || null,
            coverLetter: coverLetter || null,
            status: "APPLIED",
        },
        include: {
            job: {
                select: {
                    title: true,
                    recruiter: { select: { companyName: true } },
                },
            },
        },
    });

    sendCreated(res, {
        message: `Applied to ${application.job.title} successfully!`,
        data: application,
    });
}

// ── Get my applications ───────────────────────────────────────────────────────
export async function getMyApplications(req, res) {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const where = {
        studentId: profile.id,
        ...(status && { status }),
    };

    const [applications, total] = await Promise.all([
        prisma.application.findMany({
            where,
            skip: parseInt(skip),
            take: parseInt(limit),
            orderBy: { appliedAt: "desc" },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        jobType: true,
                        salary: true,
                        deadline: true,
                        recruiter: {
                            select: { companyName: true, companyLogo: true },
                        },
                    },
                },
                resume: { select: { id: true, title: true } },
                interviews: {
                    select: { id: true, scheduledAt: true, mode: true, status: true },
                    orderBy: { scheduledAt: "asc" },
                },
            },
        }),
        prisma.application.count({ where }),
    ]);

    sendPaginated(res, { data: applications, page, limit, total });
}

// ── Get single application detail ─────────────────────────────────────────────
export async function getApplicationById(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const application = await prisma.application.findFirst({
        where: { id: req.params.applicationId, studentId: profile.id },
        include: {
            job: {
                include: {
                    recruiter: {
                        select: { companyName: true, companyLogo: true, companyWebsite: true },
                    },
                },
            },
            interviews: true,
        },
    });

    if (!application) throw NotFound("Application not found.");
    sendSuccess(res, { data: application });
}

// ── Withdraw application ──────────────────────────────────────────────────────
export async function withdrawApplication(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const application = await prisma.application.findFirst({
        where: { id: req.params.applicationId, studentId: profile.id },
    });
    if (!application) throw NotFound("Application not found.");

    // Can only withdraw if still in APPLIED status
    if (!["APPLIED", "SHORTLISTED"].includes(application.status)) {
        throw BadRequest(`Cannot withdraw an application with status: ${application.status}`);
    }

    await prisma.application.delete({ where: { id: application.id } });
    sendSuccess(res, { message: "Application withdrawn." });
}

// ── Get placement stats for dashboard ────────────────────────────────────────
export async function getMyStats(req, res) {
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
    });

    const [totalApplied, shortlisted, interviews, offers] = await Promise.all([
        prisma.application.count({ where: { studentId: profile.id } }),
        prisma.application.count({ where: { studentId: profile.id, status: "SHORTLISTED" } }),
        prisma.application.count({ where: { studentId: profile.id, status: "INTERVIEW_SCHEDULED" } }),
        prisma.application.count({ where: { studentId: profile.id, status: "OFFER" } }),
    ]);

    sendSuccess(res, {
        data: {
            totalApplied,
            shortlisted,
            interviews,
            offers,
            profileCompletion: calculateProfileCompletion(profile),
        },
    });
}

// Helper: calculate how complete the student profile is (%)
function calculateProfileCompletion(profile) {
    const fields = [
        "firstName", "lastName", "phone", "college", "department",
        "degree", "cgpa", "skills", "bio", "linkedinUrl",
    ];
    const filled = fields.filter((f) => {
        const val = profile[f];
        return val !== null && val !== undefined && val !== "" &&
            !(Array.isArray(val) && val.length === 0);
    });
    return Math.round((filled.length / fields.length) * 100);
}