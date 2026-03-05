import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { TaxonomyT1, TaxonomyT2, TaxonomyT3 } from "@shared/schema";
import { FolderTree, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";

type TaxLevel = "t1" | "t2" | "t3";
interface FormState { level: TaxLevel; name: string; parentId: string; editId?: number; }

export default function TaxonomyPage() {
  const { isSysadmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ level: "t1", name: "", parentId: "" });

  const { data: t1s = [], isLoading: l1 } = useQuery<TaxonomyT1[]>({ queryKey: ["/api/taxonomy/t1"] });
  const { data: t2s = [], isLoading: l2 } = useQuery<TaxonomyT2[]>({ queryKey: ["/api/taxonomy/t2"] });
  const { data: t3s = [], isLoading: l3 } = useQuery<TaxonomyT3[]>({ queryKey: ["/api/taxonomy/t3"] });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/taxonomy/t1"] });
    queryClient.invalidateQueries({ queryKey: ["/api/taxonomy/t2"] });
    queryClient.invalidateQueries({ queryKey: ["/api/taxonomy/t3"] });
  };

  const saveMut = useMutation({
    mutationFn: (f: FormState) => {
      const url = `/api/taxonomy/${f.level}${f.editId ? `/${f.editId}` : ""}`;
      const method = f.editId ? "PATCH" : "POST";
      const body: any = { name: f.name };
      if (f.level === "t2") body.t1Id = parseInt(f.parentId);
      if (f.level === "t3") body.t2Id = parseInt(f.parentId);
      return apiRequest(method, url, body);
    },
    onSuccess: () => { invalidateAll(); setDialogOpen(false); toast({ title: "Berhasil disimpan" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: ({ level, id }: { level: TaxLevel; id: number }) => apiRequest("DELETE", `/api/taxonomy/${level}/${id}`),
    onSuccess: () => { invalidateAll(); toast({ title: "Berhasil dihapus" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openAdd = (level: TaxLevel, parentId?: number) => {
    setForm({ level, name: "", parentId: parentId?.toString() || "", editId: undefined });
    setDialogOpen(true);
  };

  const openEdit = (level: TaxLevel, id: number, name: string, parentId?: number) => {
    setForm({ level, name, parentId: parentId?.toString() || "", editId: id });
    setDialogOpen(true);
  };

  const isLoading = l1 || l2 || l3;

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Taxonomy Risiko</h1>
          <p className="text-muted-foreground mt-1">Klasifikasi tiga tingkat untuk standardisasi pelaporan risiko (T1 - T2 - T3)</p>
        </div>
        {isSysadmin && (
          <Button onClick={() => openAdd("t1")} data-testid="button-add-t1"><Plus className="h-4 w-4 mr-2" />Tambah Tema (T1)</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tema (T1)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{t1s.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Kategori (T2)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{t2s.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Peristiwa (T3)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{t3s.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            Struktur Taxonomy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {t1s.map((t1) => {
              const relatedT2 = t2s.filter(t => t.t1Id === t1.id);
              return (
                <AccordionItem key={t1.id} value={`t1-${t1.id}`}>
                  <AccordionTrigger className="text-sm font-semibold" data-testid={`accordion-t1-${t1.id}`}>
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="secondary" className="text-[10px]">T1</Badge>
                      {t1.name}
                      <Badge variant="outline" className="text-[10px] ml-2">{relatedT2.length} kategori</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="ml-4 space-y-2">
                      {isSysadmin && (
                        <div className="flex items-center gap-2 pb-2">
                          <Button size="sm" variant="outline" onClick={() => openAdd("t2", t1.id)} data-testid={`button-add-t2-${t1.id}`}>
                            <Plus className="h-3 w-3 mr-1" />Tambah Kategori (T2)
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit("t1", t1.id, t1.name)} data-testid={`button-edit-t1-${t1.id}`}>
                            <Pencil className="h-3 w-3 mr-1" />Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Hapus tema "${t1.name}" dan semua sub-kategori?`)) deleteMut.mutate({ level: "t1", id: t1.id }); }} data-testid={`button-delete-t1-${t1.id}`}>
                            <Trash2 className="h-3 w-3 mr-1" />Hapus
                          </Button>
                        </div>
                      )}
                      {relatedT2.map((t2) => {
                        const relatedT3 = t3s.filter(t => t.t2Id === t2.id);
                        return (
                          <div key={t2.id} className="space-y-1">
                            <div className="flex items-center gap-2 py-1 group">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="secondary" className="text-[10px]">T2</Badge>
                              <span className="text-sm font-medium flex-1">{t2.name}</span>
                              <Badge variant="outline" className="text-[10px]">{relatedT3.length}</Badge>
                              {isSysadmin && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openAdd("t3", t2.id)} data-testid={`button-add-t3-${t2.id}`}><Plus className="h-3 w-3" /></Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit("t2", t2.id, t2.name, t1.id)} data-testid={`button-edit-t2-${t2.id}`}><Pencil className="h-3 w-3" /></Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { if (confirm(`Hapus "${t2.name}"?`)) deleteMut.mutate({ level: "t2", id: t2.id }); }} data-testid={`button-delete-t2-${t2.id}`}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              )}
                            </div>
                            {relatedT3.length > 0 && (
                              <div className="ml-8 space-y-1">
                                {relatedT3.map((t3) => (
                                  <div key={t3.id} className="flex items-center gap-2 py-0.5 group/t3">
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <Badge variant="outline" className="text-[10px]">T3</Badge>
                                    <span className="text-sm text-muted-foreground flex-1">{t3.name}</span>
                                    {isSysadmin && (
                                      <div className="flex items-center gap-1 opacity-0 group-hover/t3:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit("t3", t3.id, t3.name, t2.id)} data-testid={`button-edit-t3-${t3.id}`}><Pencil className="h-3 w-3" /></Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { if (confirm(`Hapus "${t3.name}"?`)) deleteMut.mutate({ level: "t3", id: t3.id }); }} data-testid={`button-delete-t3-${t3.id}`}><Trash2 className="h-3 w-3" /></Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.editId ? "Edit" : "Tambah"} {form.level === "t1" ? "Tema (T1)" : form.level === "t2" ? "Kategori (T2)" : "Peristiwa (T3)"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-taxonomy-name" />
            </div>
            {form.level === "t2" && !form.editId && (
              <div className="space-y-2">
                <Label>Parent Tema (T1)</Label>
                <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
                  <SelectTrigger data-testid="select-taxonomy-parent"><SelectValue placeholder="Pilih tema" /></SelectTrigger>
                  <SelectContent>{t1s.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {form.level === "t3" && !form.editId && (
              <div className="space-y-2">
                <Label>Parent Kategori (T2)</Label>
                <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
                  <SelectTrigger data-testid="select-taxonomy-parent"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>{t2s.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">Batal</Button>
              <Button type="submit" disabled={saveMut.isPending || !form.name} data-testid="button-save-taxonomy">
                {saveMut.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
