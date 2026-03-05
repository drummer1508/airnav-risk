import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertOctagon,
  ChevronUp,
  Minus,
  ChevronDown,
} from "lucide-react";

interface DashboardStats {
  totalRisks: number;
  openRisks: number;
  mitigatedRisks: number;
  closedRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  activeMitigations: number;
  completedMitigations: number;
  totalMitigations: number;
  risksByCategory: { name: string; color: string; count: number }[];
  heatMapData: { likelihood: number; impact: number; title: string; id: number }[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  variant?: "default" | "destructive" | "warning" | "success";
}) {
  const variantClasses = {
    default: "text-primary",
    destructive: "text-red-500 dark:text-red-400",
    warning: "text-amber-500 dark:text-amber-400",
    success: "text-emerald-500 dark:text-emerald-400",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${variantClasses[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function RiskLevelBadge({ level, count }: { level: string; count: number }) {
  const config: Record<string, { className: string; icon: any }> = {
    Critical: { className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: AlertOctagon },
    High: { className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", icon: ChevronUp },
    Medium: { className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Minus },
    Low: { className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: ChevronDown },
  };

  const c = config[level];
  const Icon = c.icon;

  return (
    <div className="flex items-center justify-between py-3" data-testid={`risk-level-${level.toLowerCase()}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${c.className}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{level}</span>
      </div>
      <span className="text-lg font-semibold">{count}</span>
    </div>
  );
}

function HeatMap({ data }: { data: DashboardStats["heatMapData"] }) {
  const grid: { [key: string]: number } = {};
  data.forEach((d) => {
    const key = `${d.likelihood}-${d.impact}`;
    grid[key] = (grid[key] || 0) + 1;
  });

  const getCellColor = (l: number, i: number) => {
    const score = l * i;
    if (score >= 16) return "bg-red-500/80 dark:bg-red-500/60";
    if (score >= 9) return "bg-orange-500/70 dark:bg-orange-500/50";
    if (score >= 4) return "bg-amber-500/60 dark:bg-amber-500/40";
    return "bg-emerald-500/50 dark:bg-emerald-500/30";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1">
        <div className="w-16 text-xs text-muted-foreground text-right pr-2 pb-1">
          Impact
        </div>
        <div className="flex-1 grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((l) => (
            <div key={l} className="text-xs text-center text-muted-foreground pb-1">
              {l}
            </div>
          ))}
        </div>
      </div>
      {[5, 4, 3, 2, 1].map((impact) => (
        <div key={impact} className="flex items-center gap-1">
          <div className="w-16 text-xs text-muted-foreground text-right pr-2">
            {impact}
          </div>
          <div className="flex-1 grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((likelihood) => {
              const count = grid[`${likelihood}-${impact}`] || 0;
              return (
                <div
                  key={likelihood}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${
                    count > 0
                      ? `${getCellColor(likelihood, impact)} text-white`
                      : "bg-muted/50"
                  }`}
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
        <div className="w-16" />
        <div className="flex-1 text-xs text-center text-muted-foreground">
          Likelihood
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Risk Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of enterprise risk management metrics and indicators
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Risks"
          value={stats.totalRisks}
          icon={AlertTriangle}
          description={`${stats.openRisks} open, ${stats.closedRisks} closed`}
        />
        <StatCard
          title="Critical Risks"
          value={stats.criticalRisks}
          icon={AlertOctagon}
          description="Score 16-25, requires immediate attention"
          variant="destructive"
        />
        <StatCard
          title="Active Mitigations"
          value={stats.activeMitigations}
          icon={Activity}
          description={`${stats.completedMitigations} of ${stats.totalMitigations} completed`}
          variant="warning"
        />
        <StatCard
          title="Mitigated Risks"
          value={stats.mitigatedRisks}
          icon={ShieldCheck}
          description="Successfully mitigated risks"
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Risk Heat Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HeatMap data={stats.heatMapData} />
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-emerald-500/50" />
                <span className="text-xs text-muted-foreground">Low (1-3)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-amber-500/60" />
                <span className="text-xs text-muted-foreground">Medium (4-8)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-orange-500/70" />
                <span className="text-xs text-muted-foreground">High (9-15)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-red-500/80" />
                <span className="text-xs text-muted-foreground">Critical (16-25)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Risk Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <RiskLevelBadge level="Critical" count={stats.criticalRisks} />
            <RiskLevelBadge level="High" count={stats.highRisks} />
            <RiskLevelBadge level="Medium" count={stats.mediumRisks} />
            <RiskLevelBadge level="Low" count={stats.lowRisks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Risks by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.risksByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between" data-testid={`category-stat-${cat.name.toLowerCase()}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm">{cat.name}</span>
                </div>
                <Badge variant="secondary">{cat.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Mitigation Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Completion</span>
                <span className="font-medium">
                  {stats.totalMitigations > 0
                    ? Math.round((stats.completedMitigations / stats.totalMitigations) * 100)
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalMitigations > 0 ? (stats.completedMitigations / stats.totalMitigations) * 100 : 0}%`,
                  }}
                  data-testid="progress-bar"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-lg font-bold text-amber-500 dark:text-amber-400">
                  {stats.totalMitigations - stats.completedMitigations - stats.activeMitigations}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Planned</div>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-lg font-bold text-blue-500 dark:text-blue-400">
                  {stats.activeMitigations}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">In Progress</div>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-lg font-bold text-emerald-500 dark:text-emerald-400">
                  {stats.completedMitigations}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
