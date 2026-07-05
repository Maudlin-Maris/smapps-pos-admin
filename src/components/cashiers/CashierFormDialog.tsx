import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Pencil, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetOutlets } from "@/services/api/outlets";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { api } from "@/services/api/base";

export interface OutletAssignment {
  outletId: string;
  outletName: string;
  departments: { id: string; name: string }[];
}

export interface CashierFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  assignments: OutletAssignment[];
}

const emptyForm: CashierFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  assignments: [],
};

interface CashierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: CashierFormData;
  onSubmit: (data: CashierFormData) => void;
}

export default function CashierFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: CashierFormDialogProps) {
  const [form, setForm] = useState<CashierFormData>(emptyForm);
  // Map of outletId -> selected department ids
  const [outletDeptMap, setOutletDeptMap] = useState<Record<string, string[]>>(
    {},
  );

  const { data: outlets = [], isLoading: isLoadingOutlets } = useGetOutlets(
    open ? undefined : { shouldRetryOnError: false },
  );

  const [departmentsByOutlet, setDepartmentsByOutlet] = useState<
    Record<string, { id: string; name: string }[]>
  >({});
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  useEffect(() => {
    if (!open || outlets.length === 0) return;

    let isMounted = true;
    const fetchDepartments = async () => {
      setIsLoadingDepts(true);
      try {
        const results = await Promise.all(
          outlets.map(async (outlet) => {
            try {
              const res = await api.get<any[]>(
                API_ENDPOINTS.OUTLET_DEPARTMENTS(outlet.id),
              );
              return { outletId: outlet.id, depts: res.data };
            } catch (err) {
              console.error(
                `Failed to load departments for outlet ${outlet.id}`,
                err,
              );
              return { outletId: outlet.id, depts: [] };
            }
          }),
        );
        if (isMounted) {
          const map: Record<string, { id: string; name: string }[]> = {};
          results.forEach(({ outletId, depts }) => {
            map[outletId] = depts.map((d: any) => ({ id: d.id, name: d.name }));
          });
          setDepartmentsByOutlet(map);
        }
      } catch (err) {
        toast.error("Failed to load departments for some outlets");
      } finally {
        if (isMounted) {
          setIsLoadingDepts(false);
        }
      }
    };

    fetchDepartments();
    return () => {
      isMounted = false;
    };
  }, [open, outlets]);

  useEffect(() => {
    if (open) {
      const data = initialData || emptyForm;
      setForm(data);
      const map: Record<string, string[]> = {};
      data.assignments.forEach((a) => {
        map[a.outletId] = (a.departments ?? []).map((d) => d.id);
      });
      setOutletDeptMap(map);
    }
  }, [open, initialData]);

  const update = (key: keyof CashierFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedOutlets = useMemo(
    () => Object.keys(outletDeptMap),
    [outletDeptMap],
  );

  const toggleOutlet = (outletId: string, checked: boolean) => {
    setOutletDeptMap((prev) => {
      const next = { ...prev };
      if (checked) {
        // Pre-select all departments by default for convenience
        next[outletId] = (departmentsByOutlet[outletId] ?? []).map((d) => d.id);
      } else {
        delete next[outletId];
      }
      return next;
    });
  };

  const toggleDepartment = (
    outletId: string,
    deptId: string,
    checked: boolean,
  ) => {
    setOutletDeptMap((prev) => {
      const current = prev[outletId] ?? [];
      const next = checked
        ? Array.from(new Set([...current, deptId]))
        : current.filter((id) => id !== deptId);
      return { ...prev, [outletId]: next };
    });
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    if (form.phone.trim() && !/^\d{11}$/.test(form.phone.trim())) {
      toast.error("Phone number must be an 11-digit number (e.g., 08012345678)");
      return;
    }
    if (selectedOutlets.length === 0) {
      toast.error("Assign at least one outlet");
      return;
    }

    const assignments: OutletAssignment[] = [];
    for (const outletId of selectedOutlets) {
      const outlet = outlets.find((o) => o.id === outletId);
      if (!outlet) continue;
      const depts = departmentsByOutlet[outletId] ?? [];
      const selectedDeptIds = outletDeptMap[outletId] ?? [];
      if (depts.length > 0 && selectedDeptIds.length === 0) {
        toast.error(`Assign at least one department for ${outlet.name}`);
        return;
      }
      assignments.push({
        outletId,
        outletName: outlet.name,
        departments: depts.filter((d) => selectedDeptIds.includes(d.id)),
      });
    }

    onSubmit({ ...form, assignments });
    onOpenChange(false);
  };

  const isEdit = mode === "edit";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-full !max-w-none lg:!max-w-2xl p-0 flex flex-col overflow-hidden [&>button]:z-10"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-heading">
            {isEdit ? (
              <Pencil className="h-5 w-5 text-accent" />
            ) : (
              <UserPlus className="h-5 w-5 text-accent" />
            )}
            {isEdit ? "Edit Cashier" : "Add New Cashier"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashierEmail">Email</Label>
              <Input
                id="cashierEmail"
                type="email"
                placeholder="cashier@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashierPhone">Phone</Label>
              <Input
                id="cashierPhone"
                type="tel"
                placeholder="08012345678"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                A secure 4-digit PIN will be generated automatically when this
                cashier is created and emailed to them. You can regenerate it
                later from the cashier list.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-heading font-semibold text-foreground">
                Outlet & Department Assignment
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select outlets this cashier can access, then choose which
                departments at each outlet they handle.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-3">
                {isLoadingOutlets || isLoadingDepts ? (
                  <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading outlets and departments...</span>
                  </div>
                ) : outlets.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p>No outlets configured</p>
                  </div>
                ) : (
                  outlets.map((outlet) => {
                    const isChecked = selectedOutlets.includes(outlet.id);
                    const depts = departmentsByOutlet[outlet.id] ?? [];
                    const selectedDeptIds = outletDeptMap[outlet.id] ?? [];
                    return (
                      <div
                        key={outlet.id}
                        className={`rounded-lg border p-3 transition-colors ${isChecked ? "border-accent bg-accent/5" : "border-border"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`outlet-${outlet.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              toggleOutlet(outlet.id, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`outlet-${outlet.id}`}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {outlet.name}
                          </Label>
                          {isChecked && depts.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5"
                            >
                              {selectedDeptIds.length}/{depts.length} depts
                            </Badge>
                          )}
                        </div>

                        {isChecked && (
                          <div className="mt-3 pl-7">
                            {depts.length === 0 ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                <Building2 className="h-3 w-3" />
                                No departments configured for this outlet
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {depts.map((dept) => {
                                  const deptChecked = selectedDeptIds.includes(
                                    dept.id,
                                  );
                                  return (
                                    <div
                                      key={dept.id}
                                      className="flex items-center gap-2"
                                    >
                                      <Checkbox
                                        id={`dept-${outlet.id}-${dept.id}`}
                                        checked={deptChecked}
                                        onCheckedChange={(c) =>
                                          toggleDepartment(
                                            outlet.id,
                                            dept.id,
                                            c === true,
                                          )
                                        }
                                      />
                                      <Label
                                        htmlFor={`dept-${outlet.id}-${dept.id}`}
                                        className="text-xs cursor-pointer font-normal"
                                      >
                                        {dept.name}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoadingOutlets || isLoadingDepts}
            >
              {isEdit ? "Save Changes" : "Add Cashier"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
