import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRiskSchema, insertMitigationSchema, insertOrgUnitSchema, insertWorkflowLogSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/org-units", async (_req, res) => {
    const units = await storage.getOrgUnits();
    res.json(units);
  });

  app.post("/api/org-units", async (req, res) => {
    const parsed = insertOrgUnitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const unit = await storage.createOrgUnit(parsed.data);
    res.status(201).json(unit);
  });

  app.patch("/api/org-units/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertOrgUnitSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const unit = await storage.updateOrgUnit(id, parsed.data);
    if (!unit) return res.status(404).json({ message: "Not found" });
    res.json(unit);
  });

  app.delete("/api/org-units/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteOrgUnit(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/taxonomy/t1", async (_req, res) => {
    const t1s = await storage.getTaxonomyT1();
    res.json(t1s);
  });

  app.get("/api/taxonomy/t2", async (req, res) => {
    const t1Id = req.query.t1Id ? parseInt(req.query.t1Id as string) : undefined;
    const t2s = await storage.getTaxonomyT2(t1Id);
    res.json(t2s);
  });

  app.get("/api/taxonomy/t3", async (req, res) => {
    const t2Id = req.query.t2Id ? parseInt(req.query.t2Id as string) : undefined;
    const t3s = await storage.getTaxonomyT3(t2Id);
    res.json(t3s);
  });

  app.get("/api/risks", async (_req, res) => {
    const allRisks = await storage.getRisks();
    res.json(allRisks);
  });

  app.get("/api/risks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const risk = await storage.getRisk(id);
    if (!risk) return res.status(404).json({ message: "Not found" });
    res.json(risk);
  });

  app.post("/api/risks", async (req, res) => {
    const parsed = insertRiskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const risk = await storage.createRisk(parsed.data);
    res.status(201).json(risk);
  });

  app.patch("/api/risks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertRiskSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const risk = await storage.updateRisk(id, parsed.data);
    if (!risk) return res.status(404).json({ message: "Not found" });
    res.json(risk);
  });

  app.delete("/api/risks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteRisk(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/mitigations", async (_req, res) => {
    const mits = await storage.getMitigations();
    res.json(mits);
  });

  app.get("/api/mitigations/risk/:riskId", async (req, res) => {
    const riskId = parseInt(req.params.riskId);
    const mits = await storage.getMitigationsByRiskId(riskId);
    res.json(mits);
  });

  app.post("/api/mitigations", async (req, res) => {
    const parsed = insertMitigationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const mit = await storage.createMitigation(parsed.data);
    res.status(201).json(mit);
  });

  app.patch("/api/mitigations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertMitigationSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const mit = await storage.updateMitigation(id, parsed.data);
    if (!mit) return res.status(404).json({ message: "Not found" });
    res.json(mit);
  });

  app.delete("/api/mitigations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteMitigation(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/workflow-logs/:riskId", async (req, res) => {
    const riskId = parseInt(req.params.riskId);
    const logs = await storage.getWorkflowLogs(riskId);
    res.json(logs);
  });

  app.post("/api/workflow-logs", async (req, res) => {
    const parsed = insertWorkflowLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const log = await storage.createWorkflowLog(parsed.data);

    if (parsed.data.toStatus) {
      await storage.updateRisk(parsed.data.riskId, { currentStatus: parsed.data.toStatus });
    }
    res.status(201).json(log);
  });

  app.get("/api/dashboard/stats", async (_req, res) => {
    const allRisks = await storage.getRisks();
    const allMitigations = await storage.getMitigations();
    const t1s = await storage.getTaxonomyT1();
    const orgUnitsList = await storage.getOrgUnits();

    const totalRisks = allRisks.length;
    const draftRisks = allRisks.filter(r => r.currentStatus === "draft").length;
    const reviewedRisks = allRisks.filter(r => r.currentStatus === "reviewed").length;
    const approvedRisks = allRisks.filter(r => r.currentStatus === "approved").length;
    const validatedRisks = allRisks.filter(r => r.currentStatus === "validated").length;

    const criticalRisks = allRisks.filter(r => r.inherentRiskScore >= 16).length;
    const highRisks = allRisks.filter(r => r.inherentRiskScore >= 9 && r.inherentRiskScore < 16).length;
    const mediumRisks = allRisks.filter(r => r.inherentRiskScore >= 4 && r.inherentRiskScore < 9).length;
    const lowRisks = allRisks.filter(r => r.inherentRiskScore < 4).length;

    const activeMitigations = allMitigations.filter(m => m.status === "in_progress").length;
    const completedMitigations = allMitigations.filter(m => m.status === "completed").length;
    const plannedMitigations = allMitigations.filter(m => m.status === "planned").length;

    const risksByT1 = t1s.map(t => ({
      name: t.name,
      count: allRisks.filter(r => r.t1Id === t.id).length,
    }));

    const risksByOrgUnit = orgUnitsList
      .filter(u => u.type === "directorate" || u.type === "branch")
      .map(u => ({
        name: u.name.replace("Direktorat ", "").replace("Cabang ", ""),
        type: u.type,
        count: allRisks.filter(r => r.orgUnitId === u.id).length,
      }))
      .filter(u => u.count > 0);

    const heatMapData = allRisks.map(r => ({
      likelihood: r.likelihoodScore,
      impact: r.impactScore,
      title: r.title,
      id: r.id,
      riskCode: r.riskCode,
      currentStatus: r.currentStatus,
    }));

    const topRisks = allRisks
      .sort((a, b) => b.inherentRiskScore - a.inherentRiskScore)
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        riskCode: r.riskCode,
        title: r.title,
        inherentRiskScore: r.inherentRiskScore,
        impactScore: r.impactScore,
        likelihoodScore: r.likelihoodScore,
        currentStatus: r.currentStatus,
        riskOwner: r.riskOwner,
        orgUnitId: r.orgUnitId,
      }));

    res.json({
      totalRisks,
      draftRisks,
      reviewedRisks,
      approvedRisks,
      validatedRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      activeMitigations,
      completedMitigations,
      plannedMitigations,
      totalMitigations: allMitigations.length,
      risksByT1,
      risksByOrgUnit,
      heatMapData,
      topRisks,
    });
  });

  return httpServer;
}
