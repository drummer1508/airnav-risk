import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Risk, OrgUnit, TaxonomyT1, TaxonomyT2, TaxonomyT3, WorkflowLog, Mitigation } from "@shared/schema";
import { getRiskLevelInfo, getStatusInfo, getMitigationStatusInfo, getStrategyInfo, getAvailableWorkflowActions, IMPACT_CRITERIA_LABELS, IMPACT_DESCRIPTIONS, LIKELIHOOD_DESCRIPTIONS, formatCurrency } from "@/lib/risk-helpers";
import { useAuth } from "@/lib/auth";
import { AuditTrailIcon, AuditTrailList } from "@/components/audit-trail";
import { Plus, Search, AlertTriangle, Pencil, Trash2, Filter, Eye, History, ChevronRight, Send } from "lucide-react";

function RiskForm({ risk, orgUnits, t1s, t2s, t3s, onSave, onCancel, isPending }: {
  risk?: Risk; orgUnits: OrgUnit[]; t1s: TaxonomyT1[]; t2s: TaxonomyT2[]; t3s: TaxonomyT3[];
  onSave: (data: any) => void; onCancel: () => void; isPending: boolean;
}) {
  const { user } = useAuth();
  const userOrgUnitId = user?.orgUnitId;
  const [form, setForm] = useState({
    riskCode: risk?.riskCode || "",
    title: risk?.title || "",
    description: risk?.description || "",
    rootCause: risk?.rootCause || "",
    consequence: risk?.consequence || "",
    orgUnitId: risk?.orgUnitId?.toString() || (userOrgUnitId ? userOrgUnitId.toString() : ""),
    t1Id: risk?.t1Id?.toString() || "",
    t2Id: risk?.t2Id?.toString() || "",
    t3Id: risk?.t3Id?.toString() || "",
    impactCriteria: risk?.impactCriteria || "financial",
    financialEstimate: risk?.financialEstimate || "",
    impactFinancial: risk?.impactFinancial?.toString() || "1",
    impactLegal: risk?.impactLegal?.toString() || "1",
    impactCompliance: risk?.impactCompliance?.toString() || "1",
    impactReputation: risk?.impactReputation?.toString() || "1",
    impactMarket: risk?.impactMarket?.toString() || "1",
    impactIt: risk?.impactIt?.toString() || "1",
    impactHr: risk?.impactHr?.toString() || "1",
    impactHsse: risk?.impactHsse?.toString() || "1",
    impactPmn: risk?.impactPmn?.toString() || "1",
    likelihoodScore: risk?.likelihoodScore?.toString() || "1",
    justification: risk?.justification || "",
    rkapYear: risk?.rkapYear?.toString() || new Date().getFullYear().toString(),
  });

  const filteredT2 = t2s.filter(t => !form.t1Id || t.t1Id === parseInt(form.t1Id));
  const filteredT3 = t3s.filter(t => !form.t2Id || t.t2Id === parseInt(form.t2Id));

  const impacts = [
    parseInt(form.impactFinancial), parseInt(form.impactLegal), parseInt(form.impactCompliance),
    parseInt(form.impactReputation), parseInt(form.impactMarket), parseInt(form.impactIt),
    parseInt(form.impactHr), parseInt(form.impactHsse), parseInt(form.impactPmn),
  ];
  const maxImpact = Math.max(...impacts);
  const inherentScore = maxImpact * parseInt(form.likelihoodScore);
  const level = getRiskLevelInfo(inherentScore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      riskCode: form.riskCode,
      title: form.title,
      description: form.description || null,
      rootCause: form.rootCause || null,
      consequence: form.consequence || null,
      orgUnitId: form.orgUnitId ? parseInt(form.orgUnitId) : null,
      riskOwner: form.orgUnitId ? (orgUnits.find(u => u.id === parseInt(form.orgUnitId))?.name || null) : null,
      t1Id: form.t1Id ? parseInt(form.t1Id) : null,
      t2Id: form.t2Id ? parseInt(form.t2Id) : null,
      t3Id: form.t3Id ? parseInt(form.t3Id) : null,
      impactCriteria: form.impactCriteria,
      financialEstimate: form.financialEstimate || null,
      impactFinancial: parseInt(form.impactFinancial),
      impactLegal: parseInt(form.impactLegal),
      impactCompliance: parseInt(form.impactCompliance),
      impactReputation: parseInt(form.impactReputation),
      impactMarket: parseInt(form.impactMarket),
      impactIt: parseInt(form.impactIt),
      impactHr: parseInt(form.impactHr),
      impactHsse: parseInt(form.impactHsse),
      impactPmn: parseInt(form.impactPmn),
      likelihoodScore: parseInt(form.likelihoodScore),
      justification: form.justification || null,
      rkapYear: form.rkapYear ? parseInt(form.rkapYear) : null,
      currentStatus: risk?.currentStatus || "draft",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="info" data-testid="tab-info">Informasi</TabsTrigger>
          <TabsTrigger value="taxonomy" data-testid="tab-taxonomy">Taxonomy & Scoring</TabsTrigger>
          <TabsTrigger value="assessment" data-testid="tab-assessment">Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Risiko *</Label>
              <Input value={form.riskCode} onChange={(e) => setForm({ ...form, riskCode: e.target.value })} placeholder="RISK-2025-OPS-001" required data-testid="input-risk-code" />
            </div>
            <div className="space-y-2">
              <Label>Tahun RKAP</Label>
              <Input type="number" value={form.rkapYear} onChange={(e) => setForm({ ...form, rkapYear: e.target.value })} data-testid="input-rkap-year" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Judul Risiko *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-risk-title" />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-risk-description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Kerja</Label>
              {userOrgUnitId && !risk ? (
                <Input value={orgUnits.find(u => u.id === userOrgUnitId)?.name || ""} disabled className="bg-muted" data-testid="input-org-unit-auto" />
              ) : (
                <Select value={form.orgUnitId} onValueChange={(v) => setForm({ ...form, orgUnitId: v })}>
                  <SelectTrigger data-testid="select-org-unit"><SelectValue placeholder="Pilih unit kerja" /></SelectTrigger>
                  <SelectContent>
                    {orgUnits.filter(u => u.type !== "head_office").map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Risk Owner</Label>
              <Input value={form.orgUnitId ? (orgUnits.find(u => u.id === parseInt(form.orgUnitId))?.name || "") : ""} disabled className="bg-muted" data-testid="input-risk-owner" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Penyebab (Root Cause)</Label>
            <Textarea value={form.rootCause} onChange={(e) => setForm({ ...form, rootCause: e.target.value })} placeholder="Mengapa risiko ini bisa terjadi?" data-testid="input-root-cause" />
          </div>
          <div className="space-y-2">
            <Label>Dampak (Consequence)</Label>
            <Textarea value={form.consequence} onChange={(e) => setForm({ ...form, consequence: e.target.value })} placeholder="Apa akibat nyata jika risiko ini terjadi?" data-testid="input-consequence" />
          </div>
        </TabsContent>

        <TabsContent value="taxonomy" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Tema Risiko (T1)</Label>
            <Select value={form.t1Id} onValueChange={(v) => setForm({ ...form, t1Id: v, t2Id: "", t3Id: "" })}>
              <SelectTrigger data-testid="select-t1"><SelectValue placeholder="Pilih Tema" /></SelectTrigger>
              <SelectContent>{t1s.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kategori Risiko (T2)</Label>
            <Select value={form.t2Id} onValueChange={(v) => setForm({ ...form, t2Id: v, t3Id: "" })}>
              <SelectTrigger data-testid="select-t2"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
              <SelectContent>{filteredT2.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Peristiwa Risiko (T3)</Label>
            <Select value={form.t3Id} onValueChange={(v) => setForm({ ...form, t3Id: v })}>
              <SelectTrigger data-testid="select-t3"><SelectValue placeholder="Pilih Peristiwa" /></SelectTrigger>
              <SelectContent>{filteredT3.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Kriteria Dampak Utama</Label>
            <Select value={form.impactCriteria} onValueChange={(v) => setForm({ ...form, impactCriteria: v })}>
              <SelectTrigger data-testid="select-impact-criteria"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(IMPACT_CRITERIA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.impactCriteria === "financial" && (
            <div className="space-y-2">
              <Label>Nilai Estimasi Finansial (Rp)</Label>
              <Input type="number" value={form.financialEstimate} onChange={(e) => setForm({ ...form, financialEstimate: e.target.value })} placeholder="0" data-testid="input-financial-estimate" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4 mt-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Skor Dampak per Parameter (1-5)</Label>
            <p className="text-xs text-muted-foreground">Prinsip Max Impact: Skor tertinggi akan diambil sebagai skor dampak akhir</p>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(IMPACT_CRITERIA_LABELS).map(([key, label]) => {
                const fieldKey = `impact${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof form;
                const descriptions = IMPACT_DESCRIPTIONS[key] || [];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-24 text-xs shrink-0">{label}</Label>
                    <Select value={(form[fieldKey] as string) || "1"} onValueChange={(v) => setForm({ ...form, [fieldKey]: v })}>
                      <SelectTrigger className="flex-1" data-testid={`select-impact-${key}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(v => (
                          <SelectItem key={v} value={v.toString()}>
                            {v} - {descriptions[v - 1] || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Skor Probabilitas (Likelihood)</Label>
            <Select value={form.likelihoodScore} onValueChange={(v) => setForm({ ...form, likelihoodScore: v })}>
              <SelectTrigger data-testid="select-likelihood"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(v => (
                  <SelectItem key={v} value={v.toString()}>{v} - {LIKELIHOOD_DESCRIPTIONS[v - 1]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 rounded-md bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Max Impact Score:</span>
              <span className="font-bold">{maxImpact}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Likelihood Score:</span>
              <span className="font-bold">{form.likelihoodScore}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Inherent Risk Score:</span>
              <Badge className={level.className}>{inherentScore} - {level.label}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Justifikasi Penilaian</Label>
            <Textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} placeholder="Penjelasan mengapa memberikan skor tersebut" data-testid="input-justification" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">Batal</Button>
        <Button type="submit" disabled={isPending || !form.title || !form.riskCode} data-testid="button-save-risk">
          {isPending ? "Menyimpan..." : risk ? "Update Risiko" : "Simpan Risiko"}
        </Button>
      </div>
    </form>
  );
}

function RiskDetailDialog({ risk, orgUnits, t1s, t2s, t3s, onStatusChange }: {
  risk: Risk; orgUnits: OrgUnit[]; t1s: TaxonomyT1[]; t2s: TaxonomyT2[]; t3s: TaxonomyT3[];
  onStatusChange?: () => void;
}) {
  const level = getRiskLevelInfo(risk.inherentRiskScore);
  const status = getStatusInfo(risk.currentStatus);
  const { data: wfLogs = [] } = useQuery<WorkflowLog[]>({ queryKey: ["/api/workflow-logs", risk.id] });
  const { data: mits = [] } = useQuery<Mitigation[]>({ queryKey: ["/api/mitigations/risk", risk.id] });
  const { user } = useAuth();
  const { toast } = useToast();
  const [wfComment, setWfComment] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const orgUnit = orgUnits.find(u => u.id === risk.orgUnitId);
  const t1 = t1s.find(t => t.id === risk.t1Id);
  const t2 = t2s.find(t => t.id === risk.t2Id);
  const t3 = t3s.find(t => t.id === risk.t3Id);

  const actions = user ? getAvailableWorkflowActions(risk.currentStatus, user.role, user.line) : [];

  const workflowMut = useMutation({
    mutationFn: async ({ toStatus, comment }: { toStatus: string; comment: string }) => {
      return apiRequest("POST", "/api/workflow-logs", {
        riskId: risk.id,
        fromStatus: risk.currentStatus,
        toStatus,
        actorName: user!.fullName,
        actorRole: user!.role,
        comments: comment || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-logs", risk.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setPendingAction(null);
      setWfComment("");
      toast({ title: "Status berhasil diubah" });
      onStatusChange?.();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">{risk.riskCode}</Badge>
        <Badge className={status.className}>{status.label}</Badge>
        <Badge className={level.className}>{risk.inherentRiskScore} - {level.label}</Badge>
        <AuditTrailIcon tableName="risks" recordId={risk.id} />
      </div>

      {actions.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
          <Label className="font-semibold text-sm flex items-center gap-2"><Send className="h-4 w-4" />Aksi Workflow</Label>
          {pendingAction ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Transisi: <Badge variant="outline" className={getStatusInfo(risk.currentStatus).className}>{getStatusInfo(risk.currentStatus).label}</Badge>
                {" "}<ChevronRight className="h-3 w-3 inline" />{" "}
                <Badge variant="outline" className={getStatusInfo(pendingAction).className}>{getStatusInfo(pendingAction).label}</Badge>
              </p>
              <Textarea
                placeholder="Komentar (opsional untuk approve, wajib untuk pengembalian)"
                value={wfComment}
                onChange={(e) => setWfComment(e.target.value)}
                className="text-sm min-h-[60px]"
                data-testid="textarea-workflow-comment"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => workflowMut.mutate({ toStatus: pendingAction, comment: wfComment })}
                  disabled={workflowMut.isPending || (["returned_to_inputer", "returned_to_reviewer", "l2_returned"].includes(pendingAction) && !wfComment.trim())}
                  data-testid="button-confirm-workflow"
                >
                  {workflowMut.isPending ? "Memproses..." : "Konfirmasi"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setPendingAction(null); setWfComment(""); }} data-testid="button-cancel-workflow">
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.toStatus}
                  size="sm"
                  variant={action.variant}
                  onClick={() => {
                    if (action.requireComment) {
                      setPendingAction(action.toStatus);
                    } else {
                      setPendingAction(action.toStatus);
                    }
                  }}
                  data-testid={`button-workflow-${action.toStatus}`}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-1"><span className="text-muted-foreground">Unit Kerja:</span> <span className="font-medium ml-1">{orgUnit?.name || "-"}</span><AuditTrailIcon tableName="risks" recordId={risk.id} fieldName="orgUnitId" /></div>
        <div className="flex items-center gap-1"><span className="text-muted-foreground">Risk Owner:</span> <span className="font-medium ml-1">{risk.riskOwner || "-"}</span><AuditTrailIcon tableName="risks" recordId={risk.id} fieldName="riskOwner" /></div>
        <div><span className="text-muted-foreground">Tahun RKAP:</span> <span className="font-medium ml-1">{risk.rkapYear || "-"}</span></div>
        <div><span className="text-muted-foreground">Taxonomy:</span> <span className="font-medium ml-1">{t1?.name} {t2 ? `> ${t2.name}` : ""} {t3 ? `> ${t3.name}` : ""}</span></div>
      </div>

      {risk.description && <div className="text-sm"><Label className="text-muted-foreground">Deskripsi</Label><p className="mt-1">{risk.description}</p></div>}
      {risk.rootCause && <div className="text-sm"><Label className="text-muted-foreground">Root Cause</Label><p className="mt-1">{risk.rootCause}</p></div>}
      {risk.consequence && <div className="text-sm"><Label className="text-muted-foreground">Consequence</Label><p className="mt-1">{risk.consequence}</p></div>}

      <Separator />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="font-semibold">Scoring Detail</Label>
          <AuditTrailIcon tableName="risks" recordId={risk.id} fieldName="impactFinancial" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {Object.entries(IMPACT_CRITERIA_LABELS).map(([key, label]) => {
            const fieldKey = `impact${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof Risk;
            const val = risk[fieldKey] as number;
            return (
              <div key={key} className="flex justify-between p-2 rounded-md bg-muted/30">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className={`font-bold text-xs ${val >= 4 ? "text-red-500" : val >= 3 ? "text-amber-500" : ""}`}>{val}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50 text-sm">
          <div>Impact: <span className="font-bold">{risk.impactScore}</span></div>
          <div>Likelihood: <span className="font-bold">{risk.likelihoodScore}</span></div>
          <div>Inherent: <Badge className={level.className}>{risk.inherentRiskScore}</Badge></div>
          {risk.residualRiskScore && (
            <div>Residual: <Badge className={getRiskLevelInfo(risk.residualRiskScore).className}>{risk.residualRiskScore}</Badge></div>
          )}
        </div>
      </div>

      {mits.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="font-semibold">Mitigasi ({mits.length})</Label>
            {mits.map(m => {
              const s = getMitigationStatusInfo(m.status);
              const st = getStrategyInfo(m.strategy);
              return (
                <div key={m.id} className="p-3 rounded-md bg-muted/30 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={st.className}>{st.label}</Badge>
                    <span className="text-sm font-medium flex-1">{m.actionDescription.slice(0, 80)}{m.actionDescription.length > 80 ? "..." : ""}</span>
                    <AuditTrailIcon tableName="mitigations" recordId={m.id} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className={s.className}>{s.label}</Badge>
                    <span>Progress: {m.progress}%</span>
                    {m.picName && <span>PIC: {m.picName}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Separator />
      <div className="space-y-2">
        <Label className="font-semibold flex items-center gap-2"><History className="h-4 w-4" />Workflow History</Label>
        {wfLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada riwayat workflow.</p>
        ) : wfLogs.map(log => (
          <div key={log.id} className="flex items-start gap-3 p-2 text-sm border-b last:border-0">
            <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground mt-0.5">
              <Badge variant="outline" className={getStatusInfo(log.fromStatus).className}>{getStatusInfo(log.fromStatus).label}</Badge>
              <ChevronRight className="h-3 w-3" />
              <Badge variant="outline" className={getStatusInfo(log.toStatus).className}>{getStatusInfo(log.toStatus).label}</Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs"><span className="font-medium">{log.actorName}</span> <span className="text-muted-foreground">({log.actorRole})</span></p>
              {log.comments && <p className="text-xs text-muted-foreground mt-0.5 italic">"{log.comments}"</p>}
              {log.timestamp && <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(log.timestamp).toLocaleString("id-ID")}</p>}
            </div>
          </div>
        ))}
      </div>

      <Separator />
      <div className="space-y-2">
        <Label className="font-semibold flex items-center gap-2"><History className="h-4 w-4" />Audit Trail</Label>
        <AuditTrailList tableName="risks" recordId={risk.id} />
      </div>
    </div>
  );
}

export default function RisksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailRisk, setDetailRisk] = useState<Risk | null>(null);
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>();
  const { toast } = useToast();
  const { canCreateRisk, isSysadmin, user, isReviewer, isInputer } = useAuth();

  const { data: allRisks = [], isLoading } = useQuery<Risk[]>({ queryKey: ["/api/risks"] });
  const { data: orgUnits = [] } = useQuery<OrgUnit[]>({ queryKey: ["/api/org-units"] });
  const { data: t1s = [] } = useQuery<TaxonomyT1[]>({ queryKey: ["/api/taxonomy/t1"] });
  const { data: t2s = [] } = useQuery<TaxonomyT2[]>({ queryKey: ["/api/taxonomy/t2"] });
  const { data: t3s = [] } = useQuery<TaxonomyT3[]>({ queryKey: ["/api/taxonomy/t3"] });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/risks", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/risks"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); setFormOpen(false); toast({ title: "Risiko berhasil dibuat" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/risks/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/risks"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); setFormOpen(false); setEditingRisk(undefined); toast({ title: "Risiko berhasil diupdate" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/risks/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/risks"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); toast({ title: "Risiko berhasil dihapus" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = allRisks.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.riskCode.toLowerCase().includes(search.toLowerCase()) || (r.riskOwner?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStatus = statusFilter === "all" || r.currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const getOrgName = (id: number | null) => { if (!id) return "-"; return orgUnits.find(u => u.id === id)?.name || "-"; };
  const getT3Name = (id: number | null) => { if (!id) return "-"; return t3s.find(t => t.id === id)?.name || "-"; };

  if (isLoading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Risk Register</h1>
          <p className="text-muted-foreground mt-1">Identifikasi, penilaian, dan pengelolaan risiko enterprise</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingRisk(undefined); }}>
          {canCreateRisk && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-risk"><Plus className="h-4 w-4 mr-2" />Tambah Risiko</Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingRisk ? "Edit Risiko" : "Input Risiko Baru"}</DialogTitle></DialogHeader>
            <RiskForm
              risk={editingRisk} orgUnits={orgUnits} t1s={t1s} t2s={t2s} t3s={t3s}
              onSave={(data) => editingRisk ? updateMut.mutate({ id: editingRisk.id, data }) : createMut.mutate(data)}
              onCancel={() => { setFormOpen(false); setEditingRisk(undefined); }}
              isPending={createMut.isPending || updateMut.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari risiko..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-risks" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Diajukan</SelectItem>
            <SelectItem value="returned_to_inputer">Dikembalikan ke Inputer</SelectItem>
            <SelectItem value="reviewed">Direview L1</SelectItem>
            <SelectItem value="returned_to_reviewer">Dikembalikan ke Reviewer</SelectItem>
            <SelectItem value="l1_approved">Disetujui L1</SelectItem>
            <SelectItem value="l2_review">Review L2</SelectItem>
            <SelectItem value="l2_returned">Dikembalikan L2</SelectItem>
            <SelectItem value="l2_finalized">Final L2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Kode</TableHead>
                <TableHead className="w-[250px]">Judul Risiko</TableHead>
                <TableHead>Peristiwa (T3)</TableHead>
                <TableHead className="text-center">Impact</TableHead>
                <TableHead className="text-center">Likelihood</TableHead>
                <TableHead className="text-center">Skor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Owner</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Tidak ada risiko ditemukan</p>
                </TableCell></TableRow>
              ) : filtered.map((risk) => {
                const level = getRiskLevelInfo(risk.inherentRiskScore);
                const status = getStatusInfo(risk.currentStatus);
                return (
                  <TableRow key={risk.id} data-testid={`risk-row-${risk.id}`}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{risk.riskCode}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{risk.title}</p>
                      {risk.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{risk.description}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{getT3Name(risk.t3Id)}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{risk.impactScore}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{risk.likelihoodScore}</TableCell>
                    <TableCell className="text-center"><Badge className={level.className}>{risk.inherentRiskScore}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={status.className}>{status.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{risk.riskOwner || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setDetailRisk(risk)} data-testid={`button-view-risk-${risk.id}`}><Eye className="h-4 w-4" /></Button>
                        {!isSysadmin && (!risk.createdBy || risk.createdBy === user?.id || (!isInputer && !isReviewer)) && (
                          <Button size="icon" variant="ghost" onClick={() => { setEditingRisk(risk); setFormOpen(true); }} data-testid={`button-edit-risk-${risk.id}`}><Pencil className="h-4 w-4" /></Button>
                        )}
                        {canCreateRisk && (!risk.createdBy || risk.createdBy === user?.id) && (
                          <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(risk.id)} data-testid={`button-delete-risk-${risk.id}`}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailRisk} onOpenChange={(open) => { if (!open) setDetailRisk(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detailRisk?.title}</DialogTitle></DialogHeader>
          {detailRisk && <RiskDetailDialog risk={detailRisk} orgUnits={orgUnits} t1s={t1s} t2s={t2s} t3s={t3s} onStatusChange={() => setDetailRisk(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
