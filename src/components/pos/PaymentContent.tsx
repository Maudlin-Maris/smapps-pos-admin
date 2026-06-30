import { useState, useMemo, useCallback, useEffect } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Checkbox } from "@/components/ui/checkbox";
import { type OrderType, type PaymentMethod, posLocations, getOrderTypesForBusiness, type POSDiscount, type AppliedFee } from "@/data/posData";
import { getOutletDiscountTipConfig } from "@/data/outletDiscountTips";
import { getOutletPaymentMethods } from "@/data/outletPaymentMethods";
import { type LoyaltyRedemption } from "@/data/loyaltyData";
import { getFeatures, getBusinessType } from "@/data/businessTypes";
import { formatNaira } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CreditCard, Banknote, Smartphone, ArrowRightLeft, Clock, Printer,
  CheckCircle2, SplitSquareHorizontal, ArrowLeft, Percent, Tag, MapPin,
  Heart, Search, ChefHat, ListChecks, DollarSign, Minus, Plus, ChevronLeft
} from "lucide-react";
import PrintReceiptDialog from "./PrintReceiptDialog";
import LoyaltyRedemptionPanel from "./LoyaltyRedemptionPanel";

interface Props {
  existingOrderId?: string;
  onClose: () => void;
  onBackToOrder?: () => void;
}

type Step = "type" | "discount" | "payment" | "split" | "split-choice" | "split-items" | "partial" | "complete";

export default function PaymentContent({ existingOrderId, onClose, onBackToOrder }: Props) {
  const { cartTotal, cart, createOrder, addPayment, updateOrderTotals, orders, currentOutlet } = usePOS();
  const [step, setStep] = useState<Step>(existingOrderId ? "discount" : "type");
  const allowedTypes = currentOutlet ? getOrderTypesForBusiness(currentOutlet.businessType) : [];
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>(allowedTypes[0]?.id || "walk_in");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const customerName = [customerFirstName.trim(), customerLastName.trim()].filter(Boolean).join(" ");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [splitMode, setSplitMode] = useState<"equal" | "custom" | null>(null);
  const [splitCount, setSplitCount] = useState(2);
  const [customAmounts, setCustomAmounts] = useState<{ method: string; amount: string }[]>([]);
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: string; total: number; id: string } | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [payNow, setPayNow] = useState(true);

  // Discount state
  const [selectedDiscount, setSelectedDiscount] = useState<POSDiscount | null>(null);
  const [customDiscountAmount, setCustomDiscountAmount] = useState("");
  const [customDiscountType, setCustomDiscountType] = useState<"percentage" | "fixed">("fixed");

  // Tip state
  const [tipAmount, setTipAmount] = useState("");
  const [tipPreset, setTipPreset] = useState<number | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");

  // Split by items state
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; qty: number }[]>([]);
  const [splitItemPaymentMethod, setSplitItemPaymentMethod] = useState<string>("");

  // Partial payment state
  const [partialAmount, setPartialAmount] = useState("");
  const [partialPaymentMethod, setPartialPaymentMethod] = useState<string>("");

  // Loyalty state
  const [loyaltyRedemption, setLoyaltyRedemption] = useState<LoyaltyRedemption | null>(null);

  const existingOrder = existingOrderId ? orders.find(o => o.id === existingOrderId) : null;
  // For existing orders, subtotal = raw items sum (so discount/fees/tip/loyalty can be edited without double counting).
  // For new orders, subtotal = current cart total.
  const subtotal = existingOrder
    ? existingOrder.items.reduce((s, i) => s + i.totalPrice, 0)
    : cartTotal;

  // Prefilled discount label from the existing order (cleared when cashier edits the discount)
  const [prefilledDiscountName, setPrefilledDiscountName] = useState<string | undefined>(undefined);
  const [prefilledFromOrderId, setPrefilledFromOrderId] = useState<string | null>(null);

  const features = currentOutlet ? getFeatures(currentOutlet.businessType) : null;
  const businessType = currentOutlet ? getBusinessType(currentOutlet.businessType) : null;
  const allowedOrderTypes = allowedTypes;
  const outletLocations = currentOutlet ? posLocations.filter(l => l.outletId === currentOutlet.id) : [];
  const showLocationPicker = features?.hasDineIn && selectedOrderType === "dine_in";

  const notesPlaceholder = useMemo(() => {
    if (!currentOutlet) return "Add any special instructions or notes...";
    switch (currentOutlet.businessType) {
      case "restaurant": return "e.g. Nut allergy, no onions, birthday celebration...";
      case "pharmacy": return "e.g. Prescription notes, dosage instructions, patient info...";
      case "salon": case "barber": return "e.g. Preferred stylist, hair type, skin sensitivity...";
      case "grocery": case "supermarket": return "e.g. Ripe produce only, substitute preferences...";
      case "clothing": case "hair_seller": return "e.g. Gift wrap requested, size exchange policy...";
      case "electronics": return "e.g. Warranty registration, setup assistance needed...";
      case "wine_store": return "e.g. Gift packaging, temperature notes...";
      default: return "Add any special instructions or notes...";
    }
  }, [currentOutlet]);

  const applicableFees = useMemo((): AppliedFee[] => {
    if (!currentOutlet?.fees) return [];
    const afterDiscount = subtotal - ((() => {
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
    })());
    return currentOutlet.fees
      .filter(f => f.enabled)
      .filter(f => !f.appliesTo || f.appliesTo.includes(selectedOrderType))
      .map(f => ({
        name: f.name,
        amount: f.type === "percentage" ? Math.round(afterDiscount * f.value / 100) : f.value,
      }));
  }, [currentOutlet, selectedOrderType, subtotal, selectedDiscount, customDiscountAmount, customDiscountType]);

  const feesTotal = applicableFees.reduce((s, f) => s + f.amount, 0);

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

  const discountName = selectedDiscount?.name
    || (customDiscountAmount ? (prefilledDiscountName || "Custom Discount") : undefined);

  const tipValue = useMemo(() => {
    if (tipPreset !== null) return Math.round(subtotal * tipPreset / 100);
    return parseFloat(tipAmount) || 0;
  }, [tipPreset, tipAmount, subtotal]);

  const loyaltyDiscount = loyaltyRedemption?.discountValue || 0;
  const total = subtotal - discountAmount - loyaltyDiscount + feesTotal + tipValue;
  const amountToCharge = existingOrder ? Math.max(0, total - existingOrder.paidAmount) : total;

  // Prefill discount, tip, fees, loyalty from the existing order so the cashier sees what was applied
  useEffect(() => {
    if (!existingOrder) return;
    if (prefilledFromOrderId === existingOrder.id) return;
    if (existingOrder.discountAmount && existingOrder.discountAmount > 0) {
      setCustomDiscountType("fixed");
      setCustomDiscountAmount(String(existingOrder.discountAmount));
      setPrefilledDiscountName(existingOrder.discountName);
    }
    if (existingOrder.tipAmount && existingOrder.tipAmount > 0) {
      setTipAmount(String(existingOrder.tipAmount));
      setTipPreset(null);
    }
    if (existingOrder.loyaltyRedemption) {
      setLoyaltyRedemption(existingOrder.loyaltyRedemption);
    }
    setPrefilledFromOrderId(existingOrder.id);
  }, [existingOrder, prefilledFromOrderId]);

  const reset = () => {
    setStep(existingOrderId ? "discount" : "type");
    setSelectedLocation("");
    setCustomerFirstName(""); setCustomerLastName("");
    setCustomerPhone("");
    setPaymentMethod("");
    setSplitMode(null);
    setSplitCount(2);
    setCustomAmounts([]);
    setCompletedOrder(null);
    setPayNow(true);
    setSelectedDiscount(null);
    setCustomDiscountAmount("");
    setTipAmount("");
    setTipPreset(null);
    setCustomerNotes("");
    setSelectedItems([]);
    setSplitItemPaymentMethod("");
    setPartialAmount("");
    setPartialPaymentMethod("");
    setLoyaltyRedemption(null);
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
    if (!payNow && !existingOrderId) {
      const locationName = selectedLocation || undefined;
      const order = createOrder(selectedOrderType, locationName, customerName || undefined, false, tipValue || undefined, discountAmount || undefined, discountName, customerNotes || undefined, applicableFees.length > 0 ? applicableFees : undefined, feesTotal || undefined, loyaltyRedemption || undefined, customerPhone.trim() || undefined);
      setCompletedOrder({ orderNumber: order.orderNumber, total: order.totalAmount, id: order.id });
      setStep("complete");
      return;
    }
    if (existingOrderId) {
      // Persist any cashier-edited discount/tip/fees/loyalty before charging
      updateOrderTotals(existingOrderId, {
        totalAmount: total,
        tipAmount: tipValue || undefined,
        discountAmount: discountAmount || undefined,
        discountName,
        appliedFees: applicableFees.length > 0 ? applicableFees : undefined,
        feesTotal: feesTotal || undefined,
        loyaltyRedemption: loyaltyRedemption || null,
      });
    }
    setStep("payment");
  };

  const persistExistingOrderTotals = () => {
    if (!existingOrderId) return;
    updateOrderTotals(existingOrderId, {
      totalAmount: total,
      tipAmount: tipValue || undefined,
      discountAmount: discountAmount || undefined,
      discountName,
      appliedFees: applicableFees.length > 0 ? applicableFees : undefined,
      feesTotal: feesTotal || undefined,
      loyaltyRedemption: loyaltyRedemption || null,
    });
  };

  const handleFullPayment = () => {
    if (existingOrderId) {
      persistExistingOrderTotals();
      addPayment(existingOrderId, { method: resolveKind(paymentMethod), amount: amountToCharge });
      setCompletedOrder({ orderNumber: existingOrder?.orderNumber || "", total: amountToCharge, id: existingOrderId });
    } else {
      const locationName = selectedLocation || undefined;
      const order = createOrder(selectedOrderType, locationName, customerName || undefined, true, tipValue || undefined, discountAmount || undefined, discountName, customerNotes || undefined, applicableFees.length > 0 ? applicableFees : undefined, feesTotal || undefined, loyaltyRedemption || undefined, customerPhone.trim() || undefined);
      addPayment(order.id, { method: resolveKind(paymentMethod), amount: total });
      setCompletedOrder({ orderNumber: order.orderNumber, total, id: order.id });
    }
    setStep("complete");
  };

  const handleSplitPayment = () => {
    if (customAmounts.length === 0) return;
    if (existingOrderId) {
      persistExistingOrderTotals();
      customAmounts.forEach(ca => {
        const amt = parseFloat(ca.amount) || 0;
        if (amt > 0) addPayment(existingOrderId, { method: resolveKind(ca.method), amount: amt });
      });
      setCompletedOrder({ orderNumber: existingOrder?.orderNumber || "", total: amountToCharge, id: existingOrderId });
    } else {
      const locationName = selectedLocation || undefined;
      const order = createOrder(selectedOrderType, locationName, customerName || undefined, true, tipValue || undefined, discountAmount || undefined, discountName, customerNotes || undefined, applicableFees.length > 0 ? applicableFees : undefined, feesTotal || undefined, loyaltyRedemption || undefined, customerPhone.trim() || undefined);
      customAmounts.forEach(ca => {
        const amt = parseFloat(ca.amount) || 0;
        if (amt > 0) addPayment(order.id, { method: resolveKind(ca.method), amount: amt });
      });
      setCompletedOrder({ orderNumber: order.orderNumber, total, id: order.id });
    }
    setStep("complete");
  };

  const initSplit = () => {
    const def = paymentMethods[0]?.id ?? "";
    const second = paymentMethods[1]?.id ?? def;
    if (existingOrderId) {
      setStep("split-choice");
    } else {
      setCustomAmounts([
        { method: def, amount: "" },
        { method: second, amount: "" },
      ]);
      setStep("split");
    }
  };

  const initSplitByAmount = () => {
    const def = paymentMethods[0]?.id ?? "";
    const second = paymentMethods[1]?.id ?? def;
    setCustomAmounts([
      { method: def, amount: "" },
      { method: second, amount: "" },
    ]);
    setStep("split");
  };

  const initSplitByItems = () => {
    setSelectedItems([]);
    setSplitItemPaymentMethod(paymentMethods[0]?.id ?? "");
    setStep("split-items");
  };

  const initPartialPayment = () => {
    setPartialAmount("");
    setPartialPaymentMethod(paymentMethods[0]?.id ?? "");
    setStep("partial");
  };

  const orderItems = existingOrder?.items || cart;
  const remainingAmount = existingOrder ? amountToCharge : total;

  const selectedItemsTotal = useMemo(() => {
    return selectedItems.reduce((sum, si) => {
      const item = orderItems.find(i => i.id === si.itemId);
      if (!item) return sum;
      const perUnit = item.unitPrice + item.extras.reduce((s, e) => s + e.price * e.quantity, 0);
      return sum + perUnit * si.qty;
    }, 0);
  }, [selectedItems, orderItems]);

  const toggleItemSelection = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(s => s.itemId === itemId);
      if (existing) return prev.filter(s => s.itemId !== itemId);
      return [...prev, { itemId, qty: maxQty }];
    });
  };

  const updateSelectedItemQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => prev.map(s => s.itemId === itemId ? { ...s, qty } : s));
  };

  const handleSplitItemsPayment = () => {
    if (!existingOrderId || selectedItemsTotal <= 0) return;
    addPayment(existingOrderId, {
      method: resolveKind(splitItemPaymentMethod),
      amount: selectedItemsTotal,
      paidItems: selectedItems.map(si => ({ itemId: si.itemId, qty: si.qty })),
    });
    setCompletedOrder({ orderNumber: existingOrder?.orderNumber || "", total: selectedItemsTotal, id: existingOrderId });
    setStep("complete");
  };

  const handlePartialPayment = () => {
    const amt = parseFloat(partialAmount) || 0;
    if (!existingOrderId || amt <= 0) return;
    addPayment(existingOrderId, { method: resolveKind(partialPaymentMethod), amount: amt });
    setCompletedOrder({ orderNumber: existingOrder?.orderNumber || "", total: amt, id: existingOrderId });
    setStep("complete");
  };

  const PM_ICONS: Record<PaymentMethod, React.ReactNode> = {
    cash: <Banknote className="w-5 h-5" />,
    card: <CreditCard className="w-5 h-5" />,
    mobile: <Smartphone className="w-5 h-5" />,
    transfer: <ArrowRightLeft className="w-5 h-5" />,
  };

  const paymentMethods = useMemo(() => {
    const cfg = getOutletPaymentMethods(currentOutlet?.id ?? "default");
    return cfg
      .filter((m) => m.enabled)
      .map((m) => ({ id: m.id, label: m.label || m.kind, kind: m.kind, icon: PM_ICONS[m.kind] }));
  }, [currentOutlet?.id]);

  const resolveKind = useCallback(
    (id: string): PaymentMethod => paymentMethods.find((p) => p.id === id)?.kind ?? "cash",
    [paymentMethods],
  );

  // Ensure selected payment method is always in the enabled set
  useEffect(() => {
    if (paymentMethods.length && !paymentMethods.find((pm) => pm.id === paymentMethod)) {
      setPaymentMethod(paymentMethods[0].id);
    }
    if (paymentMethods.length && !paymentMethods.find((pm) => pm.id === splitItemPaymentMethod)) {
      setSplitItemPaymentMethod(paymentMethods[0].id);
    }
    if (paymentMethods.length && !paymentMethods.find((pm) => pm.id === partialPaymentMethod)) {
      setPartialPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, paymentMethod, splitItemPaymentMethod, partialPaymentMethod]);

  const outletConfig = useMemo(
    () => getOutletDiscountTipConfig(currentOutlet?.id ?? "default"),
    [currentOutlet?.id]
  );
  const outletDiscounts = outletConfig.discounts;
  const tipPresets = outletConfig.tips.map((t) => t.value);

  // Header with back button for inline mode
  const renderHeader = (title: string, backStep?: Step | "close") => (
    <div className="flex items-center gap-2 mb-3">
      {backStep && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => {
            if (backStep === "close") {
              if (onBackToOrder) { onBackToOrder(); }
              else { handleClose(); }
            } else {
              goBack(backStep);
            }
          }}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );

  return (
    <>
      {/* ===== STEP: ORDER TYPE ===== */}
      {step === "type" && !existingOrderId && (
        <>
          {renderHeader("New Order")}
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Order Type</p>
              <div className={`grid gap-2 ${allowedOrderTypes.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {allowedOrderTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setSelectedOrderType(type.id); setSelectedLocation(""); setLocationSearch(""); }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedOrderType === type.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

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
              <label className="text-sm font-medium">Notes & Special Instructions (optional)</label>
              <Textarea
                value={customerNotes}
                onChange={e => setCustomerNotes(e.target.value)}
                placeholder={notesPlaceholder}
                className="h-16 text-sm resize-none"
              />
            </div>

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

            <Button
              onClick={handleProceedToDiscount}
              className="w-full h-11"
              disabled={showLocationPicker && outletLocations.length > 0 && !selectedLocation}
            >
              {showLocationPicker && outletLocations.length > 0 && !selectedLocation ? "Select a Location" : "Continue"}
            </Button>
          </div>
        </>
      )}

      {/* ===== STEP: DISCOUNT & TIP ===== */}
      {step === "discount" && (
        <>
          {renderHeader(
            existingOrderId ? `${existingOrder?.orderNumber} — Discount & Tip` : "Discount & Tip",
            existingOrderId ? "close" : "type"
          )}
          <div className="space-y-4">
            {!existingOrderId && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => goBack("type")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  {allowedOrderTypes.find(t => t.id === selectedOrderType)?.label || selectedOrderType}
                </button>
                {selectedLocation && (
                  <button onClick={() => goBack("type")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                    <MapPin className="w-3 h-3" />
                    {selectedLocation}
                  </button>
                )}
                {customerName && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    {customerName}
                  </span>
                )}
                {customerNotes && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium truncate max-w-[200px]" title={customerNotes}>
                    ⚠ {customerNotes}
                  </span>
                )}
              </div>
            )}

            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-2xl font-bold text-foreground">{formatNaira(subtotal)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Apply Discount</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {outletDiscounts.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDiscount(selectedDiscount?.id === d.id ? null : d); setCustomDiscountAmount(""); setPrefilledDiscountName(undefined); }}
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
                  onChange={e => { setCustomDiscountAmount(e.target.value); setSelectedDiscount(null); setPrefilledDiscountName(undefined); }}
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

            <LoyaltyRedemptionPanel
              subtotal={subtotal}
              onApplyRedemption={setLoyaltyRedemption}
              onClearRedemption={() => setLoyaltyRedemption(null)}
              currentRedemption={loyaltyRedemption}
            />

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
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-[hsl(var(--success))]">
                  <span>Loyalty ({loyaltyRedemption?.rewardName})</span>
                  <span>-{formatNaira(loyaltyDiscount)}</span>
                </div>
              )}
              {applicableFees.map((fee, i) => (
                <div key={i} className="flex justify-between text-sm text-muted-foreground">
                  <span>{fee.name}</span>
                  <span>+{formatNaira(fee.amount)}</span>
                </div>
              ))}
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
              {existingOrderId ? `Continue to Payment ${formatNaira(total)}` : (payNow ? `Pay ${formatNaira(total)}` : "Create Order")}
            </Button>
          </div>
        </>
      )}

      {/* ===== STEP: PAYMENT ===== */}
      {step === "payment" && (
        <>
          {renderHeader(
            existingOrderId ? `Pay ${existingOrder?.orderNumber}` : "Payment",
            "discount"
          )}
          <div className="space-y-4">
            {!existingOrderId && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => goBack("type")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  {allowedOrderTypes.find(t => t.id === selectedOrderType)?.label || selectedOrderType}
                </button>
                {selectedLocation && (
                  <button onClick={() => goBack("type")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                    <MapPin className="w-3 h-3" />
                    {selectedLocation}
                  </button>
                )}
                {customerName && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    {customerName}
                  </span>
                )}
              </div>
            )}
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-3xl font-bold text-foreground">{formatNaira(amountToCharge)}</p>
              {existingOrder && existingOrder.paidAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total {formatNaira(total)} · Already paid {formatNaira(existingOrder.paidAmount)}
                </p>
              )}
              {discountAmount > 0 && (
                <p className="text-xs text-[hsl(var(--success))] mt-1">Discount: -{formatNaira(discountAmount)}</p>
              )}
              {feesTotal > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fees: {applicableFees.map(f => `${f.name} ${formatNaira(f.amount)}`).join(", ")}
                </p>
              )}
              {tipValue > 0 && (
                <p className="text-xs text-primary mt-0.5">Includes tip: {formatNaira(tipValue)}</p>
              )}
            </div>

            <p className="text-sm font-medium">Payment Method</p>
            {paymentMethods.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No payment methods configured for this outlet. Ask an admin to add payment methods from the Outlets page.
              </div>
            ) : (
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
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleFullPayment} className="h-11">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Confirm & Pay
              </Button>
              <Button variant="outline" onClick={initSplit} className="h-11">
                <SplitSquareHorizontal className="w-4 h-4 mr-1" />
                Split Payment
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ===== STEP: SPLIT ===== */}
      {step === "split" && (
        <>
          {renderHeader("Split by Amount", existingOrderId ? "split-choice" : "payment")}
          <div className="space-y-4">
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{formatNaira(total)}</span></p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Split into</label>
              <div className="flex items-center gap-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => {
                    const n = Math.max(2, splitCount - 1);
                    setSplitCount(n);
                    const per = Math.floor(total / n);
                    const remainder = total - per * n;
                    setCustomAmounts(Array.from({ length: n }, (_, i) => ({
                      method: paymentMethods[0]?.id ?? "",
                      amount: (i === n - 1 ? per + remainder : per).toString()
                    })));
                  }}
                  disabled={splitCount <= 2}
                >−</Button>
                <div className="h-9 w-10 flex items-center justify-center border-y border-input bg-background text-sm font-medium">
                  {splitCount}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => {
                    const n = Math.min(10, splitCount + 1);
                    setSplitCount(n);
                    const per = Math.floor(total / n);
                    const remainder = total - per * n;
                    setCustomAmounts(Array.from({ length: n }, (_, i) => ({
                      method: paymentMethods[0]?.id ?? "",
                      amount: (i === n - 1 ? per + remainder : per).toString()
                    })));
                  }}
                  disabled={splitCount >= 10}
                >+</Button>
              </div>
              <span className="text-sm text-muted-foreground">methods</span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Payment splits</p>
              {customAmounts.map((ca, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <select
                    value={ca.method}
                    onChange={e => {
                      const next = [...customAmounts];
                      next[i] = { ...next[i], method: e.target.value };
                      setCustomAmounts(next);
                    }}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.label}</option>)}
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">₦</span>
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
                      className="h-9 pl-7"
                    />
                  </div>
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
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Confirm & Process Order
            </Button>
          </div>
        </>
      )}

      {/* ===== STEP: SPLIT CHOICE ===== */}
      {step === "split-choice" && existingOrderId && (
        <>
          {renderHeader("Split Payment", "payment")}
          <div className="space-y-3">
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-foreground">{formatNaira(remainingAmount)}</p>
            </div>

            <p className="text-sm text-muted-foreground">How would you like to split the payment?</p>

            <button
              onClick={initSplitByItems}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Split by Items</p>
                <p className="text-xs text-muted-foreground mt-0.5">Select specific items and quantities to pay for</p>
              </div>
            </button>

            <button
              onClick={initSplitByAmount}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <SplitSquareHorizontal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Split by Amount</p>
                <p className="text-xs text-muted-foreground mt-0.5">Divide the total across multiple payment methods</p>
              </div>
            </button>

            <button
              onClick={initPartialPayment}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">₦</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Partial Payment</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pay a custom amount towards the bill</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* ===== STEP: SPLIT BY ITEMS ===== */}
      {step === "split-items" && existingOrderId && (
        <>
          {renderHeader("Split by Items", "split-choice")}
          <div className="space-y-4">
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Order Total: <span className="font-bold text-foreground">{formatNaira(remainingAmount)}</span></p>
            </div>

            <p className="text-sm font-medium text-foreground">Select items to pay for</p>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {orderItems.map(item => {
                  const selected = selectedItems.find(s => s.itemId === item.id);
                  const perUnit = item.unitPrice + item.extras.reduce((s, e) => s + e.price * e.quantity, 0);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <Checkbox
                        checked={!!selected}
                        onCheckedChange={() => toggleItemSelection(item.id, item.quantity)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground">{item.variantName}</p>
                        )}
                        {item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{item.extras.map(e => e.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{formatNaira(perUnit)}</p>
                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                      </div>
                      {selected && item.quantity > 1 && (
                        <div className="flex items-center gap-0 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-r-none"
                            onClick={() => updateSelectedItemQty(item.id, Math.max(1, selected.qty - 1))}
                            disabled={selected.qty <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <div className="h-7 w-8 flex items-center justify-center border-y border-input bg-background text-xs font-medium">
                            {selected.qty}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-l-none"
                            onClick={() => updateSelectedItemQty(item.id, Math.min(item.quantity, selected.qty + 1))}
                            disabled={selected.qty >= item.quantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {selectedItemsTotal > 0 && (
              <div className="border-t border-border pt-3 space-y-3">
                <div className="flex justify-between font-bold text-base">
                  <span>Selected Total</span>
                  <span>{formatNaira(selectedItemsTotal)}</span>
                </div>

                <p className="text-sm font-medium">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setSplitItemPaymentMethod(pm.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        splitItemPaymentMethod === pm.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                      }`}
                    >
                      {pm.icon}
                      <span className="text-sm font-medium">{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleSplitItemsPayment}
              disabled={selectedItemsTotal <= 0}
              className="w-full h-11"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Pay {formatNaira(selectedItemsTotal)}
            </Button>
          </div>
        </>
      )}

      {/* ===== STEP: PARTIAL PAYMENT ===== */}
      {step === "partial" && existingOrderId && (
        <>
          {renderHeader("Partial Payment", "split-choice")}
          <div className="space-y-4">
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-foreground">{formatNaira(remainingAmount)}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Pay</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">₦</span>
                <Input
                  type="number"
                  value={partialAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-11 text-lg pl-8"
                />
              </div>
              {parseFloat(partialAmount) > 0 && parseFloat(partialAmount) < remainingAmount && (
                <p className="text-xs text-muted-foreground">
                  Remaining after payment: {formatNaira(remainingAmount - (parseFloat(partialAmount) || 0))}
                </p>
              )}
              {parseFloat(partialAmount) > remainingAmount && (
                <p className="text-xs text-destructive">
                  Amount exceeds balance due
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[25, 50, 75].map(pct => (
                <button
                  key={pct}
                  onClick={() => setPartialAmount(Math.round(remainingAmount * pct / 100).toString())}
                  className="p-2 rounded-lg border border-border hover:border-primary/30 text-xs font-medium text-center transition-all"
                >
                  {pct}%
                </button>
              ))}
              <button
                onClick={() => setPartialAmount(remainingAmount.toString())}
                className="p-2 rounded-lg border border-border hover:border-primary/30 text-xs font-medium text-center transition-all"
              >
                Full
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPartialPaymentMethod(pm.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      partialPaymentMethod === pm.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {pm.icon}
                    <span className="text-sm font-medium">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handlePartialPayment}
              disabled={!parseFloat(partialAmount) || parseFloat(partialAmount) <= 0 || parseFloat(partialAmount) > remainingAmount}
              className="w-full h-11"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Pay {formatNaira(parseFloat(partialAmount) || 0)}
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
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setShowPrintDialog(true)}>
                <Printer className="w-4 h-4" /> Receipt
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => { setShowPrintDialog(true); }}>
                <ChefHat className="w-4 h-4" /> Dockets
              </Button>
            </div>
            <Button onClick={handleClose} className="w-40">Done</Button>
          </div>
        </div>
      )}

      <PrintReceiptDialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        order={completedOrder ? orders.find(o => o.id === completedOrder.id) || null : null}
      />
    </>
  );
}
