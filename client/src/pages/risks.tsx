import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Risk, RiskCategory } from "@shared/schema";
import {
  Plus,
  Search,
  AlertTriangle,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";

function getRiskLevelInfo(score: number) {
  if (score >= 16) return { label: "Critical", className: "bg-red-500/10 text-red-600 dark:text-red-400" };
  if (score >= 9) return { label: "High", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" };
  if (score >= 4) return { label: "Medium", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  return { label: "Low", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
}

function getStatusInfo(status: string) {
  switch (status) {
    case "open": return { label: "Open", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    case "mitigated": return { label: "Mitigated", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    case "closed": return { label: "Closed", className: "bg-muted text-muted-foreground" };
    default: return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

function RiskForm({
  risk,
  categories,
  onSave,
  onCancel,
  isPending,
}: {
  risk?: Risk;
  categories: RiskCategory[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    title: risk?.title || "",
    description: risk?.description || "",
    categoryId: risk?.categoryId?.toString() || "",
    likelihood: risk?.likelihood?.toString() || "1",
    impact: risk?.impact?.toString() || "1",
    status: risk?.status || "open",
    owner: risk?.owner || "",
    department: risk?.department || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: form.title,
      description: form.description || null,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      likelihood: parseInt(form.likelihood),
      impact: parseInt(form.impact),
      status: form.status,
      owner: form.owner || null,
      department: form.department || null,
    });
  };

  const riskScore = parseInt(form.likelihood) * parseInt(form.impact);
  const level = getRiskLevelInfo(riskScore);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          data-testid="input-risk-title"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          data-testid="input-risk-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger data-testid="select-risk-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger data-testid="select-risk-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="mitigated">Mitigated</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Likelihood (1-5)</Label>
          <Select value={form.likelihood} onValueChange={(v) => setForm({ ...form, likelihood: v })}>
            <SelectTrigger data-testid="select-risk-likelihood">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((v) => (
                <SelectItem key={v} value={v.toString()}>
                  {v} - {["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"][v - 1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Impact (1-5)</Label>
          <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v })}>
            <SelectTrigger data-testid="select-risk-impact">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((v) => (
                <SelectItem key={v} value={v.toString()}>
                  {v} - {["Negligible", "Minor", "Moderate", "Major", "Catastrophic"][v - 1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2 py-2">
        <span className="text-sm text-muted-foreground">Risk Score:</span>
        <Badge className={level.className}>{riskScore} - {level.label}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Owner</Label>
          <Input
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            data-testid="input-risk-owner"
          />
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            data-testid="input-risk-department"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !form.title} data-testid="button-save-risk">
          {isPending ? "Saving..." : risk ? "Update Risk" : "Create Risk"}
        </Button>
      </div>
    </form>
  );
}

export default function RisksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>();
  const { toast } = useToast();

  const { data: allRisks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const { data: categories = [] } = useQuery<RiskCategory[]>({
    queryKey: ["/api/risk-categories"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/risks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: "Risk created successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/risks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditingRisk(undefined);
      toast({ title: "Risk updated successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/risks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Risk deleted successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filteredRisks = allRisks.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (r.owner?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCategoryName = (id: number | null) => {
    if (!id) return "-";
    return categories.find((c) => c.id === id)?.name || "-";
  };

  if (risksLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Risk Register
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all identified risks
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRisk(undefined);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-risk">
              <Plus className="h-4 w-4 mr-2" />
              Add Risk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRisk ? "Edit Risk" : "New Risk"}</DialogTitle>
            </DialogHeader>
            <RiskForm
              risk={editingRisk}
              categories={categories}
              onSave={(data) => {
                if (editingRisk) {
                  updateMutation.mutate({ id: editingRisk.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingRisk(undefined);
              }}
              isPending={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search risks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-risks"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="mitigated">Mitigated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Risk</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Likelihood</TableHead>
                <TableHead className="text-center">Impact</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRisks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No risks found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRisks.map((risk) => {
                  const level = getRiskLevelInfo(risk.riskScore);
                  const status = getStatusInfo(risk.status);
                  return (
                    <TableRow key={risk.id} data-testid={`risk-row-${risk.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{risk.title}</p>
                          {risk.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {risk.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getCategoryName(risk.categoryId)}</TableCell>
                      <TableCell className="text-center text-sm">{risk.likelihood}</TableCell>
                      <TableCell className="text-center text-sm">{risk.impact}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={level.className}>{risk.riskScore}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{risk.owner || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingRisk(risk);
                              setDialogOpen(true);
                            }}
                            data-testid={`button-edit-risk-${risk.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(risk.id)}
                            data-testid={`button-delete-risk-${risk.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
