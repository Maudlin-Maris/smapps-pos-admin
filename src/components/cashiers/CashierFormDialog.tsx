import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";

const availableOutlets = [
  { id: "outlet-1", name: "Downtown Flagship" },
  { id: "outlet-2", name: "Mall Branch" },
  { id: "outlet-3", name: "Airport Kiosk" },
  { id: "outlet-4", name: "Suburban Store" },
];

export interface OutletAssignment {
  outletId: string;
  outletName: string;
}

export interface CashierFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  assignments: OutletAssignment[];
}

const emptyForm: CashierFormData = {
  firstName: "", lastName: "", email: "", phone: "", assignments: [],
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

  useEffect(() => {
    if (open) {
      const data = initialData || emptyForm;
      setForm(data);
      setSelectedOutlets(data.assignments.map((a) => a.outletId));
    }
  }, [open, initialData]);

  const update = (key: keyof CashierFormData, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleOutlet = (outletId: string, checked: boolean) => {
    if (checked) {
      setSelectedOutlets((prev) => [...prev, outletId]);
    } else {
      setSelectedOutlets((prev) => prev.filter((id) => id !== outletId));
    }
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error("First and last name are required"); return; }
    if (selectedOutlets.length === 0) { toast.error("Assign at least one outlet"); return; }
    const assignments: OutletAssignment[] = selectedOutlets.map((outletId) => ({
      outletId,
      outletName: availableOutlets.find((o) => o.id === outletId)?.name || "",
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
            <div className="space-y-2 sm:col-span-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                A secure 4-digit PIN will be generated automatically when this cashier is created and emailed to them. You can regenerate it later from the cashier list.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-heading font-semibold text-foreground">Outlet Assignment</h3>
            <p className="text-xs text-muted-foreground">Select one or more outlets this cashier can access.</p>
            <div className="space-y-3">
              {availableOutlets.map((outlet) => {
                const isChecked = selectedOutlets.includes(outlet.id);
                return (
                  <div key={outlet.id} className={`rounded-lg border p-3 transition-colors ${isChecked ? "border-accent bg-accent/5" : "border-border"}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox id={`outlet-${outlet.id}`} checked={isChecked} onCheckedChange={(checked) => toggleOutlet(outlet.id, checked === true)} />
                      <Label htmlFor={`outlet-${outlet.id}`} className="text-sm font-medium cursor-pointer flex-1">{outlet.name}</Label>
                    </div>
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
