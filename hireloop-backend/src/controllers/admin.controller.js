import { prisma } from "../config/database.js";
import { sendRecruiterApprovalEmail } from "../utils/email.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { BadRequest, NotFound } from "../middleware/errorHandler.js";

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export async function getDashboard(req, res) {
    const [
        totalStudents,
        totalRecruiters,
        pendingRecruiters,
        totalJobs,
        activeJobs,
        totalApplications,
        placements,            // applications with OFFER status
        recentRecruiters,
        topCompanies,
        applicationsByStatus,
        placementByDepartment,
    ] = await Promise.all([
        prisma.studentProfile.count(),
        prisma.recruiterProfile.count({ where: { status: "APPROVED" } }),
        prisma.recruiterProfile.count({ where: { status: "PENDING" } }),
        prisma.job.count(),
        prisma.job.count({ where: { status: "ACTIVE" } }),
        prisma.application.count(),
        prisma.application.count({ where: { status: "OFFER" } }),

        // Latest 5 recruiter registrations awaiting approval
        prisma.recruiterProfile.findMany({
            where: { status: "PENDING" },
            include: { user: { select: { email: true, createdAt: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),

        // Top hiring companies (by accepted offers)
        prisma.recruiterProfile.findMany({
            where: { status: "APPROVED" },
            select: {
                companyName: true,
                companyLogo: true,
                _count: {
                    select: {
                        jobs: {
                            where: { applications: { some: { status: "OFFER" } } },
                        },
                    },
                },
            },
            orderBy: { jobs: { _count: "desc" } },
            take: 10,
        }),

        // Applications breakdown by status
        prisma.application.groupBy({
            by: ["status"],
            _count: { status: true },
        }),

        // Placements by department
        prisma.studentProfile.findMany({
            where: {
                applications: { some: { status: "OFFER" } },
            },
            select: { department: true },
        }),
    ]);

    // Calculate placement percentage
    const placementRate =
        totalStudents > 0 ? ((placements / totalStudents) * 100).toFixed(1) : 0;

    // Group placements by department
    const deptMap = placementByDepartment.reduce((acc, s) => {
        acc[s.department] = (acc[s.department] || 0) + 1;
        return acc;
    }, {});

    const statusBreakdown = applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
    }, {});

    sendSuccess(res, {
        data: {
            overview: {
                totalStudents,
                totalRecruiters,
                pendingRecruiters,
                totalJobs,
                activeJobs,
                totalApplications,
                placements,
                placementRate: `${placementRate}%`,
            },
            statusBreakdown,
            departmentPlacements: deptMap,
            pendingRecruiterApprovals: recentRecruiters,
            topCompanies,
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECRUITER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function getPendingRecruiters(req, res) {
    const { page = "1", limit = "20", status = "PENDING" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recruiters, total] = await Promise.all([
        prisma.recruiterProfile.findMany({
            where: { status },
            include: {
                user: { select: { email: true, createdAt: true, lastLoginAt: true } },
                _count: { select: { jobs: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.recruiterProfile.count({ where: { status } }),
    ]);

    sendPaginated(res, { data: recruiters, page: parseInt(page), limit: parseInt(limit), total });
}

export async function approveRecruiter(req, res) {
    const { recruiterId } = req.params;

    const recruiter = await prisma.recruiterProfile.findUnique({
        where: { id: recruiterId },
        include: { user: { select: { email: true } } },
    });
    if (!recruiter) throw NotFound("Recruiter not found.");
    if (recruiter.status === "APPROVED") throw BadRequest("Recruiter is already approved.");

    await prisma.recruiterProfile.update({
        where: { id: recruiterId },
        data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: req.user.id,
            rejectionReason: null,
        },
    });

    sendRecruiterApprovalEmail(
        { email: recruiter.user.email, firstName: recruiter.firstName, companyName: recruiter.companyName },
        true
    );

    sendSuccess(res, { message: `${recruiter.companyName} has been approved.` });
}

export async function rejectRecruiter(req, res) {
    const { recruiterId } = req.params;
    const { reason } = req.body;

    const recruiter = await prisma.recruiterProfile.findUnique({
        where: { id: recruiterId },
        include: { user: { select: { email: true } } },
    });
    if (!recruiter) throw NotFound("Recruiter not found.");

    await prisma.recruiterProfile.update({
        where: { id: recruiterId },
        data: {
            status: "REJECTED",
            rejectionReason: reason || null,
        },
    });

    sendRecruiterApprovalEmail(
        { email: recruiter.user.email, firstName: recruiter.firstName, companyName: recruiter.companyName },
        false,
        reason
    );

    sendSuccess(res, { message: `${recruiter.companyName} has been rejected.` });
}

export async function suspendRecruiter(req, res) {
    const { recruiterId } = req.params;

    const recruiter = await prisma.recruiterProfile.findUnique({ where: { id: recruiterId } });
    if (!recruiter) throw NotFound("Recruiter not found.");

    await prisma.$transaction([
        prisma.recruiterProfile.update({
            where: { id: recruiterId },
            data: { status: "SUSPENDED" },
        }),
        // Deactivate their user account
        prisma.user.update({
            where: { id: recruiter.userId },
            data: { isActive: false },
        }),
        // Close all their active jobs
        prisma.job.updateMany({
            where: { recruiterId, status: "ACTIVE" },
            data: { status: "CLOSED" },
        }),
    ]);

    sendSuccess(res, { message: "Recruiter suspended and all active jobs closed." });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllStudents(req, res) {
    const { page = "1", limit = "20", search, department, isPlaced } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        ...(search && {
            OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { college: { contains: search, mode: "insensitive" } },
                { rollNumber: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...(department && { department }),
        ...(isPlaced === "true" && {
            applications: { some: { status: "OFFER" } },
        }),
        ...(isPlaced === "false" && {
            applications: { none: { status: "OFFER" } },
        }),
    };

    const [students, total] = await Promise.all([
        prisma.studentProfile.findMany({
            where,
            select: {
                id: true, firstName: true, lastName: true,
                department: true, degree: true, college: true,
                cgpa: true, graduationYear: true, skills: true,
                isPremium: true,
                _count: { select: { applications: true } },
                user: { select: { email: true, isEmailVerified: true, createdAt: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.studentProfile.count({ where }),
    ]);

    sendPaginated(res, { data: students, page: parseInt(page), limit: parseInt(limit), total });
}

export async function getStudentDetail(req, res) {
    const student = await prisma.studentProfile.findUnique({
        where: { id: req.params.studentId },
        include: {
            user: { select: { email: true, createdAt: true, lastLoginAt: true } },
            resumes: { select: { id: true, title: true, atsScore: true, createdAt: true } },
            applications: {
                include: {
                    job: { select: { title: true, recruiter: { select: { companyName: true } } } },
                },
                orderBy: { appliedAt: "desc" },
            },
        },
    });

    if (!student) throw NotFound("Student not found.");
    sendSuccess(res, { data: student });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS & REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getPlacementAnalytics(req, res) {
    const { year } = req.query;
    const graduationYear = year ? parseInt(year) : new Date().getFullYear();

    const [
        totalStudents,
        placedStudents,
        applicationStats,
        departmentBreakdown,
        companyHiring,
        monthlyApplications,
        salaryData,
    ] = await Promise.all([
        // Total students for the year
        prisma.studentProfile.count({ where: { graduationYear } }),

        // Placed students (got an offer)
        prisma.studentProfile.count({
            where: {
                graduationYear,
                applications: { some: { status: "OFFER" } },
            },
        }),

        // Application pipeline stats
        prisma.application.groupBy({
            by: ["status"],
            where: { student: { graduationYear } },
            _count: { status: true },
        }),

        // Placement by department
        prisma.application.findMany({
            where: { status: "OFFER", student: { graduationYear } },
            select: { student: { select: { department: true } } },
        }),

        // Top hiring companies for the year
        prisma.recruiterProfile.findMany({
            where: {
                jobs: {
                    some: {
                        applications: {
                            some: { status: "OFFER", student: { graduationYear } },
                        },
                    },
                },
            },
            select: {
                companyName: true,
                companyLogo: true,
                industry: true,
                jobs: {
                    select: {
                        _count: {
                            select: {
                                applications: { where: { status: "OFFER" } },
                            },
                        },
                    },
                },
            },
        }),

        // Applications per month (last 12 months)
        prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "appliedAt") as month,
        COUNT(*)::int as count
      FROM applications a
      JOIN student_profiles sp ON a."studentId" = sp.id
      WHERE sp."graduationYear" = ${graduationYear}
        AND a."appliedAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `,

        // Salary range data from offers
        prisma.job.findMany({
            where: {
                salary: { not: null },
                applications: {
                    some: { status: "OFFER", student: { graduationYear } },
                },
            },
            select: { salary: true, title: true, recruiter: { select: { companyName: true } } },
        }),
    ]);

    const placementRate = totalStudents > 0
        ? ((placedStudents / totalStudents) * 100).toFixed(1)
        : 0;

    // Department breakdown
    const deptPlacement = departmentBreakdown.reduce((acc, a) => {
        const dept = a.student.department;
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});

    // Company hiring count
    const companyStats = companyHiring
        .map((c) => ({
            companyName: c.companyName,
            companyLogo: c.companyLogo,
            industry: c.industry,
            offersGiven: c.jobs.reduce((sum, j) => sum + j._count.applications, 0),
        }))
        .sort((a, b) => b.offersGiven - a.offersGiven)
        .slice(0, 15);

    const statusBreakdown = applicationStats.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
    }, {});

    sendSuccess(res, {
        data: {
            year: graduationYear,
            summary: {
                totalStudents,
                placedStudents,
                unplacedStudents: totalStudents - placedStudents,
                placementRate: `${placementRate}%`,
                totalApplications: Object.values(statusBreakdown).reduce((a, b) => a + b, 0),
            },
            statusBreakdown,
            departmentBreakdown: deptPlacement,
            topCompanies: companyStats,
            monthlyTrend: monthlyApplications,
            salaryInsights: salaryData,
        },
    });
}

export async function generateReport(req, res) {
    // Returns structured data; the frontend/PDF service renders it
    const { type = "placement", year } = req.query;
    const graduationYear = year ? parseInt(year) : new Date().getFullYear();

    if (type === "placement") {
        const students = await prisma.studentProfile.findMany({
            where: { graduationYear },
            include: {
                user: { select: { email: true } },
                applications: {
                    where: { status: { in: ["OFFER", "SHORTLISTED", "INTERVIEW_SCHEDULED"] } },
                    include: {
                        job: {
                            select: {
                                title: true,
                                salary: true,
                                recruiter: { select: { companyName: true } },
                            },
                        },
                    },
                    take: 1,
                    orderBy: { updatedAt: "desc" },
                },
            },
            orderBy: [{ department: "asc" }, { cgpa: "desc" }],
        });

        return sendSuccess(res, {
            data: {
                reportType: "placement",
                generatedAt: new Date().toISOString(),
                year: graduationYear,
                students: students.map((s) => ({
                    name: `${s.firstName} ${s.lastName}`,
                    email: s.user.email,
                    department: s.department,
                    degree: s.degree,
                    cgpa: s.cgpa,
                    rollNumber: s.rollNumber,
                    status: s.applications[0]?.status || "NOT_APPLIED",
                    company: s.applications[0]?.job?.recruiter?.companyName || null,
                    role: s.applications[0]?.job?.title || null,
                    salary: s.applications[0]?.job?.salary || null,
                })),
            },
        });
    }

    throw BadRequest(`Unknown report type: ${type}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function createAnnouncement(req, res) {
    const { title, content, isPinned, targetRole, expiresAt } = req.body;

    const announcement = await prisma.announcement.create({
        data: {
            title,
            content,
            isPinned: isPinned || false,
            targetRole: targetRole || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.user.id,
        },
    });

    sendCreated(res, { message: "Announcement published.", data: announcement });
}

export async function getAnnouncements(req, res) {
    const { page = "1", limit = "20", targetRole } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        ...(targetRole && { OR: [{ targetRole: null }, { targetRole }] }),
    };

    const [announcements, total] = await Promise.all([
        prisma.announcement.findMany({
            where,
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
            skip,
            take: parseInt(limit),
        }),
        prisma.announcement.count({ where }),
    ]);

    sendPaginated(res, { data: announcements, page: parseInt(page), limit: parseInt(limit), total });
}

export async function updateAnnouncement(req, res) {
    const { title, content, isPinned, targetRole, expiresAt } = req.body;

    const announcement = await prisma.announcement.findUnique({
        where: { id: req.params.announcementId },
    });
    if (!announcement) throw NotFound("Announcement not found.");

    const updated = await prisma.announcement.update({
        where: { id: req.params.announcementId },
        data: {
            ...(title && { title }),
            ...(content && { content }),
            ...(isPinned !== undefined && { isPinned }),
            ...(targetRole !== undefined && { targetRole }),
            ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        },
    });

    sendSuccess(res, { message: "Announcement updated.", data: updated });
}

export async function deleteAnnouncement(req, res) {
    const announcement = await prisma.announcement.findUnique({
        where: { id: req.params.announcementId },
    });
    if (!announcement) throw NotFound("Announcement not found.");

    await prisma.announcement.delete({ where: { id: req.params.announcementId } });
    sendSuccess(res, { message: "Announcement deleted." });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL JOBS (admin view)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllJobs(req, res) {
    const { page = "1", limit = "20", status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
        ...(status && { status }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { recruiter: { companyName: { contains: search, mode: "insensitive" } } },
            ],
        }),
    };

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            include: {
                recruiter: { select: { companyName: true, companyLogo: true } },
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

// Admin can force-close any job
export async function forceCloseJob(req, res) {
    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job) throw NotFound("Job not found.");

    await prisma.job.update({
        where: { id: req.params.jobId },
        data: { status: "ARCHIVED" },
    });

    sendSuccess(res, { message: "Job archived by admin." });
}