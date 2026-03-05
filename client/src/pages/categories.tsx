import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import type { RiskCategory } from "@shared/schema";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";

const COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#6366f1",
];

function CategoryForm({
  category,
  onSave,
  onCancel,
  isPending,
}: {
  category?: RiskCategory;
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || COLORS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      description: form.description || null,
      color: form.color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          data-testid="input-category-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          data-testid="input-category-description"
        />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-8 w-8 rounded-md transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => setForm({ ...form, color: c })}
              data-testid={`color-${c}`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !form.name} data-testid="button-save-category">
          {isPending ? "Saving..." : category ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RiskCategory | undefined>();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<RiskCategory[]>({
    queryKey: ["/api/risk-categories"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/risk-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: "Category created successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/risk-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditing(undefined);
      toast({ title: "Category updated successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/risk-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Risk Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize risks into meaningful categories
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(undefined);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-category">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editing}
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

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm mt-1">Create your first risk category to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="group" data-testid={`category-card-${cat.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(cat);
                      setDialogOpen(true);
                    }}
                    data-testid={`button-edit-category-${cat.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(cat.id)}
                    data-testid={`button-delete-category-${cat.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {cat.description || "No description provided"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
