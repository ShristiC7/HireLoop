import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const recruitersTable = pgTable("recruiters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  designation: text("designation"),
  phone: text("phone"),
  website: text("website"),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecruiterSchema = createInsertSchema(recruitersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecruiter = z.infer<typeof insertRecruiterSchema>;
export type Recruiter = typeof recruitersTable.$inferSelect;
