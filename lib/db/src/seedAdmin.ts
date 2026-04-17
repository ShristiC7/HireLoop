import { db, usersTable, studentsTable, resumesTable, recruitersTable } from "./index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding demo users and profiles...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@demo.com";
  const password = process.env.ADMIN_PASSWORD || "demo123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Seed Admin User
  const [existingAdmin] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
  if (!existingAdmin) {
    await db.insert(usersTable).values({
      email: adminEmail,
      passwordHash: hashedPassword,
      name: "System Admin",
      role: "admin",
    });
    console.log(`Admin user created: ${adminEmail}`);
  }

  // 2. Seed Student User + Profile + Resume
  const studentEmail = "student@demo.com";
  const [existingStudent] = await db.select().from(usersTable).where(eq(usersTable.email, studentEmail));
  if (!existingStudent) {
    const [user] = await db.insert(usersTable).values({
      email: studentEmail,
      passwordHash: hashedPassword,
      name: "Demo Student",
      role: "student",
    }).returning();

    const [student] = await db.insert(studentsTable).values({
      userId: user.id,
      name: user.name,
      email: user.email,
      branch: "Computer Science",
      batch: "2025",
      cgpa: 8.5,
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      placementStatus: "unplaced",
    }).returning();

    await db.insert(resumesTable).values({
      studentId: student.id,
      summary: "Aspiring full-stack developer with experience in React and Node.js.",
      experience: [
        { title: "Frontend Intern", company: "Tech Corp", location: "Remote", type: "internship", description: "Built accessible UI components." }
      ],
      education: [
        { school: "Tech University", degree: "B.Tech", field: "CSE", location: "City", startYear: "2021", endYear: "2025", grade: "8.5" }
      ],
      projects: [
        { title: "HireLoop", description: "Campus Recruitment Platform", link: "https://github.com/demo/hireloop", technologies: ["React", "Express"] }
      ],
      certifications: ["Google Cloud Certified", "AWS Practitioner"],
      languages: ["English", "Hindi"],
      atsScore: 75,
    });
    console.log(`Student user and profile created: ${studentEmail}`);
  }

  // 3. Seed Recruiter User + Profile
  const recruiterEmail = "recruiter@demo.com";
  const [existingRecruiter] = await db.select().from(usersTable).where(eq(usersTable.email, recruiterEmail));
  if (!existingRecruiter) {
    const [user] = await db.insert(usersTable).values({
      email: recruiterEmail,
      passwordHash: hashedPassword,
      name: "Demo Recruiter",
      role: "recruiter",
    }).returning();

    await db.insert(recruitersTable).values({
      userId: user.id,
      name: user.name,
      email: user.email,
      company: "Innovate Labs",
      isApproved: true,
    });
    console.log(`Recruiter user and profile created: ${recruiterEmail}`);
  }

  console.log("Seeding completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
