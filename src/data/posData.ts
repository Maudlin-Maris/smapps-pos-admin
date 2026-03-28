import type { BusinessTypeId } from "./businessTypes";

export interface POSCategory {
  id: string;
  name: string;
  subcategories?: POSSubcategory[];
  icon?: string;
  outletId?: string; // if set, only show for this outlet
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
  category?: string;
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

export type ItemStatus = "open" | "in_progress" | "ready" | "served";

export interface POSCartItem {
  id: string;
  productId: string;
  productName: string;
  categoryId?: string;
  variantId?: string;
  variantName?: string;
  extras: { id: string; name: string; price: number; quantity: number }[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  itemStatus?: ItemStatus;
}

export type OrderStatus = "open" | "in_progress" | "ready" | "served" | "paid" | "voided";
export type OrderType = "dine_in" | "takeaway" | "delivery" | "pickup" | "walk_in";
export type PaymentMethod = "cash" | "card" | "mobile" | "transfer";

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

export interface POSDiscount {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number; // percentage (0-100) or fixed amount in Naira
}

export interface POSLocation {
  id: string;
  name: string;
  outletId: string;
}

export interface AppliedFee {
  name: string;
  amount: number;
}

export interface POSOrder {
  id: string;
  orderNumber: string;
  items: POSCartItem[];
  status: OrderStatus;
  type: OrderType;
  tableNumber?: string;
  locationName?: string;
  customerName?: string;
  payments: PaymentEntry[];
  totalAmount: number;
  paidAmount: number;
  tipAmount?: number;
  discountAmount?: number;
  discountName?: string;
  appliedFees?: AppliedFee[];
  feesTotal?: number;
  createdAt: Date;
  updatedAt: Date;
  outletId: string;
  cashierId: string;
  transferredToCashierId?: string;
  notes?: string;
}

export interface POSCashier {
  id: string;
  name: string;
  username: string;
  pin: string;
  avatar?: string;
  assignedOutlets: string[];
  role: "cashier" | "manager";
}

export interface OutletFee {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  appliesTo?: OrderType[]; // if set, only apply for these order types
  enabled: boolean;
}

export interface POSOutlet {
  id: string;
  name: string;
  businessType: BusinessTypeId;
  email?: string;
  phone?: string;
  address?: string;
  fees?: OutletFee[];
}

// --- Preconfigured Discounts ---
export const posDiscounts: POSDiscount[] = [
  { id: "disc-1", name: "Manager's Discount", type: "percentage", value: 10 },
  { id: "disc-2", name: "Sarah's Discount", type: "percentage", value: 5 },
  { id: "disc-3", name: "Staff Discount", type: "percentage", value: 15 },
  { id: "disc-4", name: "VIP Customer", type: "percentage", value: 20 },
  { id: "disc-5", name: "₦500 Off", type: "fixed", value: 500 },
  { id: "disc-6", name: "₦1,000 Off", type: "fixed", value: 1000 },
];

// --- Locations per outlet ---
export const posLocations: POSLocation[] = [
  // Restaurant locations — Tables
  ...Array.from({ length: 40 }, (_, i) => ({ id: `loc-t${i + 1}`, name: `Table ${i + 1}`, outletId: "outlet-1" })),
  // Restaurant locations — VIP
  ...Array.from({ length: 8 }, (_, i) => ({ id: `loc-v${i + 1}`, name: `VIP ${i + 1}`, outletId: "outlet-1" })),
  // Restaurant locations — Outdoor
  ...Array.from({ length: 10 }, (_, i) => ({ id: `loc-o${i + 1}`, name: `Outdoor ${i + 1}`, outletId: "outlet-1" })),
  // Restaurant locations — Bar
  { id: "loc-bar1", name: "Bar Counter 1", outletId: "outlet-1" },
  { id: "loc-bar2", name: "Bar Counter 2", outletId: "outlet-1" },
  // Restaurant locations — Rooftop
  ...Array.from({ length: 10 }, (_, i) => ({ id: `loc-r${i + 1}`, name: `Rooftop ${i + 1}`, outletId: "outlet-1" })),
  // Restaurant locations — Private Dining
  ...Array.from({ length: 5 }, (_, i) => ({ id: `loc-pd${i + 1}`, name: `Private Dining ${i + 1}`, outletId: "outlet-1" })),
  // Airport kiosk
  { id: "loc-11", name: "Counter 1", outletId: "outlet-3" },
  { id: "loc-12", name: "Counter 2", outletId: "outlet-3" },
  { id: "loc-13", name: "Waiting Area", outletId: "outlet-3" },
  // Salon stations
  { id: "loc-14", name: "Station 1", outletId: "outlet-5" },
  { id: "loc-15", name: "Station 2", outletId: "outlet-5" },
  { id: "loc-16", name: "Station 3", outletId: "outlet-5" },
  { id: "loc-17", name: "Wash Basin", outletId: "outlet-5" },
];

// Mock Data
export const posCashiers: POSCashier[] = [
  { id: "c1", name: "Sarah Johnson", username: "sarah", pin: "1234", assignedOutlets: ["outlet-1", "outlet-2", "outlet-4", "outlet-5", "outlet-7"], role: "manager" },
  { id: "c2", name: "Mike Chen", username: "mike", pin: "5678", assignedOutlets: ["outlet-1", "outlet-3"], role: "cashier" },
  { id: "c3", name: "Amara Obi", username: "amara", pin: "9012", assignedOutlets: ["outlet-1", "outlet-5", "outlet-7"], role: "cashier" },
  { id: "c4", name: "David Adeyemi", username: "david", pin: "3456", assignedOutlets: ["outlet-2", "outlet-4"], role: "cashier" },
];

// ==================== CATEGORIES ====================

// Restaurant categories
const restaurantCategories: POSCategory[] = [
  { id: "rcat-1", name: "🍔 Burgers", outletId: "outlet-1", subcategories: [
    { id: "rsub-1a", name: "Classic" }, { id: "rsub-1b", name: "Premium" },
  ]},
  { id: "rcat-2", name: "🍕 Pizza", outletId: "outlet-1", subcategories: [
    { id: "rsub-2a", name: "Traditional" }, { id: "rsub-2b", name: "Specialty" },
  ]},
  { id: "rcat-3", name: "🥗 Salads", outletId: "outlet-1" },
  { id: "rcat-4", name: "🍟 Sides", outletId: "outlet-1" },
  { id: "rcat-5", name: "🥤 Beverages", outletId: "outlet-1", subcategories: [
    { id: "rsub-5a", name: "Cold Drinks" }, { id: "rsub-5b", name: "Hot Drinks" },
  ]},
  { id: "rcat-6", name: "🍰 Desserts", outletId: "outlet-1" },
  { id: "rcat-7", name: "🍺 Alcohol", outletId: "outlet-1", subcategories: [
    { id: "rsub-7a", name: "Beer" }, { id: "rsub-7b", name: "Wine" }, { id: "rsub-7c", name: "Cocktails" },
  ]},
];

// Pharmacy categories
const pharmacyCategories: POSCategory[] = [
  { id: "pcat-1", name: "💊 Medications", outletId: "outlet-4", subcategories: [
    { id: "psub-1a", name: "Prescription" }, { id: "psub-1b", name: "OTC" },
  ]},
  { id: "pcat-2", name: "🩹 First Aid", outletId: "outlet-4" },
  { id: "pcat-3", name: "🧴 Personal Care", outletId: "outlet-4" },
  { id: "pcat-4", name: "🍼 Baby Care", outletId: "outlet-4" },
  { id: "pcat-5", name: "💪 Supplements", outletId: "outlet-4" },
];

// Salon categories
const salonCategories: POSCategory[] = [
  { id: "scat-1", name: "✂️ Hair Services", outletId: "outlet-5", subcategories: [
    { id: "ssub-1a", name: "Styling" }, { id: "ssub-1b", name: "Treatments" },
  ]},
  { id: "scat-2", name: "💅 Nails", outletId: "outlet-5" },
  { id: "scat-3", name: "🧖 Facial & Skin", outletId: "outlet-5" },
  { id: "scat-4", name: "🛍️ Products", outletId: "outlet-5" },
];

// Retail categories
const retailCategories: POSCategory[] = [
  { id: "rtcat-1", name: "📱 Electronics", outletId: "outlet-2", subcategories: [
    { id: "rtsub-1a", name: "Phones" }, { id: "rtsub-1b", name: "Accessories" },
  ]},
  { id: "rtcat-2", name: "👕 Clothing", outletId: "outlet-2" },
  { id: "rtcat-3", name: "👟 Footwear", outletId: "outlet-2" },
  { id: "rtcat-4", name: "🎒 Bags", outletId: "outlet-2" },
];

// Grocery categories
const groceryCategories: POSCategory[] = [
  { id: "gcat-1", name: "🥬 Fresh Produce", outletId: "outlet-7" },
  { id: "gcat-2", name: "🥩 Meat & Poultry", outletId: "outlet-7" },
  { id: "gcat-3", name: "🧈 Dairy", outletId: "outlet-7" },
  { id: "gcat-4", name: "🥫 Canned Goods", outletId: "outlet-7" },
  { id: "gcat-5", name: "🍞 Bakery", outletId: "outlet-7" },
];

export const posCategories: POSCategory[] = [
  ...restaurantCategories,
  ...pharmacyCategories,
  ...salonCategories,
  ...retailCategories,
  ...groceryCategories,
];

// ==================== PRODUCTS ====================

const burgerExtras: POSExtra[] = [
  { id: "ex-1", name: "Extra Cheese", price: 500, category: "Toppings" },
  { id: "ex-2", name: "Bacon", price: 800, category: "Toppings" },
  { id: "ex-3", name: "Avocado", price: 1000, category: "Toppings" },
  { id: "ex-4", name: "Jalapeños", price: 300, category: "Toppings" },
  { id: "ex-5", name: "Onion Rings", price: 600, category: "Sides" },
  { id: "ex-6", name: "Coleslaw", price: 400, category: "Sides" },
];

const drinkExtras: POSExtra[] = [
  { id: "ex-d1", name: "Extra Shot", price: 500, category: "Add-ons" },
  { id: "ex-d2", name: "Whipped Cream", price: 300, category: "Add-ons" },
  { id: "ex-d3", name: "Oat Milk", price: 400, category: "Add-ons" },
  { id: "ex-d4", name: "Vanilla Syrup", price: 250, category: "Add-ons" },
];

// Restaurant products (outlet-1)
const restaurantProducts: POSProduct[] = [
  // Scenario: variants WITH extras AND product barcode
  { id: "p1", name: "Classic Beef Burger", price: 5500, categoryId: "rcat-1", subcategoryId: "rsub-1a", barcode: "1234567890", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v1a", name: "Single", price: 5500, sku: "BRG-CLASSIC-S" }, { id: "v1b", name: "Double", price: 8500, sku: "BRG-CLASSIC-D" }], extras: burgerExtras },
  // Scenario: variants WITH extras, product barcode
  { id: "p2", name: "Chicken Burger", price: 4800, categoryId: "rcat-1", subcategoryId: "rsub-1a", barcode: "1234567891", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v2a", name: "Regular", price: 4800, sku: "BRG-CHKN-R" }, { id: "v2b", name: "Spicy", price: 5200, sku: "BRG-CHKN-S" }], extras: burgerExtras },
  // Scenario: no variants, only extras
  { id: "p3", name: "Wagyu Burger", price: 15000, categoryId: "rcat-1", subcategoryId: "rsub-1b", barcode: "BRG-WAGYU", inStock: true, outletId: "outlet-1", extras: burgerExtras },
  { id: "p4", name: "Truffle Burger", price: 12500, categoryId: "rcat-1", subcategoryId: "rsub-1b", barcode: "BRG-TRFL", inStock: true, outletId: "outlet-1", extras: burgerExtras },
  // Scenario: variants only (no extras), with product barcode
  { id: "p6", name: "Margherita Pizza", price: 7500, categoryId: "rcat-2", subcategoryId: "rsub-2a", barcode: "PZZ-MARG", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v6a", name: "Small 10\"", price: 5500, sku: "PZZ-MARG-S" }, { id: "v6b", name: "Medium 12\"", price: 7500, sku: "PZZ-MARG-M" }, { id: "v6c", name: "Large 16\"", price: 11000, sku: "PZZ-MARG-L" }] },
  { id: "p7", name: "Pepperoni Pizza", price: 8500, categoryId: "rcat-2", subcategoryId: "rsub-2a", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v7a", name: "Small 10\"", price: 6500, sku: "PZZ-PEP-S" }, { id: "v7b", name: "Medium 12\"", price: 8500, sku: "PZZ-PEP-M" }, { id: "v7c", name: "Large 16\"", price: 12500, sku: "PZZ-PEP-L" }] },
  // Scenario: no variants, no extras, with barcode
  { id: "p8", name: "BBQ Chicken Pizza", price: 9500, categoryId: "rcat-2", subcategoryId: "rsub-2b", barcode: "PZZ-BBQ", inStock: true, outletId: "outlet-1" },
  // Scenario: out of stock (should not be scannable)
  { id: "p9", name: "Truffle Mushroom Pizza", price: 11000, categoryId: "rcat-2", subcategoryId: "rsub-2b", barcode: "PZZ-TRFL", inStock: false, outletId: "outlet-1" },
  // Scenario: variants only, no barcode on product
  { id: "p10", name: "Caesar Salad", price: 4500, categoryId: "rcat-3", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v10a", name: "Regular", price: 4500, sku: "SAL-CAES-R" }, { id: "v10b", name: "Large", price: 6500, sku: "SAL-CAES-L" }] },
  // Scenario: no variants, no extras, no barcode
  { id: "p11", name: "Greek Salad", price: 5000, categoryId: "rcat-3", inStock: true, outletId: "outlet-1" },
  { id: "p12", name: "French Fries", price: 2500, categoryId: "rcat-4", barcode: "FRIES-001", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v12a", name: "Regular", price: 2500, sku: "FRIES-R" }, { id: "v12b", name: "Large", price: 3800, sku: "FRIES-L" }] },
  { id: "p13", name: "Sweet Potato Fries", price: 3200, categoryId: "rcat-4", barcode: "FRIES-SP", inStock: true, outletId: "outlet-1" },
  { id: "p14", name: "Mozzarella Sticks", price: 4200, categoryId: "rcat-4", barcode: "MOZ-STK", inStock: true, outletId: "outlet-1" },
  { id: "p15", name: "Chicken Wings", price: 5500, categoryId: "rcat-4", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v15a", name: "6pc", price: 5500, sku: "WINGS-6" }, { id: "v15b", name: "12pc", price: 9800, sku: "WINGS-12" }] },
  // Scenario: simple product with barcode, no variants/extras
  { id: "p16", name: "Coca-Cola", price: 800, categoryId: "rcat-5", subcategoryId: "rsub-5a", barcode: "5449000000996", inStock: true, outletId: "outlet-1" },
  { id: "p17", name: "Fresh Lemonade", price: 2500, categoryId: "rcat-5", subcategoryId: "rsub-5a", barcode: "LEMON-001", inStock: true, outletId: "outlet-1" },
  // Scenario: extras only (no variants)
  { id: "p18", name: "Espresso", price: 2000, categoryId: "rcat-5", subcategoryId: "rsub-5b", barcode: "ESP-001", inStock: true, outletId: "outlet-1", extras: drinkExtras },
  // Scenario: variants AND extras
  { id: "p19", name: "Cappuccino", price: 2800, categoryId: "rcat-5", subcategoryId: "rsub-5b", barcode: "CAP-001", inStock: true, outletId: "outlet-1", extras: drinkExtras,
    variants: [{ id: "v19a", name: "Small", price: 2000, sku: "CAP-S" }, { id: "v19b", name: "Regular", price: 2800, sku: "CAP-R" }, { id: "v19c", name: "Large", price: 3500, sku: "CAP-L" }] },
  { id: "p20", name: "Mango Smoothie", price: 3500, categoryId: "rcat-5", subcategoryId: "rsub-5a", barcode: "SMOOTH-MNG", inStock: true, outletId: "outlet-1" },
  { id: "p21", name: "Chocolate Cake", price: 4000, categoryId: "rcat-6", barcode: "CAKE-CHOC", inStock: true, outletId: "outlet-1" },
  { id: "p22", name: "Cheesecake", price: 4500, categoryId: "rcat-6", barcode: "CAKE-CHSE", inStock: true, outletId: "outlet-1" },
  // Scenario: many variants, no extras
  { id: "p23", name: "Ice Cream Sundae", price: 3500, categoryId: "rcat-6", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v23a", name: "Single Scoop", price: 2500, sku: "ICE-1" }, { id: "v23b", name: "Double Scoop", price: 3500, sku: "ICE-2" }, { id: "v23c", name: "Triple Scoop", price: 4500, sku: "ICE-3" }] },
  { id: "p24", name: "House Lager", price: 2500, categoryId: "rcat-7", subcategoryId: "rsub-7a", barcode: "BEER-LAGER", inStock: true, outletId: "outlet-1" },
  { id: "p25", name: "IPA Draft", price: 3500, categoryId: "rcat-7", subcategoryId: "rsub-7a", barcode: "BEER-IPA", inStock: true, outletId: "outlet-1" },
  { id: "p26", name: "House Red Wine", price: 4500, categoryId: "rcat-7", subcategoryId: "rsub-7b", inStock: true, outletId: "outlet-1",
    variants: [{ id: "v26a", name: "Glass", price: 4500, sku: "WINE-RED-G" }, { id: "v26b", name: "Bottle", price: 18000, sku: "WINE-RED-B" }] },
  { id: "p27", name: "Mojito", price: 6500, categoryId: "rcat-7", subcategoryId: "rsub-7c", barcode: "CKTL-MOJ", inStock: true, outletId: "outlet-1" },
  { id: "p28", name: "Margarita", price: 7000, categoryId: "rcat-7", subcategoryId: "rsub-7c", barcode: "CKTL-MARG", inStock: true, outletId: "outlet-1" },
];

// Pharmacy products (outlet-4)
const pharmacyProducts: POSProduct[] = [
  { id: "ph1", name: "Paracetamol 500mg", price: 350, categoryId: "pcat-1", subcategoryId: "psub-1b", barcode: "PH001", inStock: true, outletId: "outlet-4" },
  { id: "ph2", name: "Ibuprofen 400mg", price: 550, categoryId: "pcat-1", subcategoryId: "psub-1b", barcode: "PH002", inStock: true, outletId: "outlet-4" },
  { id: "ph3", name: "Amoxicillin 250mg", price: 2800, categoryId: "pcat-1", subcategoryId: "psub-1a", barcode: "PH003", inStock: true, outletId: "outlet-4" },
  { id: "ph4", name: "Metformin 500mg", price: 3500, categoryId: "pcat-1", subcategoryId: "psub-1a", inStock: true, outletId: "outlet-4" },
  { id: "ph5", name: "Cough Syrup 100ml", price: 1800, categoryId: "pcat-1", subcategoryId: "psub-1b", barcode: "PH005", inStock: true, outletId: "outlet-4" },
  { id: "ph6", name: "Vitamin C 1000mg", price: 4500, categoryId: "pcat-5", barcode: "PH006", inStock: true, outletId: "outlet-4",
    variants: [{ id: "phv6a", name: "30 Tabs", price: 4500, sku: "VIT-C-30" }, { id: "phv6b", name: "60 Tabs", price: 7800, sku: "VIT-C-60" }] },
  { id: "ph7", name: "Omega-3 Fish Oil", price: 8500, categoryId: "pcat-5", barcode: "PH007", inStock: true, outletId: "outlet-4" },
  { id: "ph8", name: "First Aid Kit", price: 12500, categoryId: "pcat-2", barcode: "PH008", inStock: true, outletId: "outlet-4" },
  { id: "ph9", name: "Adhesive Bandages (Box)", price: 1500, categoryId: "pcat-2", barcode: "PH009", inStock: true, outletId: "outlet-4" },
  { id: "ph10", name: "Antiseptic Solution", price: 2200, categoryId: "pcat-2", barcode: "PH010", inStock: true, outletId: "outlet-4" },
  { id: "ph11", name: "Baby Diapers (Pack)", price: 8500, categoryId: "pcat-4", barcode: "PH011", inStock: true, outletId: "outlet-4",
    variants: [{ id: "phv11a", name: "Small (20pcs)", price: 5500, sku: "DIAPER-S" }, { id: "phv11b", name: "Medium (20pcs)", price: 7500, sku: "DIAPER-M" }, { id: "phv11c", name: "Large (20pcs)", price: 8500, sku: "DIAPER-L" }] },
  { id: "ph12", name: "Baby Formula 400g", price: 15000, categoryId: "pcat-4", barcode: "PH012", inStock: true, outletId: "outlet-4" },
  { id: "ph13", name: "Hand Sanitizer 500ml", price: 2500, categoryId: "pcat-3", barcode: "PH013", inStock: true, outletId: "outlet-4" },
  { id: "ph14", name: "Sunscreen SPF50", price: 6500, categoryId: "pcat-3", barcode: "PH014", inStock: true, outletId: "outlet-4" },
  { id: "ph15", name: "Blood Pressure Monitor", price: 45000, categoryId: "pcat-1", subcategoryId: "psub-1b", barcode: "PH015", inStock: true, outletId: "outlet-4" },
];

// Salon products (outlet-5)
const salonProducts: POSProduct[] = [
  { id: "sl1", name: "Women's Haircut", price: 8000, categoryId: "scat-1", subcategoryId: "ssub-1a", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv1a", name: "Basic Cut", price: 8000, sku: "HAIR-BASIC" }, { id: "slv1b", name: "Styled Cut", price: 12000, sku: "HAIR-STYLED" }, { id: "slv1c", name: "Premium Styling", price: 18000, sku: "HAIR-PREM" }] },
  { id: "sl2", name: "Hair Coloring", price: 25000, categoryId: "scat-1", subcategoryId: "ssub-1b", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv2a", name: "Full Color", price: 25000, sku: "COLOR-FULL" }, { id: "slv2b", name: "Highlights", price: 35000, sku: "COLOR-HIGH" }, { id: "slv2c", name: "Balayage", price: 55000, sku: "COLOR-BALY" }] },
  { id: "sl3", name: "Brazilian Blowout", price: 45000, categoryId: "scat-1", subcategoryId: "ssub-1b", barcode: "SL-BLOWOUT", inStock: true, outletId: "outlet-5" },
  { id: "sl4", name: "Hair Treatment", price: 15000, categoryId: "scat-1", subcategoryId: "ssub-1b", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv4a", name: "Deep Conditioning", price: 15000, sku: "TREAT-DEEP" }, { id: "slv4b", name: "Keratin Treatment", price: 35000, sku: "TREAT-KERA" }] },
  { id: "sl5", name: "Braiding", price: 20000, categoryId: "scat-1", subcategoryId: "ssub-1a", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv5a", name: "Box Braids", price: 20000, sku: "BRAID-BOX" }, { id: "slv5b", name: "Cornrows", price: 15000, sku: "BRAID-CORN" }, { id: "slv5c", name: "Ghana Weaving", price: 18000, sku: "BRAID-GHANA" }] },
  { id: "sl6", name: "Manicure", price: 5000, categoryId: "scat-2", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv6a", name: "Basic", price: 5000, sku: "MANI-BASIC" }, { id: "slv6b", name: "Gel Polish", price: 8000, sku: "MANI-GEL" }, { id: "slv6c", name: "Acrylic Nails", price: 15000, sku: "MANI-ACRY" }] },
  { id: "sl7", name: "Pedicure", price: 6000, categoryId: "scat-2", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv7a", name: "Basic", price: 6000, sku: "PEDI-BASIC" }, { id: "slv7b", name: "Spa Pedicure", price: 10000, sku: "PEDI-SPA" }] },
  { id: "sl8", name: "Facial Treatment", price: 12000, categoryId: "scat-3", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv8a", name: "Basic Facial", price: 12000, sku: "FACE-BASIC" }, { id: "slv8b", name: "Deep Cleanse", price: 18000, sku: "FACE-DEEP" }, { id: "slv8c", name: "Anti-Aging", price: 25000, sku: "FACE-ANTI" }] },
  { id: "sl9", name: "Shampoo & Conditioner Set", price: 8500, categoryId: "scat-4", barcode: "SL-SHAMPOO", inStock: true, outletId: "outlet-5" },
  { id: "sl10", name: "Hair Oil Treatment", price: 6500, categoryId: "scat-4", barcode: "SL-HAIROIL", inStock: true, outletId: "outlet-5" },
  { id: "sl11", name: "Wig Installation", price: 35000, categoryId: "scat-1", subcategoryId: "ssub-1a", inStock: true, outletId: "outlet-5",
    variants: [{ id: "slv11a", name: "Lace Front", price: 35000, sku: "WIG-LACE" }, { id: "slv11b", name: "Full Lace", price: 55000, sku: "WIG-FULL" }] },
];

// Retail products (outlet-2)
const retailProducts: POSProduct[] = [
  { id: "rt1", name: "iPhone 15 Case", price: 12000, categoryId: "rtcat-1", subcategoryId: "rtsub-1b", barcode: "RT001", inStock: true, outletId: "outlet-2" },
  { id: "rt2", name: "USB-C Cable 1m", price: 3500, categoryId: "rtcat-1", subcategoryId: "rtsub-1b", barcode: "RT002", inStock: true, outletId: "outlet-2" },
  { id: "rt3", name: "Wireless Earbuds", price: 25000, categoryId: "rtcat-1", subcategoryId: "rtsub-1b", barcode: "RT003", inStock: true, outletId: "outlet-2",
    variants: [{ id: "rtv3a", name: "Standard", price: 25000, sku: "EAR-STD" }, { id: "rtv3b", name: "Pro", price: 45000, sku: "EAR-PRO" }] },
  { id: "rt4", name: "Bluetooth Speaker", price: 35000, categoryId: "rtcat-1", subcategoryId: "rtsub-1b", barcode: "RT004", inStock: true, outletId: "outlet-2" },
  { id: "rt5", name: "Power Bank 20000mAh", price: 18000, categoryId: "rtcat-1", subcategoryId: "rtsub-1b", barcode: "RT005", inStock: true, outletId: "outlet-2" },
  { id: "rt6", name: "Cotton T-Shirt", price: 8500, categoryId: "rtcat-2", barcode: "RT006", inStock: true, outletId: "outlet-2",
    variants: [{ id: "rtv6a", name: "Small", price: 8500, sku: "TSHIRT-S" }, { id: "rtv6b", name: "Medium", price: 8500, sku: "TSHIRT-M" }, { id: "rtv6c", name: "Large", price: 9000, sku: "TSHIRT-L" }, { id: "rtv6d", name: "XL", price: 9500, sku: "TSHIRT-XL" }] },
  { id: "rt7", name: "Jeans", price: 22000, categoryId: "rtcat-2", barcode: "RT007", inStock: true, outletId: "outlet-2",
    variants: [{ id: "rtv7a", name: "Size 30", price: 22000, sku: "JEANS-30" }, { id: "rtv7b", name: "Size 32", price: 22000, sku: "JEANS-32" }, { id: "rtv7c", name: "Size 34", price: 23000, sku: "JEANS-34" }] },
  { id: "rt8", name: "Running Shoes", price: 35000, categoryId: "rtcat-3", barcode: "RT008", inStock: true, outletId: "outlet-2",
    variants: [{ id: "rtv8a", name: "Size 40", price: 35000, sku: "SHOE-40" }, { id: "rtv8b", name: "Size 42", price: 35000, sku: "SHOE-42" }, { id: "rtv8c", name: "Size 44", price: 36000, sku: "SHOE-44" }] },
  { id: "rt9", name: "Backpack", price: 28000, categoryId: "rtcat-4", barcode: "RT009", inStock: true, outletId: "outlet-2" },
  { id: "rt10", name: "Laptop Bag", price: 32000, categoryId: "rtcat-4", barcode: "RT010", inStock: true, outletId: "outlet-2" },
  { id: "rt11", name: "Screen Protector", price: 5000, categoryId: "rtcat-1", subcategoryId: "rtsub-1b", barcode: "RT011", inStock: true, outletId: "outlet-2" },
  { id: "rt12", name: "Samsung Galaxy S24", price: 650000, categoryId: "rtcat-1", subcategoryId: "rtsub-1a", barcode: "RT012", inStock: true, outletId: "outlet-2" },
];

// Grocery products (outlet-7)
const groceryProducts: POSProduct[] = [
  { id: "gr1", name: "Fresh Tomatoes (1kg)", price: 1500, categoryId: "gcat-1", barcode: "GR001", inStock: true, outletId: "outlet-7" },
  { id: "gr2", name: "Onions (1kg)", price: 1200, categoryId: "gcat-1", barcode: "GR002", inStock: true, outletId: "outlet-7" },
  { id: "gr3", name: "Bell Peppers (3pcs)", price: 2000, categoryId: "gcat-1", inStock: true, outletId: "outlet-7" },
  { id: "gr4", name: "Spinach Bunch", price: 800, categoryId: "gcat-1", inStock: true, outletId: "outlet-7" },
  { id: "gr5", name: "Chicken Breast (1kg)", price: 5500, categoryId: "gcat-2", inStock: true, outletId: "outlet-7" },
  { id: "gr6", name: "Beef Stew Meat (1kg)", price: 7500, categoryId: "gcat-2", inStock: true, outletId: "outlet-7" },
  { id: "gr7", name: "Fresh Milk 1L", price: 2200, categoryId: "gcat-3", barcode: "GR007", inStock: true, outletId: "outlet-7" },
  { id: "gr8", name: "Butter 250g", price: 3500, categoryId: "gcat-3", inStock: true, outletId: "outlet-7" },
  { id: "gr9", name: "Eggs (Crate of 30)", price: 4500, categoryId: "gcat-3", inStock: true, outletId: "outlet-7" },
  { id: "gr10", name: "Baked Beans 400g", price: 850, categoryId: "gcat-4", barcode: "GR010", inStock: true, outletId: "outlet-7" },
  { id: "gr11", name: "Tomato Paste 400g", price: 1200, categoryId: "gcat-4", barcode: "GR011", inStock: true, outletId: "outlet-7" },
  { id: "gr12", name: "Sliced Bread", price: 1800, categoryId: "gcat-5", barcode: "GR012", inStock: true, outletId: "outlet-7" },
  { id: "gr13", name: "Croissants (4pcs)", price: 3500, categoryId: "gcat-5", inStock: true, outletId: "outlet-7" },
  { id: "gr14", name: "Rice 5kg", price: 12500, categoryId: "gcat-4", inStock: true, outletId: "outlet-7" },
  { id: "gr15", name: "Vegetable Oil 3L", price: 8500, categoryId: "gcat-4", inStock: true, outletId: "outlet-7" },
];

export const posProducts: POSProduct[] = [
  ...restaurantProducts,
  ...pharmacyProducts,
  ...salonProducts,
  ...retailProducts,
  ...groceryProducts,
];

// Mock existing orders
export const mockOrders: POSOrder[] = [
  {
    id: "ord-1", orderNumber: "#001", status: "open", type: "dine_in", tableNumber: "Table 5",
    locationName: "Table 5", customerName: "Table 5", outletId: "outlet-1", cashierId: "c1",
    items: [
      { id: "ci-1", productId: "p1", productName: "Classic Beef Burger", variantId: "v1b", variantName: "Double", extras: [{ id: "ex-1", name: "Extra Cheese", price: 500, quantity: 1 }], quantity: 2, unitPrice: 9000, totalPrice: 18000 },
      { id: "ci-2", productId: "p12", productName: "French Fries", variantId: "v12b", variantName: "Large", extras: [], quantity: 2, unitPrice: 3800, totalPrice: 7600 },
      { id: "ci-3", productId: "p16", productName: "Coca-Cola", extras: [], quantity: 2, unitPrice: 800, totalPrice: 1600 },
    ],
    payments: [], totalAmount: 27200, paidAmount: 0,
    createdAt: new Date(Date.now() - 30 * 60000), updatedAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "ord-2", orderNumber: "#002", status: "in_progress", type: "dine_in", tableNumber: "VIP Lounge 1",
    locationName: "VIP 1", customerName: "VIP Lounge 1", outletId: "outlet-1", cashierId: "c2", transferredToCashierId: "c1",
    items: [
      { id: "ci-4", productId: "p6", productName: "Margherita Pizza", variantId: "v6c", variantName: "Large 16\"", extras: [], quantity: 1, unitPrice: 11000, totalPrice: 11000 },
      { id: "ci-5", productId: "p7", productName: "Pepperoni Pizza", variantId: "v7b", variantName: "Medium 12\"", extras: [], quantity: 1, unitPrice: 8500, totalPrice: 8500 },
      { id: "ci-6", productId: "p25", productName: "IPA Draft", extras: [], quantity: 3, unitPrice: 3500, totalPrice: 10500 },
    ],
    payments: [], totalAmount: 30000, paidAmount: 0,
    createdAt: new Date(Date.now() - 45 * 60000), updatedAt: new Date(Date.now() - 20 * 60000),
  },
  {
    id: "ord-3", orderNumber: "#003", status: "ready", type: "takeaway",
    customerName: "James W.", outletId: "outlet-1", cashierId: "c1",
    items: [
      { id: "ci-7", productId: "p2", productName: "Chicken Burger", variantId: "v2b", variantName: "Spicy", extras: [{ id: "ex-2", name: "Bacon", price: 800, quantity: 1 }], quantity: 1, unitPrice: 6000, totalPrice: 6000 },
      { id: "ci-8", productId: "p13", productName: "Sweet Potato Fries", extras: [], quantity: 1, unitPrice: 3200, totalPrice: 3200 },
    ],
    payments: [{ method: "card", amount: 9200 }], totalAmount: 9200, paidAmount: 9200,
    createdAt: new Date(Date.now() - 15 * 60000), updatedAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "ord-4", orderNumber: "#004", status: "open", type: "dine_in", tableNumber: "Table 12",
    locationName: "Table 12", customerName: "Table 12", outletId: "outlet-1", cashierId: "c3",
    items: [
      { id: "ci-9", productId: "p27", productName: "Mojito", extras: [], quantity: 2, unitPrice: 6500, totalPrice: 13000 },
    ],
    payments: [], totalAmount: 13000, paidAmount: 0,
    createdAt: new Date(Date.now() - 10 * 60000), updatedAt: new Date(Date.now() - 10 * 60000),
  },
  {
    id: "ord-5", orderNumber: "#005", status: "served", type: "dine_in", tableNumber: "Outdoor 3",
    locationName: "Outdoor 3", customerName: "Outdoor 3", outletId: "outlet-1", cashierId: "c1",
    items: [
      { id: "ci-10", productId: "p3", productName: "Wagyu Burger", extras: [], quantity: 1, unitPrice: 15000, totalPrice: 15000 },
      { id: "ci-11", productId: "p26", productName: "House Red Wine", variantId: "v26b", variantName: "Bottle", extras: [], quantity: 1, unitPrice: 18000, totalPrice: 18000 },
    ],
    payments: [{ method: "card", amount: 20000 }], totalAmount: 33000, paidAmount: 20000,
    createdAt: new Date(Date.now() - 60 * 60000), updatedAt: new Date(Date.now() - 25 * 60000),
  },
  {
    id: "ord-6", orderNumber: "#006", status: "paid", type: "takeaway",
    customerName: "Emeka O.", outletId: "outlet-1", cashierId: "c2",
    items: [
      { id: "ci-12", productId: "p8", productName: "BBQ Chicken Pizza", extras: [], quantity: 1, unitPrice: 9500, totalPrice: 9500 },
      { id: "ci-13", productId: "p17", productName: "Fresh Lemonade", extras: [], quantity: 1, unitPrice: 2500, totalPrice: 2500 },
    ],
    payments: [{ method: "cash", amount: 12000 }], totalAmount: 12000, paidAmount: 12000,
    createdAt: new Date(Date.now() - 90 * 60000), updatedAt: new Date(Date.now() - 80 * 60000),
  },
  {
    id: "ord-7", orderNumber: "#007", status: "in_progress", type: "dine_in", tableNumber: "Rooftop 2",
    locationName: "Rooftop 2", customerName: "Rooftop 2", outletId: "outlet-1", cashierId: "c3",
    items: [
      { id: "ci-14", productId: "p19", productName: "Cappuccino", variantId: "v19c", variantName: "Large", extras: [{ id: "ex-d1", name: "Extra Shot", price: 500, quantity: 1 }], quantity: 2, unitPrice: 4000, totalPrice: 8000 },
      { id: "ci-15", productId: "p21", productName: "Chocolate Cake", extras: [], quantity: 1, unitPrice: 4000, totalPrice: 4000 },
    ],
    payments: [], totalAmount: 12000, paidAmount: 0,
    createdAt: new Date(Date.now() - 20 * 60000), updatedAt: new Date(Date.now() - 12 * 60000),
  },
  {
    id: "ord-8", orderNumber: "#008", status: "open", type: "dine_in", tableNumber: "Bar Counter 1",
    locationName: "Bar Counter 1", customerName: "Bar Counter 1", outletId: "outlet-1", cashierId: "c1",
    items: [
      { id: "ci-16", productId: "p24", productName: "House Lager", extras: [], quantity: 3, unitPrice: 2500, totalPrice: 7500 },
      { id: "ci-17", productId: "p28", productName: "Margarita", extras: [], quantity: 1, unitPrice: 7000, totalPrice: 7000 },
    ],
    payments: [], totalAmount: 14500, paidAmount: 0,
    createdAt: new Date(Date.now() - 8 * 60000), updatedAt: new Date(Date.now() - 8 * 60000),
  },
  {
    id: "ord-9", orderNumber: "#009", status: "open", type: "delivery",
    customerName: "Funke A.", outletId: "outlet-1", cashierId: "c2", transferredToCashierId: "c1",
    items: [
      { id: "ci-18", productId: "p1", productName: "Classic Beef Burger", variantId: "v1a", variantName: "Single", extras: [{ id: "ex-3", name: "Avocado", price: 1000, quantity: 1 }], quantity: 1, unitPrice: 6500, totalPrice: 6500 },
      { id: "ci-19", productId: "p20", productName: "Mango Smoothie", extras: [], quantity: 1, unitPrice: 3500, totalPrice: 3500 },
    ],
    payments: [{ method: "transfer", amount: 5000 }], totalAmount: 10000, paidAmount: 5000,
    createdAt: new Date(Date.now() - 35 * 60000), updatedAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "ord-10", orderNumber: "#010", status: "paid", type: "dine_in", tableNumber: "Private Dining 1",
    locationName: "Private Dining 1", customerName: "Private Dining 1", outletId: "outlet-1", cashierId: "c1",
    items: [
      { id: "ci-20", productId: "p4", productName: "Truffle Burger", extras: [{ id: "ex-1", name: "Extra Cheese", price: 500, quantity: 1 }], quantity: 2, unitPrice: 13000, totalPrice: 26000 },
      { id: "ci-21", productId: "p10", productName: "Caesar Salad", variantId: "v10b", variantName: "Large", extras: [], quantity: 2, unitPrice: 6500, totalPrice: 13000 },
      { id: "ci-22", productId: "p26", productName: "House Red Wine", variantId: "v26b", variantName: "Bottle", extras: [], quantity: 2, unitPrice: 18000, totalPrice: 36000 },
    ],
    payments: [{ method: "card", amount: 75000 }], totalAmount: 75000, paidAmount: 75000,
    createdAt: new Date(Date.now() - 120 * 60000), updatedAt: new Date(Date.now() - 100 * 60000),
  },
  {
    id: "ord-11", orderNumber: "#011", status: "open", type: "dine_in", tableNumber: "VIP 3",
    locationName: "VIP 3", customerName: "VIP 3", outletId: "outlet-1", cashierId: "c3", transferredToCashierId: "c1",
    items: [
      { id: "ci-23", productId: "p23", productName: "Ice Cream Sundae", variantId: "v23c", variantName: "Triple Scoop", extras: [], quantity: 3, unitPrice: 4500, totalPrice: 13500 },
    ],
    payments: [], totalAmount: 13500, paidAmount: 0,
    createdAt: new Date(Date.now() - 5 * 60000), updatedAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "ord-12", orderNumber: "#012", status: "in_progress", type: "dine_in", tableNumber: "Table 20",
    locationName: "Table 20", customerName: "Table 20", outletId: "outlet-1", cashierId: "c2",
    items: [
      { id: "ci-24", productId: "p15", productName: "Chicken Wings", variantId: "v15b", variantName: "12pc", extras: [], quantity: 2, unitPrice: 9800, totalPrice: 19600 },
      { id: "ci-25", productId: "p14", productName: "Mozzarella Sticks", extras: [], quantity: 1, unitPrice: 4200, totalPrice: 4200 },
    ],
    payments: [], totalAmount: 23800, paidAmount: 0,
    createdAt: new Date(Date.now() - 18 * 60000), updatedAt: new Date(Date.now() - 14 * 60000),
  },
  // ==================== RETAIL ORDERS (outlet-2) ====================
  {
    id: "ord-r1", orderNumber: "R-001", status: "open", type: "walk_in",
    customerName: "Walk-in Customer", outletId: "outlet-2", cashierId: "c4",
    items: [
      { id: "ci-r1", productId: "rt1", productName: "iPhone 15 Case", extras: [], quantity: 1, unitPrice: 12000, totalPrice: 12000 },
      { id: "ci-r2", productId: "rt2", productName: "USB-C Cable 1m", extras: [], quantity: 2, unitPrice: 3500, totalPrice: 7000 },
    ],
    payments: [], totalAmount: 19000, paidAmount: 0,
    createdAt: new Date(Date.now() - 10 * 60000), updatedAt: new Date(Date.now() - 10 * 60000),
  },
  {
    id: "ord-r2", orderNumber: "R-002", status: "paid", type: "walk_in",
    customerName: "Chioma N.", outletId: "outlet-2", cashierId: "c4",
    items: [
      { id: "ci-r3", productId: "rt6", productName: "Cotton T-Shirt", variantId: "rtv6b", variantName: "Medium", extras: [], quantity: 3, unitPrice: 8500, totalPrice: 25500 },
      { id: "ci-r4", productId: "rt7", productName: "Jeans", variantId: "rtv7b", variantName: "Size 32", extras: [], quantity: 1, unitPrice: 22000, totalPrice: 22000 },
    ],
    payments: [{ method: "card", amount: 47500 }], totalAmount: 47500, paidAmount: 47500,
    createdAt: new Date(Date.now() - 45 * 60000), updatedAt: new Date(Date.now() - 40 * 60000),
  },
  {
    id: "ord-r3", orderNumber: "R-003", status: "open", type: "pickup",
    customerName: "Tunde K.", outletId: "outlet-2", cashierId: "c1",
    items: [
      { id: "ci-r5", productId: "rt3", productName: "Wireless Earbuds", variantId: "rtv3b", variantName: "Pro", extras: [], quantity: 1, unitPrice: 45000, totalPrice: 45000 },
      { id: "ci-r6", productId: "rt5", productName: "Power Bank 20000mAh", extras: [], quantity: 1, unitPrice: 18000, totalPrice: 18000 },
    ],
    payments: [{ method: "transfer", amount: 30000 }], totalAmount: 63000, paidAmount: 30000,
    createdAt: new Date(Date.now() - 25 * 60000), updatedAt: new Date(Date.now() - 20 * 60000),
  },
  {
    id: "ord-r4", orderNumber: "R-004", status: "paid", type: "delivery",
    customerName: "Ada M.", outletId: "outlet-2", cashierId: "c4",
    items: [
      { id: "ci-r7", productId: "rt12", productName: "Samsung Galaxy S24", extras: [], quantity: 1, unitPrice: 650000, totalPrice: 650000 },
      { id: "ci-r8", productId: "rt11", productName: "Screen Protector", extras: [], quantity: 1, unitPrice: 5000, totalPrice: 5000 },
    ],
    payments: [{ method: "transfer", amount: 655000 }], totalAmount: 655000, paidAmount: 655000,
    createdAt: new Date(Date.now() - 120 * 60000), updatedAt: new Date(Date.now() - 110 * 60000),
  },

  // ==================== PHARMACY ORDERS (outlet-4) ====================
  {
    id: "ord-p1", orderNumber: "PH-001", status: "paid", type: "walk_in",
    customerName: "Mrs. Adebayo", outletId: "outlet-4", cashierId: "c4",
    items: [
      { id: "ci-p1", productId: "ph1", productName: "Paracetamol 500mg", extras: [], quantity: 2, unitPrice: 350, totalPrice: 700 },
      { id: "ci-p2", productId: "ph5", productName: "Cough Syrup 100ml", extras: [], quantity: 1, unitPrice: 1800, totalPrice: 1800 },
      { id: "ci-p3", productId: "ph6", productName: "Vitamin C 1000mg", variantId: "phv6a", variantName: "30 Tabs", extras: [], quantity: 1, unitPrice: 4500, totalPrice: 4500 },
    ],
    payments: [{ method: "cash", amount: 7000 }], totalAmount: 7000, paidAmount: 7000,
    createdAt: new Date(Date.now() - 60 * 60000), updatedAt: new Date(Date.now() - 55 * 60000),
  },
  {
    id: "ord-p2", orderNumber: "PH-002", status: "open", type: "walk_in",
    customerName: "Mr. Okafor", outletId: "outlet-4", cashierId: "c1",
    items: [
      { id: "ci-p4", productId: "ph3", productName: "Amoxicillin 250mg", extras: [], quantity: 1, unitPrice: 2800, totalPrice: 2800 },
      { id: "ci-p5", productId: "ph10", productName: "Antiseptic Solution", extras: [], quantity: 1, unitPrice: 2200, totalPrice: 2200 },
    ],
    payments: [], totalAmount: 5000, paidAmount: 0,
    createdAt: new Date(Date.now() - 5 * 60000), updatedAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "ord-p3", orderNumber: "PH-003", status: "open", type: "delivery",
    customerName: "Ngozi E.", outletId: "outlet-4", cashierId: "c4",
    items: [
      { id: "ci-p6", productId: "ph11", productName: "Baby Diapers (Pack)", variantId: "phv11b", variantName: "Medium (20pcs)", extras: [], quantity: 2, unitPrice: 7500, totalPrice: 15000 },
      { id: "ci-p7", productId: "ph12", productName: "Baby Formula 400g", extras: [], quantity: 1, unitPrice: 15000, totalPrice: 15000 },
    ],
    payments: [{ method: "transfer", amount: 15000 }], totalAmount: 30000, paidAmount: 15000,
    createdAt: new Date(Date.now() - 15 * 60000), updatedAt: new Date(Date.now() - 12 * 60000),
  },

  // ==================== SALON ORDERS (outlet-5) ====================
  {
    id: "ord-s1", orderNumber: "S-001", status: "in_progress", type: "walk_in",
    locationName: "Station 1", customerName: "Grace A.", outletId: "outlet-5", cashierId: "c3",
    items: [
      { id: "ci-s1", productId: "sl1", productName: "Women's Haircut", variantId: "slv1b", variantName: "Styled Cut", extras: [], quantity: 1, unitPrice: 12000, totalPrice: 12000 },
      { id: "ci-s2", productId: "sl2", productName: "Hair Coloring", variantId: "slv2b", variantName: "Highlights", extras: [], quantity: 1, unitPrice: 35000, totalPrice: 35000 },
    ],
    payments: [], totalAmount: 47000, paidAmount: 0,
    createdAt: new Date(Date.now() - 90 * 60000), updatedAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "ord-s2", orderNumber: "S-002", status: "paid", type: "walk_in",
    locationName: "Station 2", customerName: "Blessing O.", outletId: "outlet-5", cashierId: "c1",
    items: [
      { id: "ci-s3", productId: "sl6", productName: "Manicure", variantId: "slv6b", variantName: "Gel Polish", extras: [], quantity: 1, unitPrice: 8000, totalPrice: 8000 },
      { id: "ci-s4", productId: "sl7", productName: "Pedicure", variantId: "slv7b", variantName: "Spa Pedicure", extras: [], quantity: 1, unitPrice: 10000, totalPrice: 10000 },
    ],
    payments: [{ method: "card", amount: 18000 }], totalAmount: 18000, paidAmount: 18000,
    createdAt: new Date(Date.now() - 120 * 60000), updatedAt: new Date(Date.now() - 90 * 60000),
  },
  {
    id: "ord-s3", orderNumber: "S-003", status: "open", type: "walk_in",
    locationName: "Station 3", customerName: "Fatima M.", outletId: "outlet-5", cashierId: "c3",
    items: [
      { id: "ci-s5", productId: "sl5", productName: "Braiding", variantId: "slv5a", variantName: "Box Braids", extras: [], quantity: 1, unitPrice: 20000, totalPrice: 20000 },
      { id: "ci-s6", productId: "sl9", productName: "Shampoo & Conditioner Set", extras: [], quantity: 1, unitPrice: 8500, totalPrice: 8500 },
    ],
    payments: [], totalAmount: 28500, paidAmount: 0,
    createdAt: new Date(Date.now() - 40 * 60000), updatedAt: new Date(Date.now() - 35 * 60000),
  },
  {
    id: "ord-s4", orderNumber: "S-004", status: "in_progress", type: "walk_in",
    locationName: "Wash Basin", customerName: "Aisha I.", outletId: "outlet-5", cashierId: "c1",
    items: [
      { id: "ci-s7", productId: "sl4", productName: "Hair Treatment", variantId: "slv4b", variantName: "Keratin Treatment", extras: [], quantity: 1, unitPrice: 35000, totalPrice: 35000 },
    ],
    payments: [{ method: "cash", amount: 20000 }], totalAmount: 35000, paidAmount: 20000,
    createdAt: new Date(Date.now() - 60 * 60000), updatedAt: new Date(Date.now() - 45 * 60000),
  },

  // ==================== GROCERY ORDERS (outlet-7) ====================
  {
    id: "ord-g1", orderNumber: "G-001", status: "paid", type: "walk_in",
    customerName: "Mrs. Ojo", outletId: "outlet-7", cashierId: "c3",
    items: [
      { id: "ci-g1", productId: "gr1", productName: "Fresh Tomatoes (1kg)", extras: [], quantity: 3, unitPrice: 1500, totalPrice: 4500 },
      { id: "ci-g2", productId: "gr2", productName: "Onions (1kg)", extras: [], quantity: 2, unitPrice: 1200, totalPrice: 2400 },
      { id: "ci-g3", productId: "gr14", productName: "Rice 5kg", extras: [], quantity: 1, unitPrice: 12500, totalPrice: 12500 },
      { id: "ci-g4", productId: "gr15", productName: "Vegetable Oil 3L", extras: [], quantity: 1, unitPrice: 8500, totalPrice: 8500 },
    ],
    payments: [{ method: "cash", amount: 27900 }], totalAmount: 27900, paidAmount: 27900,
    createdAt: new Date(Date.now() - 30 * 60000), updatedAt: new Date(Date.now() - 25 * 60000),
  },
  {
    id: "ord-g2", orderNumber: "G-002", status: "open", type: "walk_in",
    customerName: "Emeka U.", outletId: "outlet-7", cashierId: "c1",
    items: [
      { id: "ci-g5", productId: "gr5", productName: "Chicken Breast (1kg)", extras: [], quantity: 2, unitPrice: 5500, totalPrice: 11000 },
      { id: "ci-g6", productId: "gr9", productName: "Eggs (Crate of 30)", extras: [], quantity: 1, unitPrice: 4500, totalPrice: 4500 },
      { id: "ci-g7", productId: "gr7", productName: "Fresh Milk 1L", extras: [], quantity: 3, unitPrice: 2200, totalPrice: 6600 },
    ],
    payments: [], totalAmount: 22100, paidAmount: 0,
    createdAt: new Date(Date.now() - 8 * 60000), updatedAt: new Date(Date.now() - 8 * 60000),
  },
  {
    id: "ord-g3", orderNumber: "G-003", status: "open", type: "delivery",
    customerName: "Sandra K.", outletId: "outlet-7", cashierId: "c3",
    items: [
      { id: "ci-g8", productId: "gr12", productName: "Sliced Bread", extras: [], quantity: 2, unitPrice: 1800, totalPrice: 3600 },
      { id: "ci-g9", productId: "gr8", productName: "Butter 250g", extras: [], quantity: 1, unitPrice: 3500, totalPrice: 3500 },
      { id: "ci-g10", productId: "gr13", productName: "Croissants (4pcs)", extras: [], quantity: 1, unitPrice: 3500, totalPrice: 3500 },
    ],
    payments: [{ method: "mobile", amount: 5000 }], totalAmount: 10600, paidAmount: 5000,
    createdAt: new Date(Date.now() - 20 * 60000), updatedAt: new Date(Date.now() - 18 * 60000),
  },
];

export const posOutlets: POSOutlet[] = [
  {
    id: "outlet-1", name: "Downtown Flagship", businessType: "restaurant",
    email: "downtown@flagship.ng", phone: "+234 801 234 5678", address: "12 Victoria Island Way, Lagos",
    fees: [
      { id: "fee-vat", name: "VAT", type: "percentage", value: 7.5, enabled: true },
      { id: "fee-svc", name: "Service Charge", type: "percentage", value: 10, appliesTo: ["dine_in"], enabled: true },
      { id: "fee-del", name: "Delivery Fee", type: "fixed", value: 1500, appliesTo: ["delivery"], enabled: true },
    ],
  },
  {
    id: "outlet-2", name: "Mall Branch", businessType: "retail",
    email: "mall@branch.ng", phone: "+234 802 345 6789", address: "Shop 45, Ikeja City Mall, Lagos",
    fees: [
      { id: "fee-vat2", name: "VAT", type: "percentage", value: 7.5, enabled: true },
      { id: "fee-del2", name: "Delivery Fee", type: "fixed", value: 2000, appliesTo: ["delivery"], enabled: true },
    ],
  },
  {
    id: "outlet-3", name: "Airport Kiosk", businessType: "restaurant",
    email: "airport@kiosk.ng", phone: "+234 803 456 7890", address: "Terminal 2, MM Int'l Airport, Lagos",
    fees: [
      { id: "fee-vat3", name: "VAT", type: "percentage", value: 7.5, enabled: true },
      { id: "fee-svc3", name: "Service Charge", type: "percentage", value: 5, appliesTo: ["dine_in"], enabled: true },
    ],
  },
  {
    id: "outlet-4", name: "Suburban Pharmacy", businessType: "pharmacy",
    email: "info@suburbanpharmacy.ng", phone: "+234 804 567 8901", address: "22 Lekki Phase 1, Lagos",
    fees: [
      { id: "fee-del4", name: "Delivery Fee", type: "fixed", value: 1000, appliesTo: ["delivery"], enabled: true },
    ],
  },
  {
    id: "outlet-5", name: "Glow Beauty Salon", businessType: "salon",
    email: "hello@glowbeauty.ng", phone: "+234 805 678 9012", address: "8 Admiralty Way, Lekki, Lagos",
    fees: [
      { id: "fee-vat5", name: "VAT", type: "percentage", value: 7.5, enabled: true },
    ],
  },
  {
    id: "outlet-7", name: "FreshMart Grocery", businessType: "grocery",
    email: "orders@freshmart.ng", phone: "+234 806 789 0123", address: "Plot 5, Allen Avenue, Ikeja, Lagos",
    fees: [
      { id: "fee-del7", name: "Delivery Fee", type: "fixed", value: 1500, appliesTo: ["delivery"], enabled: true },
      { id: "fee-bag", name: "Bag Charge", type: "fixed", value: 100, enabled: true },
    ],
  },
];

/** Get allowed order types for a business */
export function getOrderTypesForBusiness(businessType: BusinessTypeId): { id: OrderType; label: string }[] {
  switch (businessType) {
    case "restaurant":
      return [
        { id: "dine_in", label: "Dine In" },
        { id: "takeaway", label: "Takeaway" },
        { id: "delivery", label: "Delivery" },
      ];
    case "pharmacy":
    case "grocery":
    case "supermarket":
      return [
        { id: "walk_in", label: "Walk-In" },
        { id: "delivery", label: "Delivery" },
      ];
    case "salon":
    case "barber":
      return [
        { id: "walk_in", label: "Walk-In" },
      ];
    case "retail":
    case "clothing":
    case "electronics":
    case "hair_seller":
    case "wine_store":
      return [
        { id: "walk_in", label: "Walk-In" },
        { id: "pickup", label: "Pickup" },
        { id: "delivery", label: "Delivery" },
      ];
    default:
      return [{ id: "walk_in", label: "Walk-In" }];
  }
}
