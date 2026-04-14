import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { recruitersTable } from "./recruiters";

export const jobTypeEnum = pgEnum("job_type", ["fulltime", "internship", "contract"]);
export const jobStatusEnum = pgEnum("job_status", ["active", "closed", "pending"]);

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull().references(() => recruitersTable.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  salaryMin: real("salary_min"),
  salaryMax: real("salary_max"),
  eligibleBranches: text("eligible_branches").array().notNull().default([]),
  minCgpa: real("min_cgpa").notNull().default(0),
  batchYear: text("batch_year"),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  jobType: jobTypeEnum("job_type").notNull().default("fulltime"),
  status: jobStatusEnum("status").notNull().default("active"),
  skills: text("skills").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
