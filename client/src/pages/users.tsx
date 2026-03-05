import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { OrgUnit } from "@shared/schema";
import { Plus, Users, Pencil, Trash2, Search, ShieldCheck, UserCheck, ClipboardCheck, FileInput } from "lucide-react";

interface SafeUser {
  id: number;
  username: string;
  fullName: string;
  orgUnitId: number | null;
  role: string;
  line: number;
  isActive: boolean;
}

const ROLE_INFO: Record<string, { label: string; description: string; className: string; icon: any }> = {
  sysadmin: { label: "Sysadmin", description: "Akses penuh + master data", className: "bg-red-500/10 text-red-600 dark:text-red-400", icon: ShieldCheck },
  inputer: { label: "Inputer", description: "Input & edit risiko", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: FileInput },
  reviewer: { label: "Reviewer", description: "Review risiko", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: ClipboardCheck },
  approval: { label: "Approval", description: "Approve risiko", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: UserCheck },
};

function UserForm({ user, orgUnits, onSave, onCancel, isPending }: {
  user?: SafeUser; orgUnits: OrgUnit[]; onSave: (data: any) => void; onCancel: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    username: user?.username || "",
    password: "",
    fullName: user?.fullName || "",
    orgUnitId: user?.orgUnitId?.toString() || "",
    role: user?.role || "inputer",
    line: user?.line?.toString() || "1",
    isActive: user?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      username: form.username,
      fullName: form.fullName,
      orgUnitId: form.orgUnitId ? parseInt(form.orgUnitId) : null,
      role: form.role,
      line: parseInt(form.line),
      isActive: form.isActive,
    };
    if (form.password) data.password = form.password;
    else if (!user) return;
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Username *</Label>
          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={!!user} data-testid="input-user-username" />
        </div>
        <div className="space-y-2">
          <Label>{user ? "Password Baru (opsional)" : "Password *"}</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!user} placeholder={user ? "Kosongkan jika tidak diubah" : ""} data-testid="input-user-password" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nama Lengkap *</Label>
        <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required data-testid="input-user-fullname" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role *</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_INFO).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label} - {v.description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Line Pertahanan</Label>
          <Select value={form.line} onValueChange={(v) => setForm({ ...form, line: v })}>
            <SelectTrigger data-testid="select-user-line"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 - System</SelectItem>
              <SelectItem value="1">1 - Lini Pertama</SelectItem>
              <SelectItem value="2">2 - Lini Kedua</SelectItem>
              <SelectItem value="3">3 - Lini Ketiga</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Unit Kerja</Label>
        <Select value={form.orgUnitId} onValueChange={(v) => setForm({ ...form, orgUnitId: v })}>
          <SelectTrigger data-testid="select-user-orgunit"><SelectValue placeholder="Pilih unit kerja" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tidak ada</SelectItem>
            {orgUnits.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Status Aktif</Label>
        <Switch checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} data-testid="switch-user-active" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">Batal</Button>
        <Button type="submit" disabled={isPending || !form.username || !form.fullName || (!form.password && !user)} data-testid="button-save-user">
          {isPending ? "Menyimpan..." : user ? "Update User" : "Buat User"}
        </Button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SafeUser | undefined>();
  const { toast } = useToast();

  const { data: allUsers = [], isLoading } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });
  const { data: orgUnits = [] } = useQuery<OrgUnit[]>({ queryKey: ["/api/org-units"] });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setDialogOpen(false); toast({ title: "User berhasil dibuat" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setDialogOpen(false); setEditing(undefined); toast({ title: "User berhasil diupdate" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User berhasil dihapus" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = allUsers.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const getOrgName = (id: number | null) => { if (!id) return "-"; return orgUnits.find(u => u.id === id)?.name || "-"; };

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Manajemen User</h1>
          <p className="text-muted-foreground mt-1">Kelola akun pengguna dan hak akses sistem ERM</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user"><Plus className="h-4 w-4 mr-2" />Tambah User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit User" : "User Baru"}</DialogTitle></DialogHeader>
            <UserForm
              user={editing} orgUnits={orgUnits}
              onSave={(data) => {
                if (data.orgUnitId === "none" || !data.orgUnitId) data.orgUnitId = null;
                if (editing) updateMut.mutate({ id: editing.id, data });
                else createMut.mutate(data);
              }}
              onCancel={() => { setDialogOpen(false); setEditing(undefined); }}
              isPending={createMut.isPending || updateMut.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(ROLE_INFO).map(([role, info]) => {
          const count = allUsers.filter(u => u.role === role).length;
          return (
            <Card key={role}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${info.className}`}>
                  <info.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{info.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari user..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-users" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Tidak ada user ditemukan</p>
                </TableCell></TableRow>
              ) : filtered.map((u) => {
                const roleInfo = ROLE_INFO[u.role] || { label: u.role, className: "bg-muted text-muted-foreground" };
                return (
                  <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                    <TableCell className="font-mono text-sm">{u.username}</TableCell>
                    <TableCell className="font-medium text-sm">{u.fullName}</TableCell>
                    <TableCell><Badge variant="outline" className={roleInfo.className}>{roleInfo.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">Lini {u.line}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getOrgName(u.orgUnitId)}</TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(u); setDialogOpen(true); }} data-testid={`button-edit-user-${u.id}`}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Hapus user ${u.username}?`)) deleteMut.mutate(u.id); }} data-testid={`button-delete-user-${u.id}`}><Trash2 className="h-4 w-4" /></Button>
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
