import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users, risks, riskCategories, mitigations,
  type User, type InsertUser,
  type Risk, type InsertRisk,
  type RiskCategory, type InsertRiskCategory,
  type Mitigation, type InsertMitigation,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getRiskCategories(): Promise<RiskCategory[]>;
  getRiskCategory(id: number): Promise<RiskCategory | undefined>;
  createRiskCategory(cat: InsertRiskCategory): Promise<RiskCategory>;
  updateRiskCategory(id: number, cat: Partial<InsertRiskCategory>): Promise<RiskCategory | undefined>;
  deleteRiskCategory(id: number): Promise<boolean>;

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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getRiskCategories(): Promise<RiskCategory[]> {
    return db.select().from(riskCategories);
  }

  async getRiskCategory(id: number): Promise<RiskCategory | undefined> {
    const [cat] = await db.select().from(riskCategories).where(eq(riskCategories.id, id));
    return cat;
  }

  async createRiskCategory(cat: InsertRiskCategory): Promise<RiskCategory> {
    const [result] = await db.insert(riskCategories).values(cat).returning();
    return result;
  }

  async updateRiskCategory(id: number, cat: Partial<InsertRiskCategory>): Promise<RiskCategory | undefined> {
    const [result] = await db.update(riskCategories).set(cat).where(eq(riskCategories.id, id)).returning();
    return result;
  }

  async deleteRiskCategory(id: number): Promise<boolean> {
    const result = await db.delete(riskCategories).where(eq(riskCategories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRisks(): Promise<Risk[]> {
    return db.select().from(risks);
  }

  async getRisk(id: number): Promise<Risk | undefined> {
    const [risk] = await db.select().from(risks).where(eq(risks.id, id));
    return risk;
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const score = (risk.likelihood ?? 1) * (risk.impact ?? 1);
    const [result] = await db.insert(risks).values({ ...risk, riskScore: score }).returning();
    return result;
  }

  async updateRisk(id: number, risk: Partial<InsertRisk>): Promise<Risk | undefined> {
    const updates: any = { ...risk, updatedAt: new Date() };
    if (risk.likelihood !== undefined && risk.impact !== undefined) {
      updates.riskScore = risk.likelihood * risk.impact;
    } else if (risk.likelihood !== undefined || risk.impact !== undefined) {
      const existing = await this.getRisk(id);
      if (existing) {
        const l = risk.likelihood ?? existing.likelihood;
        const i = risk.impact ?? existing.impact;
        updates.riskScore = l * i;
      }
    }
    const [result] = await db.update(risks).set(updates).where(eq(risks.id, id)).returning();
    return result;
  }

  async deleteRisk(id: number): Promise<boolean> {
    await db.delete(mitigations).where(eq(mitigations.riskId, id));
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
}

export const storage = new DatabaseStorage();
