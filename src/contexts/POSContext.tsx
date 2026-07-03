/* POS Context */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { posProducts } from "@/data/posData";
import {
  type POSCashier, type POSOrder, type POSCartItem, type POSOutlet,
  type OrderType, type PaymentEntry, type OrderStatus, type AppliedFee, type ItemStatus,
  type POSBusiness,
  posCashiers, mockOrders, posOutlets, mockDeviceLinks,
} from "@/data/posData";
import type { LoyaltyRedemption } from "@/data/loyaltyData";

type AuthState = "device_link" | "outlet_select" | "login" | "pin" | "locked" | "active";

export interface POSShift {
  id: string;
  cashierId: string;
  outletId: string;
  startedAt: Date;
  endedAt?: Date;
  openingCash: number;
  closingCash?: number;
  status: "active" | "closed";
}

interface POSContextType {
  // Device & Business
  linkedBusiness: POSBusiness | null;
  linkDevice: (linkingId: string) => boolean;
  unlinkDevice: () => void;
  selectOutletAndProceed: (outlet: POSOutlet) => void;

  // Auth
  authState: AuthState;
  currentCashier: POSCashier | null;
  signedInCashiers: POSCashier[];
  loginWithCredentials: (username: string, password: string) => boolean;
  selectCashierForPin: (cashier: POSCashier) => void;
  loginWithPin: (pin: string) => boolean;
  selectCashier: (cashier: POSCashier) => void;
  lockScreen: () => void;
  switchProfile: () => void;
  logout: () => void;

  // Shift
  currentShift: POSShift | null;
  startShift: (openingCash: number) => void;
  closeShift: (closingCash: number) => void;

  // Outlet
  currentOutlet: POSOutlet | null;
  setCurrentOutlet: (outlet: POSOutlet) => void;
  availableOutlets: POSOutlet[];
  outletOpen: boolean;
  toggleOutletOpen: () => void;

  // Cart
  cart: POSCartItem[];
  addToCart: (item: Omit<POSCartItem, "id">) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  updateCartItem: (itemId: string, variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number; quantity: number }[], unitPrice: number, notes?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  removeBundleFromCart: (bundleId: string) => void;
  breakBundle: (bundleId: string) => void;
  swapBundleItem: (bundleId: string, oldItemId: string, newProductId: string, newVariantId?: string, newVariantName?: string) => void;

  // Orders
  orders: POSOrder[];
  createOrder: (type: OrderType, tableNumber?: string, customerName?: string, payNow?: boolean, tipAmount?: number, discountAmount?: number, discountName?: string, notes?: string, appliedFees?: AppliedFee[], feesTotal?: number, loyaltyRedemption?: LoyaltyRedemption, customerPhone?: string) => POSOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemId: string, status: ItemStatus) => void;
  addItemsToOrder: (orderId: string, items: POSCartItem[]) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  mergeOrders: (sourceId: string, targetId: string) => void;
  addPayment: (orderId: string, payment: PaymentEntry) => void;
  updateOrderTotals: (orderId: string, updates: { totalAmount: number; tipAmount?: number; discountAmount?: number; discountName?: string; appliedFees?: AppliedFee[]; feesTotal?: number; loyaltyRedemption?: LoyaltyRedemption | null; }) => void;
  voidOrder: (orderId: string) => void;
  transferOrder: (orderId: string, toCashierId: string) => void;
  acceptTransfer: (orderId: string) => void;
  rejectTransfer: (orderId: string) => void;
  changeOrderLocation: (orderId: string, locationName: string | undefined) => void;

  // UI state
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
}

const POSContext = createContext<POSContextType | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  // --- Device & Business linking (persisted in localStorage) ---
  const [linkedBusiness, setLinkedBusiness] = useState<POSBusiness | null>(() => {
    try {
      const raw = localStorage.getItem("pos_linked_business");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const initialAuthState = (): AuthState => {
    if (!linkedBusiness) return "device_link";
    // Check for session
    try {
      const raw = sessionStorage.getItem("pos_session");
      if (raw) {
        const s = JSON.parse(raw);
        return s.authState === "active" ? "locked" : s.authState;
      }
    } catch {}
    return "login";
  };

  // Restore session from sessionStorage
  const saved = (() => {
    try {
      const raw = sessionStorage.getItem("pos_session");
      if (!raw) return null;
      return JSON.parse(raw) as {
        authState: AuthState;
        cashierId: string;
        signedInCashierIds: string[];
        outletId: string | null;
      };
    } catch { return null; }
  })();

  const restoredCashier = saved ? posCashiers.find(c => c.id === saved.cashierId) || null : null;
  const restoredSignedIn = saved ? posCashiers.filter(c => saved.signedInCashierIds.includes(c.id)) : [];
  
  // Resolve initial outlet from last-used or session
  const resolveInitialOutlet = (): POSOutlet | null => {
    if (!linkedBusiness) return null;
    const deviceOutlets = posOutlets.filter(o => linkedBusiness.assignedOutlets.includes(o.id));
    // Session outlet
    if (saved?.outletId) {
      const o = deviceOutlets.find(o => o.id === saved.outletId);
      if (o) return o;
    }
    // Last used
    const lastId = localStorage.getItem("pos_last_outlet_id");
    if (lastId) {
      const o = deviceOutlets.find(o => o.id === lastId);
      if (o) return o;
    }
    // Default to first assigned outlet — device link auto-selects
    return deviceOutlets[0] || null;
  };

  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [currentCashier, setCurrentCashier] = useState<POSCashier | null>(restoredCashier);
  const [signedInCashiers, setSignedInCashiers] = useState<POSCashier[]>(restoredSignedIn);
  const [currentOutlet, setCurrentOutletState] = useState<POSOutlet | null>(resolveInitialOutlet);
  const setCurrentOutlet = useCallback((outlet: POSOutlet) => {
    setCurrentOutletState(outlet);
    setCart([]);
  }, []);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [orders, setOrders] = useState<POSOrder[]>(mockOrders);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [orderCounter, setOrderCounter] = useState(5);
  const [currentShift, setCurrentShift] = useState<POSShift | null>(null);
  const [outletOpen, setOutletOpen] = useState(true);
  const toggleOutletOpen = useCallback(() => setOutletOpen(prev => !prev), []);

  // --- Device linking ---
  const linkDevice = useCallback((linkingId: string): boolean => {
    const biz = mockDeviceLinks[linkingId];
    if (!biz) return false;
    localStorage.setItem("pos_linked_business", JSON.stringify(biz));
    setLinkedBusiness(biz);
    const deviceOutlets = posOutlets.filter(o => biz.assignedOutlets.includes(o.id));
    // Auto-select first assigned outlet — skip the outlet picker
    const outlet = deviceOutlets[0];
    if (outlet) {
      setCurrentOutletState(outlet);
      localStorage.setItem("pos_last_outlet_id", outlet.id);
    }
    setAuthState("login");
    return true;
  }, []);

  const unlinkDevice = useCallback(() => {
    localStorage.removeItem("pos_linked_business");
    localStorage.removeItem("pos_last_outlet_id");
    sessionStorage.removeItem("pos_session");
    setLinkedBusiness(null);
    setCurrentOutletState(null);
    setCurrentCashier(null);
    setSignedInCashiers([]);
    setCart([]);
    setAuthState("device_link");
  }, []);

  const selectOutletAndProceed = useCallback((outlet: POSOutlet) => {
    setCurrentOutletState(outlet);
    localStorage.setItem("pos_last_outlet_id", outlet.id);
    setCart([]);
    setAuthState("login");
  }, []);

  // Persist session to sessionStorage
  useEffect(() => {
    if (authState === "login" || authState === "device_link" || authState === "outlet_select") {
      sessionStorage.removeItem("pos_session");
    } else {
      sessionStorage.setItem("pos_session", JSON.stringify({
        authState,
        cashierId: currentCashier?.id || null,
        signedInCashierIds: signedInCashiers.map(c => c.id),
        outletId: currentOutlet?.id || null,
      }));
    }
  }, [authState, currentCashier, signedInCashiers, currentOutlet]);

  const loginWithCredentials = useCallback((username: string, _password: string) => {
    const cashier = posCashiers.find(c => c.username.toLowerCase() === username.toLowerCase());
    if (cashier) {
      setCurrentCashier(cashier);
      setSignedInCashiers(prev => prev.some(c => c.id === cashier.id) ? prev : [...prev, cashier]);
      setAuthState("pin");
      return true;
    }
    return false;
  }, []);

  const selectCashierForPin = useCallback((cashier: POSCashier) => {
    setCurrentCashier(cashier);
    setSignedInCashiers(prev => prev.some(c => c.id === cashier.id) ? prev : [...prev, cashier]);
  }, []);

  const loginWithPin = useCallback((pin: string) => {
    if (!currentCashier) return false;
    if (currentCashier.status === "suspended") return false;
    if (currentCashier.pin === pin) {
      setAuthState("active");
      if (!currentOutlet) {
        const outlet = posOutlets.find(o => currentCashier.assignedOutlets.includes(o.id));
        if (outlet) setCurrentOutlet(outlet);
      }
      return true;
    }
    return false;
  }, [currentCashier, currentOutlet]);

  const selectCashier = useCallback((cashier: POSCashier) => {
    setCurrentCashier(cashier);
    setAuthState("locked");
    setCart([]);
  }, []);

  const lockScreen = useCallback(() => setAuthState("locked"), []);
  const switchProfile = useCallback(() => {
    setAuthState("pin");
    setCart([]);
  }, []);
  const logout = useCallback(() => {
    setSignedInCashiers(prev => prev.filter(c => c.id !== currentCashier?.id));
    setAuthState("login");
    setCurrentCashier(null);
    // Keep currentOutlet — terminal is bound to its outlet via device link.
    // Re-resolve from linked business if it was cleared.
    if (!currentOutlet && linkedBusiness) {
      const deviceOutlets = posOutlets.filter(o => linkedBusiness.assignedOutlets.includes(o.id));
      const lastId = localStorage.getItem("pos_last_outlet_id");
      const outlet = (lastId && deviceOutlets.find(o => o.id === lastId)) || deviceOutlets[0] || null;
      if (outlet) setCurrentOutletState(outlet);
    }
    setCart([]);
    setCurrentShift(null);
    sessionStorage.removeItem("pos_session");
  }, [currentCashier, currentOutlet, linkedBusiness]);

  const startShift = useCallback((openingCash: number) => {
    const shift: POSShift = {
      id: `shift-${Date.now()}`,
      cashierId: currentCashier?.id || "",
      outletId: currentOutlet?.id || "",
      startedAt: new Date(),
      openingCash,
      status: "active",
    };
    setCurrentShift(shift);
  }, [currentCashier, currentOutlet]);

  const closeShift = useCallback((closingCash: number) => {
    setCurrentShift(prev => prev ? { ...prev, endedAt: new Date(), closingCash, status: "closed" } : null);
    setTimeout(() => setCurrentShift(null), 0);
  }, []);

  const availableOutlets = currentCashier
    ? posOutlets.filter(o => currentCashier.assignedOutlets.includes(o.id))
    : [];

  const addToCart = useCallback((item: Omit<POSCartItem, "id">) => {
    setCart(prev => {
      // Never merge bundle items — they must stay as separate locked entries
      if (item.bundleId) {
        const id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        return [...prev, { ...item, id }];
      }
      const extrasKey = [...item.extras].sort((a, b) => a.id.localeCompare(b.id)).map(e => `${e.id}:${e.quantity}`).join(",");
      const existing = prev.find(c => {
        if (c.bundleId) return false; // don't merge into bundle items
        const cExtrasKey = [...c.extras].sort((a, b) => a.id.localeCompare(b.id)).map(e => `${e.id}:${e.quantity}`).join(",");
        return c.productId === item.productId && c.variantId === item.variantId && cExtrasKey === extrasKey && (c.notes || "") === (item.notes || "");
      });
      if (existing) {
        return prev.map(c => c.id === existing.id
          ? { ...c, quantity: c.quantity + item.quantity, totalPrice: (c.quantity + item.quantity) * (c.unitPrice + c.extras.reduce((s, e) => s + e.price * e.quantity, 0)) }
          : c
        );
      }
      const id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      return [...prev, { ...item, id }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const updateCartItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.id !== itemId));
    } else {
      setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity, totalPrice: (i.unitPrice + i.extras.reduce((s, e) => s + e.price * e.quantity, 0)) * quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const updateCartItem = useCallback((itemId: string, variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number; quantity: number }[], unitPrice: number, notes?: string) => {
    setCart(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const extrasTotal = extras.reduce((s, e) => s + e.price * e.quantity, 0);
      return { ...i, variantId, variantName, extras, unitPrice, notes, totalPrice: (unitPrice + extrasTotal) * i.quantity };
    }));
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);

  // Bundle group actions
  const removeBundleFromCart = useCallback((bundleId: string) => {
    setCart(prev => prev.filter(i => i.bundleId !== bundleId));
  }, []);

  const breakBundle = useCallback((bundleId: string) => {
    setCart(prev => prev.map(i => {
      if (i.bundleId !== bundleId) return i;
      // Restore original prices and remove bundle association
      const prod = posProducts.find(p => p.id === i.productId);
      const variant = i.variantId ? prod?.variants?.find(v => v.id === i.variantId) : undefined;
      const originalPrice = variant?.price ?? prod?.price ?? i.unitPrice;
      return {
        ...i,
        bundleId: undefined,
        bundleName: undefined,
        unitPrice: originalPrice,
        totalPrice: originalPrice * i.quantity,
      };
    }));
  }, []);

  const swapBundleItem = useCallback((bundleId: string, oldItemId: string, newProductId: string, newVariantId?: string, newVariantName?: string) => {
    setCart(prev => {
      const oldItem = prev.find(i => i.id === oldItemId && i.bundleId === bundleId);
      if (!oldItem) return prev;

      const newProd = posProducts.find(p => p.id === newProductId);
      if (!newProd) return prev;
      const newVariant = newVariantId ? newProd.variants?.find(v => v.id === newVariantId) : undefined;

      // Toast POS swap pricing rule:
      // - New item costs MORE than the default → upcharge = difference added to slot price
      // - New item costs LESS or EQUAL → keep the base slot price (no discount below combo price)
      const defaultMarketPrice = oldItem.bundleDefaultMarketPrice ?? (oldItem.unitPrice * oldItem.quantity);
      const slotBasePrice = oldItem.bundleSlotBasePrice ?? oldItem.totalPrice;
      const newMarketPrice = ((newVariant?.price ?? newProd.price) * oldItem.quantity);
      const upcharge = Math.max(0, newMarketPrice - defaultMarketPrice);
      const newTotalPrice = slotBasePrice + upcharge;

      return prev.map(i => {
        if (i.id !== oldItemId) return i;
        return {
          ...i,
          productId: newProd.id,
          productName: newProd.name,
          categoryId: newProd.categoryId,
          variantId: newVariant?.id,
          variantName: newVariantName || newVariant?.name,
          extras: [],
          unitPrice: Math.round(newTotalPrice / oldItem.quantity),
          totalPrice: newTotalPrice,
          // Preserve original defaults for future swaps
          bundleDefaultMarketPrice: oldItem.bundleDefaultMarketPrice,
          bundleSlotBasePrice: oldItem.bundleSlotBasePrice,
        };
      });
    });
  }, []);

  const createOrder = useCallback((type: OrderType, tableNumber?: string, customerName?: string, payNow?: boolean, tipAmount?: number, discountAmount?: number, discountName?: string, notes?: string, appliedFees?: AppliedFee[], feesTotal?: number, loyaltyRedemption?: LoyaltyRedemption, customerPhone?: string) => {
    const num = orderCounter;
    setOrderCounter(n => n + 1);
    const order: POSOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `#${String(num).padStart(3, "0")}`,
      items: [...cart],
      status: payNow ? "paid" : "open",
      type,
      tableNumber,
      locationName: tableNumber,
      customerName: customerName || (type === "dine_in" && tableNumber ? tableNumber : undefined),
      customerPhone,
      payments: [],
      totalAmount: cartTotal - (discountAmount || 0) - (loyaltyRedemption?.discountValue || 0) + (feesTotal || 0),
      paidAmount: 0,
      tipAmount,
      discountAmount,
      discountName,
      appliedFees,
      feesTotal,
      notes,
      loyaltyRedemption,
      createdAt: new Date(),
      updatedAt: new Date(),
      outletId: currentOutlet?.id || "",
      cashierId: currentCashier?.id || "",
    };
    setOrders(prev => [order, ...prev]);
    setCart([]);
    return order;
  }, [cart, cartTotal, orderCounter, currentOutlet, currentCashier]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date() } : o));
  }, []);

  // Derive order status from item statuses
  const deriveOrderStatus = (items: POSCartItem[]): OrderStatus => {
    const statuses = items.map(i => i.itemStatus || "open");
    if (statuses.every(s => s === "served")) return "served";
    if (statuses.every(s => s === "ready" || s === "served")) return "ready";
    if (statuses.some(s => s === "in_progress" || s === "ready" || s === "served")) return "in_progress";
    return "open";
  };

  const updateItemStatus = useCallback((orderId: string, itemId: string, status: ItemStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.map(i => i.id === itemId ? { ...i, itemStatus: status } : i);
      const derivedStatus = deriveOrderStatus(updatedItems);
      // Only auto-derive if order isn't paid/voided
      const newOrderStatus = (o.status === "paid" || o.status === "voided") ? o.status : derivedStatus;
      return { ...o, items: updatedItems, status: newOrderStatus, updatedAt: new Date() };
    }));
  }, []);

  const addItemsToOrder = useCallback((orderId: string, items: POSCartItem[]) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = [...o.items, ...items];
      const newTotal = newItems.reduce((s, i) => s + i.totalPrice, 0);
      return { ...o, items: newItems, totalAmount: newTotal, updatedAt: new Date() };
    }));
  }, []);

  const removeItemFromOrder = useCallback((orderId: string, itemId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = o.items.filter(i => i.id !== itemId);
      if (newItems.length === 0) return { ...o, items: newItems, totalAmount: 0, status: "voided" as OrderStatus, updatedAt: new Date() };
      const newTotal = newItems.reduce((s, i) => s + i.totalPrice, 0) - (o.discountAmount || 0) + (o.feesTotal || 0);
      return { ...o, items: newItems, totalAmount: newTotal, updatedAt: new Date() };
    }));
  }, []);

  const mergeOrders = useCallback((sourceId: string, targetId: string) => {
    setOrders(prev => {
      const source = prev.find(o => o.id === sourceId);
      const target = prev.find(o => o.id === targetId);
      if (!source || !target) return prev;
      const mergedItems = [...target.items, ...source.items];
      const mergedTotal = mergedItems.reduce((s, i) => s + i.totalPrice, 0);
      return prev.map(o => {
        if (o.id === targetId) return { ...o, items: mergedItems, totalAmount: mergedTotal, paidAmount: target.paidAmount + source.paidAmount, updatedAt: new Date() };
        if (o.id === sourceId) return { ...o, status: "voided" as OrderStatus, updatedAt: new Date() };
        return o;
      });
    });
  }, []);

  const addPayment = useCallback((orderId: string, payment: PaymentEntry) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const payments = [...o.payments, payment];
      const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
      const status: OrderStatus = paidAmount >= o.totalAmount ? "paid" : o.status;
      return { ...o, payments, paidAmount, status, updatedAt: new Date() };
    }));
  }, []);

  const updateOrderTotals = useCallback((orderId: string, updates: { totalAmount: number; tipAmount?: number; discountAmount?: number; discountName?: string; appliedFees?: AppliedFee[]; feesTotal?: number; loyaltyRedemption?: LoyaltyRedemption | null; }) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        totalAmount: updates.totalAmount,
        tipAmount: updates.tipAmount,
        discountAmount: updates.discountAmount,
        discountName: updates.discountName,
        appliedFees: updates.appliedFees,
        feesTotal: updates.feesTotal,
        loyaltyRedemption: updates.loyaltyRedemption ?? undefined,
        updatedAt: new Date(),
      };
    }));
  }, []);

  const voidOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "voided" as OrderStatus, updatedAt: new Date() } : o));
  }, []);

  const transferOrder = useCallback((orderId: string, toCashierId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, transferredToCashierId: toCashierId, updatedAt: new Date() } : o));
  }, []);

  const acceptTransfer = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId || !o.transferredToCashierId) return o;
      return { ...o, cashierId: o.transferredToCashierId, transferredToCashierId: undefined, updatedAt: new Date() };
    }));
  }, []);

  const rejectTransfer = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, transferredToCashierId: undefined, updatedAt: new Date() } : o));
  }, []);

  const changeOrderLocation = useCallback((orderId: string, locationName: string | undefined) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, locationName, updatedAt: new Date() } : o));
  }, []);

  return (
    <POSContext.Provider value={{
      linkedBusiness, linkDevice, unlinkDevice, selectOutletAndProceed,
      authState, currentCashier, signedInCashiers, loginWithCredentials, selectCashierForPin, loginWithPin, selectCashier, lockScreen, switchProfile, logout,
      currentShift, startShift, closeShift,
      currentOutlet, setCurrentOutlet, availableOutlets, outletOpen, toggleOutletOpen,
      cart, addToCart, removeFromCart, updateCartItemQuantity, updateCartItem, clearCart, cartTotal, removeBundleFromCart, breakBundle, swapBundleItem,
      orders, createOrder, updateOrderStatus, updateItemStatus, addItemsToOrder, removeItemFromOrder, mergeOrders, addPayment, updateOrderTotals, voidOrder, transferOrder, acceptTransfer, rejectTransfer, changeOrderLocation,
      orderType, setOrderType,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be used within POSProvider");
  return ctx;
}
