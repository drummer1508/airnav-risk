import { db } from "./db";
import { users, orgUnits, taxonomyT1, taxonomyT2, taxonomyT3, risks, mitigations, workflowLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await db.insert(users).values([
      { username: "sysadmin", password: hash, fullName: "System Administrator", role: "sysadmin", line: 0, isActive: true },
      { username: "inputer1", password: await bcrypt.hash("inputer123", 10), fullName: "Budi Santoso", role: "inputer", line: 1, isActive: true },
      { username: "reviewer1", password: await bcrypt.hash("reviewer123", 10), fullName: "Ahmad Fauzi", role: "reviewer", line: 1, isActive: true },
      { username: "approval1", password: await bcrypt.hash("approval123", 10), fullName: "Direktur Operasi", role: "approval", line: 1, isActive: true },
      { username: "reviewer2", password: await bcrypt.hash("reviewer123", 10), fullName: "Siti Rahayu (L2)", role: "reviewer", line: 2, isActive: true },
      { username: "approval2", password: await bcrypt.hash("approval123", 10), fullName: "VP Risk Management", role: "approval", line: 2, isActive: true },
    ]);
  } else {
    const usernames = existingUsers.map(u => u.username);
    const newUsers: any[] = [];
    if (!usernames.includes("reviewer2")) {
      newUsers.push({ username: "reviewer2", password: await bcrypt.hash("reviewer123", 10), fullName: "Siti Rahayu (L2)", role: "reviewer", line: 2, isActive: true });
    }
    if (!usernames.includes("approval2")) {
      newUsers.push({ username: "approval2", password: await bcrypt.hash("approval123", 10), fullName: "VP Risk Management", role: "approval", line: 2, isActive: true });
    }

    const allOrgs = await db.select().from(orgUnits);
    const gaOrg = allOrgs.find(o => o.name === "GA - Cabang Soekarno-Hatta");
    if (gaOrg) {
      const existingSubDivs = allOrgs.filter(o => o.parentId === gaOrg.id && o.type === "sub_division");
      if (existingSubDivs.length === 0) {
        const subs = await db.insert(orgUnits).values([
          { name: "Sub Divisi Finansial - Cabang Soekarno-Hatta", parentId: gaOrg.id, type: "sub_division", level: "branch" },
          { name: "Sub Divisi Personalia - Cabang Soekarno-Hatta", parentId: gaOrg.id, type: "sub_division", level: "branch" },
        ]).returning();
        const branch = allOrgs.find(o => o.name === "Cabang Soekarno-Hatta");
        if (!usernames.includes("inputer_fin_cgt")) {
          newUsers.push({ username: "inputer_fin_cgt", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Finansial CGK", role: "inputer", line: 1, orgUnitId: subs[0].id, isActive: true });
        }
        if (!usernames.includes("inputer_hr_cgt")) {
          newUsers.push({ username: "inputer_hr_cgt", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Personalia CGK", role: "inputer", line: 1, orgUnitId: subs[1].id, isActive: true });
        }
        if (!usernames.includes("reviewer_ga_cgt")) {
          newUsers.push({ username: "reviewer_ga_cgt", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Divisi GA CGK", role: "reviewer", line: 1, orgUnitId: gaOrg.id, isActive: true });
        }
        if (!usernames.includes("approval_gm_cgt") && branch) {
          newUsers.push({ username: "approval_gm_cgt", password: await bcrypt.hash("approval123", 10), fullName: "GM Cabang Soekarno-Hatta", role: "approval", line: 1, orgUnitId: branch.id, isActive: true });
        }
      }
    }

    const dirKeuOrg = allOrgs.find(o => o.name === "Direktorat Keuangan");
    const existingSubRisiko = allOrgs.find(o => o.name === "Sub Divisi Risiko");
    if (dirKeuOrg && !existingSubRisiko) {
      const subRisiko = await db.insert(orgUnits).values([
        { name: "Sub Divisi Risiko", parentId: dirKeuOrg.id, type: "sub_division", level: "head_office" },
      ]).returning();
      if (!usernames.includes("reviewer_risiko")) {
        newUsers.push({ username: "reviewer_risiko", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Sub Divisi Risiko", role: "reviewer", line: 2, orgUnitId: subRisiko[0].id, isActive: true });
      }
      if (!usernames.includes("inputer_risiko")) {
        newUsers.push({ username: "inputer_risiko", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Risiko", role: "inputer", line: 1, orgUnitId: subRisiko[0].id, isActive: true });
      }
    } else if (existingSubRisiko && dirKeuOrg && existingSubRisiko.parentId !== dirKeuOrg.id) {
      await db.update(orgUnits).set({ parentId: dirKeuOrg.id }).where(eq(orgUnits.id, existingSubRisiko.id));
    }

    const internalAudit = allOrgs.find(o => o.name === "Internal Audit");
    if (internalAudit) {
      if (internalAudit.type !== "directorate") {
        await db.update(orgUnits).set({ type: "directorate" }).where(eq(orgUnits.id, internalAudit.id));
      }
      if (!usernames.includes("reviewer_audit")) {
        newUsers.push({ username: "reviewer_audit", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Internal Audit", role: "reviewer", line: 3, orgUnitId: internalAudit.id, isActive: true });
      }
      if (!usernames.includes("inputer_audit")) {
        newUsers.push({ username: "inputer_audit", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Auditor", role: "inputer", line: 1, orgUnitId: internalAudit.id, isActive: true });
      }
    }

    const kantorPusat = allOrgs.find(o => o.name === "Kantor Pusat");
    if (kantorPusat) {
      if (!usernames.includes("dirut")) {
        newUsers.push({ username: "dirut", password: await bcrypt.hash("approval123", 10), fullName: "Direktur Utama", role: "approval", line: 1, orgUnitId: kantorPusat.id, isActive: true });
      }
      if (!allOrgs.find(o => o.name === "Komite Audit")) {
        await db.insert(orgUnits).values([
          { name: "Komite Audit", parentId: kantorPusat.id, type: "committee", level: "head_office" },
        ]);
      }
      if (!usernames.includes("komite_audit")) {
        newUsers.push({ username: "komite_audit", password: await bcrypt.hash("approval123", 10), fullName: "Ketua Komite Audit", role: "approval", line: 1, orgUnitId: kantorPusat.id, isActive: true });
      }
      const existingKomiteUser = existingUsers.find(u => u.username === "komite_audit");
      if (existingKomiteUser && existingKomiteUser.orgUnitId !== kantorPusat.id) {
        await db.update(users).set({ orgUnitId: kantorPusat.id }).where(eq(users.id, existingKomiteUser.id));
      }
    }

    const dirOps = allOrgs.find(o => o.name === "Direktorat Operasi");
    const divAtc = allOrgs.find(o => o.name === "Divisi Operasi ATC");
    if (dirOps && divAtc) {
      if (!usernames.includes("inputer_atc")) {
        newUsers.push({ username: "inputer_atc", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Operasi ATC", role: "inputer", line: 1, orgUnitId: divAtc.id, isActive: true });
      }
      if (!usernames.includes("reviewer_atc")) {
        newUsers.push({ username: "reviewer_atc", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Divisi Operasi ATC", role: "reviewer", line: 1, orgUnitId: divAtc.id, isActive: true });
      }
      if (!usernames.includes("approval_dir_ops")) {
        newUsers.push({ username: "approval_dir_ops", password: await bcrypt.hash("approval123", 10), fullName: "Direktur Operasi", role: "approval", line: 1, orgUnitId: dirOps.id, isActive: true });
      }
    }

    const dirKeu = allOrgs.find(o => o.name === "Direktorat Keuangan");
    const divKeu = allOrgs.find(o => o.name === "Divisi Keuangan");
    if (dirKeu && divKeu) {
      if (!usernames.includes("inputer_keu")) {
        newUsers.push({ username: "inputer_keu", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Divisi Keuangan", role: "inputer", line: 1, orgUnitId: divKeu.id, isActive: true });
      }
      if (!usernames.includes("reviewer_keu")) {
        newUsers.push({ username: "reviewer_keu", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Divisi Keuangan", role: "reviewer", line: 1, orgUnitId: divKeu.id, isActive: true });
      }
      if (!usernames.includes("approval_dir_keu")) {
        newUsers.push({ username: "approval_dir_keu", password: await bcrypt.hash("approval123", 10), fullName: "Direktur Keuangan", role: "approval", line: 1, orgUnitId: dirKeu.id, isActive: true });
      }
    }

    if (newUsers.length > 0) {
      await db.insert(users).values(newUsers);
    }
  }

  const existingT1 = await db.select().from(taxonomyT1);
  if (existingT1.length > 0) return;

  const t1s = await db.insert(taxonomyT1).values([
    { name: "Portofolio BUMN" },
    { name: "Struktur Korporasi & Organisasi" },
    { name: "Bisnis BUMN" },
    { name: "Risiko Lainnya" },
  ]).returning();

  const t2s = await db.insert(taxonomyT2).values([
    { t1Id: t1s[0].id, name: "Fiskal" },
    { t1Id: t1s[0].id, name: "Kebijakan" },
    { t1Id: t1s[1].id, name: "Komposisi" },
    { t1Id: t1s[1].id, name: "Struktur Korporasi" },
    { t1Id: t1s[1].id, name: "Restrukturisasi" },
    { t1Id: t1s[2].id, name: "Industri Umum" },
    { t1Id: t1s[2].id, name: "Perbankan" },
    { t1Id: t1s[2].id, name: "Asuransi" },
    { t1Id: t1s[3].id, name: "Lainnya" },
  ]).returning();

  await db.insert(taxonomyT3).values([
    { t2Id: t2s[0].id, name: "Dividen" },
    { t2Id: t2s[0].id, name: "PMN" },
    { t2Id: t2s[0].id, name: "Subsidi" },
    { t2Id: t2s[1].id, name: "Kebijakan Pemerintah" },
    { t2Id: t2s[2].id, name: "SDM" },
    { t2Id: t2s[3].id, name: "Tata Kelola" },
    { t2Id: t2s[4].id, name: "Merger & Akuisisi" },
    { t2Id: t2s[5].id, name: "Sektoral" },
    { t2Id: t2s[5].id, name: "Pasar/Makro" },
    { t2Id: t2s[5].id, name: "Keuangan" },
    { t2Id: t2s[5].id, name: "Hukum/Reputasi" },
    { t2Id: t2s[5].id, name: "Proyek" },
    { t2Id: t2s[5].id, name: "TI/Siber" },
    { t2Id: t2s[5].id, name: "HSSE" },
    { t2Id: t2s[5].id, name: "Operasional" },
    { t2Id: t2s[6].id, name: "Kredit" },
    { t2Id: t2s[6].id, name: "Likuiditas" },
    { t2Id: t2s[7].id, name: "Investasi" },
    { t2Id: t2s[7].id, name: "Aktuarial" },
    { t2Id: t2s[8].id, name: "Risiko Lain-Lain" },
    { t2Id: t2s[8].id, name: "Reputasi" },
  ]);

  const headOffice = await db.insert(orgUnits).values([
    { name: "Kantor Pusat", parentId: null, type: "head_office", level: "head_office" },
  ]).returning();

  const direktorats = await db.insert(orgUnits).values([
    { name: "Direktorat Operasi", parentId: headOffice[0].id, type: "directorate", level: "head_office" },
    { name: "Direktorat Teknik", parentId: headOffice[0].id, type: "directorate", level: "head_office" },
    { name: "Direktorat Keuangan", parentId: headOffice[0].id, type: "directorate", level: "head_office" },
    { name: "Direktorat Personalia & Umum", parentId: headOffice[0].id, type: "directorate", level: "head_office" },
    { name: "Direktorat Safety", parentId: headOffice[0].id, type: "directorate", level: "head_office" },
    { name: "Sekretaris Perusahaan", parentId: headOffice[0].id, type: "function", level: "head_office" },
    { name: "Corporate Planning", parentId: headOffice[0].id, type: "function", level: "head_office" },
    { name: "Internal Audit", parentId: headOffice[0].id, type: "directorate", level: "head_office" },
    { name: "Komite Audit", parentId: headOffice[0].id, type: "committee", level: "head_office" },
  ]).returning();

  const divisions = await db.insert(orgUnits).values([
    { name: "Divisi Operasi ATC", parentId: direktorats[0].id, type: "division", level: "head_office" },
    { name: "Divisi Perencanaan Operasi", parentId: direktorats[0].id, type: "division", level: "head_office" },
    { name: "Divisi Teknik Navigasi", parentId: direktorats[1].id, type: "division", level: "head_office" },
    { name: "Divisi Teknik Fasilitas", parentId: direktorats[1].id, type: "division", level: "head_office" },
    { name: "Divisi Keuangan", parentId: direktorats[2].id, type: "division", level: "head_office" },
    { name: "Divisi Akuntansi", parentId: direktorats[2].id, type: "division", level: "head_office" },
    { name: "Divisi SDM", parentId: direktorats[3].id, type: "division", level: "head_office" },
    { name: "Divisi Umum", parentId: direktorats[3].id, type: "division", level: "head_office" },
    { name: "Divisi Safety Management", parentId: direktorats[4].id, type: "division", level: "head_office" },
    { name: "Divisi Quality Assurance", parentId: direktorats[4].id, type: "division", level: "head_office" },
  ]).returning();

  const subDivRisiko = await db.insert(orgUnits).values([
    { name: "Sub Divisi Risiko", parentId: direktorats[2].id, type: "sub_division", level: "head_office" },
  ]).returning();

  await db.insert(users).values([
    { username: "inputer_atc", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Operasi ATC", role: "inputer", line: 1, orgUnitId: divisions[0].id, isActive: true },
    { username: "reviewer_atc", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Divisi Operasi ATC", role: "reviewer", line: 1, orgUnitId: divisions[0].id, isActive: true },
    { username: "approval_dir_ops", password: await bcrypt.hash("approval123", 10), fullName: "Direktur Operasi", role: "approval", line: 1, orgUnitId: direktorats[0].id, isActive: true },
    { username: "inputer_keu", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Divisi Keuangan", role: "inputer", line: 1, orgUnitId: divisions[4].id, isActive: true },
    { username: "reviewer_keu", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Divisi Keuangan", role: "reviewer", line: 1, orgUnitId: divisions[4].id, isActive: true },
    { username: "approval_dir_keu", password: await bcrypt.hash("approval123", 10), fullName: "Direktur Keuangan", role: "approval", line: 1, orgUnitId: direktorats[2].id, isActive: true },
    { username: "reviewer_risiko", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Sub Divisi Risiko", role: "reviewer", line: 2, orgUnitId: subDivRisiko[0].id, isActive: true },
    { username: "inputer_risiko", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Risiko", role: "inputer", line: 1, orgUnitId: subDivRisiko[0].id, isActive: true },
    { username: "reviewer_audit", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Internal Audit", role: "reviewer", line: 3, orgUnitId: direktorats[7].id, isActive: true },
    { username: "inputer_audit", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Auditor", role: "inputer", line: 1, orgUnitId: direktorats[7].id, isActive: true },
    { username: "dirut", password: await bcrypt.hash("approval123", 10), fullName: "Direktur Utama", role: "approval", line: 1, orgUnitId: headOffice[0].id, isActive: true },
    { username: "komite_audit", password: await bcrypt.hash("approval123", 10), fullName: "Ketua Komite Audit", role: "approval", line: 1, orgUnitId: headOffice[0].id, isActive: true },
  ]);

  const branches = await db.insert(orgUnits).values([
    { name: "Cabang Soekarno-Hatta", parentId: headOffice[0].id, type: "branch", level: "branch" },
    { name: "Cabang Ngurah Rai", parentId: headOffice[0].id, type: "branch", level: "branch" },
    { name: "Cabang Juanda", parentId: headOffice[0].id, type: "branch", level: "branch" },
  ]).returning();

  const branchDivs = await db.insert(orgUnits).values([
    { name: "Operasi - Cabang Soekarno-Hatta", parentId: branches[0].id, type: "branch_division", level: "branch" },
    { name: "Teknik - Cabang Soekarno-Hatta", parentId: branches[0].id, type: "branch_division", level: "branch" },
    { name: "Safety - Cabang Soekarno-Hatta", parentId: branches[0].id, type: "branch_division", level: "branch" },
    { name: "GA - Cabang Soekarno-Hatta", parentId: branches[0].id, type: "branch_division", level: "branch" },
  ]).returning();

  const gaDiv = branchDivs[3];
  const subDivs = await db.insert(orgUnits).values([
    { name: "Sub Divisi Finansial - Cabang Soekarno-Hatta", parentId: gaDiv.id, type: "sub_division", level: "branch" },
    { name: "Sub Divisi Personalia - Cabang Soekarno-Hatta", parentId: gaDiv.id, type: "sub_division", level: "branch" },
  ]).returning();

  await db.insert(users).values([
    { username: "inputer_fin_cgt", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Finansial CGK", role: "inputer", line: 1, orgUnitId: subDivs[0].id, isActive: true },
    { username: "inputer_hr_cgt", password: await bcrypt.hash("inputer123", 10), fullName: "Staf Personalia CGK", role: "inputer", line: 1, orgUnitId: subDivs[1].id, isActive: true },
    { username: "reviewer_ga_cgt", password: await bcrypt.hash("reviewer123", 10), fullName: "Kepala Divisi GA CGK", role: "reviewer", line: 1, orgUnitId: gaDiv.id, isActive: true },
    { username: "approval_gm_cgt", password: await bcrypt.hash("approval123", 10), fullName: "GM Cabang Soekarno-Hatta", role: "approval", line: 1, orgUnitId: branches[0].id, isActive: true },
  ]);

  const allT3 = await db.select().from(taxonomyT3);
  const getT3 = (name: string) => allT3.find(t => t.name === name);
  const allT2 = await db.select().from(taxonomyT2);
  const getT2 = (name: string) => allT2.find(t => t.name === name);

  const createdRisks = await db.insert(risks).values([
    {
      riskCode: "RISK-2025-OPS-001",
      title: "ATC System Outage",
      description: "Risiko gangguan sistem ATC yang menyebabkan downtime pada layanan navigasi udara",
      rootCause: "Aging hardware, keterbatasan redundansi sistem, dan keterlambatan upgrade infrastruktur TI",
      consequence: "Gangguan layanan navigasi udara, potensi delay penerbangan massal, dan risiko keselamatan penerbangan",
      orgUnitId: direktorats[0].id,
      riskOwner: "Budi Santoso",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("TI/Siber")?.id,
      impactCriteria: "it",
      impactIt: 5,
      impactFinancial: 3,
      impactHsse: 4,
      impactScore: 5,
      likelihoodScore: 3,
      inherentRiskScore: 15,
      currentStatus: "approved",
      rkapYear: 2025,
    },
    {
      riskCode: "RISK-2025-FIN-001",
      title: "Budget Overrun CNS Modernization",
      description: "Program modernisasi CNS melebihi anggaran yang disetujui RKAP lebih dari 15%",
      rootCause: "Fluktuasi nilai tukar, keterlambatan pengadaan, dan perubahan scope proyek",
      consequence: "Tekanan arus kas, penundaan proyek lain, dan potensi penyesuaian RKAP",
      orgUnitId: direktorats[2].id,
      riskOwner: "Rina Wijaya",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("Keuangan")?.id,
      impactCriteria: "financial",
      financialEstimate: "25000000000",
      impactFinancial: 4,
      impactScore: 4,
      likelihoodScore: 4,
      inherentRiskScore: 16,
      currentStatus: "validated",
      rkapYear: 2025,
    },
    {
      riskCode: "RISK-2025-SAF-001",
      title: "ICAO USOAP Audit Non-Compliance",
      description: "Potensi temuan ketidaksesuaian pada audit ICAO USOAP terhadap standar SARP",
      rootCause: "Gap dalam implementasi prosedur SMS, dokumentasi yang belum terupdate, dan kurangnya pelatihan",
      consequence: "Penurunan rating safety nasional, pembatasan penerbangan internasional",
      orgUnitId: direktorats[4].id,
      riskOwner: "Ahmad Fauzi",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("Operasional")?.id,
      impactCriteria: "compliance",
      impactCompliance: 5,
      impactReputation: 4,
      impactScore: 5,
      likelihoodScore: 2,
      inherentRiskScore: 10,
      residualImpact: 3,
      residualLikelihood: 1,
      residualRiskScore: 3,
      currentStatus: "validated",
      rkapYear: 2025,
    },
    {
      riskCode: "RISK-2025-IT-001",
      title: "Cybersecurity Breach pada Infrastruktur Kritikal",
      description: "Akses tidak sah ke sistem TI kritikal navigasi udara dan pencurian data sensitif",
      rootCause: "Evolusi ancaman siber, kerentanan zero-day, dan insider threat",
      consequence: "Gangguan layanan, pencurian data rahasia, dan kerusakan reputasi organisasi",
      orgUnitId: direktorats[1].id,
      riskOwner: "Dewi Lestari",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("TI/Siber")?.id,
      impactCriteria: "it",
      impactIt: 5,
      impactFinancial: 4,
      impactReputation: 5,
      impactScore: 5,
      likelihoodScore: 3,
      inherentRiskScore: 15,
      currentStatus: "approved",
      rkapYear: 2025,
    },
    {
      riskCode: "RISK-2025-HR-001",
      title: "Kekurangan ATCO Bersertifikasi",
      description: "Jumlah Air Traffic Controller bersertifikasi tidak mencukupi untuk operasional peak hours",
      rootCause: "Masa pensiun massal, program pelatihan belum optimal, dan kompetisi dengan maskapai",
      consequence: "Pembatasan kapasitas sektor, overtime berlebihan, dan peningkatan risiko fatigue",
      orgUnitId: direktorats[3].id,
      riskOwner: "Hendra Pratama",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("SDM")?.id,
      impactCriteria: "hr",
      impactHr: 4,
      impactHsse: 4,
      impactFinancial: 3,
      impactScore: 4,
      likelihoodScore: 4,
      inherentRiskScore: 16,
      currentStatus: "reviewed",
      rkapYear: 2025,
    },
    {
      riskCode: "RISK-2025-STR-001",
      title: "Penurunan Market Share Layanan Aeronautika",
      description: "Kehilangan pangsa pasar informasi aeronautika akibat kompetisi dan disrupsi teknologi",
      rootCause: "Munculnya penyedia layanan informasi alternatif berbasis digital dan AI",
      consequence: "Penurunan pendapatan non-ATC dan relevansi organisasi dalam ekosistem penerbangan",
      orgUnitId: direktorats[0].id,
      riskOwner: "Sari Handayani",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("Sektoral")?.id,
      impactCriteria: "market",
      impactMarket: 3,
      impactFinancial: 3,
      impactScore: 3,
      likelihoodScore: 2,
      inherentRiskScore: 6,
      currentStatus: "draft",
      rkapYear: 2025,
    },
    {
      riskCode: "RISK-2025-TEK-001",
      title: "Kegagalan Radar di Approach Control",
      description: "Kegagalan sistem radar primer dan sekunder di fasilitas approach control utama",
      rootCause: "Usia peralatan melebihi lifecycle, keterlambatan procurement spare part",
      consequence: "Pemberlakuan prosedur non-radar, penurunan kapasitas area control, dan delay signifikan",
      orgUnitId: direktorats[1].id,
      riskOwner: "Agus Prasetyo",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("Operasional")?.id,
      impactCriteria: "hsse",
      impactHsse: 5,
      impactIt: 4,
      impactFinancial: 3,
      impactScore: 5,
      likelihoodScore: 2,
      inherentRiskScore: 10,
      residualImpact: 3,
      residualLikelihood: 1,
      residualRiskScore: 3,
      currentStatus: "validated",
      rkapYear: 2025,
    },
    {
      riskCode: "RISK-2025-LEG-001",
      title: "Dampak Perubahan Regulasi Penerbangan",
      description: "Perubahan regulasi CASR baru yang membutuhkan modifikasi signifikan pada prosedur dan infrastruktur",
      rootCause: "Harmonisasi regulasi dengan standar internasional terbaru",
      consequence: "Biaya kepatuhan tinggi, perubahan prosedur operasional, dan potensi penalti non-compliance",
      orgUnitId: direktorats[4].id,
      riskOwner: "Nurul Hidayah",
      t1Id: t1s[2].id,
      t2Id: getT2("Industri Umum")?.id,
      t3Id: getT3("Hukum/Reputasi")?.id,
      impactCriteria: "legal",
      impactLegal: 3,
      impactCompliance: 4,
      impactFinancial: 3,
      impactScore: 4,
      likelihoodScore: 3,
      inherentRiskScore: 12,
      currentStatus: "approved",
      rkapYear: 2025,
    },
  ]).returning();

  await db.insert(mitigations).values([
    {
      riskId: createdRisks[0].id,
      strategy: "reduce",
      actionDescription: "Implementasi sistem ATC redundan dengan automatic failover di seluruh pusat kontrol utama",
      picName: "Budi Santoso",
      deadline: "2025-06-30",
      estimatedCost: "15000000000",
      progress: 45,
      status: "in_progress",
    },
    {
      riskId: createdRisks[0].id,
      strategy: "reduce",
      actionDescription: "Penyusunan dan drill prosedur emergency untuk skenario ATC system outage",
      picName: "Tim Operasi",
      deadline: "2025-03-15",
      progress: 100,
      status: "completed",
    },
    {
      riskId: createdRisks[1].id,
      strategy: "reduce",
      actionDescription: "Review anggaran kuartalan dengan seluruh stakeholder proyek CNS modernisasi",
      picName: "Rina Wijaya",
      deadline: "2025-04-30",
      estimatedCost: "500000000",
      progress: 60,
      status: "in_progress",
    },
    {
      riskId: createdRisks[2].id,
      strategy: "reduce",
      actionDescription: "Gap analysis komprehensif terhadap ICAO SARPs dan remediasi temuan",
      picName: "Tim QA",
      deadline: "2025-02-28",
      progress: 100,
      status: "completed",
    },
    {
      riskId: createdRisks[3].id,
      strategy: "reduce",
      actionDescription: "Upgrade firewall, IDS/IPS, dan implementasi arsitektur zero-trust",
      picName: "Dewi Lestari",
      deadline: "2025-08-30",
      estimatedCost: "8000000000",
      progress: 30,
      status: "in_progress",
    },
    {
      riskId: createdRisks[3].id,
      strategy: "transfer",
      actionDescription: "Pengadaan cyber insurance untuk memitigasi dampak finansial serangan siber",
      picName: "Tim Keuangan",
      deadline: "2025-05-15",
      estimatedCost: "2000000000",
      progress: 0,
      status: "planned",
    },
    {
      riskId: createdRisks[4].id,
      strategy: "reduce",
      actionDescription: "Program pelatihan ATCO akselerasi dan kerjasama dengan lembaga sertifikasi",
      picName: "Hendra Pratama",
      deadline: "2025-12-31",
      estimatedCost: "5000000000",
      progress: 25,
      status: "in_progress",
    },
    {
      riskId: createdRisks[6].id,
      strategy: "reduce",
      actionDescription: "Implementasi preventive maintenance schedule enhanced untuk seluruh peralatan radar",
      picName: "Tim Teknik",
      deadline: "2025-01-31",
      progress: 100,
      status: "completed",
    },
    {
      riskId: createdRisks[6].id,
      strategy: "avoid",
      actionDescription: "Pengadaan radar baru untuk menggantikan unit yang telah melewati lifecycle",
      picName: "Agus Prasetyo",
      deadline: "2025-09-30",
      estimatedCost: "50000000000",
      progress: 15,
      status: "in_progress",
    },
    {
      riskId: createdRisks[7].id,
      strategy: "accept",
      actionDescription: "Monitoring otomatis perubahan regulasi dari ICAO, DGCA, dan badan regional",
      picName: "Tim Legal",
      deadline: "2025-07-31",
      progress: 0,
      status: "planned",
    },
  ]);

  await db.insert(workflowLogs).values([
    { riskId: createdRisks[0].id, fromStatus: "draft", toStatus: "reviewed", actorName: "Supervisor A", actorRole: "reviewer", comments: "Data operasional sudah divalidasi" },
    { riskId: createdRisks[0].id, fromStatus: "reviewed", toStatus: "approved", actorName: "Direktur Operasi", actorRole: "approver", comments: "Approved - prioritas tinggi" },
    { riskId: createdRisks[1].id, fromStatus: "draft", toStatus: "reviewed", actorName: "Reviewer Finance", actorRole: "reviewer", comments: "Angka keuangan sudah diverifikasi" },
    { riskId: createdRisks[1].id, fromStatus: "reviewed", toStatus: "approved", actorName: "Direktur Keuangan", actorRole: "approver", comments: "Setuju untuk eskalasi" },
    { riskId: createdRisks[1].id, fromStatus: "approved", toStatus: "validated", actorName: "Risk Officer", actorRole: "validator", comments: "Skor Impact disesuaikan dari 3 ke 4 berdasarkan analisis terbaru" },
    { riskId: createdRisks[2].id, fromStatus: "draft", toStatus: "validated", actorName: "Risk Officer", actorRole: "validator", comments: "Fast-track validation karena audit mendekati" },
    { riskId: createdRisks[3].id, fromStatus: "draft", toStatus: "reviewed", actorName: "Supervisor IT", actorRole: "reviewer", comments: "Analisis ancaman sudah lengkap" },
    { riskId: createdRisks[3].id, fromStatus: "reviewed", toStatus: "approved", actorName: "Direktur Teknik", actorRole: "approver", comments: "Prioritas keamanan siber nasional" },
  ]);
}
