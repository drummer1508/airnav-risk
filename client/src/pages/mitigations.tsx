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
import { useToast } from "@/hooks/use-toast";
import type { Mitigation, Risk } from "@shared/schema";
import {
  Plus,
  Search,
  Shield,
  Pencil,
  Trash2,
  Filter,
  Calendar,
} from "lucide-react";

function getStatusInfo(status: string) {
  switch (status) {
    case "planned": return { label: "Planned", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    case "in_progress": return { label: "In Progress", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    case "completed": return { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    case "cancelled": return { label: "Cancelled", className: "bg-muted text-muted-foreground" };
    default: return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

function getPriorityInfo(priority: string) {
  switch (priority) {
    case "high": return { label: "High", className: "bg-red-500/10 text-red-600 dark:text-red-400" };
    case "medium": return { label: "Medium", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    case "low": return { label: "Low", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    default: return { label: priority, className: "bg-muted text-muted-foreground" };
  }
}

function MitigationForm({
  mitigation,
  risks,
  onSave,
  onCancel,
  isPending,
}: {
  mitigation?: Mitigation;
  risks: Risk[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    riskId: mitigation?.riskId?.toString() || "",
    title: mitigation?.title || "",
    description: mitigation?.description || "",
    status: mitigation?.status || "planned",
    priority: mitigation?.priority || "medium",
    dueDate: mitigation?.dueDate || "",
    assignedTo: mitigation?.assignedTo || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      riskId: parseInt(form.riskId),
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assignedTo: form.assignedTo || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Associated Risk</Label>
        <Select value={form.riskId} onValueChange={(v) => setForm({ ...form, riskId: v })}>
          <SelectTrigger data-testid="select-mitigation-risk">
            <SelectValue placeholder="Select a risk" />
          </SelectTrigger>
          <SelectContent>
            {risks.map((r) => (
              <SelectItem key={r.id} value={r.id.toString()}>
                {r.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          data-testid="input-mitigation-title"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          data-testid="input-mitigation-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger data-testid="select-mitigation-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger data-testid="select-mitigation-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            data-testid="input-mitigation-due-date"
          />
        </div>
        <div className="space-y-2">
          <Label>Assigned To</Label>
          <Input
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            data-testid="input-mitigation-assigned-to"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !form.title || !form.riskId} data-testid="button-save-mitigation">
          {isPending ? "Saving..." : mitigation ? "Update" : "Create"}
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

  const { data: allMitigations = [], isLoading } = useQuery<Mitigation[]>({
    queryKey: ["/api/mitigations"],
  });

  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mitigations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mitigations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: "Mitigation created successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/mitigations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mitigations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditing(undefined);
      toast({ title: "Mitigation updated successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/mitigations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mitigations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Mitigation deleted successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = allMitigations.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.assignedTo?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRiskTitle = (riskId: number) =>
    risks.find((r) => r.id === riskId)?.title || "-";

  if (isLoading) {
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
            Mitigation Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage risk mitigation actions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(undefined);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-mitigation">
              <Plus className="h-4 w-4 mr-2" />
              Add Mitigation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Mitigation" : "New Mitigation"}</DialogTitle>
            </DialogHeader>
            <MitigationForm
              mitigation={editing}
              risks={risks}
              onSave={(data) => {
                if (editing) {
                  updateMutation.mutate({ id: editing.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditing(undefined);
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
            placeholder="Search mitigations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-mitigations"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
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
                <TableHead className="w-[250px]">Mitigation</TableHead>
                <TableHead>Associated Risk</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No mitigations found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((mit) => {
                  const status = getStatusInfo(mit.status);
                  const priority = getPriorityInfo(mit.priority);
                  return (
                    <TableRow key={mit.id} data-testid={`mitigation-row-${mit.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{mit.title}</p>
                          {mit.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {mit.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getRiskTitle(mit.riskId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priority.className}>
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mit.dueDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {mit.dueDate}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mit.assignedTo || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditing(mit);
                              setDialogOpen(true);
                            }}
                            data-testid={`button-edit-mitigation-${mit.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(mit.id)}
                            data-testid={`button-delete-mitigation-${mit.id}`}
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
