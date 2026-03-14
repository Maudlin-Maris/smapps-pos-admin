import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { outlets } from "@/data/outlets";

export interface FeeFormData {
  id?: number;
  outletId: string;
  name: string;
  serviceOption: "all" | "dine_in" | "takeaway";
  isFixed: boolean;
  chargeToCustomers: boolean;
  orderPeg: string;
  minimumFee: string;
  maximumFee: string;
}

interface FeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: Partial<FeeFormData>;
  onSubmit: (data: FeeFormData) => void;
  hideOutletSelector?: boolean;
}

export default function FeeFormDialog({
  open, onOpenChange, mode, initialData, onSubmit, hideOutletSelector = false,
}: FeeFormDialogProps) {
  const form = useForm<FeeFormData>({
    defaultValues: {
      outletId: "",
      name: "",
      serviceOption: "all",
      isFixed: false,
      chargeToCustomers: false,
      orderPeg: "",
      minimumFee: "",
      maximumFee: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        outletId: initialData?.outletId ?? "",
        name: initialData?.name ?? "",
        serviceOption: initialData?.serviceOption ?? "all",
        isFixed: initialData?.isFixed ?? false,
        chargeToCustomers: initialData?.chargeToCustomers ?? false,
        orderPeg: initialData?.orderPeg ?? "",
        minimumFee: initialData?.minimumFee ?? "",
        maximumFee: initialData?.maximumFee ?? "",
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = (data: FeeFormData) => {
    onSubmit({ ...data, id: initialData?.id });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Fee / Tax" : "Edit Fee / Tax"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Create a new fee or tax." : "Update the fee or tax details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Outlet — only shown when not embedded in outlet context */}
            {!hideOutletSelector && (
              <FormField
                control={form.control}
                name="outletId"
                rules={{ required: "Please select an outlet" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outlet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose outlet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {outlets.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. VAT, Service Charge" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Option Applied</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="dine_in">Dine-In Only</SelectItem>
                      <SelectItem value="takeaway">Takeaway Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFixed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Is Fixed?</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "yes")}
                    value={field.value ? "yes" : "no"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chargeToCustomers"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Charge To Customers?</FormLabel>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">{field.value ? "Yes" : "No"}</Label>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderPeg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Peg</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minimumFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Fee</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maximumFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Fee</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === "add" ? "Add Fee" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
