import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  AlertOctagon,
  ChevronUp,
  Minus,
  ChevronDown,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";
import { getRiskLevelInfo, getStatusInfo, getHeatMapColor } from "@/lib/risk-helpers";
import type { OrgUnit, ReportingPeriod } from "@shared/schema";

interface DashboardStats {
  totalRisks: number;
  draftRisks: number;
  submittedRisks: number;
  reviewedRisks: number;
  l1ApprovedRisks: number;
  l2ReviewRisks: number;
  l2FinalizedRisks: number;
  l3ReviewRisks: number;
  l3FinalizedRisks?: number;
  approvedRisks: number;
  validatedRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  activeMitigations: number;
  completedMitigations: number;
  plannedMitigations: number;
  totalMitigations: number;
  risksByT1: { name: string; count: number }[];
  risksByOrgUnit: { name: string; type: string; count: number }[];
  heatMapData: { likelihood: number; impact: number; title: string; id: number; riskCode: string; currentStatus: string }[];
  topRisks: { id: number; riskCode: string; title: string; inherentRiskScore: number; impactScore: number; likelihoodScore: number; currentStatus: string; riskOwner: string | null; orgUnitId: number | null }[];
}

function StatCard({ title, value, icon: Icon, description, iconColor }: {
  title: string; value: string | number; icon: any; description: string; iconColor: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function HeatMap({ data }: { data: DashboardStats["heatMapData"] }) {
  const grid: Record<string, { count: number; items: typeof data }> = {};
  data.forEach((d) => {
    const key = `${d.likelihood}-${d.impact}`;
    if (!grid[key]) grid[key] = { count: 0, items: [] };
    grid[key].count++;
    grid[key].items.push(d);
  });

  const impactLabels = ["Sangat Rendah", "Rendah", "Moderat", "Tinggi", "Sangat Tinggi"];
  const likelihoodLabels = ["Sangat Jarang", "Jarang", "Mungkin", "Sering", "Hampir Pasti"];

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1">
        <div className="w-20 shrink-0" />
        <div className="flex-1 grid grid-cols-5 gap-1">
          {likelihoodLabels.map((l, i) => (
            <div key={i} className="text-[10px] text-center text-muted-foreground leading-tight pb-1">{l}</div>
          ))}
        </div>
      </div>
      {[5, 4, 3, 2, 1].map((impact) => (
        <div key={impact} className="flex items-center gap-1">
          <div className="w-20 shrink-0 text-[10px] text-muted-foreground text-right pr-2 leading-tight">
            {impactLabels[impact - 1]}
          </div>
          <div className="flex-1 grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((likelihood) => {
              const cell = grid[`${likelihood}-${impact}`];
              const count = cell?.count || 0;
              return (
                <div
                  key={likelihood}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                    count > 0 ? `${getHeatMapColor(likelihood, impact)} text-white` : "bg-muted/40"
                  }`}
                  title={cell?.items.map(i => `${i.riskCode}: ${i.title}`).join("\n")}
                  data-testid={`heatmap-cell-${likelihood}-${impact}`}
                >
                  {count > 0 ? count : ""}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1 pt-1">
        <div className="w-20 shrink-0 text-[10px] text-muted-foreground text-right pr-2">Dampak / Probabilitas</div>
        <div className="flex-1 text-[10px] text-center text-muted-foreground">Probabilitas (Likelihood)</div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-emerald-400" /><span className="text-xs text-muted-foreground">Rendah (1-3)</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-amber-400" /><span className="text-xs text-muted-foreground">Sedang (4-8)</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-orange-500" /><span className="text-xs text-muted-foreground">Tinggi (9-15)</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-red-500" /><span className="text-xs text-muted-foreground">Sangat Tinggi (16-25)</span></div>
      </div>
    </div>
  );
}

function RiskLevelRow({ level, count, icon: Icon, className }: { level: string; count: number; icon: any; className: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${className}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{level}</span>
      </div>
      <span className="text-lg font-semibold">{count}</span>
    </div>
  );
}

interface TimeSeriesEntry {
  periodId: number;
  label: string;
  year: number;
  quarter: number;
  status: string;
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  validatedRisks: number;
  draftRisks: number;
}

function TimeSeriesChart({ data }: { data: TimeSeriesEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
        Belum ada data periode untuk ditampilkan
      </div>
    );
  }
  const maxTotal = Math.max(...data.map(d => d.totalRisks), 1);
  return (
    <div className="space-y-3">
      <div className="flex gap-4 flex-wrap text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />Sangat Tinggi</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />Tinggi</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Sedang</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Rendah</span>
      </div>
      <div className="flex items-end gap-3 h-40 overflow-x-auto pb-2">
        {data.map(entry => (
          <div key={entry.periodId} className="flex flex-col items-center gap-1 min-w-[60px]">
            <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: "120px" }}>
              {entry.totalRisks === 0 ? (
                <div className="w-full bg-muted/40 rounded" style={{ height: "8px" }} />
              ) : (
                <>
                  {entry.lowRisks > 0 && (
                    <div className="w-full bg-emerald-400 rounded-b" style={{ height: `${(entry.lowRisks / maxTotal) * 120}px` }} title={`Rendah: ${entry.lowRisks}`} />
                  )}
                  {entry.mediumRisks > 0 && (
                    <div className="w-full bg-amber-400" style={{ height: `${(entry.mediumRisks / maxTotal) * 120}px` }} title={`Sedang: ${entry.mediumRisks}`} />
                  )}
                  {entry.highRisks > 0 && (
                    <div className="w-full bg-orange-400" style={{ height: `${(entry.highRisks / maxTotal) * 120}px` }} title={`Tinggi: ${entry.highRisks}`} />
                  )}
                  {entry.criticalRisks > 0 && (
                    <div className="w-full bg-red-500 rounded-t" style={{ height: `${(entry.criticalRisks / maxTotal) * 120}px` }} title={`Sangat Tinggi: ${entry.criticalRisks}`} />
                  )}
                </>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground text-center font-medium">{entry.label}</div>
            <div className="text-[10px] text-center font-bold">{entry.totalRisks}</div>
            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${entry.status === "open" ? "border-emerald-400 text-emerald-600" : "opacity-60"}`}>
              {entry.status === "open" ? "Aktif" : "Tutup"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("all");

  const { data: periods = [] } = useQuery<ReportingPeriod[]>({ queryKey: ["/api/periods"] });
  const periodQueryKey = selectedPeriodId !== "all"
    ? ["/api/dashboard/stats", { periodId: selectedPeriodId }]
    : ["/api/dashboard/stats"];
  const periodStatsUrl = selectedPeriodId !== "all"
    ? `/api/dashboard/stats?periodId=${selectedPeriodId}`
    : "/api/dashboard/stats";

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: periodQueryKey,
    queryFn: () => fetch(periodStatsUrl, { credentials: "include" }).then(r => r.json()),
  });
  const { data: timeSeries = [] } = useQuery<TimeSeriesEntry[]>({ queryKey: ["/api/dashboard/timeseries"] });
  const { data: orgUnitsList = [] } = useQuery<OrgUnit[]>({ queryKey: ["/api/org-units"] });

  const getOrgName = (id: number | null) => {
    if (!id) return "-";
    const unit = orgUnitsList.find(u => u.id === id);
    return unit ? unit.name.replace("Direktorat ", "").replace("Cabang ", "") : "-";
  };

  const openPeriod = periods.find(p => p.status === "open");

  if (isLoading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const selectedPeriod = selectedPeriodId !== "all" ? periods.find(p => p.id === parseInt(selectedPeriodId)) : null;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Ringkasan Enterprise Risk Management AirNav Indonesia</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-44" data-testid="select-dashboard-period">
              <SelectValue placeholder="Semua Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Periode</SelectItem>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.label}{p.status === "open" ? " ★" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {selectedPeriod && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Menampilkan data: <strong className="text-foreground">{selectedPeriod.label}</strong> ({selectedPeriod.startDate} – {selectedPeriod.endDate})</span>
          <Badge variant="outline" className={selectedPeriod.status === "open" ? "border-emerald-400 text-emerald-600 ml-1" : "ml-1"}>
            {selectedPeriod.status === "open" ? "Aktif" : "Ditutup"}
          </Badge>
        </div>
      )}
      {!openPeriod && selectedPeriodId === "all" && periods.length > 0 && (
        <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 rounded-md px-3 py-2">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>Tidak ada periode pelaporan aktif. Data yang ditampilkan adalah gabungan semua periode.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Risiko" value={stats.totalRisks} icon={AlertTriangle} description={`${stats.criticalRisks} sangat tinggi, ${stats.highRisks} tinggi`} iconColor="text-primary" />
        <StatCard title="Risiko Sangat Tinggi" value={stats.criticalRisks} icon={AlertOctagon} description="Skor 16-25, perlu tindakan segera" iconColor="text-red-500 dark:text-red-400" />
        <StatCard title="Mitigasi Aktif" value={stats.activeMitigations} icon={Activity} description={`${stats.completedMitigations} selesai dari ${stats.totalMitigations}`} iconColor="text-amber-500 dark:text-amber-400" />
        <StatCard title="Validated" value={stats.validatedRisks} icon={ShieldCheck} description="Risiko telah divalidasi final" iconColor="text-teal-500 dark:text-teal-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />Risk Heat Map (Inherent)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HeatMap data={stats.heatMapData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />Risk Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <RiskLevelRow level="Sangat Tinggi" count={stats.criticalRisks} icon={AlertOctagon} className="bg-red-500/10 text-red-600 dark:text-red-400" />
            <RiskLevelRow level="Tinggi" count={stats.highRisks} icon={ChevronUp} className="bg-orange-500/10 text-orange-600 dark:text-orange-400" />
            <RiskLevelRow level="Sedang" count={stats.mediumRisks} icon={Minus} className="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
            <RiskLevelRow level="Rendah" count={stats.lowRisks} icon={ChevronDown} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" />Top 10 High Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-auto">
            {stats.topRisks.map((risk, idx) => {
              const level = getRiskLevelInfo(risk.inherentRiskScore);
              const status = getStatusInfo(risk.currentStatus);
              return (
                <div key={risk.id} className="flex items-center gap-3 py-2 border-b last:border-0" data-testid={`top-risk-${risk.id}`}>
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{risk.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{risk.riskCode}</span>
                      <Badge variant="outline" className={`text-[10px] ${status.className}`}>{status.label}</Badge>
                    </div>
                  </div>
                  <Badge className={`shrink-0 ${level.className}`}>{risk.inherentRiskScore}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />Workflow Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <div className="text-lg font-bold">{stats.draftRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Draft</div>
                </div>
                <div className="text-center p-2 rounded-md bg-blue-500/5">
                  <div className="text-lg font-bold text-blue-500 dark:text-blue-400">{stats.submittedRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Diajukan</div>
                </div>
                <div className="text-center p-2 rounded-md bg-indigo-500/5">
                  <div className="text-lg font-bold text-indigo-500 dark:text-indigo-400">{stats.reviewedRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Review L1</div>
                </div>
                <div className="text-center p-2 rounded-md bg-purple-500/5">
                  <div className="text-lg font-bold text-purple-500 dark:text-purple-400">{stats.l1ApprovedRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Approved L1</div>
                </div>
                <div className="text-center p-2 rounded-md bg-cyan-500/5">
                  <div className="text-lg font-bold text-cyan-500 dark:text-cyan-400">{stats.l2ReviewRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Review L2</div>
                </div>
                <div className="text-center p-2 rounded-md bg-emerald-500/5">
                  <div className="text-lg font-bold text-emerald-500 dark:text-emerald-400">{stats.l2FinalizedRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Final L2</div>
                </div>
                <div className="text-center p-2 rounded-md bg-violet-500/5">
                  <div className="text-lg font-bold text-violet-500 dark:text-violet-400">{stats.l3ReviewRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Review L3</div>
                </div>
                <div className="text-center p-2 rounded-md bg-teal-500/5">
                  <div className="text-lg font-bold text-teal-500 dark:text-teal-400">{stats.validatedRisks}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Validated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />Mitigation Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Completion</span>
                  <span className="font-medium">{stats.totalMitigations > 0 ? Math.round((stats.completedMitigations / stats.totalMitigations) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${stats.totalMitigations > 0 ? (stats.completedMitigations / stats.totalMitigations) * 100 : 0}%` }} data-testid="progress-bar" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                  <div className="text-lg font-bold">{stats.plannedMitigations}</div>
                  <div className="text-[10px] text-muted-foreground">Planned</div>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <Activity className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold">{stats.activeMitigations}</div>
                  <div className="text-[10px] text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                  <div className="text-lg font-bold">{stats.completedMitigations}</div>
                  <div className="text-[10px] text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Risk Profile per Tema (T1)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.risksByT1.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="text-sm">{t.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${stats.totalRisks > 0 ? (t.count / stats.totalRisks) * 100 : 0}%` }} />
                  </div>
                  <Badge variant="secondary">{t.count}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribusi per Unit Kerja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.risksByOrgUnit.map((u) => (
              <div key={u.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{u.type === "branch" ? "Cabang" : "Direktorat"}</Badge>
                  <span className="text-sm">{u.name}</span>
                </div>
                <Badge variant="secondary">{u.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {timeSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Tren Risiko per Periode (Time Series)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart data={timeSeries} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
