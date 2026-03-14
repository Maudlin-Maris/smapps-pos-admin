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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { sampleMenuItems } from "@/data/departments";
import type { MenuItem } from "@/components/menu/MenuItemForm";

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
      menuItemIds: [],
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

  const toggleMenuItem = (deptId: string, itemId: string) => {
    onUpdateDepartments(
      departments.map((d) => {
        if (d.id !== deptId) return d;
        const has = d.menuItemIds.includes(itemId);
        return {
          ...d,
          menuItemIds: has
            ? d.menuItemIds.filter((id) => id !== itemId)
            : [...d.menuItemIds, itemId],
        };
      })
    );
    // Update selectedDept to reflect changes
    setSelectedDept((prev) => {
      if (!prev || prev.id !== deptId) return prev;
      const has = prev.menuItemIds.includes(itemId);
      return {
        ...prev,
        menuItemIds: has
          ? prev.menuItemIds.filter((id) => id !== itemId)
          : [...prev.menuItemIds, itemId],
      };
    });
  };

  const getMenuItem = (id: string): MenuItem | undefined =>
    sampleMenuItems.find((m) => m.id === id);

  const filteredMenuItems = sampleMenuItems.filter((m) =>
    m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  // Sync selectedDept with latest departments data
  const currentSelectedDept = selectedDept
    ? departments.find((d) => d.id === selectedDept.id) || null
    : null;

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
                {outletDepts.map((dept) => (
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
                          {dept.menuItemIds.length} menu item
                          {dept.menuItemIds.length !== 1 ? "s" : ""}
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
                ))}

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
            /* Department Detail — Menu Items */
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
                  {currentSelectedDept.menuItemIds.length} assigned
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  className="pl-9 h-9"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-xs">Item</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs text-right">Price</TableHead>
                      <TableHead className="text-xs text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMenuItems.map((item) => {
                      const isAssigned =
                        currentSelectedDept.menuItemIds.includes(item.id);
                      return (
                        <TableRow
                          key={item.id}
                          className={`cursor-pointer ${isAssigned ? "bg-accent/5" : ""}`}
                          onClick={() =>
                            toggleMenuItem(currentSelectedDept.id, item.id)
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={() =>
                                toggleMenuItem(currentSelectedDept.id, item.id)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-right tabular-nums">
                            ₦{item.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] capitalize ${
                                item.status === "active"
                                  ? "bg-success/10 text-success"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredMenuItems.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-sm text-muted-foreground"
                        >
                          No menu items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
              ? Menu items will be unassigned from this department.
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
