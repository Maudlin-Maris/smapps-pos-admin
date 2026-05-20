import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import type { Department } from "@/data/departments";
import { sampleMenuItems, getCategoryMap, getDeptItemCount } from "@/data/departments";

interface DepartmentManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: number;
  outletName: string;
  departments: Department[];
  onUpdateDepartments: (departments: Department[]) => void;
}

export default function DepartmentManagerDialog({
  open,
  onOpenChange,
  outletId,
  outletName,
  departments,
  onUpdateDepartments,
}: DepartmentManagerDialogProps) {
  const outletDepts = departments.filter((d) => d.outletId === outletId);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [addingDept, setAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [menuSearch, setMenuSearch] = useState("");

  const categoryMap = getCategoryMap(sampleMenuItems);

  const handleAddDept = () => {
    if (!deptName.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (outletDepts.some((d) => d.name.toLowerCase() === deptName.trim().toLowerCase())) {
      toast.error("Department already exists");
      return;
    }
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: deptName.trim(),
      outletId,
      assignedCategories: [],
      assignedSubcategories: [],
    };
    onUpdateDepartments([...departments, newDept]);
    toast.success(`Department "${newDept.name}" added`);
    setDeptName("");
    setAddingDept(false);
  };

  const handleEditDept = () => {
    if (!editingDept || !deptName.trim()) return;
    onUpdateDepartments(
      departments.map((d) =>
        d.id === editingDept.id ? { ...d, name: deptName.trim() } : d
      )
    );
    toast.success(`Department renamed to "${deptName.trim()}"`);
    setEditingDept(null);
    setDeptName("");
    if (selectedDept?.id === editingDept.id) {
      setSelectedDept({ ...editingDept, name: deptName.trim() });
    }
  };

  const handleDeleteDept = () => {
    if (!deleteTarget) return;
    onUpdateDepartments(departments.filter((d) => d.id !== deleteTarget.id));
    toast.success(`Department "${deleteTarget.name}" deleted`);
    if (selectedDept?.id === deleteTarget.id) setSelectedDept(null);
    setDeleteTarget(null);
  };

  const toggleCategory = (deptId: string, category: string) => {
    onUpdateDepartments(
      departments.map((d) => {
        if (d.id !== deptId) return d;
        const has = d.assignedCategories.includes(category);
        const subcats = categoryMap[category] || [];
        const subcatKeys = subcats.map((s) => `${category}::${s}`);
        if (has) {
          // Remove category
          return {
            ...d,
            assignedCategories: d.assignedCategories.filter((c) => c !== category),
          };
        } else {
          // Add category, remove individual subcategories since whole category is selected
          return {
            ...d,
            assignedCategories: [...d.assignedCategories, category],
            assignedSubcategories: d.assignedSubcategories.filter(
              (s) => !subcatKeys.includes(s)
            ),
          };
        }
      })
    );
  };

  const toggleSubcategory = (deptId: string, category: string, subcategory: string) => {
    const key = `${category}::${subcategory}`;
    onUpdateDepartments(
      departments.map((d) => {
        if (d.id !== deptId) return d;
        // If full category is assigned, don't allow individual subcategory toggle
        if (d.assignedCategories.includes(category)) return d;
        const has = d.assignedSubcategories.includes(key);
        const newSubcats = has
          ? d.assignedSubcategories.filter((s) => s !== key)
          : [...d.assignedSubcategories, key];

        // Check if all subcategories are now selected → promote to full category
        const allSubs = categoryMap[category] || [];
        const selectedSubs = newSubcats.filter((s) => s.startsWith(`${category}::`));
        if (allSubs.length > 0 && selectedSubs.length === allSubs.length) {
          return {
            ...d,
            assignedCategories: [...d.assignedCategories, category],
            assignedSubcategories: newSubcats.filter((s) => !s.startsWith(`${category}::`)),
          };
        }

        return { ...d, assignedSubcategories: newSubcats };
      })
    );
  };

  const toggleExpanded = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // Sync selectedDept with latest departments data
  const currentSelectedDept = selectedDept
    ? departments.find((d) => d.id === selectedDept.id) || null
    : null;

  // Filter categories by search
  const allCategories = Object.keys(categoryMap).sort();
  const filteredCategories = menuSearch
    ? allCategories.filter((cat) => {
        const matchesCat = cat.toLowerCase().includes(menuSearch.toLowerCase());
        const matchesSub = categoryMap[cat].some((sub) =>
          sub.toLowerCase().includes(menuSearch.toLowerCase())
        );
        return matchesCat || matchesSub;
      })
    : allCategories;

  const getFilteredSubcategories = (category: string) => {
    if (!menuSearch) return categoryMap[category];
    const catMatches = category.toLowerCase().includes(menuSearch.toLowerCase());
    if (catMatches) return categoryMap[category];
    return categoryMap[category].filter((sub) =>
      sub.toLowerCase().includes(menuSearch.toLowerCase())
    );
  };

  const getItemCountForCategory = (category: string) =>
    sampleMenuItems.filter((m) => m.category === category).length;

  const getItemCountForSubcategory = (category: string, subcategory: string) =>
    sampleMenuItems.filter((m) => m.category === category && m.subcategory === subcategory).length;

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

          {!currentSelectedDept ? (
            /* Department List View */
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {outletDepts.length} department{outletDepts.length !== 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddingDept(true);
                    setDeptName("");
                  }}
                >
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
                  />
                  <Button size="sm" onClick={handleAddDept}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingDept(false)}
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
                  />
                  <Button size="sm" onClick={handleEditDept}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingDept(null);
                      setDeptName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {outletDepts.map((dept) => {
                  const itemCount = getDeptItemCount(dept, sampleMenuItems);
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
                          setExpandedCategories(new Set());
                        }}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <UtensilsCrossed className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{dept.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {itemCount} menu item{itemCount !== 1 ? "s" : ""}
                            {dept.assignedCategories.length > 0 && (
                              <span className="ml-1">
                                · {dept.assignedCategories.length} categor{dept.assignedCategories.length !== 1 ? "ies" : "y"}
                              </span>
                            )}
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
                            setExpandedCategories(new Set());
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {outletDepts.length === 0 && !addingDept && (
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
            /* Department Detail — Category / Subcategory Assignment */
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDept(null)}
                  className="gap-1 text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <Badge variant="secondary" className="text-xs">
                  {getDeptItemCount(currentSelectedDept, sampleMenuItems)} items covered
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories or subcategories..."
                  className="pl-9 h-9"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                {filteredCategories.map((category) => {
                  const subcategories = getFilteredSubcategories(category);
                  const isCategoryAssigned = currentSelectedDept.assignedCategories.includes(category);
                  const assignedSubCount = subcategories.filter((sub) =>
                    currentSelectedDept.assignedSubcategories.includes(`${category}::${sub}`)
                  ).length;
                  const isPartial = !isCategoryAssigned && assignedSubCount > 0;
                  const isExpanded = expandedCategories.has(category) || !!menuSearch;

                  return (
                    <div key={category} className="rounded-lg border border-border overflow-hidden">
                      {/* Category Header */}
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          isCategoryAssigned ? "bg-accent/10" : isPartial ? "bg-accent/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={isCategoryAssigned}
                          onCheckedChange={() => toggleCategory(currentSelectedDept.id, category)}
                        />
                        <div
                          className="flex items-center gap-2 flex-1"
                          onClick={() => toggleExpanded(category)}
                        >
                          <span className="text-sm font-medium">{category}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {getItemCountForCategory(category)} items
                          </Badge>
                          {isPartial && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-accent border-accent/30">
                              {assignedSubCount} sub selected
                            </Badge>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          onClick={() => toggleExpanded(category)}
                        />
                      </div>

                      {/* Subcategories */}
                      {isExpanded && subcategories.length > 0 && (
                        <div className="border-t border-border bg-muted/20">
                          {subcategories.map((sub) => {
                            const isSubAssigned =
                              isCategoryAssigned ||
                              currentSelectedDept.assignedSubcategories.includes(`${category}::${sub}`);
                            return (
                              <div
                                key={sub}
                                className={`flex items-center gap-3 px-3 py-2 pl-10 cursor-pointer transition-colors ${
                                  isSubAssigned ? "bg-accent/5" : "hover:bg-muted/30"
                                }`}
                                onClick={() => {
                                  if (!isCategoryAssigned) {
                                    toggleSubcategory(currentSelectedDept.id, category, sub);
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={isSubAssigned}
                                  disabled={isCategoryAssigned}
                                  onCheckedChange={() =>
                                    toggleSubcategory(currentSelectedDept.id, category, sub)
                                  }
                                />
                                <span className="text-sm">{sub}</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                                  {getItemCountForSubcategory(category, sub)} items
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDept}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
