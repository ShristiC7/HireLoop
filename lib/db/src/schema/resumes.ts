import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id).unique(),
  summary: text("summary").notNull().default(""),
  experience: jsonb("experience").notNull().default([]),
  education: jsonb("education").notNull().default([]),
  projects: jsonb("projects").notNull().default([]),
  certifications: text("certifications").array().notNull().default([]),
  languages: text("languages").array().notNull().default([]),
  atsScore: integer("ats_score").notNull().default(0),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({ id: true, createdAt: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
