import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  orgUnitId: integer("org_unit_id"),
  role: text("role").notNull().default("inputer"),
  line: integer("line").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
});

export const orgUnits = pgTable("org_units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  type: text("type").notNull().default("division"),
  level: text("level").notNull().default("head_office"),
});

export const taxonomyT1 = pgTable("taxonomy_t1", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const taxonomyT2 = pgTable("taxonomy_t2", {
  id: serial("id").primaryKey(),
  t1Id: integer("t1_id").notNull(),
  name: text("name").notNull(),
});

export const taxonomyT3 = pgTable("taxonomy_t3", {
  id: serial("id").primaryKey(),
  t2Id: integer("t2_id").notNull(),
  name: text("name").notNull(),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  riskCode: text("risk_code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  rootCause: text("root_cause"),
  consequence: text("consequence"),
  orgUnitId: integer("org_unit_id"),
  riskOwner: text("risk_owner"),
  t1Id: integer("t1_id"),
  t2Id: integer("t2_id"),
  t3Id: integer("t3_id"),
  impactCriteria: text("impact_criteria").notNull().default("financial"),
  financialEstimate: numeric("financial_estimate"),
  impactFinancial: integer("impact_financial").notNull().default(1),
  impactLegal: integer("impact_legal").notNull().default(1),
  impactCompliance: integer("impact_compliance").notNull().default(1),
  impactReputation: integer("impact_reputation").notNull().default(1),
  impactMarket: integer("impact_market").notNull().default(1),
  impactIt: integer("impact_it").notNull().default(1),
  impactHr: integer("impact_hr").notNull().default(1),
  impactHsse: integer("impact_hsse").notNull().default(1),
  impactPmn: integer("impact_pmn").notNull().default(1),
  impactScore: integer("impact_score").notNull().default(1),
  likelihoodScore: integer("likelihood_score").notNull().default(1),
  inherentRiskScore: integer("inherent_risk_score").notNull().default(1),
  residualImpact: integer("residual_impact"),
  residualLikelihood: integer("residual_likelihood"),
  residualRiskScore: integer("residual_risk_score"),
  justification: text("justification"),
  currentStatus: text("current_status").notNull().default("draft"),
  rkapYear: integer("rkap_year"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mitigations = pgTable("mitigations", {
  id: serial("id").primaryKey(),
  riskId: integer("risk_id").notNull(),
  strategy: text("strategy").notNull().default("reduce"),
  actionDescription: text("action_description").notNull(),
  picName: text("pic_name"),
  deadline: text("deadline"),
  estimatedCost: numeric("estimated_cost"),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("planned"),
  evidence: text("evidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowLogs = pgTable("workflow_logs", {
  id: serial("id").primaryKey(),
  riskId: integer("risk_id").notNull(),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  comments: text("comments"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertOrgUnitSchema = createInsertSchema(orgUnits).omit({ id: true });
export const insertTaxonomyT1Schema = createInsertSchema(taxonomyT1).omit({ id: true });
export const insertTaxonomyT2Schema = createInsertSchema(taxonomyT2).omit({ id: true });
export const insertTaxonomyT3Schema = createInsertSchema(taxonomyT3).omit({ id: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMitigationSchema = createInsertSchema(mitigations).omit({ id: true, createdAt: true });
export const insertWorkflowLogSchema = createInsertSchema(workflowLogs).omit({ id: true, timestamp: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OrgUnit = typeof orgUnits.$inferSelect;
export type InsertOrgUnit = z.infer<typeof insertOrgUnitSchema>;
export type TaxonomyT1 = typeof taxonomyT1.$inferSelect;
export type TaxonomyT2 = typeof taxonomyT2.$inferSelect;
export type TaxonomyT3 = typeof taxonomyT3.$inferSelect;
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Mitigation = typeof mitigations.$inferSelect;
export type InsertMitigation = z.infer<typeof insertMitigationSchema>;
export type WorkflowLog = typeof workflowLogs.$inferSelect;
export type InsertWorkflowLog = z.infer<typeof insertWorkflowLogSchema>;
