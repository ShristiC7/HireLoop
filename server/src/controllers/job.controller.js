import { prisma } from "../config/database.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { NotFound } from "../middleware/errorHandler.js";

// ── List Active Jobs (with filters) ──────────────────────────────────────────
export async function listJobs(req, res) {
    const {
        page = "1",
        limit = "12",
        search,
        jobType,
        location,
        isRemote,
        branch,
        degree,
        minCgpa,
        skills,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object dynamically
    const where = {
        status: "ACTIVE",
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }], // not expired

        // Text search across title, description, company name
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { recruiter: { companyName: { contains: search, mode: "insensitive" } } },
            ],
        }),

        ...(jobType && { jobType }),
        ...(location && { location: { contains: location, mode: "insensitive" } }),
        ...(isRemote === "true" && { isRemote: true }),
        ...(branch && { eligibleBranches: { has: branch } }),
        ...(degree && { eligibleDegrees: { has: degree } }),
        ...(minCgpa && { OR: [{ minCgpa: null }, { minCgpa: { lte: parseFloat(minCgpa) } }] }),
        ...(skills && {
            skills: { hasSome: skills.split(",").map((s) => s.trim()) },
        }),
    };

    const orderBy = { [sortBy]: sortOrder };

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                location: true,
                isRemote: true,
                jobType: true,
                salary: true,
                skills: true,
                deadline: true,
                minCgpa: true,
                eligibleBranches: true,
                eligibleDegrees: true,
                graduationYear: true,
                createdAt: true,
                recruiter: {
                    select: {
                        companyName: true,
                        companyLogo: true,
                        industry: true,
                        companyWebsite: true,
                    },
                },
                _count: { select: { applications: true } },
            },
            orderBy,
            skip,
            take: parseInt(limit),
        }),
        prisma.job.count({ where }),
    ]);

    sendPaginated(res, { data: jobs, page: parseInt(page), limit: parseInt(limit), total });
}

// ── Get Single Job Detail ────────────────────────────────────────────────────
export async function getJobDetail(req, res) {
    const job = await prisma.job.findFirst({
        where: { id: req.params.jobId, status: "ACTIVE" },
        include: {
            recruiter: {
                select: {
                    companyName: true,
                    companyLogo: true,
                    companyWebsite: true,
                    industry: true,
                    companySize: true,
                    companyDescription: true,
                },
            },
            _count: { select: { applications: true } },
        },
    });

    if (!job) throw NotFound("Job not found or no longer active.");

    // If student is logged in, check if they've already applied
    let hasApplied = false;
    if (req.user?.role === "STUDENT") {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id },
            select: { id: true },
        });
        if (profile) {
            const existing = await prisma.application.findUnique({
                where: { studentId_jobId: { studentId: profile.id, jobId: job.id } },
                select: { id: true, status: true },
            });
            hasApplied = !!existing;
        }
    }

    sendSuccess(res, { data: { ...job, hasApplied } });
}

// ── Get Smart Job Recommendations for Student ─────────────────────────────────
export async function getRecommendedJobs(req, res) {
    // Must be a logged-in student
    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
        select: {
            id: true, skills: true, department: true,
            degree: true, cgpa: true, graduationYear: true,
        },
    });

    if (!profile) throw NotFound("Student profile not found.");

    // Get jobs the student already applied to (to exclude)
    const appliedJobIds = await prisma.application.findMany({
        where: { studentId: profile.id },
        select: { jobId: true },
    });
    const excludeIds = appliedJobIds.map((a) => a.jobId);

    // Smart recommendation query:
    // 1. Student is eligible (branch, degree, cgpa, year)
    // 2. Matches at least one skill
    // 3. Not already applied
    // 4. Active and not expired
    const jobs = await prisma.job.findMany({
        where: {
            status: "ACTIVE",
            id: { notIn: excludeIds },
            OR: [{ deadline: null }, { deadline: { gte: new Date() } }],

            // Eligibility filters (handle empty arrays = no restriction)
            OR: [
                { eligibleBranches: { equals: [] } },
                { eligibleBranches: { has: profile.department } },
            ],

            ...(profile.cgpa && {
                OR: [{ minCgpa: null }, { minCgpa: { lte: profile.cgpa } }],
            }),

            ...(profile.graduationYear && {
                OR: [{ graduationYear: null }, { graduationYear: profile.graduationYear }],
            }),

            // Skill overlap (at least one skill matches)
            ...(profile.skills.length > 0 && {
                skills: { hasSome: profile.skills },
            }),
        },
        select: {
            id: true,
            title: true,
            location: true,
            isRemote: true,
            jobType: true,
            salary: true,
            skills: true,
            deadline: true,
            createdAt: true,
            recruiter: {
                select: { companyName: true, companyLogo: true, industry: true },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    sendSuccess(res, { data: jobs });
}

// ── Get Filter Options (branches, job types, etc.) ────────────────────────────
export async function getFilterOptions(req, res) {
    // Get distinct values to power frontend filter dropdowns
    const [branches, degrees, jobTypes, locations] = await Promise.all([
        prisma.job.findMany({
            where: { status: "ACTIVE" },
            select: { eligibleBranches: true },
        }),
        prisma.job.findMany({
            where: { status: "ACTIVE" },
            select: { eligibleDegrees: true },
        }),
        prisma.job.findMany({
            where: { status: "ACTIVE", jobType: { not: null } },
            distinct: ["jobType"],
            select: { jobType: true },
        }),
        prisma.job.findMany({
            where: { status: "ACTIVE", location: { not: null } },
            distinct: ["location"],
            select: { location: true },
        }),
    ]);

    // Flatten arrays and deduplicate
    const uniqueBranches = [...new Set(branches.flatMap((j) => j.eligibleBranches))].sort();
    const uniqueDegrees = [...new Set(degrees.flatMap((j) => j.eligibleDegrees))].sort();

    sendSuccess(res, {
        data: {
            branches: uniqueBranches,
            degrees: uniqueDegrees,
            jobTypes: jobTypes.map((j) => j.jobType),
            locations: locations.map((j) => j.location),
        },
    });
}