import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Phone, Pencil, Power, Banknote, Store, LayoutGrid, Percent, Tag, Wallet } from "lucide-react";
import OutletFormDialog, { type OutletFormData } from "@/components/outlets/OutletFormDialog";
import DepartmentManagerDialog from "@/components/outlets/DepartmentManagerDialog";
import FeeManagerDialog from "@/components/outlets/FeeManagerDialog";
import DiscountTipManagerDialog from "@/components/outlets/DiscountTipManagerDialog";
import PaymentMethodManagerDialog from "@/components/outlets/PaymentMethodManagerDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { initialDepartments, type Department } from "@/data/departments";
import { type FeeFormData } from "@/components/fees/FeeFormDialog";
import { toast } from "sonner";

interface OutletData {
  id: number;
  name: string;
  address: string;
  phone: string;
  currency: string;
  businessType: string;
  status: "open" | "closed";
  staff: number;
  formData?: Partial<OutletFormData>;
}

import { getBusinessType } from "@/data/businessTypes";

const initialOutlets: OutletData[] = [
  { id: 1, name: "Downtown Flagship", address: "123 Main Street, Downtown", phone: "+1 (555) 123-4567", currency: "NGN", businessType: "restaurant", status: "open", staff: 8 },
  { id: 2, name: "Mall Branch", address: "456 Shopping Center Blvd, Level 2", phone: "+1 (555) 234-5678", currency: "NGN", businessType: "retail", status: "open", staff: 5 },
  { id: 3, name: "Airport Kiosk", address: "Terminal 3, Gate B12", phone: "+1 (555) 345-6789", currency: "USD", businessType: "restaurant", status: "open", staff: 3 },
  { id: 4, name: "Suburban Store", address: "789 Oak Avenue, Westside", phone: "+1 (555) 456-7890", currency: "GBP", businessType: "pharmacy", status: "closed", staff: 4 },
];

export default function OutletManagement() {
  const [outlets, setOutlets] = useState<OutletData[]>(initialOutlets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingOutlet, setEditingOutlet] = useState<OutletData | null>(null);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [deptDialogOutlet, setDeptDialogOutlet] = useState<OutletData | null>(null);
  const [fees, setFees] = useState<FeeFormData[]>([
    { id: 1, outletId: "1", name: "VAT", serviceOption: "all", isFixed: false, chargeToCustomers: true, value: "7.5", orderPeg: "", minimumFee: "", maximumFee: "" },
    { id: 2, outletId: "1", name: "Service Charge", serviceOption: "dine_in", isFixed: true, chargeToCustomers: true, value: "", orderPeg: "2000", minimumFee: "500", maximumFee: "1000" },
  ]);
  const [feeDialogOutlet, setFeeDialogOutlet] = useState<OutletData | null>(null);
  const [discountTipOutlet, setDiscountTipOutlet] = useState<OutletData | null>(null);
  const [paymentMethodOutlet, setPaymentMethodOutlet] = useState<OutletData | null>(null);
  const [statusToggleOutlet, setStatusToggleOutlet] = useState<OutletData | null>(null);

  const handleAdd = () => {
    setDialogMode("add");
    setEditingOutlet(null);
    setDialogOpen(true);
  };

  const handleEdit = (outlet: OutletData) => {
    setDialogMode("edit");
    setEditingOutlet(outlet);
    setDialogOpen(true);
  };

  const handleToggleStatus = (id: number) => {
    setOutlets((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const newStatus = o.status === "open" ? "closed" : "open";
        toast.success(`${o.name} is now ${newStatus}`);
        return { ...o, status: newStatus };
      })
    );
  };

  const handleSubmit = (data: OutletFormData) => {
    if (dialogMode === "add") {
      const newOutlet: OutletData = {
        id: Date.now(),
        name: data.name,
        address: data.outletAddress || data.locationAddress,
        phone: data.phone,
        currency: data.currency || "NGN",
        businessType: data.businessType || "restaurant",
        status: "closed",
        staff: 0,
        formData: data,
      };
      setOutlets((prev) => [...prev, newOutlet]);
      toast.success(`Outlet "${data.name}" created successfully`);
    } else if (editingOutlet) {
      setOutlets((prev) =>
        prev.map((o) =>
          o.id === editingOutlet.id
            ? { ...o, name: data.name, address: data.outletAddress || data.locationAddress || o.address, phone: data.phone || o.phone, currency: data.currency || o.currency, businessType: data.businessType || o.businessType, formData: data }
            : o
        )
      );
      toast.success(`Outlet "${data.name}" updated successfully`);
    }
  };

  const getInitialData = (): Partial<OutletFormData> | undefined => {
    if (!editingOutlet) return undefined;
    return {
      name: editingOutlet.name,
      outletAddress: editingOutlet.address,
      phone: editingOutlet.phone,
      ...editingOutlet.formData,
    };
  };

  const getDeptCount = (outletId: number) =>
    departments.filter((d) => d.outletId === outletId).length;

  const getFeeCount = (outletId: number) =>
    fees.filter((f) => f.outletId === String(outletId)).length;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Outlets</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your business locations</p>
        </div>
        <Button size="sm" className="w-fit" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Outlet
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {outlets.map((outlet) => (
          <Card key={outlet.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-heading font-semibold">{outlet.name}</h3>
                <Badge
                  variant="secondary"
                  className={`mt-1 text-xs capitalize ${
                    outlet.status === "open"
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {outlet.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={outlet.status === "open" ? "Close outlet" : "Open outlet"}
                  onClick={() => handleToggleStatus(outlet.id)}
                >
                  <Power className={`h-4 w-4 ${outlet.status === "open" ? "text-success" : "text-muted-foreground"}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Edit outlet"
                  onClick={() => handleEdit(outlet)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{outlet.address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{outlet.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Banknote className="h-3.5 w-3.5 shrink-0" />
                <span>{outlet.currency}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="h-3.5 w-3.5 shrink-0" />
                <span>{getBusinessType(outlet.businessType).label}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setDeptDialogOutlet(outlet)}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Departments
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                    {getDeptCount(outlet.id)}
                  </Badge>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setFeeDialogOutlet(outlet)}
                >
                  <Percent className="h-3.5 w-3.5" />
                  Fees & Taxes
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                    {getFeeCount(outlet.id)}
                  </Badge>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setDiscountTipOutlet(outlet)}
                >
                  <Tag className="h-3.5 w-3.5" />
                  Discounts & Tips
                </Button>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Staff</p>
                <p className="text-lg font-heading font-bold">{outlet.staff}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <OutletFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={getInitialData()}
        onSubmit={handleSubmit}
      />

      {deptDialogOutlet && (
        <DepartmentManagerDialog
          open={!!deptDialogOutlet}
          onOpenChange={(open) => !open && setDeptDialogOutlet(null)}
          outletId={deptDialogOutlet.id}
          outletName={deptDialogOutlet.name}
          departments={departments}
          onUpdateDepartments={setDepartments}
        />
      )}

      {feeDialogOutlet && (
        <FeeManagerDialog
          open={!!feeDialogOutlet}
          onOpenChange={(open) => !open && setFeeDialogOutlet(null)}
          outletId={feeDialogOutlet.id}
          outletName={feeDialogOutlet.name}
          businessType={feeDialogOutlet.businessType}
          fees={fees}
          onUpdateFees={setFees}
        />
      )}

      {discountTipOutlet && (
        <DiscountTipManagerDialog
          open={!!discountTipOutlet}
          onOpenChange={(open) => !open && setDiscountTipOutlet(null)}
          outletId={discountTipOutlet.id}
          outletName={discountTipOutlet.name}
        />
      )}
    </div>
  );
}
