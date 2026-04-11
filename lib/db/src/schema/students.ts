import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const placementStatusEnum = pgEnum("placement_status", ["unplaced", "placed", "internship"]);

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  branch: text("branch").notNull().default("CSE"),
  batch: text("batch").notNull().default("2025"),
  cgpa: real("cgpa").notNull().default(0),
  skills: text("skills").array().notNull().default([]),
  bio: text("bio"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  placementStatus: placementStatusEnum("placement_status").notNull().default("unplaced"),
  placedCompany: text("placed_company"),
  packageLpa: real("package_lpa"),
  resumeScore: integer("resume_score").notNull().default(0),
  profileCompleteness: integer("profile_completeness").notNull().default(20),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
