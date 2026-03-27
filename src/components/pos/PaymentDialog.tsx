import { useState, useMemo, useCallback } from "react";
import { usePOS } from "@/contexts/POSContext";
import { type OrderType, type PaymentMethod, posDiscounts, posLocations, getOrderTypesForBusiness, type POSDiscount } from "@/data/posData";
import { getFeatures } from "@/data/businessTypes";
import { formatNaira } from "@/lib/currency";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, Banknote, Smartphone, ArrowRightLeft, Clock, Printer,
  CheckCircle2, SplitSquareHorizontal, ArrowLeft, Percent, Tag, MapPin,
  Heart, Search
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  existingOrderId?: string;
}

type Step = "type" | "discount" | "payment" | "split" | "complete";

export default function PaymentDialog({ open, onClose, existingOrderId }: Props) {
  const { cartTotal, cart, createOrder, addPayment, orders, currentOutlet } = usePOS();
  const [step, setStep] = useState<Step>("type");
  const allowedTypes = currentOutlet ? getOrderTypesForBusiness(currentOutlet.businessType) : [];
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>(allowedTypes[0]?.id || "walk_in");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [splitMode, setSplitMode] = useState<"equal" | "custom" | null>(null);
  const [splitCount, setSplitCount] = useState(2);
  const [customAmounts, setCustomAmounts] = useState<{ method: PaymentMethod; amount: string }[]>([]);
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: string; total: number } | null>(null);
  const [payNow, setPayNow] = useState(true);

  // Discount state
  const [selectedDiscount, setSelectedDiscount] = useState<POSDiscount | null>(null);
  const [customDiscountAmount, setCustomDiscountAmount] = useState("");
  const [customDiscountType, setCustomDiscountType] = useState<"percentage" | "fixed">("fixed");

  // Tip state
  const [tipAmount, setTipAmount] = useState("");
  const [tipPreset, setTipPreset] = useState<number | null>(null);

  const existingOrder = existingOrderId ? orders.find(o => o.id === existingOrderId) : null;
  const subtotal = existingOrder ? (existingOrder.totalAmount - existingOrder.paidAmount) : cartTotal;

  const features = currentOutlet ? getFeatures(currentOutlet.businessType) : null;
  const allowedOrderTypes = allowedTypes;
  const outletLocations = currentOutlet ? posLocations.filter(l => l.outletId === currentOutlet.id) : [];
  const showLocationPicker = features?.hasDineIn && selectedOrderType === "dine_in";

  // Calculate discount
  const discountAmount = useMemo(() => {
    if (selectedDiscount) {
      return selectedDiscount.type === "percentage"
        ? Math.round(subtotal * selectedDiscount.value / 100)
        : Math.min(selectedDiscount.value, subtotal);
    }
    if (customDiscountAmount) {
      const val = parseFloat(customDiscountAmount) || 0;
      return customDiscountType === "percentage"
        ? Math.round(subtotal * val / 100)
        : Math.min(val, subtotal);
    }
    return 0;
  }, [selectedDiscount, customDiscountAmount, customDiscountType, subtotal]);

  const discountName = selectedDiscount?.name || (customDiscountAmount ? "Custom Discount" : undefined);

  // Calculate tip
  const tipValue = useMemo(() => {
    if (tipPreset !== null) return Math.round(subtotal * tipPreset / 100);
    return parseFloat(tipAmount) || 0;
  }, [tipPreset, tipAmount, subtotal]);

  const total = subtotal - discountAmount + tipValue;

  // Set default order type when outlet changes
  useState(() => {
    if (allowedOrderTypes.length > 0 && !allowedOrderTypes.find(t => t.id === selectedOrderType)) {
      setSelectedOrderType(allowedOrderTypes[0].id);
    }
  });

  const reset = () => {
    setStep("type");
    setSelectedLocation("");
    setCustomerName("");
    setPaymentMethod("cash");
    setSplitMode(null);
    setSplitCount(2);
    setCustomAmounts([]);
    setCompletedOrder(null);
    setPayNow(true);
    setSelectedDiscount(null);
    setCustomDiscountAmount("");
    setTipAmount("");
    setTipPreset(null);
    if (allowedOrderTypes.length > 0) {
      setSelectedOrderType(allowedOrderTypes[0].id);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  const goBack = (to: Step) => setStep(to);

  const handleProceedToDiscount = () => {
    setStep("discount");
  };

  const handleProceedToPayment = () => {
    if (!payNow) {
      const locationName = selectedLocation || undefined;
      const order = createOrder(selectedOrderType, locationName, customerName || undefined, false, tipValue || undefined, discountAmount || undefined, discountName);
      setCompletedOrder({ orderNumber: order.orderNumber, total: order.totalAmount });
      setStep("complete");
      return;
    }
    setStep("payment");
  };

  const handleFullPayment = () => {
    if (existingOrderId) {
      addPayment(existingOrderId, { method: paymentMethod, amount: total });
      setCompletedOrder({ orderNumber: existingOrder?.orderNumber || "", total });
    } else {
      const locationName = selectedLocation || undefined;
      const order = createOrder(selectedOrderType, locationName, customerName || undefined, true, tipValue || undefined, discountAmount || undefined, discountName);
      addPayment(order.id, { method: paymentMethod, amount: total });
      setCompletedOrder({ orderNumber: order.orderNumber, total });
    }
    setStep("complete");
  };

  const handleSplitPayment = () => {
    if (customAmounts.length === 0) return;
    if (existingOrderId) {
      customAmounts.forEach(ca => {
        const amt = parseFloat(ca.amount) || 0;
        if (amt > 0) addPayment(existingOrderId, { method: ca.method, amount: amt });
      });
      setCompletedOrder({ orderNumber: existingOrder?.orderNumber || "", total });
    } else {
      const locationName = selectedLocation || undefined;
      const order = createOrder(selectedOrderType, locationName, customerName || undefined, true, tipValue || undefined, discountAmount || undefined, discountName);
      customAmounts.forEach(ca => {
        const amt = parseFloat(ca.amount) || 0;
        if (amt > 0) addPayment(order.id, { method: ca.method, amount: amt });
      });
      setCompletedOrder({ orderNumber: order.orderNumber, total });
    }
    setStep("complete");
  };

  const initSplit = () => {
    setCustomAmounts([
      { method: "cash", amount: "" },
      { method: "card", amount: "" },
    ]);
    setStep("split");
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: "cash", label: "Cash", icon: <Banknote className="w-5 h-5" /> },
    { id: "card", label: "Card", icon: <CreditCard className="w-5 h-5" /> },
    { id: "mobile", label: "Mobile", icon: <Smartphone className="w-5 h-5" /> },
    { id: "transfer", label: "Transfer", icon: <ArrowRightLeft className="w-5 h-5" /> },
  ];

  const tipPresets = [5, 10, 15, 20];

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {/* ===== STEP: ORDER TYPE ===== */}
        {step === "type" && !existingOrderId && (
          <>
            <DialogHeader>
              <DialogTitle>New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Order type */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Order Type</p>
                <div className={`grid gap-2 ${allowedOrderTypes.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {allowedOrderTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => { setSelectedOrderType(type.id); setSelectedLocation(""); }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedOrderType === type.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location picker for dine-in */}
              {showLocationPicker && outletLocations.length > 0 && (() => {
                const filtered = locationSearch
                  ? outletLocations.filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase()))
                  : outletLocations;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <label className="text-sm font-medium">Select Location</label>
                      </div>
                      <span className="text-xs text-muted-foreground">{outletLocations.length} locations</span>
                    </div>
                    {outletLocations.length > 12 && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          value={locationSearch}
                          onChange={e => setLocationSearch(e.target.value)}
                          placeholder="Search tables, rooms..."
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                    )}
                    <ScrollArea className="max-h-40">
                      {filtered.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">No locations match "{locationSearch}"</p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                          {filtered.map(loc => (
                            <button
                              key={loc.id}
                              onClick={() => setSelectedLocation(loc.name)}
                              className={`p-2 rounded-lg border text-xs font-medium text-center transition-all truncate ${
                                selectedLocation === loc.name ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                              }`}
                              title={loc.name}
                            >
                              {loc.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name (optional)</label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" />
              </div>

              {/* Pay now / later */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPayNow(true)}
                  className={`p-3 rounded-xl border text-center transition-all ${payNow ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"}`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <span className="text-sm font-medium">Pay Now</span>
                </button>
                <button
                  onClick={() => setPayNow(false)}
                  className={`p-3 rounded-xl border text-center transition-all ${!payNow ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"}`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-sm font-medium">Pay Later</span>
                </button>
              </div>

              <Button onClick={handleProceedToDiscount} className="w-full h-11">
                Continue
              </Button>
            </div>
          </>
        )}

        {/* ===== STEP: DISCOUNT & TIP ===== */}
        {step === "discount" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => goBack("type")}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Discount & Tip</DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {/* Order summary */}
              <div className="text-center p-3 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-bold text-foreground">{formatNaira(subtotal)}</p>
              </div>

              {/* Discounts */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Apply Discount</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {posDiscounts.map(d => (
                    <button
                      key={d.id}
                      onClick={() => { setSelectedDiscount(selectedDiscount?.id === d.id ? null : d); setCustomDiscountAmount(""); }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        selectedDiscount?.id === d.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-xs font-medium block">{d.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.type === "percentage" ? `${d.value}% off` : formatNaira(d.value)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom discount */}
                <div className="flex gap-2 items-center pt-1">
                  <select
                    value={customDiscountType}
                    onChange={e => setCustomDiscountType(e.target.value as "percentage" | "fixed")}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="fixed">₦ Amount</option>
                    <option value="percentage">% Percent</option>
                  </select>
                  <Input
                    type="number"
                    value={customDiscountAmount}
                    onChange={e => { setCustomDiscountAmount(e.target.value); setSelectedDiscount(null); }}
                    placeholder="Custom discount"
                    className="h-9"
                  />
                </div>
                {discountAmount > 0 && (
                  <p className="text-xs text-[hsl(var(--success))] font-medium">
                    Discount: -{formatNaira(discountAmount)}
                  </p>
                )}
              </div>

              {/* Tips */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Add Tip</p>
                </div>
                <div className="flex gap-1.5">
                  {tipPresets.map(pct => (
                    <button
                      key={pct}
                      onClick={() => { setTipPreset(tipPreset === pct ? null : pct); setTipAmount(""); }}
                      className={`flex-1 p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                        tipPreset === pct ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={tipAmount}
                  onChange={e => { setTipAmount(e.target.value); setTipPreset(null); }}
                  placeholder="Custom tip amount (₦)"
                  className="h-9"
                />
                {tipValue > 0 && (
                  <p className="text-xs text-primary font-medium">Tip: +{formatNaira(tipValue)}</p>
                )}
              </div>

              {/* Total breakdown */}
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-[hsl(var(--success))]">
                    <span>Discount ({discountName})</span>
                    <span>-{formatNaira(discountAmount)}</span>
                  </div>
                )}
                {tipValue > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Tip</span>
                    <span>+{formatNaira(tipValue)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>
              </div>

              <Button onClick={handleProceedToPayment} className="w-full h-11">
                {payNow ? `Pay ${formatNaira(total)}` : "Create Order"}
              </Button>
            </div>
          </>
        )}

        {/* ===== STEP: PAYMENT ===== */}
        {(step === "payment" || (step === "type" && existingOrderId)) && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {!existingOrderId && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => goBack("discount")}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <DialogTitle>
                  {existingOrderId ? `Pay ${existingOrder?.orderNumber}` : "Payment"}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="text-3xl font-bold text-foreground">{formatNaira(total)}</p>
                {discountAmount > 0 && (
                  <p className="text-xs text-[hsl(var(--success))] mt-1">Discount applied: -{formatNaira(discountAmount)}</p>
                )}
                {tipValue > 0 && (
                  <p className="text-xs text-primary mt-0.5">Includes tip: {formatNaira(tipValue)}</p>
                )}
              </div>

              <p className="text-sm font-medium">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                      paymentMethod === pm.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {pm.icon}
                    <span className="text-sm font-medium">{pm.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleFullPayment} className="h-11">
                  Full Payment
                </Button>
                <Button variant="outline" onClick={initSplit} className="h-11">
                  <SplitSquareHorizontal className="w-4 h-4 mr-1" />
                  Split
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ===== STEP: SPLIT ===== */}
        {step === "split" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => goBack("payment")}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Split Payment</DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-3 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{formatNaira(total)}</span></p>
              </div>

              {/* Split equally shortcut */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">Split equally between</label>
                <Input type="number" min={2} max={10} value={splitCount} onChange={e => {
                  const n = Math.max(2, Math.min(10, parseInt(e.target.value) || 2));
                  setSplitCount(n);
                  const perPerson = Math.floor(total / n);
                  const remainder = total - perPerson * n;
                  setCustomAmounts(Array.from({ length: n }, (_, i) => ({
                    method: "cash" as PaymentMethod,
                    amount: (i === n - 1 ? perPerson + remainder : perPerson).toString()
                  })));
                }} className="w-20 h-8" />
                <span className="text-sm text-muted-foreground">people</span>
              </div>

              {/* Split entries */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Payment splits</p>
                {customAmounts.map((ca, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <select
                      value={ca.method}
                      onChange={e => {
                        const next = [...customAmounts];
                        next[i] = { ...next[i], method: e.target.value as PaymentMethod };
                        setCustomAmounts(next);
                      }}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.label}</option>)}
                    </select>
                    <Input
                      type="number"
                      step="1"
                      value={ca.amount}
                      onChange={e => {
                        const next = [...customAmounts];
                        next[i] = { ...next[i], amount: e.target.value };
                        setCustomAmounts(next);
                      }}
                      placeholder="Amount"
                      className="h-9"
                    />
                    {customAmounts.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setCustomAmounts(prev => prev.filter((_, j) => j !== i))}>×</Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setCustomAmounts(prev => [...prev, { method: "cash", amount: "" }])}>
                  + Add Split
                </Button>
              </div>

              {(() => {
                const splitTotal = customAmounts.reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0);
                const remaining = total - splitTotal;
                return (
                  <div className={`text-sm ${Math.abs(remaining) < 1 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {Math.abs(remaining) < 1 ? "✓ Amounts match" : remaining > 0 ? `${formatNaira(remaining)} remaining` : `${formatNaira(Math.abs(remaining))} over`}
                  </div>
                );
              })()}

              <Button
                onClick={handleSplitPayment}
                disabled={Math.abs(total - customAmounts.reduce((s, ca) => s + (parseFloat(ca.amount) || 0), 0)) > 1}
                className="w-full h-11"
              >
                Confirm Split Payment
              </Button>
            </div>
          </>
        )}

        {/* ===== STEP: COMPLETE ===== */}
        {step === "complete" && completedOrder && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--success))]/10">
              <CheckCircle2 className="w-8 h-8 text-[hsl(var(--success))]" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {payNow || existingOrderId ? "Payment Complete!" : "Order Created!"}
            </h3>
            <p className="text-muted-foreground">
              Order {completedOrder.orderNumber} · {formatNaira(completedOrder.total)}
            </p>
            {tipValue > 0 && (
              <p className="text-sm text-primary">Tip: {formatNaira(tipValue)}</p>
            )}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print Receipt
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
