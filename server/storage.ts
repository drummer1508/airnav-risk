import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users, risks, orgUnits, taxonomyT1, taxonomyT2, taxonomyT3,
  mitigations, workflowLogs,
  type User, type InsertUser,
  type Risk, type InsertRisk,
  type OrgUnit, type InsertOrgUnit,
  type TaxonomyT1, type TaxonomyT2, type TaxonomyT3,
  type Mitigation, type InsertMitigation,
  type WorkflowLog, type InsertWorkflowLog,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;

  createTaxonomyT1(data: { name: string }): Promise<TaxonomyT1>;
  updateTaxonomyT1(id: number, data: { name: string }): Promise<TaxonomyT1 | undefined>;
  deleteTaxonomyT1(id: number): Promise<boolean>;
  createTaxonomyT2(data: { name: string; t1Id: number }): Promise<TaxonomyT2>;
  updateTaxonomyT2(id: number, data: { name: string; t1Id?: number }): Promise<TaxonomyT2 | undefined>;
  deleteTaxonomyT2(id: number): Promise<boolean>;
  createTaxonomyT3(data: { name: string; t2Id: number }): Promise<TaxonomyT3>;
  updateTaxonomyT3(id: number, data: { name: string; t2Id?: number }): Promise<TaxonomyT3 | undefined>;
  deleteTaxonomyT3(id: number): Promise<boolean>;

  getOrgUnits(): Promise<OrgUnit[]>;
  createOrgUnit(unit: InsertOrgUnit): Promise<OrgUnit>;
  updateOrgUnit(id: number, unit: Partial<InsertOrgUnit>): Promise<OrgUnit | undefined>;
  deleteOrgUnit(id: number): Promise<boolean>;

  getTaxonomyT1(): Promise<TaxonomyT1[]>;
  getTaxonomyT2(t1Id?: number): Promise<TaxonomyT2[]>;
  getTaxonomyT3(t2Id?: number): Promise<TaxonomyT3[]>;

  getRisks(): Promise<Risk[]>;
  getRisk(id: number): Promise<Risk | undefined>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: number, risk: Partial<InsertRisk>): Promise<Risk | undefined>;
  deleteRisk(id: number): Promise<boolean>;

  getMitigations(): Promise<Mitigation[]>;
  getMitigationsByRiskId(riskId: number): Promise<Mitigation[]>;
  createMitigation(mit: InsertMitigation): Promise<Mitigation>;
  updateMitigation(id: number, mit: Partial<InsertMitigation>): Promise<Mitigation | undefined>;
  deleteMitigation(id: number): Promise<boolean>;

  getWorkflowLogs(riskId: number): Promise<WorkflowLog[]>;
  createWorkflowLog(log: InsertWorkflowLog): Promise<WorkflowLog>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(u: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(u).returning();
    return result;
  }
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [result] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result;
  }
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createTaxonomyT1(data: { name: string }): Promise<TaxonomyT1> {
    const [result] = await db.insert(taxonomyT1).values(data).returning();
    return result;
  }
  async updateTaxonomyT1(id: number, data: { name: string }): Promise<TaxonomyT1 | undefined> {
    const [result] = await db.update(taxonomyT1).set(data).where(eq(taxonomyT1.id, id)).returning();
    return result;
  }
  async deleteTaxonomyT1(id: number): Promise<boolean> {
    await db.delete(taxonomyT2).where(eq(taxonomyT2.t1Id, id));
    const result = await db.delete(taxonomyT1).where(eq(taxonomyT1.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async createTaxonomyT2(data: { name: string; t1Id: number }): Promise<TaxonomyT2> {
    const [result] = await db.insert(taxonomyT2).values(data).returning();
    return result;
  }
  async updateTaxonomyT2(id: number, data: { name: string; t1Id?: number }): Promise<TaxonomyT2 | undefined> {
    const [result] = await db.update(taxonomyT2).set(data).where(eq(taxonomyT2.id, id)).returning();
    return result;
  }
  async deleteTaxonomyT2(id: number): Promise<boolean> {
    await db.delete(taxonomyT3).where(eq(taxonomyT3.t2Id, id));
    const result = await db.delete(taxonomyT2).where(eq(taxonomyT2.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async createTaxonomyT3(data: { name: string; t2Id: number }): Promise<TaxonomyT3> {
    const [result] = await db.insert(taxonomyT3).values(data).returning();
    return result;
  }
  async updateTaxonomyT3(id: number, data: { name: string; t2Id?: number }): Promise<TaxonomyT3 | undefined> {
    const [result] = await db.update(taxonomyT3).set(data).where(eq(taxonomyT3.id, id)).returning();
    return result;
  }
  async deleteTaxonomyT3(id: number): Promise<boolean> {
    const result = await db.delete(taxonomyT3).where(eq(taxonomyT3.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getOrgUnits(): Promise<OrgUnit[]> {
    return db.select().from(orgUnits);
  }
  async createOrgUnit(unit: InsertOrgUnit): Promise<OrgUnit> {
    const [result] = await db.insert(orgUnits).values(unit).returning();
    return result;
  }
  async updateOrgUnit(id: number, unit: Partial<InsertOrgUnit>): Promise<OrgUnit | undefined> {
    const [result] = await db.update(orgUnits).set(unit).where(eq(orgUnits.id, id)).returning();
    return result;
  }
  async deleteOrgUnit(id: number): Promise<boolean> {
    const result = await db.delete(orgUnits).where(eq(orgUnits.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTaxonomyT1(): Promise<TaxonomyT1[]> {
    return db.select().from(taxonomyT1);
  }
  async getTaxonomyT2(t1Id?: number): Promise<TaxonomyT2[]> {
    if (t1Id) return db.select().from(taxonomyT2).where(eq(taxonomyT2.t1Id, t1Id));
    return db.select().from(taxonomyT2);
  }
  async getTaxonomyT3(t2Id?: number): Promise<TaxonomyT3[]> {
    if (t2Id) return db.select().from(taxonomyT3).where(eq(taxonomyT3.t2Id, t2Id));
    return db.select().from(taxonomyT3);
  }

  async getRisks(): Promise<Risk[]> {
    return db.select().from(risks);
  }
  async getRisk(id: number): Promise<Risk | undefined> {
    const [risk] = await db.select().from(risks).where(eq(risks.id, id));
    return risk;
  }
  async createRisk(risk: InsertRisk): Promise<Risk> {
    const maxImpact = Math.max(
      risk.impactFinancial ?? 1, risk.impactLegal ?? 1, risk.impactCompliance ?? 1,
      risk.impactReputation ?? 1, risk.impactMarket ?? 1, risk.impactIt ?? 1,
      risk.impactHr ?? 1, risk.impactHsse ?? 1, risk.impactPmn ?? 1
    );
    const score = maxImpact * (risk.likelihoodScore ?? 1);
    const [result] = await db.insert(risks).values({
      ...risk,
      impactScore: maxImpact,
      inherentRiskScore: score,
    }).returning();
    return result;
  }
  async updateRisk(id: number, risk: Partial<InsertRisk>): Promise<Risk | undefined> {
    const existing = await this.getRisk(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...risk };
    const maxImpact = Math.max(
      merged.impactFinancial ?? 1, merged.impactLegal ?? 1, merged.impactCompliance ?? 1,
      merged.impactReputation ?? 1, merged.impactMarket ?? 1, merged.impactIt ?? 1,
      merged.impactHr ?? 1, merged.impactHsse ?? 1, merged.impactPmn ?? 1
    );
    const score = maxImpact * (merged.likelihoodScore ?? 1);
    const updates: any = {
      ...risk,
      impactScore: maxImpact,
      inherentRiskScore: score,
      updatedAt: new Date(),
    };
    if (risk.residualImpact !== undefined || risk.residualLikelihood !== undefined) {
      const ri = risk.residualImpact ?? existing.residualImpact ?? maxImpact;
      const rl = risk.residualLikelihood ?? existing.residualLikelihood ?? merged.likelihoodScore;
      updates.residualRiskScore = ri * rl;
    }
    const [result] = await db.update(risks).set(updates).where(eq(risks.id, id)).returning();
    return result;
  }
  async deleteRisk(id: number): Promise<boolean> {
    await db.delete(mitigations).where(eq(mitigations.riskId, id));
    await db.delete(workflowLogs).where(eq(workflowLogs.riskId, id));
    const result = await db.delete(risks).where(eq(risks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getMitigations(): Promise<Mitigation[]> {
    return db.select().from(mitigations);
  }
  async getMitigationsByRiskId(riskId: number): Promise<Mitigation[]> {
    return db.select().from(mitigations).where(eq(mitigations.riskId, riskId));
  }
  async createMitigation(mit: InsertMitigation): Promise<Mitigation> {
    const [result] = await db.insert(mitigations).values(mit).returning();
    return result;
  }
  async updateMitigation(id: number, mit: Partial<InsertMitigation>): Promise<Mitigation | undefined> {
    const [result] = await db.update(mitigations).set(mit).where(eq(mitigations.id, id)).returning();
    return result;
  }
  async deleteMitigation(id: number): Promise<boolean> {
    const result = await db.delete(mitigations).where(eq(mitigations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getWorkflowLogs(riskId: number): Promise<WorkflowLog[]> {
    return db.select().from(workflowLogs).where(eq(workflowLogs.riskId, riskId));
  }
  async createWorkflowLog(log: InsertWorkflowLog): Promise<WorkflowLog> {
    const [result] = await db.insert(workflowLogs).values(log).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
