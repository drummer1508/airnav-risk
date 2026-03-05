import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRiskSchema, insertRiskCategorySchema, insertMitigationSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/risk-categories", async (_req, res) => {
    const categories = await storage.getRiskCategories();
    res.json(categories);
  });

  app.post("/api/risk-categories", async (req, res) => {
    const parsed = insertRiskCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const cat = await storage.createRiskCategory(parsed.data);
    res.status(201).json(cat);
  });

  app.patch("/api/risk-categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertRiskCategorySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const cat = await storage.updateRiskCategory(id, parsed.data);
    if (!cat) return res.status(404).json({ message: "Not found" });
    res.json(cat);
  });

  app.delete("/api/risk-categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteRiskCategory(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
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

  app.get("/api/dashboard/stats", async (_req, res) => {
    const allRisks = await storage.getRisks();
    const allMitigations = await storage.getMitigations();
    const categories = await storage.getRiskCategories();

    const totalRisks = allRisks.length;
    const openRisks = allRisks.filter(r => r.status === "open").length;
    const mitigatedRisks = allRisks.filter(r => r.status === "mitigated").length;
    const closedRisks = allRisks.filter(r => r.status === "closed").length;

    const criticalRisks = allRisks.filter(r => r.riskScore >= 16).length;
    const highRisks = allRisks.filter(r => r.riskScore >= 9 && r.riskScore < 16).length;
    const mediumRisks = allRisks.filter(r => r.riskScore >= 4 && r.riskScore < 9).length;
    const lowRisks = allRisks.filter(r => r.riskScore < 4).length;

    const activeMitigations = allMitigations.filter(m => m.status === "in_progress").length;
    const completedMitigations = allMitigations.filter(m => m.status === "completed").length;

    const risksByCategory = categories.map(cat => ({
      name: cat.name,
      color: cat.color,
      count: allRisks.filter(r => r.categoryId === cat.id).length,
    }));

    const heatMapData = allRisks.map(r => ({
      likelihood: r.likelihood,
      impact: r.impact,
      title: r.title,
      id: r.id,
    }));

    res.json({
      totalRisks,
      openRisks,
      mitigatedRisks,
      closedRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      activeMitigations,
      completedMitigations,
      totalMitigations: allMitigations.length,
      risksByCategory,
      heatMapData,
    });
  });

  return httpServer;
}
