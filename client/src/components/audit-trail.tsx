import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ArrowRight } from "lucide-react";
import type { AuditTrail } from "@shared/schema";

export function AuditTrailIcon({ tableName, recordId, fieldName }: {
  tableName: string; recordId: number; fieldName?: string;
}) {
  const [open, setOpen] = useState(false);
  const url = fieldName
    ? `/api/audit-trails/${tableName}/${recordId}/${fieldName}`
    : `/api/audit-trails/${tableName}/${recordId}`;

  const { data: trails = [], isLoading } = useQuery<AuditTrail[]>({
    queryKey: ["/api/audit-trails", tableName, recordId, fieldName || "all"],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-primary"
          data-testid={`audit-trail-${tableName}-${recordId}${fieldName ? `-${fieldName}` : ""}`}
        >
          <History className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-80 overflow-y-auto p-3" align="start">
        <h4 className="text-sm font-semibold mb-2">Riwayat Perubahan</h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : trails.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada perubahan tercatat.</p>
        ) : (
          <div className="space-y-2">
            {trails.sort((a, b) => new Date(b.changedAt!).getTime() - new Date(a.changedAt!).getTime()).map((t) => (
              <div key={t.id} className="border rounded-md p-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{t.changedByName}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{t.changedByRole}</Badge>
                  </div>
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(t.changedAt!).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono">{t.fieldName}</Badge>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[10px] max-w-[140px] truncate">
                    {t.oldValue || "(kosong)"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] max-w-[140px] truncate">
                    {t.newValue || "(kosong)"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AuditTrailList({ tableName, recordId }: { tableName: string; recordId: number }) {
  const { data: trails = [], isLoading } = useQuery<AuditTrail[]>({
    queryKey: ["/api/audit-trails", tableName, recordId, "all"],
    queryFn: async () => {
      const res = await fetch(`/api/audit-trails/${tableName}/${recordId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (trails.length === 0) return <p className="text-xs text-muted-foreground py-2">Belum ada perubahan tercatat.</p>;

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {trails.sort((a, b) => new Date(b.changedAt!).getTime() - new Date(a.changedAt!).getTime()).map((t) => (
        <div key={t.id} className="border rounded-md p-2 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{t.changedByName}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0">{t.changedByRole}</Badge>
            </div>
            <span className="text-muted-foreground text-[10px]">
              {new Date(t.changedAt!).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono">{t.fieldName}</Badge>
            <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[10px] max-w-[120px] truncate">
              {t.oldValue || "(kosong)"}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] max-w-[120px] truncate">
              {t.newValue || "(kosong)"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
