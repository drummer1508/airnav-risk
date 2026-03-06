export function getRiskLevelInfo(score: number) {
  if (score >= 16) return { label: "Sangat Tinggi", className: "bg-red-500/10 text-red-600 dark:text-red-400", color: "#ef4444" };
  if (score >= 9) return { label: "Tinggi", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400", color: "#f97316" };
  if (score >= 4) return { label: "Sedang", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400", color: "#f59e0b" };
  return { label: "Rendah", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", color: "#10b981" };
}

export function getStatusInfo(status: string) {
  switch (status) {
    case "draft": return { label: "Draft", className: "bg-muted text-muted-foreground" };
    case "submitted": return { label: "Diajukan", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    case "returned_to_inputer": return { label: "Dikembalikan ke Inputer", className: "bg-red-500/10 text-red-600 dark:text-red-400" };
    case "reviewed": return { label: "Direview L1", className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" };
    case "returned_to_reviewer": return { label: "Dikembalikan ke Reviewer", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" };
    case "l1_approved": return { label: "Disetujui L1", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
    case "l2_review": return { label: "Review L2", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" };
    case "l2_returned": return { label: "Dikembalikan L2→L1", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    case "l2_finalized": return { label: "Final L2", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    case "l3_review": return { label: "Review L3 (Audit)", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" };
    case "l3_returned": return { label: "Dikembalikan L3→L2", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
    case "l3_finalized": return { label: "Final L3 (Audit)", className: "bg-teal-500/10 text-teal-600 dark:text-teal-400" };
    case "approved": return { label: "Approved", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
    case "validated": return { label: "Validated", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    case "sent_back": return { label: "Sent Back", className: "bg-red-500/10 text-red-600 dark:text-red-400" };
    default: return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

export type WorkflowAction = {
  toStatus: string;
  label: string;
  variant: "default" | "destructive" | "outline";
  requireComment: boolean;
};

export function getAvailableWorkflowActions(currentStatus: string, userRole: string, userLine: number): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  if (userRole === "sysadmin") {
    if (currentStatus === "draft" || currentStatus === "returned_to_inputer") {
      actions.push({ toStatus: "submitted", label: "Submit untuk Review", variant: "default", requireComment: false });
    }
    if (currentStatus === "submitted") {
      actions.push({ toStatus: "reviewed", label: "Approve Review", variant: "default", requireComment: false });
      actions.push({ toStatus: "returned_to_inputer", label: "Kembalikan ke Inputer", variant: "destructive", requireComment: true });
    }
    if (currentStatus === "reviewed") {
      actions.push({ toStatus: "l1_approved", label: "Approve L1", variant: "default", requireComment: false });
      actions.push({ toStatus: "returned_to_reviewer", label: "Kembalikan ke Reviewer", variant: "destructive", requireComment: true });
    }
    if (currentStatus === "l1_approved") {
      actions.push({ toStatus: "l2_review", label: "Mulai Review L2", variant: "default", requireComment: false });
    }
    if (currentStatus === "l2_review") {
      actions.push({ toStatus: "l2_finalized", label: "Finalize L2", variant: "default", requireComment: false });
      actions.push({ toStatus: "l2_returned", label: "Kembalikan ke L1", variant: "destructive", requireComment: true });
    }
    if (currentStatus === "l2_returned") {
      actions.push({ toStatus: "reviewed", label: "Kembalikan ke L1 Review", variant: "outline", requireComment: true });
      actions.push({ toStatus: "l2_review", label: "Lanjut Review L2", variant: "default", requireComment: false });
    }
    if (currentStatus === "returned_to_reviewer") {
      actions.push({ toStatus: "reviewed", label: "Ajukan Ulang ke GM", variant: "default", requireComment: false });
    }
    if (currentStatus === "l2_finalized") {
      actions.push({ toStatus: "l3_review", label: "Mulai Review L3 (Audit)", variant: "default", requireComment: false });
    }
    if (currentStatus === "l3_review") {
      actions.push({ toStatus: "l3_finalized", label: "Finalize L3 (Audit)", variant: "default", requireComment: false });
      actions.push({ toStatus: "l3_returned", label: "Kembalikan ke L2", variant: "destructive", requireComment: true });
    }
    if (currentStatus === "l3_returned") {
      actions.push({ toStatus: "l2_review", label: "Kembali ke Review L2", variant: "outline", requireComment: true });
      actions.push({ toStatus: "l2_finalized", label: "Finalize L2 Ulang", variant: "default", requireComment: false });
    }
    return actions;
  }

  if (userRole === "inputer") {
    if (currentStatus === "draft" || currentStatus === "returned_to_inputer") {
      actions.push({ toStatus: "submitted", label: "Submit untuk Review", variant: "default", requireComment: false });
    }
  }

  if (userRole === "reviewer" && userLine === 1) {
    if (currentStatus === "submitted") {
      actions.push({ toStatus: "reviewed", label: "Approve & Teruskan ke GM", variant: "default", requireComment: false });
      actions.push({ toStatus: "returned_to_inputer", label: "Kembalikan ke Inputer", variant: "destructive", requireComment: true });
    }
    if (currentStatus === "l2_returned") {
      actions.push({ toStatus: "reviewed", label: "Perbaiki & Ajukan Ulang", variant: "default", requireComment: true });
    }
  }

  if (userRole === "approval" && userLine === 1) {
    if (currentStatus === "reviewed") {
      actions.push({ toStatus: "l1_approved", label: "Approve L1", variant: "default", requireComment: false });
      actions.push({ toStatus: "returned_to_reviewer", label: "Kembalikan ke Reviewer", variant: "destructive", requireComment: true });
    }
  }

  if (userRole === "reviewer" && userLine === 2) {
    if (currentStatus === "l1_approved" || currentStatus === "l2_review") {
      actions.push({ toStatus: "l2_review", label: "Koreksi Penilaian", variant: "outline", requireComment: true });
      actions.push({ toStatus: "l2_returned", label: "Kembalikan ke L1", variant: "destructive", requireComment: true });
      actions.push({ toStatus: "l2_finalized", label: "Finalize", variant: "default", requireComment: false });
    }
    if (currentStatus === "l3_returned") {
      actions.push({ toStatus: "l2_review", label: "Perbaiki & Review Ulang", variant: "outline", requireComment: true });
      actions.push({ toStatus: "l2_finalized", label: "Finalize L2 Ulang", variant: "default", requireComment: false });
    }
  }

  if (userRole === "approval" && userLine === 2) {
    if (currentStatus === "l2_review") {
      actions.push({ toStatus: "l2_finalized", label: "Finalize L2", variant: "default", requireComment: false });
      actions.push({ toStatus: "l2_returned", label: "Kembalikan ke L1", variant: "destructive", requireComment: true });
    }
  }

  if (userRole === "reviewer" && userLine === 3) {
    if (currentStatus === "l2_finalized" || currentStatus === "l3_review") {
      actions.push({ toStatus: "l3_review", label: "Koreksi Audit", variant: "outline", requireComment: true });
      actions.push({ toStatus: "l3_returned", label: "Kembalikan ke L2", variant: "destructive", requireComment: true });
      actions.push({ toStatus: "l3_finalized", label: "Finalize Audit", variant: "default", requireComment: false });
    }
  }

  if (userRole === "approval" && userLine === 3) {
    if (currentStatus === "l3_review") {
      actions.push({ toStatus: "l3_finalized", label: "Finalize L3 (Audit)", variant: "default", requireComment: false });
      actions.push({ toStatus: "l3_returned", label: "Kembalikan ke L2", variant: "destructive", requireComment: true });
    }
  }

  return actions;
}

export function getMitigationStatusInfo(status: string) {
  switch (status) {
    case "planned": return { label: "Planned", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    case "in_progress": return { label: "In Progress", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    case "completed": return { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    case "cancelled": return { label: "Cancelled", className: "bg-muted text-muted-foreground" };
    default: return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

export function getStrategyInfo(strategy: string) {
  switch (strategy) {
    case "reduce": return { label: "Reduce", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    case "transfer": return { label: "Transfer", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
    case "avoid": return { label: "Avoid", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" };
    case "accept": return { label: "Accept", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    default: return { label: strategy, className: "bg-muted text-muted-foreground" };
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "medium": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "low": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    default: return "bg-muted text-muted-foreground";
  }
}

export const IMPACT_CRITERIA_LABELS: Record<string, string> = {
  financial: "Finansial",
  legal: "Hukum",
  compliance: "Kepatuhan",
  reputation: "Reputasi",
  market: "Pangsa Pasar",
  it: "IT & Siber",
  hr: "SDM",
  hsse: "HSSE",
  pmn: "PMN",
};

export const IMPACT_DESCRIPTIONS: Record<string, string[]> = {
  financial: ["X <= 20% Batasan", "20% < X <= 40%", "40% < X <= 60%", "60% < X <= 80%", "X > 80%"],
  legal: ["Tidak ada somasi", "Ada somasi", "Ada tuntutan hukum", "Kalah Tk. Pertama", "Kalah Inkracht"],
  compliance: ["Teguran verbal", "Panggil Regulator", "Peringatan & Denda", "Pembekuan aktivitas", "Cabut Izin/Delisting"],
  reputation: ["Media Lokal", "Media Prov/Regional", "Media Nasional", "Sosmed Nasional", "Sosmed Internasional"],
  market: ["Penurunan <= 5%", "Turun 5%-10%", "Turun 10%-15%", "Turun 15%-20%", "Turun > 20%"],
  it: ["Down 1 hari (App Pendukung)", "Down >1 hari (App Pendukung)", "Down <1 jam (App Vital)", "Down 2-6 jam (App Vital)", "Down >6 jam (App Vital)"],
  hr: ["Keluhan di Unit", "Keluhan di Penyelia", "Keluhan Sektoral", "Unjuk rasa/Cedera", "Kematian/Demo Nasional"],
  hsse: ["First Aid", "Rawat Inap", "Cacat Tidak Tetap", "Fatality Tunggal", "Fatality Jamak"],
  pmn: ["Tepat Waktu", "Tunda 1 Bulan", "Tunda 2 Bulan", "Tunda 3 Bulan", "Tunda > 4 Bulan"],
};

export const LIKELIHOOD_DESCRIPTIONS = [
  "Sangat Jarang - 1x/tahun",
  "Jarang - 1x/6 bulan",
  "Bisa Terjadi - 1x/4 bulan",
  "Sangat Mungkin - 1x/2 bulan",
  "Hampir Pasti - 1x/bulan",
];

export function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

export function getHeatMapColor(l: number, i: number) {
  const score = l * i;
  if (score >= 16) return "bg-red-500 dark:bg-red-600";
  if (score >= 9) return "bg-orange-500 dark:bg-orange-600";
  if (score >= 4) return "bg-amber-400 dark:bg-amber-500";
  return "bg-emerald-400 dark:bg-emerald-500";
}
