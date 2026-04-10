// prisma/seed.js
// ─────────────────────────────────────────────────────────────────────────────
// Database Seeder
//
// Run with: npm run db:seed
//
// Creates:
//  1. Default admin account (placement cell officer)
//  2. Sample student account for testing
//  3. Sample recruiter (pre-approved) for testing
//  4. Sample announcements
//
// IMPORTANT: Change the default passwords after first login!
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...\n");

    // ── 1. Create Admin Account ────────────────────────────────────────────────
    const adminEmail = "admin@hireloop.com";
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: await bcrypt.hash("Admin@123456", 12),
                role: "ADMIN",
                isEmailVerified: true,
                isActive: true,
                adminProfile: {
                    create: {
                        firstName: "Placement",
                        lastName: "Admin",
                        phone: "9000000000",
                        designation: "Placement Officer",
                        college: "Demo Engineering College",
                    },
                },
            },
        });
        console.log("✅ Admin account created:");
        console.log("   Email:    admin@hireloop.com");
        console.log("   Password: Admin@123456");
        console.log("   ⚠️  Change this password after first login!\n");
    } else {
        console.log("ℹ️  Admin account already exists, skipping.\n");
    }

    // ── 2. Create Sample Student ───────────────────────────────────────────────
    const studentEmail = "student@demo.com";
    const existingStudent = await prisma.user.findUnique({ where: { email: studentEmail } });

    if (!existingStudent) {
        await prisma.user.create({
            data: {
                email: studentEmail,
                passwordHash: await bcrypt.hash("Student@123", 12),
                role: "STUDENT",
                isEmailVerified: true,
                studentProfile: {
                    create: {
                        firstName: "Priya",
                        lastName: "Sharma",
                        phone: "9876543210",
                        college: "Demo Engineering College",
                        department: "CSE",
                        degree: "B.Tech",
                        graduationYear: 2025,
                        cgpa: 8.5,
                        skills: ["JavaScript", "React", "Node.js", "Python", "SQL"],
                        bio: "Final year CSE student passionate about full-stack development.",
                        linkedinUrl: "https://linkedin.com/in/priya-demo",
                        githubUrl: "https://github.com/priya-demo",
                    },
                },
            },
        });
        console.log("✅ Demo student account created:");
        console.log("   Email:    student@demo.com");
        console.log("   Password: Student@123\n");
    }

    // ── 3. Create Sample Recruiter (pre-approved) ─────────────────────────────
    const recruiterEmail = "recruiter@techcorp.com";
    const existingRecruiter = await prisma.user.findUnique({ where: { email: recruiterEmail } });

    if (!existingRecruiter) {
        await prisma.user.create({
            data: {
                email: recruiterEmail,
                passwordHash: await bcrypt.hash("Recruiter@123", 12),
                role: "RECRUITER",
                isEmailVerified: true,
                recruiterProfile: {
                    create: {
                        firstName: "Rahul",
                        lastName: "Mehta",
                        designation: "Technical Recruiter",
                        companyName: "TechCorp Solutions",
                        companyWebsite: "https://techcorp.example.com",
                        companySize: "500-1000",
                        industry: "Information Technology",
                        companyDescription: "TechCorp is a leading IT services company delivering innovative solutions.",
                        status: "APPROVED",
                        approvedAt: new Date(),
                    },
                },
            },
        });
        console.log("✅ Demo recruiter account created:");
        console.log("   Email:    recruiter@techcorp.com");
        console.log("   Password: Recruiter@123");
        console.log("   Status:   Pre-approved (ready to post jobs)\n");
    }

    // ── 4. Create Sample Jobs ─────────────────────────────────────────────────
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId: (await prisma.user.findUnique({ where: { email: recruiterEmail } }))?.id },
    });

    if (recruiterProfile) {
        const jobCount = await prisma.job.count({ where: { recruiterId: recruiterProfile.id } });

        if (jobCount === 0) {
            await prisma.job.createMany({
                data: [
                    {
                        recruiterId: recruiterProfile.id,
                        title: "Software Development Engineer",
                        description:
                            "We are looking for a talented SDE to join our engineering team. You will be working on building scalable web applications using modern technologies.",
                        responsibilities:
                            "- Design and develop new features\n- Write clean, maintainable code\n- Participate in code reviews\n- Collaborate with product and design teams",
                        requirements:
                            "- Strong understanding of data structures and algorithms\n- Proficiency in JavaScript/Python\n- Experience with React or similar frameworks\n- Good communication skills",
                        minCgpa: 7.0,
                        eligibleBranches: ["CSE", "IT", "ECE"],
                        eligibleDegrees: ["B.Tech", "B.E.", "MCA"],
                        graduationYear: 2025,
                        location: "Bangalore",
                        isRemote: false,
                        jobType: "Full-time",
                        salary: "8-12 LPA",
                        skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
                        status: "ACTIVE",
                        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        extractedKeywords: ["JavaScript", "React", "Node.js", "SQL", "REST API", "Git"],
                    },
                    {
                        recruiterId: recruiterProfile.id,
                        title: "Data Science Intern",
                        description:
                            "6-month internship program for final year students. You will work with our data science team on real-world ML problems.",
                        requirements: "- Knowledge of Python and ML libraries\n- Statistics background\n- Eagerness to learn",
                        minCgpa: 7.5,
                        eligibleBranches: ["CSE", "IT", "Mathematics"],
                        eligibleDegrees: ["B.Tech", "B.Sc"],
                        graduationYear: 2025,
                        location: "Hyderabad",
                        isRemote: true,
                        jobType: "Internship",
                        salary: "25,000/month",
                        skills: ["Python", "Machine Learning", "Pandas", "NumPy", "SQL"],
                        status: "ACTIVE",
                        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                        extractedKeywords: ["Python", "Machine Learning", "Pandas", "NumPy", "Data Analysis"],
                    },
                ],
            });
            console.log("✅ Sample jobs created (2 active jobs)\n");
        }
    }

    // ── 5. Create Welcome Announcement ───────────────────────────────────────
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const announcementCount = await prisma.announcement.count();

    if (announcementCount === 0 && admin) {
        await prisma.announcement.createMany({
            data: [
                {
                    title: "🚀 Welcome to HireLoop Placement Portal!",
                    content:
                        "Dear Students, the campus placement season has officially begun! Complete your profile and upload your resume to get started. Check the jobs section for new opportunities being added daily.",
                    isPinned: true,
                    targetRole: "STUDENT",
                    createdBy: admin.id,
                },
                {
                    title: "📅 Placement Drive: TechCorp Solutions",
                    content:
                        "TechCorp Solutions is visiting campus on 15th January 2025. Eligible students from CSE, IT, and ECE branches with CGPA ≥ 7.0 and graduation year 2025 can apply. Last date to register: 10th January 2025.",
                    isPinned: false,
                    targetRole: "STUDENT",
                    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                    createdBy: admin.id,
                },
                {
                    title: "📋 Resume Submission Guidelines Updated",
                    content:
                        "Please ensure your resume is in PDF format, not more than 2MB, and follows the standard template. AI analysis is now available in your dashboard!",
                    isPinned: false,
                    targetRole: null, // everyone
                    createdBy: admin.id,
                },
            ],
        });
        console.log("✅ Sample announcements created\n");
    }

    console.log("✨ Database seeding complete!");
    console.log("\n─────────────────────────────────────────");
    console.log("Login Credentials:");
    console.log("  Admin:     admin@hireloop.com     / Admin@123456");
    console.log("  Student:   student@demo.com       / Student@123");
    console.log("  Recruiter: recruiter@techcorp.com / Recruiter@123");
    console.log("─────────────────────────────────────────\n");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });