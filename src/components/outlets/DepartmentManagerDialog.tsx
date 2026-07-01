import { useState, useEffect, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  ChevronRight,
  ChevronLeft,
  Search,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetOutletCatalogCategories,
  useGetOutletDepartments,
  useCreateOutletDepartment,
  useUpdateOutletDepartment,
  useUpdateOutletDepartmentCategories,
  useDeleteOutletDepartment,
} from "@/services/api/outlets";
import type { DepartmentRecord } from "@/lib/types/outlet-subresources";

interface DepartmentManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: number | string;
  outletName: string;
  onUpdated?: () => void;
}

export default function DepartmentManagerDialog({
  open,
  onOpenChange,
  outletId,
  outletName,
  onUpdated,
}: DepartmentManagerDialogProps) {
  const [selectedDept, setSelectedDept] = useState<DepartmentRecord | null>(null);
  const [addingDept, setAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentRecord | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRecord | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const debouncedMenuSearch = useDebouncedValue(menuSearch, 300);

  

  const { data: categories = [], isLoading: isLoadingCats } = useGetOutletCatalogCategories(
    outletId,
    { search: debouncedMenuSearch.trim() || undefined }
  );
  const { data: departments = [], isLoading: isLoadingDepts, mutate: mutateDepts } = useGetOutletDepartments(outletId);

  const { trigger: triggerCreate, isMutating: isCreating } = useCreateOutletDepartment(outletId);
  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateOutletDepartment(outletId);
  const { trigger: triggerAssignCategories, isMutating: isAssigning } = useUpdateOutletDepartmentCategories(outletId);
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteOutletDepartment(outletId);

  const handleAddDept = async () => {
    if (!deptName.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (departments.some((d) => d.name.toLowerCase() === deptName.trim().toLowerCase())) {
      toast.error("Department already exists");
      return;
    }
    try {
      await triggerCreate({ name: deptName.trim() });
      toast.success(`Department "${deptName.trim()}" added`);
      mutateDepts();
      onUpdated?.();
      setDeptName("");
      setAddingDept(false);
    } catch (e) {}
  };

  const handleEditDept = async () => {
    if (!editingDept || !deptName.trim()) return;
    try {
      await triggerUpdate({
        deptId: editingDept.id,
        payload: { name: deptName.trim() },
      });
      toast.success(`Department renamed to "${deptName.trim()}"`);
      mutateDepts();
      onUpdated?.();
      setEditingDept(null);
      setDeptName("");
      if (selectedDept?.id === editingDept.id) {
        setSelectedDept({ ...editingDept, name: deptName.trim() });
      }
    } catch (e) {}
  };

  const handleDeleteDept = async () => {
    if (!deleteTarget) return;
    try {
      await triggerDelete(deleteTarget.id);
      toast.success(`Department "${deleteTarget.name}" deleted`);
      mutateDepts();
      onUpdated?.();
      if (selectedDept?.id === deleteTarget.id) setSelectedDept(null);
      setDeleteTarget(null);
    } catch (e) {}
  };

  const toggleCategory = async (dept: DepartmentRecord, categoryId: string) => {
    const has = dept.categoryIds.includes(categoryId);
    const newCategoryIds = has
      ? dept.categoryIds.filter((id) => id !== categoryId)
      : [...dept.categoryIds, categoryId];
    try {
      await triggerAssignCategories({
        deptId: dept.id,
        payload: { categoryIds: newCategoryIds },
      });
      mutateDepts();
    } catch (e) {}
  };

  // Sync selectedDept with latest departments data
  const currentSelectedDept = selectedDept
    ? departments.find((d) => d.id === selectedDept.id) || null
    : null;

  const filteredCategories = categories;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <LayoutGrid className="h-5 w-5 text-accent" />
              {currentSelectedDept
                ? `${outletName} — ${currentSelectedDept.name}`
                : `${outletName} — Departments`}
            </DialogTitle>
          </DialogHeader>

          {isLoadingDepts || isLoadingCats ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !currentSelectedDept ? (
            /* Department List View */
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {departments.length} department{departments.length !== 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddingDept(true);
                    setDeptName("");
                  }}
                  disabled={isCreating}
                >
                  {isCreating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  <Plus className="h-4 w-4 mr-1" /> Add Department
                </Button>
              </div>

              {addingDept && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-accent bg-accent/5">
                  <Input
                    placeholder="Department name"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddDept()}
                    autoFocus
                    className="h-8"
                    disabled={isCreating}
                  />
                  <Button size="sm" onClick={handleAddDept} disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingDept(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {editingDept && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-accent bg-accent/5">
                  <Input
                    placeholder="Department name"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEditDept()}
                    autoFocus
                    className="h-8"
                    disabled={isUpdating}
                  />
                  <Button size="sm" onClick={handleEditDept} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingDept(null);
                      setDeptName("");
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {departments.map((dept) => {
                  return (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/50 transition-colors group"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedDept(dept);
                          setMenuSearch("");
                        }}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <UtensilsCrossed className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{dept.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {dept.categoryIds.length} assigned categor{dept.categoryIds.length !== 1 ? "ies" : "y"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditingDept(dept);
                            setDeptName(dept.name);
                            setAddingDept(false);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteTarget(dept)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                        <ChevronRight
                          className="h-4 w-4 text-muted-foreground cursor-pointer"
                          onClick={() => {
                            setSelectedDept(dept);
                            setMenuSearch("");
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {departments.length === 0 && !addingDept && (
                  <div className="text-center py-8">
                    <LayoutGrid className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No departments yet. Add one to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Department Detail — Category Assignment */
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDept(null)}
                  className="gap-1 text-muted-foreground"
                  disabled={isAssigning}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <Badge variant="secondary" className="text-xs">
                  {currentSelectedDept.categoryIds.length} categories assigned
                </Badge>
                {isAssigning && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-9 h-9"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  disabled={isAssigning}
                />
              </div>

              <div className="space-y-2">
                {filteredCategories.map((category) => {
                  const isCategoryAssigned = currentSelectedDept.categoryIds.includes(category.id);

                  return (
                    <div
                      key={category.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border cursor-pointer transition-colors ${
                        isCategoryAssigned ? "bg-accent/10" : "hover:bg-muted/50"
                      }`}
                      onClick={() => !isAssigning && toggleCategory(currentSelectedDept, category.id)}
                    >
                      <Checkbox
                        checked={isCategoryAssigned}
                        onCheckedChange={() => toggleCategory(currentSelectedDept, category.id)}
                        disabled={isAssigning}
                      />
                      <span className="text-sm font-medium flex-1">{category.name}</span>
                    </div>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No categories found
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? All category assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDept}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
