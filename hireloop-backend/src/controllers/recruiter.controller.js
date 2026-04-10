import { prisma } from "../config/database.js";
import { sendApplicationStatusEmail } from "../utils/email.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { BadRequest, NotFound, Forbidden, Conflict } from "../middleware/errorHandler.js";

// ── Helper: get recruiter profile or throw ────────────────────────────────────
async function getRecruiterProfile(userId) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId },
    });
    if (!profile) throw NotFound("Recruiter profile not found.");
    if (profile.status !== "APPROVED") {
        throw Forbidden("Your recruiter account is not yet approved by the placement cell.");
    }
    return profile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export async function getProfile(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        include: {
            _count: {
                select: { jobs: true },
            },
        },
    });
    if (!profile) throw NotFound("Recruiter profile not found.");
    sendSuccess(res, { data: profile });
}

export async function updateProfile(req, res) {
    const {
        firstName, lastName, phone, designation,
        companyName, companyWebsite, companySize,
        industry, companyDescription,
    } = req.body;

    const updated = await prisma.recruiterProfile.update({
        where: { userId: req.user.id },
        data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
            ...(designation && { designation }),
            ...(companyName && { companyName }),
            ...(companyWebsite !== undefined && { companyWebsite }),
            ...(companySize && { companySize }),
            ...(industry && { industry }),
            ...(companyDescription !== undefined && { companyDescription }),
        },
    });

    sendSuccess(res, { message: "Profile updated.", data: updated });
}

export async function uploadCompanyLogo(req, res) {
    if (!req.file) throw BadRequest("No image file provided.");

    const updated = await prisma.recruiterProfile.update({
        where: { userId: req.user.id },
        data: { companyLogo: req.file.path },
    });

    sendSuccess(res, { message: "Company logo updated.", data: { companyLogo: updated.companyLogo } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export async function getDashboard(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true, firstName: true, companyName: true, status: true },
    });
    if (!profile) throw NotFound("Profile not found.");

    // If pending/rejected, return minimal data with status
    if (profile.status !== "APPROVED") {
        return sendSuccess(res, {
            data: { profile, status: profile.status, stats: null },
        });
    }

    const [
        totalJobs,
        activeJobs,
        totalApplications,
        applicationsByStatus,
        recentApplications,
        upcomingInterviews,
    ] = await Promise.all([
        prisma.job.count({ where: { recruiterId: profile.id } }),
        prisma.job.count({ where: { recruiterId: profile.id, status: "ACTIVE" } }),
        prisma.application.count({ where: { job: { recruiterId: profile.id } } }),

        prisma.application.groupBy({
            by: ["status"],
            where: { job: { recruiterId: profile.id } },
            _count: { status: true },
        }),

        prisma.application.findMany({
            where: { job: { recruiterId: profile.id } },
            include: {
                student: {
                    select: {
                        firstName: true, lastName: true,
                        department: true, college: true, cgpa: true,
                    },
                },
                job: { select: { id: true, title: true } },
            },
            orderBy: { appliedAt: "desc" },
            take: 8,
        }),

        prisma.interview.findMany({
            where: {
                job: { recruiterId: profile.id },
                status: "SCHEDULED",
                scheduledAt: { gte: new Date() },
            },
            include: {
                application: {
                    include: {
                        student: { select: { firstName: true, lastName: true } },
                    },
                },
                job: { select: { title: true } },
            },
            orderBy: { scheduledAt: "asc" },
            take: 5,
        }),
    ]);

    const statusMap = applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
    }, {});

    sendSuccess(res, {
        data: {
            profile,
            stats: {
                totalJobs,
                activeJobs,
                totalApplications,
                shortlisted: statusMap.SHORTLISTED || 0,
                offered: statusMap.OFFER || 0,
                rejected: statusMap.REJECTED || 0,
            },
            recentApplications,
            upcomingInterviews,
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOB MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function createJob(req, res) {
    const profile = await getRecruiterProfile(req.user.id);

    const job = await prisma.job.create({
        data: {
            recruiterId: profile.id,
            ...req.body,
            status: "DRAFT", // always starts as draft; recruiter publishes manually
        },
    });

    sendCreated(res, { message: "Job created as draft.", data: job });
}

export async function getMyJobs(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const { page = "1", limit = "10", status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        recruiterId: profile.id,
        ...(status && { status }),
    };

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            include: {
                _count: { select: { applications: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.job.count({ where }),
    ]);

    sendPaginated(res, { data: jobs, page: parseInt(page), limit: parseInt(limit), total });
}

export async function getJob(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const job = await prisma.job.findFirst({
        where: { id: req.params.jobId, recruiterId: profile.id },
        include: {
            _count: { select: { applications: true } },
        },
    });
    if (!job) throw NotFound("Job not found.");
    sendSuccess(res, { data: job });
}

export async function updateJob(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const job = await prisma.job.findFirst({
        where: { id: req.params.jobId, recruiterId: profile.id },
    });
    if (!job) throw NotFound("Job not found.");

    if (job.status === "CLOSED" || job.status === "ARCHIVED") {
        throw BadRequest("Cannot edit a closed or archived job.");
    }

    const updated = await prisma.job.update({
        where: { id: req.params.jobId },
        data: req.body,
    });

    sendSuccess(res, { message: "Job updated.", data: updated });
}

export async function publishJob(req, res) {
    const profile = await getRecruiterProfile(req.user.id);

    const job = await prisma.job.findFirst({
        where: { id: req.params.jobId, recruiterId: profile.id },
    });
    if (!job) throw NotFound("Job not found.");
    if (job.status === "ACTIVE") throw BadRequest("Job is already published.");
    if (job.status === "CLOSED") throw BadRequest("Cannot re-publish a closed job.");

    // Validate job has minimum required fields
    if (!job.title || !job.description) {
        throw BadRequest("Job must have a title and description before publishing.");
    }

    const published = await prisma.job.update({
        where: { id: req.params.jobId },
        data: { status: "ACTIVE" },
    });

    sendSuccess(res, { message: "Job is now live.", data: published });
}

export async function closeJob(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const job = await prisma.job.findFirst({
        where: { id: req.params.jobId, recruiterId: profile.id },
    });
    if (!job) throw NotFound("Job not found.");

    await prisma.job.update({
        where: { id: req.params.jobId },
        data: { status: "CLOSED" },
    });

    sendSuccess(res, { message: "Job closed. No new applications will be accepted." });
}

export async function deleteJob(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const job = await prisma.job.findFirst({
        where: { id: req.params.jobId, recruiterId: profile.id },
    });
    if (!job) throw NotFound("Job not found.");

    if (job.status === "ACTIVE") {
        throw BadRequest("Close the job before deleting it.");
    }

    // Only allow deleting DRAFT jobs with no applications
    const appCount = await prisma.application.count({ where: { jobId: job.id } });
    if (appCount > 0) {
        throw BadRequest("Cannot delete a job that has received applications. Archive it instead.");
    }

    await prisma.job.delete({ where: { id: req.params.jobId } });
    sendSuccess(res, { message: "Job deleted." });
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICANT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function getApplicants(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const job = await prisma.job.findFirst({
        where: { id: req.params.jobId, recruiterId: profile.id },
    });
    if (!job) throw NotFound("Job not found.");

    const {
        page = "1", limit = "20", status,
        minCgpa, branch, search, sortBy = "appliedAt", sortOrder = "desc",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Dynamic filters
    const where = {
        jobId: req.params.jobId,
        ...(status && { status }),
        ...(minCgpa && {
            student: { cgpa: { gte: parseFloat(minCgpa) } },
        }),
        ...(branch && {
            student: { department: branch },
        }),
        ...(search && {
            student: {
                OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { college: { contains: search, mode: "insensitive" } },
                ],
            },
        }),
    };

    const orderBy =
        sortBy === "cgpa"
            ? { student: { cgpa: sortOrder } }
            : { [sortBy]: sortOrder };

    const [applications, total] = await Promise.all([
        prisma.application.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        department: true, degree: true, college: true,
                        cgpa: true, skills: true, avatarUrl: true,
                        linkedinUrl: true, githubUrl: true,
                    },
                },
                resume: { select: { id: true, title: true, fileUrl: true, atsScore: true } },
                interviews: {
                    select: { scheduledAt: true, status: true },
                    take: 1,
                    orderBy: { scheduledAt: "desc" },
                },
            },
            orderBy,
            skip,
            take: parseInt(limit),
        }),
        prisma.application.count({ where }),
    ]);

    sendPaginated(res, { data: applications, page: parseInt(page), limit: parseInt(limit), total });
}

export async function getApplicant(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const application = await prisma.application.findFirst({
        where: {
            id: req.params.applicationId,
            job: { recruiterId: profile.id },
        },
        include: {
            student: true,
            job: { select: { title: true } },
            resume: true,
            interviews: { orderBy: { scheduledAt: "asc" } },
        },
    });

    if (!application) throw NotFound("Application not found.");
    sendSuccess(res, { data: application });
}

export async function updateApplicationStatus(req, res) {
    const { status, recruiterNotes } = req.body;

    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const application = await prisma.application.findFirst({
        where: {
            id: req.params.applicationId,
            job: { recruiterId: profile.id },
        },
        include: {
            student: { include: { user: { select: { email: true } } } },
            job: { select: { title: true, recruiter: { select: { companyName: true } } } },
        },
    });

    if (!application) throw NotFound("Application not found.");

    // Validate status transition
    const validTransitions = {
        APPLIED: ["SHORTLISTED", "REJECTED"],
        SHORTLISTED: ["INTERVIEW_SCHEDULED", "REJECTED"],
        INTERVIEW_SCHEDULED: ["OFFER", "REJECTED"],
        OFFER: ["REJECTED"],
        REJECTED: [], // terminal state
    };

    if (!validTransitions[application.status]?.includes(status)) {
        throw BadRequest(
            `Cannot change status from ${application.status} to ${status}.`
        );
    }

    const updated = await prisma.application.update({
        where: { id: req.params.applicationId },
        data: {
            status,
            ...(recruiterNotes !== undefined && { recruiterNotes }),
        },
    });

    // Send email notification to student
    sendApplicationStatusEmail(
        {
            email: application.student.user.email,
            firstName: application.student.firstName,
        },
        {
            title: application.job.title,
            companyName: application.job.recruiter.companyName,
        },
        status
    );

    sendSuccess(res, { message: `Application status updated to ${status}.`, data: updated });
}

export async function bulkUpdateStatus(req, res) {
    const { applicationIds, status } = req.body;

    if (!applicationIds?.length) throw BadRequest("No application IDs provided.");
    if (!status) throw BadRequest("Status is required.");

    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    // Verify all applications belong to this recruiter's jobs
    const count = await prisma.application.count({
        where: {
            id: { in: applicationIds },
            job: { recruiterId: profile.id },
        },
    });

    if (count !== applicationIds.length) {
        throw Forbidden("One or more applications do not belong to your jobs.");
    }

    await prisma.application.updateMany({
        where: { id: { in: applicationIds } },
        data: { status },
    });

    sendSuccess(res, { message: `${count} applications updated to ${status}.` });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERVIEW SCHEDULING
// ═══════════════════════════════════════════════════════════════════════════════

export async function scheduleInterview(req, res) {
    const {
        applicationId, scheduledAt, duration = 60,
        mode = "Online", meetLink, venue, instructions,
    } = req.body;

    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const application = await prisma.application.findFirst({
        where: {
            id: applicationId,
            job: { recruiterId: profile.id },
        },
        include: {
            student: { include: { user: { select: { email: true } } } },
            job: { select: { id: true, title: true, recruiter: { select: { companyName: true } } } },
        },
    });
    if (!application) throw NotFound("Application not found.");
    if (!["SHORTLISTED", "INTERVIEW_SCHEDULED"].includes(application.status)) {
        throw BadRequest("Only shortlisted candidates can be scheduled for interviews.");
    }

    // Create interview + update application status in one transaction
    const [interview] = await prisma.$transaction([
        prisma.interview.create({
            data: {
                applicationId,
                jobId: application.job.id,
                scheduledAt: new Date(scheduledAt),
                duration,
                mode,
                meetLink: meetLink || null,
                venue: venue || null,
                instructions: instructions || null,
                status: "SCHEDULED",
            },
        }),
        prisma.application.update({
            where: { id: applicationId },
            data: { status: "INTERVIEW_SCHEDULED" },
        }),
    ]);

    // Notify student
    sendApplicationStatusEmail(
        {
            email: application.student.user.email,
            firstName: application.student.firstName,
        },
        {
            title: application.job.title,
            companyName: application.job.recruiter.companyName,
        },
        "INTERVIEW_SCHEDULED"
    );

    sendCreated(res, { message: "Interview scheduled.", data: interview });
}

export async function getInterviews(req, res) {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const { upcoming } = req.query;
    const where = {
        job: { recruiterId: profile.id },
        ...(upcoming === "true" && {
            scheduledAt: { gte: new Date() },
            status: "SCHEDULED",
        }),
    };

    const interviews = await prisma.interview.findMany({
        where,
        include: {
            application: {
                include: {
                    student: { select: { firstName: true, lastName: true, department: true } },
                },
            },
            job: { select: { title: true } },
        },
        orderBy: { scheduledAt: "asc" },
    });

    sendSuccess(res, { data: interviews });
}

export async function updateInterview(req, res) {
    const { scheduledAt, duration, mode, meetLink, venue, instructions, status, feedback, result } = req.body;

    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    const interview = await prisma.interview.findFirst({
        where: {
            id: req.params.interviewId,
            job: { recruiterId: profile.id },
        },
    });
    if (!interview) throw NotFound("Interview not found.");

    const updated = await prisma.interview.update({
        where: { id: req.params.interviewId },
        data: {
            ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
            ...(duration && { duration }),
            ...(mode && { mode }),
            ...(meetLink !== undefined && { meetLink }),
            ...(venue !== undefined && { venue }),
            ...(instructions !== undefined && { instructions }),
            ...(status && { status }),
            ...(feedback !== undefined && { feedback }),
            ...(result !== undefined && { result }),
        },
    });

    sendSuccess(res, { message: "Interview updated.", data: updated });
}