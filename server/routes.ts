import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRiskSchema, insertMitigationSchema, insertOrgUnitSchema, insertWorkflowLogSchema, insertUserSchema } from "@shared/schema";
import { setupSession, hashPassword, verifyPassword, requireAuth, requireRole } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use(setupSession());

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username dan password harus diisi" });
    const user = await storage.getUserByUsername(username);
    if (!user || !user.isActive) return res.status(401).json({ message: "Username atau password salah" });
    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ message: "Username atau password salah" });
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.fullName = user.fullName;
    req.session.username = user.username;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Belum login" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User tidak ditemukan" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/users", requireRole("sysadmin"), async (_req, res) => {
    const allUsers = await storage.getUsers();
    const safeUsers = allUsers.map(({ password: _, ...u }) => u);
    res.json(safeUsers);
  });

  app.post("/api/users", requireRole("sysadmin"), async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) return res.status(409).json({ message: "Username sudah digunakan" });
    const hashed = await hashPassword(parsed.data.password);
    const user = await storage.createUser({ ...parsed.data, password: hashed });
    const { password: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  });

  app.patch("/api/users/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertUserSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = { ...parsed.data };
    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    const user = await storage.updateUser(id, data);
    if (!user) return res.status(404).json({ message: "Not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.delete("/api/users/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    if (id === req.session.userId) return res.status(400).json({ message: "Tidak bisa menghapus akun sendiri" });
    const ok = await storage.deleteUser(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/org-units", requireAuth, async (_req, res) => {
    const units = await storage.getOrgUnits();
    res.json(units);
  });

  app.post("/api/org-units", requireRole("sysadmin"), async (req, res) => {
    const parsed = insertOrgUnitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const unit = await storage.createOrgUnit(parsed.data);
    res.status(201).json(unit);
  });

  app.patch("/api/org-units/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertOrgUnitSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const unit = await storage.updateOrgUnit(id, parsed.data);
    if (!unit) return res.status(404).json({ message: "Not found" });
    res.json(unit);
  });

  app.delete("/api/org-units/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteOrgUnit(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/taxonomy/t1", requireAuth, async (_req, res) => {
    const t1s = await storage.getTaxonomyT1();
    res.json(t1s);
  });

  app.post("/api/taxonomy/t1", requireRole("sysadmin"), async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nama harus diisi" });
    const t1 = await storage.createTaxonomyT1({ name });
    res.status(201).json(t1);
  });

  app.patch("/api/taxonomy/t1/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nama harus diisi" });
    const t1 = await storage.updateTaxonomyT1(id, { name });
    if (!t1) return res.status(404).json({ message: "Not found" });
    res.json(t1);
  });

  app.delete("/api/taxonomy/t1/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteTaxonomyT1(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/taxonomy/t2", requireAuth, async (req, res) => {
    const t1Id = req.query.t1Id ? parseInt(req.query.t1Id as string) : undefined;
    const t2s = await storage.getTaxonomyT2(t1Id);
    res.json(t2s);
  });

  app.post("/api/taxonomy/t2", requireRole("sysadmin"), async (req, res) => {
    const { name, t1Id } = req.body;
    if (!name || !t1Id) return res.status(400).json({ message: "Nama dan t1Id harus diisi" });
    const t2 = await storage.createTaxonomyT2({ name, t1Id });
    res.status(201).json(t2);
  });

  app.patch("/api/taxonomy/t2/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, t1Id } = req.body;
    if (!name) return res.status(400).json({ message: "Nama harus diisi" });
    const t2 = await storage.updateTaxonomyT2(id, { name, t1Id });
    if (!t2) return res.status(404).json({ message: "Not found" });
    res.json(t2);
  });

  app.delete("/api/taxonomy/t2/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteTaxonomyT2(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/taxonomy/t3", requireAuth, async (req, res) => {
    const t2Id = req.query.t2Id ? parseInt(req.query.t2Id as string) : undefined;
    const t3s = await storage.getTaxonomyT3(t2Id);
    res.json(t3s);
  });

  app.post("/api/taxonomy/t3", requireRole("sysadmin"), async (req, res) => {
    const { name, t2Id } = req.body;
    if (!name || !t2Id) return res.status(400).json({ message: "Nama dan t2Id harus diisi" });
    const t3 = await storage.createTaxonomyT3({ name, t2Id });
    res.status(201).json(t3);
  });

  app.patch("/api/taxonomy/t3/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, t2Id } = req.body;
    if (!name) return res.status(400).json({ message: "Nama harus diisi" });
    const t3 = await storage.updateTaxonomyT3(id, { name, t2Id });
    if (!t3) return res.status(404).json({ message: "Not found" });
    res.json(t3);
  });

  app.delete("/api/taxonomy/t3/:id", requireRole("sysadmin"), async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteTaxonomyT3(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/risks", requireAuth, async (_req, res) => {
    const allRisks = await storage.getRisks();
    res.json(allRisks);
  });

  app.get("/api/risks/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const risk = await storage.getRisk(id);
    if (!risk) return res.status(404).json({ message: "Not found" });
    res.json(risk);
  });

  app.post("/api/risks", requireRole("sysadmin", "inputer"), async (req, res) => {
    const parsed = insertRiskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const risk = await storage.createRisk(parsed.data);
    res.status(201).json(risk);
  });

  app.patch("/api/risks/:id", requireRole("sysadmin", "inputer", "reviewer", "approval"), async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertRiskSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const risk = await storage.updateRisk(id, parsed.data);
    if (!risk) return res.status(404).json({ message: "Not found" });
    res.json(risk);
  });

  app.delete("/api/risks/:id", requireRole("sysadmin", "inputer"), async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteRisk(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/mitigations", requireAuth, async (_req, res) => {
    const mits = await storage.getMitigations();
    res.json(mits);
  });

  app.get("/api/mitigations/risk/:riskId", requireAuth, async (req, res) => {
    const riskId = parseInt(req.params.riskId);
    const mits = await storage.getMitigationsByRiskId(riskId);
    res.json(mits);
  });

  app.post("/api/mitigations", requireRole("sysadmin", "inputer"), async (req, res) => {
    const parsed = insertMitigationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const mit = await storage.createMitigation(parsed.data);
    res.status(201).json(mit);
  });

  app.patch("/api/mitigations/:id", requireRole("sysadmin", "inputer"), async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertMitigationSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const mit = await storage.updateMitigation(id, parsed.data);
    if (!mit) return res.status(404).json({ message: "Not found" });
    res.json(mit);
  });

  app.delete("/api/mitigations/:id", requireRole("sysadmin", "inputer"), async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteMitigation(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/workflow-logs/:riskId", requireAuth, async (req, res) => {
    const riskId = parseInt(req.params.riskId);
    const logs = await storage.getWorkflowLogs(riskId);
    res.json(logs);
  });

  app.post("/api/workflow-logs", requireRole("sysadmin", "reviewer", "approval"), async (req, res) => {
    const parsed = insertWorkflowLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const log = await storage.createWorkflowLog(parsed.data);

    if (parsed.data.toStatus) {
      await storage.updateRisk(parsed.data.riskId, { currentStatus: parsed.data.toStatus });
    }
    res.status(201).json(log);
  });

  app.get("/api/dashboard/stats", requireAuth, async (_req, res) => {
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
