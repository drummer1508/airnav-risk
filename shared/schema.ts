import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const riskCategories = pgTable("risk_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#3b82f6"),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id"),
  likelihood: integer("likelihood").notNull().default(1),
  impact: integer("impact").notNull().default(1),
  riskScore: integer("risk_score").notNull().default(1),
  status: text("status").notNull().default("open"),
  owner: text("owner"),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mitigations = pgTable("mitigations", {
  id: serial("id").primaryKey(),
  riskId: integer("risk_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  priority: text("priority").notNull().default("medium"),
  dueDate: text("due_date"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRiskCategorySchema = createInsertSchema(riskCategories).omit({ id: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMitigationSchema = createInsertSchema(mitigations).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RiskCategory = typeof riskCategories.$inferSelect;
export type InsertRiskCategory = z.infer<typeof insertRiskCategorySchema>;
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Mitigation = typeof mitigations.$inferSelect;
export type InsertMitigation = z.infer<typeof insertMitigationSchema>;
