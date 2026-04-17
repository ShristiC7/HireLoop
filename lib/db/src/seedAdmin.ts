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
  const [existingStudentUser] = await db.select().from(usersTable).where(eq(usersTable.email, studentEmail));
  
  let studentUserId = existingStudentUser?.id;
  if (!existingStudentUser) {
    const [user] = await db.insert(usersTable).values({
      email: studentEmail,
      passwordHash: hashedPassword,
      name: "Demo Student",
      role: "student",
    }).returning();
    studentUserId = user.id;
    console.log(`Student user created: ${studentEmail}`);
  }

  // Upsert Student Profile
  const studentData = {
    userId: studentUserId!,
    name: "Demo Student",
    email: studentEmail,
    branch: "Computer Science",
    batch: "2025",
    cgpa: 8.5,
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    placementStatus: "unplaced" as const,
  };

  const [existingStudentProfile] = await db.select().from(studentsTable).where(eq(studentsTable.userId, studentUserId!));
  let studentId = existingStudentProfile?.id;
  
  if (existingStudentProfile) {
    await db.update(studentsTable).set(studentData).where(eq(studentsTable.id, studentId!));
    console.log(`Student profile updated: ${studentEmail}`);
  } else {
    const [student] = await db.insert(studentsTable).values(studentData).returning();
    studentId = student.id;
    console.log(`Student profile created: ${studentEmail}`);
  }

  // Upsert Resume
  const resumeData = {
    studentId: studentId!,
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
  };

  const [existingResume] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, studentId!));
  if (existingResume) {
    await db.update(resumesTable).set(resumeData).where(eq(resumesTable.id, existingResume.id));
    console.log(`Resume updated for student: ${studentEmail}`);
  } else {
    await db.insert(resumesTable).values(resumeData);
    console.log(`Resume created for student: ${studentEmail}`);
  }

  // 3. Seed Recruiter User + Profile
  const recruiterEmail = "recruiter@demo.com";
  const [existingRecruiterUser] = await db.select().from(usersTable).where(eq(usersTable.email, recruiterEmail));
  
  let recruiterUserId = existingRecruiterUser?.id;
  if (!existingRecruiterUser) {
    const [user] = await db.insert(usersTable).values({
      email: recruiterEmail,
      passwordHash: hashedPassword,
      name: "Demo Recruiter",
      role: "recruiter",
    }).returning();
    recruiterUserId = user.id;
    console.log(`Recruiter user created: ${recruiterEmail}`);
  }

  const recruiterData = {
    userId: recruiterUserId!,
    name: "Demo Recruiter",
    email: recruiterEmail,
    company: "Innovate Labs",
    isApproved: true,
  };

  const [existingRecruiterProfile] = await db.select().from(recruitersTable).where(eq(recruitersTable.userId, recruiterUserId!));
  if (existingRecruiterProfile) {
    await db.update(recruitersTable).set(recruiterData).where(eq(recruitersTable.id, existingRecruiterProfile.id));
    console.log(`Recruiter profile updated: ${recruiterEmail}`);
  } else {
    await db.insert(recruitersTable).values(recruiterData);
    console.log(`Recruiter profile created: ${recruiterEmail}`);
  }

  console.log("Seeding completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
