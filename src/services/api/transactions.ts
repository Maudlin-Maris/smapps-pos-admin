import type { SWRConfiguration } from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "./api-hooks";
import { createUrlWithParams } from "@/lib/utils";
import type { Transaction } from "@/components/TransactionsTable";

export const initialReportTransactions: Transaction[] = [
  { orderId: "ORD-1001", date: "2026-03-08 09:12", customerPhone: "+233 24 111 2233", amount: "₦42.50", cashier: "Ama K.", location: "Downtown Supermarket", outletAddress: "12 Independence Ave, Accra", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦20.00" }, { method: "Card", amount: "₦22.50" }], orderStatus: "Completed", customerName: "Akua Mensah", orderType: "takeaway", subtotal: "₦42.50", paidAmount: "₦42.50", items: [{ name: "Rice 5kg", qty: 1, unitPrice: "₦25.00", total: "₦25.00" }, { name: "Cooking Oil 1L", qty: 1, unitPrice: "₦17.50", total: "₦17.50" }] },
  { orderId: "ORD-1002", date: "2026-03-08 09:28", customerPhone: "+233 20 555 7788", amount: "₦128.00", cashier: "Kofi B.", location: "Mall Food Court", outletAddress: "Accra Mall, 1st Floor", paymentStatus: "Paid", payments: [{ method: "Card", amount: "₦128.00" }], orderStatus: "Completed", customerName: "Kojo Antwi", orderType: "dine_in", tableLabel: "Table 7", notes: "Allergy: peanuts", subtotal: "₦124.00", fees: [{ name: "Service Charge (5%)", amount: "₦6.20" }], discount: "₦5.00", discountName: "Lunch Combo", tip: "₦2.80", paidAmount: "₦128.00", loyalty: { customerName: "Kojo Antwi", tier: "Gold", rewardName: "₦5 off Lunch Combo", discountValue: "₦5.00", pointsUsed: 50, pointsEarned: 24, pointsBalance: 1280 }, items: [{ name: "Grilled Chicken Combo", qty: 2, unitPrice: "₦45.00", total: "₦90.00", variantName: "Spicy", extras: [{ name: "Extra Sauce", qty: 1, price: "₦2.00" }, { name: "Cheese", qty: 2, price: "₦3.00" }], notes: "No onions, extra spicy on one" }, { name: "Fresh Juice", qty: 2, unitPrice: "₦12.00", total: "₦24.00", variantName: "Pineapple", notes: "Less ice" }, { name: "Side Salad", qty: 2, unitPrice: "₦5.00", total: "₦10.00", notes: "Dressing on the side" }] },
  { orderId: "ORD-1003", date: "2026-03-08 09:45", customerPhone: "+233 27 333 4455", amount: "₦35.75", cashier: "Ama K.", location: "Downtown Supermarket", paymentStatus: "Refunded", payments: [{ method: "Mobile Money", amount: "₦35.75" }], orderStatus: "Cancelled", customerName: "Adwoa Boateng", orderType: "takeaway", subtotal: "₦35.75", paidAmount: "₦35.75", items: [{ name: "Shampoo 500ml", qty: 1, unitPrice: "₦18.75", total: "₦18.75" }, { name: "Conditioner 500ml", qty: 1, unitPrice: "₦17.00", total: "₦17.00" }] },
  { orderId: "ORD-1004", date: "2026-03-08 10:02", customerPhone: "+233 55 222 9900", amount: "₦67.20", cashier: "Yaw M.", location: "Westside Salon", paymentStatus: "Paid", payments: [{ method: "Card", amount: "₦50.00" }, { method: "Cash", amount: "₦17.20" }], orderStatus: "Completed", customerName: "Yaa Asantewaa", orderType: "service", subtotal: "₦67.20", paidAmount: "₦67.20", items: [{ name: "Haircut - Men", qty: 1, unitPrice: "₦35.00", total: "₦35.00", variantName: "Standard" }, { name: "Beard Trim", qty: 1, unitPrice: "₦15.00", total: "₦15.00" }, { name: "Hair Gel", qty: 1, unitPrice: "₦17.20", total: "₦17.20" }] },
  { orderId: "ORD-1005", date: "2026-03-08 10:18", customerPhone: "+233 24 888 1122", amount: "₦215.00", cashier: "Kofi B.", location: "Mall Food Court", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦100.00" }, { method: "Mobile Money", amount: "₦115.00" }], orderStatus: "Completed", customerName: "Nana Osei", orderType: "dine_in", tableLabel: "Table 12", subtotal: "₦215.00", paidAmount: "₦215.00", loyalty: { customerName: "Nana Osei", tier: "Silver", pointsEarned: 43, pointsBalance: 612 }, items: [{ name: "Family Platter", qty: 1, unitPrice: "₦150.00", total: "₦150.00", extras: [{ name: "Extra Plantain", qty: 1, price: "₦5.00" }], notes: "Well done, no pepper" }, { name: "Soft Drinks Pack", qty: 1, unitPrice: "₦35.00", total: "₦35.00" }, { name: "Dessert Bowl", qty: 2, unitPrice: "₦15.00", total: "₦30.00", notes: "One vanilla, one chocolate" }] },
  { orderId: "ORD-1006", date: "2026-03-08 10:35", customerPhone: "+233 50 666 3344", amount: "₦19.99", cashier: "Esi D.", location: "Airport Kiosk", paymentStatus: "Paid", payments: [{ method: "Mobile Money", amount: "₦19.99" }], orderStatus: "Completed", items: [{ name: "Bottled Water", qty: 2, unitPrice: "₦3.00", total: "₦6.00" }, { name: "Sandwich", qty: 1, unitPrice: "₦13.99", total: "₦13.99" }] },
  { orderId: "ORD-1007", date: "2026-03-08 10:50", customerPhone: "+233 26 444 5566", amount: "₦88.00", cashier: "Ama K.", location: "Downtown Supermarket", paymentStatus: "Pending", payments: [{ method: "Bank Transfer", amount: "₦88.00" }], orderStatus: "Processing", customerName: "Kwame Nkrumah", subtotal: "₦88.00", paidAmount: "₦0.00", balanceDue: "₦88.00", items: [{ name: "Milk 2L", qty: 2, unitPrice: "₦12.00", total: "₦24.00" }, { name: "Bread Loaf", qty: 3, unitPrice: "₦8.00", total: "₦24.00" }, { name: "Eggs (Crate)", qty: 1, unitPrice: "₦40.00", total: "₦40.00" }] },
  { orderId: "ORD-1008", date: "2026-03-08 11:05", customerPhone: "+233 24 777 8899", amount: "₦54.30", cashier: "Yaw M.", location: "Westside Salon", paymentStatus: "Paid", payments: [{ method: "Card", amount: "₦54.30" }], orderStatus: "Completed", items: [{ name: "Manicure", qty: 1, unitPrice: "₦30.00", total: "₦30.00" }, { name: "Nail Polish", qty: 1, unitPrice: "₦24.30", total: "₦24.30" }] },
  { orderId: "ORD-1009", date: "2026-03-08 11:22", customerPhone: "+233 20 999 0011", amount: "₦32.00", cashier: "Esi D.", location: "Airport Kiosk", paymentStatus: "Failed", payments: [{ method: "Card", amount: "₦32.00" }], orderStatus: "On Hold", items: [{ name: "Magazine", qty: 1, unitPrice: "₦12.00", total: "₦12.00" }, { name: "Snack Box", qty: 1, unitPrice: "₦20.00", total: "₦20.00" }] },
  { orderId: "ORD-1010", date: "2026-03-08 11:40", customerPhone: "+233 55 111 4455", amount: "₦76.50", cashier: "Kofi B.", location: "Mall Food Court", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦80.00" }], orderStatus: "Completed", subtotal: "₦76.50", paidAmount: "₦80.00", changeDue: "₦3.50", items: [{ name: "Burger Meal", qty: 1, unitPrice: "₦42.00", total: "₦42.00", extras: [{ name: "Bacon", qty: 1, price: "₦4.00" }, { name: "Extra Cheese", qty: 1, price: "₦2.00" }], notes: "Medium well, no pickles" }, { name: "Fries - Large", qty: 1, unitPrice: "₦18.50", total: "₦18.50", notes: "Extra salt" }, { name: "Milkshake", qty: 1, unitPrice: "₦10.00", total: "₦10.00", variantName: "Vanilla" }] },
  { orderId: "ORD-1011", date: "2026-03-08 11:55", customerPhone: "+233 27 222 6677", amount: "₦145.00", cashier: "Ama K.", location: "Downtown Supermarket", paymentStatus: "Paid", payments: [{ method: "Mobile Money", amount: "₦45.00" }, { method: "Card", amount: "₦100.00" }], orderStatus: "Completed", items: [{ name: "Detergent 3kg", qty: 1, unitPrice: "₦45.00", total: "₦45.00" }, { name: "Toilet Paper (12-pack)", qty: 2, unitPrice: "₦25.00", total: "₦50.00" }, { name: "Bleach 2L", qty: 2, unitPrice: "₦25.00", total: "₦50.00" }] },
  { orderId: "ORD-1012", date: "2026-03-08 12:10", customerPhone: "+233 24 333 8899", amount: "₦28.75", cashier: "Yaw M.", location: "Westside Salon", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦28.75" }], orderStatus: "Completed", items: [{ name: "Eyebrow Threading", qty: 1, unitPrice: "₦15.00", total: "₦15.00" }, { name: "Face Cream", qty: 1, unitPrice: "₦13.75", total: "₦13.75" }] },
];

export const useGetTransactions = (
  params?: {
    outletId?: string;
    search?: string;
    cashier?: string;
    paymentMethod?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams("/api/admin/transactions", params)
    : null;

  return useApi<Transaction[]>(url, {
    fetcher: async () => {
      // Simulate backend API filter logic
      await new Promise((resolve) => setTimeout(resolve, 50));
      let result = [...initialReportTransactions];

      if (params?.cashier && params.cashier !== "all") {
        result = result.filter((t) => t.cashier === params.cashier);
      }
      if (params?.paymentMethod && params.paymentMethod !== "all") {
        result = result.filter((t) => t.payments.some((p) => p.method === params.paymentMethod));
      }
      if (params?.search) {
        const q = params.search.trim().toLowerCase();
        result = result.filter(
          (t) =>
            t.orderId.toLowerCase().includes(q) ||
            t.customerPhone.toLowerCase().includes(q) ||
            t.cashier.toLowerCase().includes(q) ||
            t.location.toLowerCase().includes(q) ||
            t.payments.some((p) => p.method.toLowerCase().includes(q)) ||
            t.orderStatus.toLowerCase().includes(q) ||
            t.paymentStatus.toLowerCase().includes(q)
        );
      }
      return result;
    },
    ...options,
  });
};
