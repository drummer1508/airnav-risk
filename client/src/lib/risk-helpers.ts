export function getRiskLevelInfo(score: number) {
  if (score >= 16) return { label: "Sangat Tinggi", className: "bg-red-500/10 text-red-600 dark:text-red-400", color: "#ef4444" };
  if (score >= 9) return { label: "Tinggi", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400", color: "#f97316" };
  if (score >= 4) return { label: "Sedang", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400", color: "#f59e0b" };
  return { label: "Rendah", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", color: "#10b981" };
}

export function getStatusInfo(status: string) {
  switch (status) {
    case "draft": return { label: "Draft", className: "bg-muted text-muted-foreground" };
    case "reviewed": return { label: "Reviewed", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    case "approved": return { label: "Approved", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
    case "validated": return { label: "Validated", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    case "sent_back": return { label: "Sent Back", className: "bg-red-500/10 text-red-600 dark:text-red-400" };
    default: return { label: status, className: "bg-muted text-muted-foreground" };
  }
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
