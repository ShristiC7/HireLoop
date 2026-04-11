import { pgTable, text, serial, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const interviewStatusEnum = pgEnum("interview_status", ["active", "completed"]);
export const interviewLevelEnum = pgEnum("interview_level", ["fresher", "junior", "mid"]);

export const interviewSessionsTable = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  role: text("role").notNull(),
  level: interviewLevelEnum("level").notNull().default("fresher"),
  status: interviewStatusEnum("status").notNull().default("active"),
  currentQuestion: text("current_question"),
  questionNumber: integer("question_number").notNull().default(1),
  totalQuestions: integer("total_questions").notNull().default(5),
  questionAnswers: jsonb("question_answers").notNull().default([]),
  overallScore: integer("overall_score"),
  communicationScore: integer("communication_score"),
  technicalScore: integer("technical_score"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessionsTable).omit({ id: true, startedAt: true });
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewSession = typeof interviewSessionsTable.$inferSelect;
