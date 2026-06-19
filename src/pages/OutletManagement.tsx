import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Phone, Pencil, Power, Banknote, Store, LayoutGrid, Percent, Tag, Wallet, QrCode, Loader2 } from "lucide-react";
import OutletFormDialog, { type OutletFormData } from "@/components/outlets/OutletFormDialog";
import DepartmentManagerDialog from "@/components/outlets/DepartmentManagerDialog";
import FeeManagerDialog from "@/components/outlets/FeeManagerDialog";
import DiscountTipManagerDialog from "@/components/outlets/DiscountTipManagerDialog";
import PaymentMethodManagerDialog from "@/components/outlets/PaymentMethodManagerDialog";
import LocationManagerDialog from "@/components/outlets/LocationManagerDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { initialDepartments, type Department } from "@/data/departments";
import { type FeeFormData } from "@/components/fees/FeeFormDialog";
import { toast } from "sonner";
import { getBusinessType } from "@/data/businessTypes";

import {
  useGetOutlets,
  useCreateOutlet,
  useUpdateOutlet,
  useUpdateOutletStatus,
} from "@/services/api/outlets";
import type { CreateOutletPayload } from "@/lib/types/create-outlet-payload";
import type { UpdateOutletPayload } from "@/lib/types/update-outlet-payload";
import type { Outlet } from "@/lib/types/outlet";

export default function OutletManagement() {
  const { data: outlets = [], isLoading, mutate } = useGetOutlets();
  const { trigger: triggerCreate, isMutating: isCreating } = useCreateOutlet();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [deptDialogOutlet, setDeptDialogOutlet] = useState<Outlet | null>(null);
  const [feeDialogOutlet, setFeeDialogOutlet] = useState<Outlet | null>(null);
  const [discountTipOutlet, setDiscountTipOutlet] = useState<Outlet | null>(null);
  const [paymentMethodOutlet, setPaymentMethodOutlet] = useState<Outlet | null>(null);
  const [statusToggleOutlet, setStatusToggleOutlet] = useState<Outlet | null>(null);
  const [locationOutlet, setLocationOutlet] = useState<Outlet | null>(null);

  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateOutlet(editingOutlet?.id);
  const { trigger: triggerStatusUpdate, isMutating: isUpdatingStatus } = useUpdateOutletStatus(statusToggleOutlet?.id);

  const handleAdd = () => {
    setDialogMode("add");
    setEditingOutlet(null);
    setDialogOpen(true);
  };

  const handleEdit = (outlet: Outlet) => {
    setDialogMode("edit");
    setEditingOutlet(outlet);
    setDialogOpen(true);
  };

  const handleToggleStatus = (outlet: Outlet) => {
    setStatusToggleOutlet(outlet);
  };

  const confirmToggleStatus = async () => {
    if (!statusToggleOutlet) return;
    const newStatus = statusToggleOutlet.status === "open" ? "closed" : "open";
    try {
      await triggerStatusUpdate({ status: newStatus });
      toast.success(`${statusToggleOutlet.name} is now ${newStatus}`);
      mutate();
    } catch (err) {
      // Toast message shown by default inside the SWR mutation onError hook
    } finally {
      setStatusToggleOutlet(null);
    }
  };

  const handleSubmit = async (data: OutletFormData) => {
    if (dialogMode === "add") {
      const payload: CreateOutletPayload = {
        name: data.name,
        businessType: data.businessType || "restaurant",
        address: data.outletAddress || data.locationAddress || "",
        phone: data.phone,
        email: data.email || "",
        currency: data.currency || "NGN",
        status: "closed",
        orderSettings: {
          allowPaymentBeforeConfirmation: data.payBeforeOrder,
          allowPaymentAfterConfirmation: data.payAfterOrder,
          disableMobileOrdering: data.disableMobileOrder,
          restrictOrderMerging: data.restrictMerging,
          restrictOrderSettlement: data.restrictSettlement,
        },
        payoutInfo: {
          bank: data.bank,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          otpEmail: data.otpEmail,
        },
      };
      try {
        await triggerCreate(payload);
        toast.success(`Outlet "${data.name}" created successfully`);
        mutate();
        setDialogOpen(false);
      } catch (err) {
        // Handled
      }
    } else if (editingOutlet) {
      const payload: UpdateOutletPayload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        status: editingOutlet.status,
        orderSettings: {
          allowPaymentBeforeConfirmation: data.payBeforeOrder,
          allowPaymentAfterConfirmation: data.payAfterOrder,
          disableMobileOrdering: data.disableMobileOrder,
          restrictOrderMerging: data.restrictMerging,
          restrictOrderSettlement: data.restrictSettlement,
        },
        payoutInfo: {
          bank: data.bank,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          otpEmail: data.otpEmail,
        },
      };
      try {
        await triggerUpdate(payload);
        toast.success(`Outlet "${data.name}" updated successfully`);
        mutate();
        setDialogOpen(false);
      } catch (err) {
        // Handled
      }
    }
  };

  const getInitialData = (): Partial<OutletFormData> | undefined => {
    if (!editingOutlet) return undefined;
    return {
      name: editingOutlet.name,
      outletAddress: editingOutlet.address,
      locationAddress: editingOutlet.address,
      phone: editingOutlet.phone,
      email: editingOutlet.email,
      currency: editingOutlet.currency,
      businessType: editingOutlet.businessType,
      payBeforeOrder: editingOutlet.orderSettings?.allowPaymentBeforeConfirmation || false,
      payAfterOrder: editingOutlet.orderSettings?.allowPaymentAfterConfirmation || false,
      disableMobileOrder: editingOutlet.orderSettings?.disableMobileOrdering || false,
      restrictMerging: editingOutlet.orderSettings?.restrictOrderMerging || false,
      restrictSettlement: editingOutlet.orderSettings?.restrictOrderSettlement || false,
      bank: editingOutlet.payoutInfo?.bank || "",
      accountNumber: editingOutlet.payoutInfo?.accountNumber || "",
      accountName: editingOutlet.payoutInfo?.accountName || "",
      otpEmail: editingOutlet.payoutInfo?.otpEmail || "",
    };
  };

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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 space-y-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
                <div className="h-8 bg-muted rounded w-8" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded w-24" />
                  <div className="h-8 bg-muted rounded w-24" />
                </div>
                <div className="h-6 bg-muted rounded w-12" />
              </div>
            </Card>
          ))}
        </div>
      ) : outlets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 border border-dashed rounded-lg">
          <Store className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No outlets found. Add one to get started.</p>
        </div>
      ) : (
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
                    onClick={() => handleToggleStatus(outlet)}
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
                      {outlet.departmentCount ?? 0}
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
                      {outlet.feesCount ?? 0}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setPaymentMethodOutlet(outlet)}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Payment Methods
                  </Button>
                  {outlet.businessType === "restaurant" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setLocationOutlet(outlet)}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Locations & QR
                    </Button>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Staff</p>
                  <p className="text-lg font-heading font-bold">{outlet.staffCount ?? 0}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <OutletFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={getInitialData()}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {deptDialogOutlet && (
        <DepartmentManagerDialog
          open={!!deptDialogOutlet}
          onOpenChange={(open) => !open && setDeptDialogOutlet(null)}
          outletId={deptDialogOutlet.id}
          outletName={deptDialogOutlet.name}
          onUpdated={mutate}
        />
      )}

      {feeDialogOutlet && (
        <FeeManagerDialog
          open={!!feeDialogOutlet}
          onOpenChange={(open) => !open && setFeeDialogOutlet(null)}
          outletId={feeDialogOutlet.id}
          outletName={feeDialogOutlet.name}
          businessType={feeDialogOutlet.businessType}
          onUpdated={mutate}
        />
      )}

      {discountTipOutlet && (
        <DiscountTipManagerDialog
          open={!!discountTipOutlet}
          onOpenChange={(open) => !open && setDiscountTipOutlet(null)}
          outletId={discountTipOutlet.id}
          outletName={discountTipOutlet.name}
          onUpdated={mutate}
        />
      )}

      {paymentMethodOutlet && (
        <PaymentMethodManagerDialog
          open={!!paymentMethodOutlet}
          onOpenChange={(open) => !open && setPaymentMethodOutlet(null)}
          outletId={paymentMethodOutlet.id}
          outletName={paymentMethodOutlet.name}
          onUpdated={mutate}
        />
      )}

      {locationOutlet && (
        <LocationManagerDialog
          open={!!locationOutlet}
          onOpenChange={(open) => !open && setLocationOutlet(null)}
          outletId={locationOutlet.id}
          outletName={locationOutlet.name}
          onUpdated={mutate}
        />
      )}

      <AlertDialog open={!!statusToggleOutlet} onOpenChange={(o) => !o && setStatusToggleOutlet(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusToggleOutlet?.status === "open" ? "Close" : "Open"} {statusToggleOutlet?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusToggleOutlet?.status === "open"
                ? "Cashiers at this outlet will no longer be able to process new orders until it is reopened."
                : "Cashiers at this outlet will be able to log in and start processing orders."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus} disabled={isUpdatingStatus}>
              {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {statusToggleOutlet?.status === "open" ? "Close Outlet" : "Open Outlet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
