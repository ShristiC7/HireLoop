import { db, usersTable } from "./index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding admin user...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@demo.com";
  const password = process.env.ADMIN_PASSWORD || "demo123";

  // Check if admin already exists
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
  
  if (existing) {
    console.log(`Admin user ${adminEmail} already exists. Skipping individual creation.`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Seed Admin
  await db.insert(usersTable).values({
    email: adminEmail,
    passwordHash: hashedPassword,
    name: "System Admin",
    role: "admin",
  }).onConflictDoNothing();

  // Seed Student
  await db.insert(usersTable).values({
    email: "student@demo.com",
    passwordHash: hashedPassword,
    name: "Demo Student",
    role: "student",
  }).onConflictDoNothing();

  // Seed Recruiter
  await db.insert(usersTable).values({
    email: "recruiter@demo.com",
    passwordHash: hashedPassword,
    name: "Demo Recruiter",
    role: "recruiter",
  }).onConflictDoNothing();

  console.log("Seeding completed: admin, student, recruiter created.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
