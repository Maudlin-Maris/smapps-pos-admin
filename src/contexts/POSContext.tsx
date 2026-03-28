import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

import {
  type POSCashier, type POSOrder, type POSCartItem, type POSOutlet,
  type OrderType, type PaymentEntry, type OrderStatus,
  posCashiers, mockOrders, posOutlets,
} from "@/data/posData";

type AuthState = "login" | "pin" | "locked" | "active";

interface POSContextType {
  // Auth
  authState: AuthState;
  currentCashier: POSCashier | null;
  signedInCashiers: POSCashier[];
  loginWithCredentials: (username: string, password: string) => boolean;
  loginWithPin: (pin: string) => boolean;
  selectCashier: (cashier: POSCashier) => void;
  lockScreen: () => void;
  switchProfile: () => void;
  logout: () => void;

  // Outlet
  currentOutlet: POSOutlet | null;
  setCurrentOutlet: (outlet: POSOutlet) => void;
  availableOutlets: POSOutlet[];

  // Cart
  cart: POSCartItem[];
  addToCart: (item: Omit<POSCartItem, "id">) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  updateCartItem: (itemId: string, variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number; quantity: number }[], unitPrice: number) => void;
  clearCart: () => void;
  cartTotal: number;

  // Orders
  orders: POSOrder[];
  createOrder: (type: OrderType, tableNumber?: string, customerName?: string, payNow?: boolean, tipAmount?: number, discountAmount?: number, discountName?: string) => POSOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addItemsToOrder: (orderId: string, items: POSCartItem[]) => void;
  mergeOrders: (sourceId: string, targetId: string) => void;
  addPayment: (orderId: string, payment: PaymentEntry) => void;
  voidOrder: (orderId: string) => void;

  // UI state
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
}

const POSContext = createContext<POSContextType | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("login");
  const [currentCashier, setCurrentCashier] = useState<POSCashier | null>(null);
  const [signedInCashiers, setSignedInCashiers] = useState<POSCashier[]>([]);
  const [currentOutlet, setCurrentOutlet] = useState<POSOutlet | null>(null);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [orders, setOrders] = useState<POSOrder[]>(mockOrders);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [orderCounter, setOrderCounter] = useState(5);

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

  const loginWithPin = useCallback((pin: string) => {
    if (currentCashier && currentCashier.pin === pin) {
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
    setCurrentOutlet(null);
    setCart([]);
  }, [currentCashier]);

  const availableOutlets = currentCashier
    ? posOutlets.filter(o => currentCashier.assignedOutlets.includes(o.id))
    : [];

  const addToCart = useCallback((item: Omit<POSCartItem, "id">) => {
    setCart(prev => {
      const extrasKey = [...item.extras].sort((a, b) => a.id.localeCompare(b.id)).map(e => `${e.id}:${e.quantity}`).join(",");
      const existing = prev.find(c => {
        const cExtrasKey = [...c.extras].sort((a, b) => a.id.localeCompare(b.id)).map(e => `${e.id}:${e.quantity}`).join(",");
        return c.productId === item.productId && c.variantId === item.variantId && cExtrasKey === extrasKey;
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

  const updateCartItem = useCallback((itemId: string, variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number; quantity: number }[], unitPrice: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const extrasTotal = extras.reduce((s, e) => s + e.price * e.quantity, 0);
      return { ...i, variantId, variantName, extras, unitPrice, totalPrice: (unitPrice + extrasTotal) * i.quantity };
    }));
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);

  const createOrder = useCallback((type: OrderType, tableNumber?: string, customerName?: string, payNow?: boolean, tipAmount?: number, discountAmount?: number, discountName?: string) => {
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
      payments: [],
      totalAmount: cartTotal - (discountAmount || 0),
      paidAmount: 0,
      tipAmount,
      discountAmount,
      discountName,
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

  const addItemsToOrder = useCallback((orderId: string, items: POSCartItem[]) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = [...o.items, ...items];
      const newTotal = newItems.reduce((s, i) => s + i.totalPrice, 0);
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

  const voidOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "voided" as OrderStatus, updatedAt: new Date() } : o));
  }, []);

  return (
    <POSContext.Provider value={{
      authState, currentCashier, signedInCashiers, loginWithCredentials, loginWithPin, selectCashier, lockScreen, switchProfile, logout,
      currentOutlet, setCurrentOutlet, availableOutlets,
      cart, addToCart, removeFromCart, updateCartItemQuantity, updateCartItem, clearCart, cartTotal,
      orders, createOrder, updateOrderStatus, addItemsToOrder, mergeOrders, addPayment, voidOrder,
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
