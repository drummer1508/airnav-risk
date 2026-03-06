import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { OrgUnit } from "@shared/schema";
import { Plus, Building2, ChevronRight, Pencil, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  head_office: "Kantor Pusat",
  directorate: "Direktorat",
  function: "Fungsi",
  division: "Divisi",
  branch: "Cabang",
  branch_division: "Divisi Cabang",
  sub_division: "Sub Divisi",
};

function OrgUnitForm({ unit, allUnits, onSave, onCancel, isPending }: {
  unit?: OrgUnit; allUnits: OrgUnit[]; onSave: (data: any) => void; onCancel: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    name: unit?.name || "",
    parentId: unit?.parentId?.toString() || "",
    type: unit?.type || "division",
    level: unit?.level || "head_office",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      parentId: form.parentId ? parseInt(form.parentId) : null,
      type: form.type,
      level: form.level,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Unit</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-org-name" />
      </div>
      <div className="space-y-2">
        <Label>Parent Unit</Label>
        <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
          <SelectTrigger data-testid="select-parent"><SelectValue placeholder="Pilih parent unit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tidak ada (Top Level)</SelectItem>
            {allUnits.filter(u => u.id !== unit?.id).map(u => (
              <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipe</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
            <SelectTrigger data-testid="select-level"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="head_office">Kantor Pusat</SelectItem>
              <SelectItem value="branch">Cabang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">Batal</Button>
        <Button type="submit" disabled={isPending || !form.name} data-testid="button-save-org">{isPending ? "Menyimpan..." : unit ? "Update" : "Simpan"}</Button>
      </div>
    </form>
  );
}

function OrgTree({ units, parentId, level = 0, onEdit, onDelete }: {
  units: OrgUnit[]; parentId: number | null; level?: number; onEdit: (u: OrgUnit) => void; onDelete: (id: number) => void;
}) {
  const children = units.filter(u => u.parentId === parentId);
  if (children.length === 0) return null;

  return (
    <div className={level > 0 ? "ml-6 border-l pl-4" : ""}>
      {children.map(unit => (
        <div key={unit.id} className="py-2">
          <div className="flex items-center justify-between gap-2 group">
            <div className="flex items-center gap-2">
              {level > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{unit.name}</span>
              <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[unit.type] || unit.type}</Badge>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" onClick={() => onEdit(unit)} data-testid={`button-edit-org-${unit.id}`}><Pencil className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(unit.id)} data-testid={`button-delete-org-${unit.id}`}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          <OrgTree units={units} parentId={unit.id} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}

export default function OrgUnitsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrgUnit | undefined>();
  const { toast } = useToast();

  const { data: units = [], isLoading } = useQuery<OrgUnit[]>({ queryKey: ["/api/org-units"] });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/org-units", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/org-units"] }); setDialogOpen(false); toast({ title: "Unit berhasil dibuat" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/org-units/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/org-units"] }); setDialogOpen(false); setEditing(undefined); toast({ title: "Unit berhasil diupdate" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/org-units/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/org-units"] }); toast({ title: "Unit berhasil dihapus" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Struktur Organisasi</h1>
          <p className="text-muted-foreground mt-1">Kelola unit kerja, direktorat, dan cabang</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-org"><Plus className="h-4 w-4 mr-2" />Tambah Unit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Unit" : "Unit Baru"}</DialogTitle></DialogHeader>
            <OrgUnitForm
              unit={editing} allUnits={units}
              onSave={(data) => {
                if (data.parentId === "none" || data.parentId === null) data.parentId = null;
                if (editing) updateMut.mutate({ id: editing.id, data });
                else createMut.mutate(data);
              }}
              onCancel={() => { setDialogOpen(false); setEditing(undefined); }}
              isPending={createMut.isPending || updateMut.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />Hierarki Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrgTree
            units={units}
            parentId={null}
            onEdit={(u) => { setEditing(u); setDialogOpen(true); }}
            onDelete={(id) => deleteMut.mutate(id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
