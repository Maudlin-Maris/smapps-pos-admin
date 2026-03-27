import type { BusinessTypeId } from "./businessTypes";

export interface POSCategory {
  id: string;
  name: string;
  subcategories?: POSSubcategory[];
  icon?: string;
}

export interface POSSubcategory {
  id: string;
  name: string;
}

export interface POSVariant {
  id: string;
  name: string;
  price: number;
  sku?: string;
}

export interface POSExtra {
  id: string;
  name: string;
  price: number;
  category?: string; // e.g. "Toppings", "Extras", "Sides"
}

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  subcategoryId?: string;
  image?: string;
  barcode?: string;
  variants?: POSVariant[];
  extras?: POSExtra[];
  inStock: boolean;
  outletId: string;
}

export interface POSCartItem {
  id: string; // unique cart item id
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  extras: { id: string; name: string; price: number }[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export type OrderStatus = "open" | "in_progress" | "ready" | "served" | "paid" | "voided";
export type OrderType = "dine_in" | "takeaway" | "delivery";
export type PaymentMethod = "cash" | "card" | "mobile" | "transfer";

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

export interface POSOrder {
  id: string;
  orderNumber: string;
  items: POSCartItem[];
  status: OrderStatus;
  type: OrderType;
  tableNumber?: string;
  customerName?: string;
  payments: PaymentEntry[];
  totalAmount: number;
  paidAmount: number;
  createdAt: Date;
  updatedAt: Date;
  outletId: string;
  cashierId: string;
  notes?: string;
}

export interface POSCashier {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-digit
  avatar?: string;
  assignedOutlets: string[];
  role: "cashier" | "manager";
}

export interface POSOutlet {
  id: string;
  name: string;
  businessType: BusinessTypeId;
}

// Mock Data
export const posCashiers: POSCashier[] = [
  { id: "c1", name: "Sarah Johnson", username: "sarah", pin: "1234", assignedOutlets: ["outlet-1", "outlet-2", "outlet-7"], role: "manager" },
  { id: "c2", name: "Mike Chen", username: "mike", pin: "5678", assignedOutlets: ["outlet-1", "outlet-3"], role: "cashier" },
  { id: "c3", name: "Amara Obi", username: "amara", pin: "9012", assignedOutlets: ["outlet-1", "outlet-5", "outlet-7"], role: "cashier" },
  { id: "c4", name: "David Adeyemi", username: "david", pin: "3456", assignedOutlets: ["outlet-2", "outlet-4"], role: "cashier" },
];

export const posCategories: POSCategory[] = [
  { id: "cat-1", name: "🍔 Burgers", subcategories: [
    { id: "sub-1a", name: "Classic" },
    { id: "sub-1b", name: "Premium" },
    { id: "sub-1c", name: "Plant-Based" },
  ]},
  { id: "cat-2", name: "🍕 Pizza", subcategories: [
    { id: "sub-2a", name: "Traditional" },
    { id: "sub-2b", name: "Specialty" },
  ]},
  { id: "cat-3", name: "🥗 Salads" },
  { id: "cat-4", name: "🍟 Sides" },
  { id: "cat-5", name: "🥤 Beverages", subcategories: [
    { id: "sub-5a", name: "Cold Drinks" },
    { id: "sub-5b", name: "Hot Drinks" },
    { id: "sub-5c", name: "Smoothies" },
  ]},
  { id: "cat-6", name: "🍰 Desserts" },
  { id: "cat-7", name: "🍺 Alcohol", subcategories: [
    { id: "sub-7a", name: "Beer" },
    { id: "sub-7b", name: "Wine" },
    { id: "sub-7c", name: "Cocktails" },
  ]},
];

const burgerExtras: POSExtra[] = [
  { id: "ex-1", name: "Extra Cheese", price: 1.50, category: "Toppings" },
  { id: "ex-2", name: "Bacon", price: 2.00, category: "Toppings" },
  { id: "ex-3", name: "Avocado", price: 2.50, category: "Toppings" },
  { id: "ex-4", name: "Jalapeños", price: 1.00, category: "Toppings" },
  { id: "ex-5", name: "Onion Rings", price: 1.50, category: "Sides" },
  { id: "ex-6", name: "Coleslaw", price: 1.00, category: "Sides" },
];

const drinkExtras: POSExtra[] = [
  { id: "ex-d1", name: "Extra Shot", price: 1.00, category: "Add-ons" },
  { id: "ex-d2", name: "Whipped Cream", price: 0.50, category: "Add-ons" },
  { id: "ex-d3", name: "Oat Milk", price: 0.75, category: "Add-ons" },
  { id: "ex-d4", name: "Vanilla Syrup", price: 0.50, category: "Add-ons" },
];

export const posProducts: POSProduct[] = [
  // Burgers
  { id: "p1", name: "Classic Beef Burger", price: 12.99, categoryId: "cat-1", subcategoryId: "sub-1a", barcode: "1234567890", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v1a", name: "Single", price: 12.99 }, { id: "v1b", name: "Double", price: 16.99 }],
    extras: burgerExtras },
  { id: "p2", name: "Chicken Burger", price: 11.99, categoryId: "cat-1", subcategoryId: "sub-1a", barcode: "1234567891", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v2a", name: "Regular", price: 11.99 }, { id: "v2b", name: "Spicy", price: 12.99 }],
    extras: burgerExtras },
  { id: "p3", name: "Wagyu Burger", price: 24.99, categoryId: "cat-1", subcategoryId: "sub-1b", inStock: true, outletId: "outlet-1", extras: burgerExtras },
  { id: "p4", name: "Truffle Burger", price: 22.99, categoryId: "cat-1", subcategoryId: "sub-1b", inStock: true, outletId: "outlet-1", extras: burgerExtras },
  { id: "p5", name: "Beyond Burger", price: 14.99, categoryId: "cat-1", subcategoryId: "sub-1c", inStock: true, outletId: "outlet-1", extras: burgerExtras },

  // Pizza
  { id: "p6", name: "Margherita", price: 14.99, categoryId: "cat-2", subcategoryId: "sub-2a", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v6a", name: "Small 10\"", price: 10.99 }, { id: "v6b", name: "Medium 12\"", price: 14.99 }, { id: "v6c", name: "Large 16\"", price: 19.99 }] },
  { id: "p7", name: "Pepperoni", price: 16.99, categoryId: "cat-2", subcategoryId: "sub-2a", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v7a", name: "Small 10\"", price: 12.99 }, { id: "v7b", name: "Medium 12\"", price: 16.99 }, { id: "v7c", name: "Large 16\"", price: 21.99 }] },
  { id: "p8", name: "BBQ Chicken Pizza", price: 18.99, categoryId: "cat-2", subcategoryId: "sub-2b", inStock: true, outletId: "outlet-1" },
  { id: "p9", name: "Truffle Mushroom", price: 20.99, categoryId: "cat-2", subcategoryId: "sub-2b", inStock: false, outletId: "outlet-1" },

  // Salads
  { id: "p10", name: "Caesar Salad", price: 9.99, categoryId: "cat-3", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v10a", name: "Regular", price: 9.99 }, { id: "v10b", name: "Large", price: 13.99 }] },
  { id: "p11", name: "Greek Salad", price: 10.99, categoryId: "cat-3", inStock: true, outletId: "outlet-1" },

  // Sides
  { id: "p12", name: "French Fries", price: 4.99, categoryId: "cat-4", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v12a", name: "Regular", price: 4.99 }, { id: "v12b", name: "Large", price: 6.99 }] },
  { id: "p13", name: "Sweet Potato Fries", price: 5.99, categoryId: "cat-4", inStock: true, outletId: "outlet-1" },
  { id: "p14", name: "Mozzarella Sticks", price: 7.99, categoryId: "cat-4", inStock: true, outletId: "outlet-1" },
  { id: "p15", name: "Chicken Wings", price: 10.99, categoryId: "cat-4", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v15a", name: "6pc", price: 10.99 }, { id: "v15b", name: "12pc", price: 18.99 }] },

  // Beverages
  { id: "p16", name: "Coca-Cola", price: 2.99, categoryId: "cat-5", subcategoryId: "sub-5a", barcode: "5449000000996", inStock: true, outletId: "outlet-1" },
  { id: "p17", name: "Fresh Lemonade", price: 4.99, categoryId: "cat-5", subcategoryId: "sub-5a", inStock: true, outletId: "outlet-1" },
  { id: "p18", name: "Espresso", price: 3.99, categoryId: "cat-5", subcategoryId: "sub-5b", inStock: true, outletId: "outlet-1", extras: drinkExtras },
  { id: "p19", name: "Cappuccino", price: 4.99, categoryId: "cat-5", subcategoryId: "sub-5b", inStock: true, outletId: "outlet-1", extras: drinkExtras,
    variants: [{ id: "v19a", name: "Small", price: 3.99 }, { id: "v19b", name: "Regular", price: 4.99 }, { id: "v19c", name: "Large", price: 5.99 }] },
  { id: "p20", name: "Mango Smoothie", price: 6.99, categoryId: "cat-5", subcategoryId: "sub-5c", inStock: true, outletId: "outlet-1" },

  // Desserts
  { id: "p21", name: "Chocolate Cake", price: 7.99, categoryId: "cat-6", inStock: true, outletId: "outlet-1" },
  { id: "p22", name: "Cheesecake", price: 8.99, categoryId: "cat-6", inStock: true, outletId: "outlet-1" },
  { id: "p23", name: "Ice Cream Sundae", price: 6.99, categoryId: "cat-6", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v23a", name: "Single Scoop", price: 4.99 }, { id: "v23b", name: "Double Scoop", price: 6.99 }, { id: "v23c", name: "Triple Scoop", price: 8.99 }] },

  // Alcohol
  { id: "p24", name: "House Lager", price: 5.99, categoryId: "cat-7", subcategoryId: "sub-7a", inStock: true, outletId: "outlet-1" },
  { id: "p25", name: "IPA Draft", price: 7.99, categoryId: "cat-7", subcategoryId: "sub-7a", inStock: true, outletId: "outlet-1" },
  { id: "p26", name: "House Red Wine", price: 8.99, categoryId: "cat-7", subcategoryId: "sub-7b", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v26a", name: "Glass", price: 8.99 }, { id: "v26b", name: "Bottle", price: 32.99 }] },
  { id: "p27", name: "Mojito", price: 12.99, categoryId: "cat-7", subcategoryId: "sub-7c", inStock: true, outletId: "outlet-1" },
  { id: "p28", name: "Margarita", price: 13.99, categoryId: "cat-7", subcategoryId: "sub-7c", inStock: true, outletId: "outlet-1" },
];

// Mock existing orders
export const mockOrders: POSOrder[] = [
  {
    id: "ord-1", orderNumber: "#001", status: "open", type: "dine_in", tableNumber: "T-5",
    customerName: "Table 5", outletId: "outlet-1", cashierId: "c1",
    items: [
      { id: "ci-1", productId: "p1", productName: "Classic Beef Burger", variantId: "v1b", variantName: "Double", extras: [{ id: "ex-1", name: "Extra Cheese", price: 1.50 }], quantity: 2, unitPrice: 18.49, totalPrice: 36.98 },
      { id: "ci-2", productId: "p12", productName: "French Fries", variantId: "v12b", variantName: "Large", extras: [], quantity: 2, unitPrice: 6.99, totalPrice: 13.98 },
      { id: "ci-3", productId: "p16", productName: "Coca-Cola", extras: [], quantity: 2, unitPrice: 2.99, totalPrice: 5.98 },
    ],
    payments: [], totalAmount: 56.94, paidAmount: 0,
    createdAt: new Date(Date.now() - 30 * 60000), updatedAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "ord-2", orderNumber: "#002", status: "in_progress", type: "dine_in", tableNumber: "T-12",
    customerName: "Table 12", outletId: "outlet-1", cashierId: "c2",
    items: [
      { id: "ci-4", productId: "p6", productName: "Margherita", variantId: "v6c", variantName: "Large 16\"", extras: [], quantity: 1, unitPrice: 19.99, totalPrice: 19.99 },
      { id: "ci-5", productId: "p7", productName: "Pepperoni", variantId: "v7b", variantName: "Medium 12\"", extras: [], quantity: 1, unitPrice: 16.99, totalPrice: 16.99 },
      { id: "ci-6", productId: "p25", productName: "IPA Draft", extras: [], quantity: 3, unitPrice: 7.99, totalPrice: 23.97 },
    ],
    payments: [], totalAmount: 60.95, paidAmount: 0,
    createdAt: new Date(Date.now() - 45 * 60000), updatedAt: new Date(Date.now() - 20 * 60000),
  },
  {
    id: "ord-3", orderNumber: "#003", status: "ready", type: "takeaway",
    customerName: "James W.", outletId: "outlet-1", cashierId: "c1",
    items: [
      { id: "ci-7", productId: "p2", productName: "Chicken Burger", variantId: "v2b", variantName: "Spicy", extras: [{ id: "ex-2", name: "Bacon", price: 2.00 }], quantity: 1, unitPrice: 14.99, totalPrice: 14.99 },
      { id: "ci-8", productId: "p13", productName: "Sweet Potato Fries", extras: [], quantity: 1, unitPrice: 5.99, totalPrice: 5.99 },
    ],
    payments: [{ method: "card", amount: 20.98 }], totalAmount: 20.98, paidAmount: 20.98,
    createdAt: new Date(Date.now() - 15 * 60000), updatedAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "ord-4", orderNumber: "#004", status: "served", type: "dine_in", tableNumber: "T-3",
    customerName: "Table 3", outletId: "outlet-1", cashierId: "c3",
    items: [
      { id: "ci-9", productId: "p10", productName: "Caesar Salad", variantId: "v10b", variantName: "Large", extras: [], quantity: 1, unitPrice: 13.99, totalPrice: 13.99 },
      { id: "ci-10", productId: "p19", productName: "Cappuccino", variantId: "v19b", variantName: "Regular", extras: [{ id: "ex-d1", name: "Extra Shot", price: 1.00 }], quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
    ],
    payments: [], totalAmount: 25.97, paidAmount: 0,
    createdAt: new Date(Date.now() - 60 * 60000), updatedAt: new Date(Date.now() - 10 * 60000),
  },
];

export const posOutlets: POSOutlet[] = [
  { id: "outlet-1", name: "Downtown Flagship", businessType: "restaurant" },
  { id: "outlet-2", name: "Mall Branch", businessType: "retail" },
  { id: "outlet-3", name: "Airport Kiosk", businessType: "restaurant" },
  { id: "outlet-4", name: "Suburban Pharmacy", businessType: "pharmacy" },
  { id: "outlet-5", name: "Glow Beauty Salon", businessType: "salon" },
  { id: "outlet-7", name: "FreshMart Grocery", businessType: "grocery" },
];
