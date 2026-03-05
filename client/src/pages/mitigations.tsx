import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Mitigation, Risk } from "@shared/schema";
import { getMitigationStatusInfo, getStrategyInfo, formatCurrency } from "@/lib/risk-helpers";
import { useAuth } from "@/lib/auth";
import { Plus, Search, Shield, Pencil, Trash2, Filter, Calendar } from "lucide-react";

function MitigationForm({ mitigation, risks, onSave, onCancel, isPending }: {
  mitigation?: Mitigation; risks: Risk[]; onSave: (data: any) => void; onCancel: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    riskId: mitigation?.riskId?.toString() || "",
    strategy: mitigation?.strategy || "reduce",
    actionDescription: mitigation?.actionDescription || "",
    picName: mitigation?.picName || "",
    deadline: mitigation?.deadline || "",
    estimatedCost: mitigation?.estimatedCost || "",
    progress: mitigation?.progress?.toString() || "0",
    status: mitigation?.status || "planned",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      riskId: parseInt(form.riskId),
      strategy: form.strategy,
      actionDescription: form.actionDescription,
      picName: form.picName || null,
      deadline: form.deadline || null,
      estimatedCost: form.estimatedCost || null,
      progress: parseInt(form.progress),
      status: form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Risiko Terkait *</Label>
        <Select value={form.riskId} onValueChange={(v) => setForm({ ...form, riskId: v })}>
          <SelectTrigger data-testid="select-mitigation-risk"><SelectValue placeholder="Pilih risiko" /></SelectTrigger>
          <SelectContent>{risks.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.riskCode} - {r.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Strategi Mitigasi *</Label>
        <Select value={form.strategy} onValueChange={(v) => setForm({ ...form, strategy: v })}>
          <SelectTrigger data-testid="select-strategy"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="reduce">Reduce - Mengurangi risiko</SelectItem>
            <SelectItem value="transfer">Transfer - Mengalihkan risiko</SelectItem>
            <SelectItem value="avoid">Avoid - Menghindari risiko</SelectItem>
            <SelectItem value="accept">Accept - Menerima risiko</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Deskripsi Tindakan *</Label>
        <Textarea value={form.actionDescription} onChange={(e) => setForm({ ...form, actionDescription: e.target.value })} required placeholder="Langkah konkret yang akan dilakukan" data-testid="input-action-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>PIC (Penanggung Jawab)</Label>
          <Input value={form.picName} onChange={(e) => setForm({ ...form, picName: e.target.value })} data-testid="input-pic-name" />
        </div>
        <div className="space-y-2">
          <Label>Target Selesai</Label>
          <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} data-testid="input-deadline" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Biaya Mitigasi (Rp)</Label>
          <Input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} placeholder="0" data-testid="input-estimated-cost" />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger data-testid="select-mitigation-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Progress ({form.progress}%)</Label>
        <Input type="range" min="0" max="100" step="5" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className="w-full" data-testid="input-progress" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">Batal</Button>
        <Button type="submit" disabled={isPending || !form.actionDescription || !form.riskId} data-testid="button-save-mitigation">
          {isPending ? "Menyimpan..." : mitigation ? "Update" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

export default function MitigationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Mitigation | undefined>();
  const { toast } = useToast();
  const { canCreateRisk } = useAuth();

  const { data: allMitigations = [], isLoading } = useQuery<Mitigation[]>({ queryKey: ["/api/mitigations"] });
  const { data: risks = [] } = useQuery<Risk[]>({ queryKey: ["/api/risks"] });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mitigations", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/mitigations"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); setDialogOpen(false); toast({ title: "Mitigasi berhasil dibuat" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/mitigations/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/mitigations"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); setDialogOpen(false); setEditing(undefined); toast({ title: "Mitigasi berhasil diupdate" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/mitigations/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/mitigations"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); toast({ title: "Mitigasi berhasil dihapus" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = allMitigations.filter((m) => {
    const matchSearch = m.actionDescription.toLowerCase().includes(search.toLowerCase()) || (m.picName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getRiskInfo = (riskId: number) => risks.find(r => r.id === riskId);

  if (isLoading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Rencana Mitigasi</h1>
          <p className="text-muted-foreground mt-1">Kelola tindakan mitigasi risiko dan monitoring progress</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }}>
          {canCreateRisk && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-mitigation"><Plus className="h-4 w-4 mr-2" />Tambah Mitigasi</Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit Mitigasi" : "Input Mitigasi Baru"}</DialogTitle></DialogHeader>
            <MitigationForm
              mitigation={editing} risks={risks}
              onSave={(data) => editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
              onCancel={() => { setDialogOpen(false); setEditing(undefined); }}
              isPending={createMut.isPending || updateMut.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari mitigasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-mitigations" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Tindakan</TableHead>
                <TableHead>Risiko</TableHead>
                <TableHead>Strategi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Progress</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Biaya</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Tidak ada mitigasi ditemukan</p>
                </TableCell></TableRow>
              ) : filtered.map((mit) => {
                const status = getMitigationStatusInfo(mit.status);
                const strategy = getStrategyInfo(mit.strategy);
                const risk = getRiskInfo(mit.riskId);
                return (
                  <TableRow key={mit.id} data-testid={`mitigation-row-${mit.id}`}>
                    <TableCell>
                      <p className="font-medium text-sm line-clamp-2">{mit.actionDescription}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {risk ? <span className="font-mono text-muted-foreground">{risk.riskCode}</span> : "-"}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={strategy.className}>{strategy.label}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={status.className}>{status.label}</Badge></TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={mit.progress} className="h-1.5" />
                        <span className="text-xs text-muted-foreground">{mit.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mit.picName || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {mit.deadline ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{mit.deadline}</span> : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatCurrency(mit.estimatedCost)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canCreateRisk && <Button size="icon" variant="ghost" onClick={() => { setEditing(mit); setDialogOpen(true); }} data-testid={`button-edit-mitigation-${mit.id}`}><Pencil className="h-4 w-4" /></Button>}
                        {canCreateRisk && <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(mit.id)} data-testid={`button-delete-mitigation-${mit.id}`}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
