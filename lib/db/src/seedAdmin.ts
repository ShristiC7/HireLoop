import { db, usersTable } from "./index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import path from "path";
import { config } from "dotenv";

// Load .env from project root
config({ path: path.join(process.cwd(), "../../.env") });

async function main() {
  console.log("Seeding admin user...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@demo.com";
  const password = process.env.ADMIN_PASSWORD || "demo123";

  // Check if admin already exists
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
  
  if (existing) {
    console.log(`Admin user ${adminEmail} already exists. Skipping.`);
    process.exit(0);
  }

  // Create admin
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await db.insert(usersTable).values({
    email: adminEmail,
    passwordHash: hashedPassword,
    name: "System Admin",
    role: "admin",
  });

  console.log(`Admin user explicitly seeded: ${adminEmail}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
