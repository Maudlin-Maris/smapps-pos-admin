import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const availableOutlets = [
  { id: "outlet-1", name: "Downtown Flagship" },
  { id: "outlet-2", name: "Mall Branch" },
  { id: "outlet-3", name: "Airport Kiosk" },
  { id: "outlet-4", name: "Suburban Store" },
];

const departmentsByOutlet: Record<string, string[]> = {
  "outlet-1": ["Kitchen", "Bar", "Front of House", "Drive-Through"],
  "outlet-2": ["Sales Floor", "Checkout", "Customer Service", "Stock Room"],
  "outlet-3": ["Counter", "Lounge Service"],
  "outlet-4": ["Dispensary", "Front Desk", "Warehouse"],
};

export interface OutletAssignment {
  outletId: string;
  outletName: string;
  department: string;
}

export interface CashierFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pin: string;
  assignments: OutletAssignment[];
}

const emptyForm: CashierFormData = {
  firstName: "", lastName: "", email: "", phone: "", pin: "", assignments: [],
};

interface CashierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: CashierFormData;
  onSubmit: (data: CashierFormData) => void;
}

export default function CashierFormDialog({ open, onOpenChange, mode, initialData, onSubmit }: CashierFormDialogProps) {
  const [form, setForm] = useState<CashierFormData>(emptyForm);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const data = initialData || emptyForm;
      setForm(data);
      const outlets = data.assignments.map((a) => a.outletId);
      setSelectedOutlets(outlets);
      const deptMap: Record<string, string> = {};
      data.assignments.forEach((a) => { deptMap[a.outletId] = a.department; });
      setDepartmentMap(deptMap);
    }
  }, [open, initialData]);

  const update = (key: keyof CashierFormData, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleOutlet = (outletId: string, checked: boolean) => {
    if (checked) {
      setSelectedOutlets((prev) => [...prev, outletId]);
    } else {
      setSelectedOutlets((prev) => prev.filter((id) => id !== outletId));
      setDepartmentMap((prev) => { const next = { ...prev }; delete next[outletId]; return next; });
    }
  };

  const setDepartment = (outletId: string, dept: string) => { setDepartmentMap((prev) => ({ ...prev, [outletId]: dept })); };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error("First and last name are required"); return; }
    if (selectedOutlets.length === 0) { toast.error("Assign at least one outlet"); return; }
    const assignments: OutletAssignment[] = selectedOutlets.map((outletId) => ({
      outletId,
      outletName: availableOutlets.find((o) => o.id === outletId)?.name || "",
      department: departmentMap[outletId] || "",
    }));
    onSubmit({ ...form, assignments });
    onOpenChange(false);
  };

  const isEdit = mode === "edit";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-2xl p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-heading">
            {isEdit ? <Pencil className="h-5 w-5 text-accent" /> : <UserPlus className="h-5 w-5 text-accent" />}
            {isEdit ? "Edit Cashier" : "Add New Cashier"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="First name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Last name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashierEmail">Email</Label>
              <Input id="cashierEmail" type="email" placeholder="cashier@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashierPhone">Phone</Label>
              <Input id="cashierPhone" type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pin">Cashier PIN</Label>
              <Input id="pin" type="password" maxLength={6} placeholder="4-6 digit PIN" value={form.pin} onChange={(e) => update("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} />
              <p className="text-xs text-muted-foreground">Used for POS login and transactions</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-heading font-semibold text-foreground">Outlet & Department Assignment</h3>
            <p className="text-xs text-muted-foreground">Select one or more outlets, then assign a department for each.</p>
            <div className="space-y-3">
              {availableOutlets.map((outlet) => {
                const isChecked = selectedOutlets.includes(outlet.id);
                const departments = departmentsByOutlet[outlet.id] || [];
                return (
                  <div key={outlet.id} className={`rounded-lg border p-3 transition-colors ${isChecked ? "border-accent bg-accent/5" : "border-border"}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox id={`outlet-${outlet.id}`} checked={isChecked} onCheckedChange={(checked) => toggleOutlet(outlet.id, checked === true)} />
                      <Label htmlFor={`outlet-${outlet.id}`} className="text-sm font-medium cursor-pointer flex-1">{outlet.name}</Label>
                      {isChecked && departmentMap[outlet.id] && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          {departmentMap[outlet.id]}
                          <button onClick={() => setDepartment(outlet.id, "")} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </Badge>
                      )}
                    </div>
                    {isChecked && departments.length > 0 && (
                      <div className="mt-2 ml-7">
                        <Select value={departmentMap[outlet.id] || ""} onValueChange={(v) => setDepartment(outlet.id, v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select department" /></SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add Cashier"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
