import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface FeeFormData {
  id?: string;
  outletId: string;
  name: string;
  serviceOption: "all" | "dine_in" | "takeaway";
  isFixed: boolean;
  chargeToCustomers: boolean;
  value: string;
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
  /** Show service option field only for dine-in capable businesses */
  showServiceOption?: boolean;
  outlets?: any[];
}

export default function FeeFormDialog({
  open, onOpenChange, mode, initialData, onSubmit, hideOutletSelector = false, showServiceOption = false, outlets = [],
}: FeeFormDialogProps) {
  const form = useForm<FeeFormData>({
    defaultValues: {
      outletId: "",
      name: "",
      serviceOption: "all",
      isFixed: false,
      chargeToCustomers: false,
      value: "",
      orderPeg: "",
      minimumFee: "",
      maximumFee: "",
    },
  });

  const isFixed = useWatch({ control: form.control, name: "isFixed" });

  useEffect(() => {
    if (open) {
      form.reset({
        outletId: initialData?.outletId ?? "",
        name: initialData?.name ?? "",
        serviceOption: initialData?.serviceOption ?? "all",
        isFixed: initialData?.isFixed ?? false,
        chargeToCustomers: initialData?.chargeToCustomers ?? false,
        value: initialData?.value ?? "",
        orderPeg: initialData?.orderPeg ?? "",
        minimumFee: initialData?.minimumFee ?? "",
        maximumFee: initialData?.maximumFee ?? "",
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = (data: FeeFormData) => {
    // Clear irrelevant fields based on isFixed
    if (data.isFixed) {
      data.value = "";
    } else {
      data.orderPeg = "";
      data.minimumFee = "";
      data.maximumFee = "";
    }
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

            {/* Service Option — only for restaurants/lounges */}
            {showServiceOption && (
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
            )}

            <FormField
              control={form.control}
              name="isFixed"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel>Fixed Amount</FormLabel>
                      <FormDescription className="text-xs">
                        {field.value
                          ? "A fixed fee amount applied based on order value thresholds"
                          : "A percentage-based fee/tax applied to the order total"}
                      </FormDescription>
                    </div>
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

            {/* Percentage value — shown when NOT fixed */}
            {!isFixed && (
              <FormField
                control={form.control}
                name="value"
                rules={{ required: "Value is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (%)</FormLabel>
                    <FormControl>
                      <NumericInput placeholder="e.g. 7.5" step={0.01} precision={2} {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Percentage of the order total
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Fixed fee fields — shown when IS fixed */}
            {isFixed && (
              <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Example: If order peg is 2,000, min fee is 500 and max fee is 1,000 — orders below 2,000 are charged 500 and orders at or above 2,000 are charged 1,000.
                </p>
                <FormField
                  control={form.control}
                  name="orderPeg"
                  rules={{ required: "Order peg is required for fixed fees" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Peg (Threshold)</FormLabel>
                      <FormControl>
                        <NumericInput placeholder="e.g. 2000" precision={2} min={0} {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Order amount threshold that determines which fee applies
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minimumFee"
                    rules={{ required: "Minimum fee is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Below Peg Fee</FormLabel>
                        <FormControl>
                          <NumericInput placeholder="e.g. 500" precision={2} min={0} {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Fee when order &lt; peg
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maximumFee"
                    rules={{ required: "Maximum fee is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>At/Above Peg Fee</FormLabel>
                        <FormControl>
                          <NumericInput placeholder="e.g. 1000" precision={2} min={0} {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Fee when order ≥ peg
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="chargeToCustomers"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Charge To Customers</FormLabel>
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
