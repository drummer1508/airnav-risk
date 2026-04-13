import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { ReportingPeriod } from "@shared/schema";
import {
  Calendar, Lock, Unlock, Plus, ArrowRightCircle, Trash2, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";

function PeriodStatusBadge({ status }: { status: string }) {
  if (status === "open") {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"><Unlock className="w-3 h-3 mr-1" />Dibuka</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0"><Lock className="w-3 h-3 mr-1" />Ditutup</Badge>;
}

function QuarterLabel({ quarter, year }: { quarter: number; year: number }) {
  const labels: Record<number, string> = { 1: "Jan – Mar", 2: "Apr – Jun", 3: "Jul – Sep", 4: "Okt – Des" };
  return (
    <div>
      <div className="font-semibold">Q{quarter} {year}</div>
      <div className="text-xs text-muted-foreground">{labels[quarter]}</div>
    </div>
  );
}

export default function PeriodsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [carryOpen, setCarryOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ReportingPeriod | null>(null);
  const [form, setForm] = useState({ year: new Date().getFullYear().toString(), quarter: "", notes: "" });
  const [targetPeriodId, setTargetPeriodId] = useState("");

  const canManage = user && user.line >= 2 && (user.role === "reviewer" || user.role === "approval");

  const { data: periods = [], isLoading } = useQuery<ReportingPeriod[]>({
    queryKey: ["/api/periods"],
  });

  const { data: openPeriod } = useQuery<ReportingPeriod | null>({
    queryKey: ["/api/periods/open"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/periods", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/periods/open"] });
      toast({ title: "Periode dibuat", description: "Periode pelaporan berhasil dibuat" });
      setCreateOpen(false);
      setForm({ year: new Date().getFullYear().toString(), quarter: "", notes: "" });
    },
    onError: (err: any) => toast({ title: "Gagal membuat periode", description: err.message, variant: "destructive" }),
  });

  const openMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/periods/${id}/open`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/periods/open"] });
      toast({ title: "Periode dibuka", description: "Periode pelaporan berhasil dibuka" });
    },
    onError: (err: any) => toast({ title: "Gagal membuka periode", description: err.message, variant: "destructive" }),
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/periods/${id}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/periods/open"] });
      toast({ title: "Periode ditutup", description: "Periode pelaporan berhasil ditutup" });
    },
    onError: (err: any) => toast({ title: "Gagal menutup periode", description: err.message, variant: "destructive" }),
  });

  const carryMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: number; targetId: number }) =>
      apiRequest("POST", `/api/periods/${sourceId}/carry-forward`, { targetPeriodId: targetId }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mitigations"] });
      toast({ title: "Carry-forward berhasil", description: data.message });
      setCarryOpen(false);
      setSelectedSource(null);
      setTargetPeriodId("");
    },
    onError: (err: any) => toast({ title: "Gagal carry-forward", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/periods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/periods"] });
      toast({ title: "Periode dihapus" });
    },
    onError: (err: any) => toast({ title: "Gagal menghapus", description: err.message, variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!form.year || !form.quarter) return;
    createMutation.mutate({ year: parseInt(form.year), quarter: parseInt(form.quarter), notes: form.notes || null });
  };

  const closedPeriods = periods.filter(p => p.status === "closed");
  const targetOptions = selectedSource
    ? periods.filter(p => p.id !== selectedSource.id)
    : periods;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-primary" />Manajemen Periode Pelaporan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola periode Q1–Q4 untuk penginputan dan pelaporan data risiko</p>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-period"><Plus className="w-4 h-4 mr-2" />Buat Periode</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Buat Periode Pelaporan Baru</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tahun</Label>
                    <Input
                      data-testid="input-period-year"
                      type="number"
                      min={2020}
                      max={2099}
                      value={form.year}
                      onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kuartal</Label>
                    <Select value={form.quarter} onValueChange={v => setForm(f => ({ ...f, quarter: v }))}>
                      <SelectTrigger data-testid="select-period-quarter"><SelectValue placeholder="Pilih kuartal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Q1 – Jan s/d Mar</SelectItem>
                        <SelectItem value="2">Q2 – Apr s/d Jun</SelectItem>
                        <SelectItem value="3">Q3 – Jul s/d Sep</SelectItem>
                        <SelectItem value="4">Q4 – Okt s/d Des</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Catatan (opsional)</Label>
                  <Textarea
                    data-testid="input-period-notes"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Catatan periode..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
                  <Button
                    data-testid="button-save-period"
                    onClick={handleCreate}
                    disabled={!form.year || !form.quarter || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Buat Periode"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {openPeriod && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Periode Aktif: {openPeriod.label}</span>
                <span className="text-sm text-emerald-700 dark:text-emerald-400 ml-2">
                  ({openPeriod.startDate} – {openPeriod.endDate})
                </span>
                {openPeriod.openedAt && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Dibuka: {new Date(openPeriod.openedAt).toLocaleDateString("id-ID")}
                  </span>
                )}
              </div>
              {canManage && (
                <Button
                  data-testid={`button-close-period-${openPeriod.id}`}
                  variant="outline"
                  size="sm"
                  className="border-emerald-400 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => closeMutation.mutate(openPeriod.id)}
                  disabled={closeMutation.isPending}
                >
                  <Lock className="w-3 h-3 mr-1" />Tutup Periode
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!openPeriod && periods.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">Tidak ada periode yang sedang dibuka. Data risiko tidak dapat diedit hingga ada periode aktif.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Periode Pelaporan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : periods.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Belum ada periode pelaporan</p>
              {canManage && <p className="text-sm mt-1">Klik "Buat Periode" untuk membuat periode pertama</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Rentang Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuka</TableHead>
                  <TableHead>Ditutup</TableHead>
                  {canManage && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={p.id} data-testid={`row-period-${p.id}`} className={p.status === "open" ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""}>
                    <TableCell><QuarterLabel quarter={p.quarter} year={p.year} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.startDate} – {p.endDate}</TableCell>
                    <TableCell><PeriodStatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.openedAt ? new Date(p.openedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "–"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.closedAt ? new Date(p.closedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "–"}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "closed" && (
                            <>
                              <Button
                                data-testid={`button-open-period-${p.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => openMutation.mutate(p.id)}
                                disabled={openMutation.isPending || !!openPeriod}
                                title={openPeriod ? "Tutup periode aktif terlebih dahulu" : "Buka periode ini"}
                              >
                                <Unlock className="w-3.5 h-3.5 mr-1" />Buka
                              </Button>
                              <Button
                                data-testid={`button-carry-forward-${p.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedSource(p); setCarryOpen(true); }}
                                title="Bawa data ke periode lain"
                              >
                                <ArrowRightCircle className="w-3.5 h-3.5 mr-1" />Carry-forward
                              </Button>
                              <Button
                                data-testid={`button-delete-period-${p.id}`}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => { if (confirm(`Hapus periode ${p.label}?`)) deleteMutation.mutate(p.id); }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          {p.status === "open" && (
                            <Button
                              data-testid={`button-close-period-inline-${p.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => closeMutation.mutate(p.id)}
                              disabled={closeMutation.isPending}
                            >
                              <Lock className="w-3.5 h-3.5 mr-1" />Tutup
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={carryOpen} onOpenChange={setCarryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Carry-Forward Data Risiko</DialogTitle></DialogHeader>
          {selectedSource && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-1">Sumber: {selectedSource.label}</p>
                <p className="text-muted-foreground">Semua data risiko dan mitigasi dari periode ini akan disalin ke periode target. Status workflow akan direset ke <strong>draft</strong>.</p>
              </div>
              <div className="space-y-2">
                <Label>Periode Target</Label>
                <Select value={targetPeriodId} onValueChange={setTargetPeriodId}>
                  <SelectTrigger data-testid="select-target-period"><SelectValue placeholder="Pilih periode tujuan" /></SelectTrigger>
                  <SelectContent>
                    {targetOptions.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.label} {p.status === "open" ? "(aktif)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setCarryOpen(false); setTargetPeriodId(""); }}>Batal</Button>
                <Button
                  data-testid="button-confirm-carry-forward"
                  onClick={() => {
                    if (!targetPeriodId) return;
                    carryMutation.mutate({ sourceId: selectedSource.id, targetId: parseInt(targetPeriodId) });
                  }}
                  disabled={!targetPeriodId || carryMutation.isPending}
                >
                  {carryMutation.isPending ? "Menyalin..." : "Lakukan Carry-Forward"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
