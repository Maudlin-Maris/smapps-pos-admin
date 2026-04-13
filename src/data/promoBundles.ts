export interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
  /** If set, lock to this variant */
  variantId?: string;
  variantName?: string;
}

export type BundlePricingType = "fixed" | "percentage_discount";

export interface PromoBundle {
  id: string;
  name: string;
  description: string;
  outletId: string;
  items: BundleItem[];
  /** "fixed" = sell at this price; "percentage_discount" = X% off combined item total */
  pricingType: BundlePricingType;
  /** For fixed: the bundle price. For percentage_discount: the % off (0-100) */
  pricingValue: number;
  /** Computed original price (sum of items) */
  originalPrice: number;
  /** Computed final price */
  bundlePrice: number;
  status: "active" | "inactive";
  startDate?: Date;
  endDate?: Date;
  image?: string;
}

// Sample bundles across outlets
export const promoBundles: PromoBundle[] = [
  // Restaurant bundles (outlet-1)
  {
    id: "bundle-1",
    name: "Burger Combo Meal",
    description: "Classic Beef Burger + French Fries + Coca-Cola",
    outletId: "outlet-1",
    items: [
      { productId: "p1", productName: "Classic Beef Burger", quantity: 1, variantId: "v1a", variantName: "Single" },
      { productId: "p12", productName: "French Fries", quantity: 1, variantId: "v12a", variantName: "Regular" },
      { productId: "p16", productName: "Coca-Cola", quantity: 1 },
    ],
    pricingType: "fixed",
    pricingValue: 7500,
    originalPrice: 8800, // 5500 + 2500 + 800
    bundlePrice: 7500,
    status: "active",
  },
  {
    id: "bundle-2",
    name: "Pizza & Drinks Deal",
    description: "Any Medium Pizza + 2 Coca-Colas — 15% off",
    outletId: "outlet-1",
    items: [
      { productId: "p6", productName: "Margherita Pizza", quantity: 1, variantId: "v6b", variantName: "Medium 12\"" },
      { productId: "p16", productName: "Coca-Cola", quantity: 2 },
    ],
    pricingType: "percentage_discount",
    pricingValue: 15,
    originalPrice: 9100, // 7500 + 1600
    bundlePrice: 7735,
    status: "active",
  },
  {
    id: "bundle-3",
    name: "Coffee & Cake",
    description: "Cappuccino + Chocolate Cake",
    outletId: "outlet-1",
    items: [
      { productId: "p19", productName: "Cappuccino", quantity: 1, variantId: "v19b", variantName: "Regular" },
      { productId: "p21", productName: "Chocolate Cake", quantity: 1 },
    ],
    pricingType: "fixed",
    pricingValue: 5500,
    originalPrice: 6800,
    bundlePrice: 5500,
    status: "active",
  },
  // Pharmacy bundle (outlet-4)
  {
    id: "bundle-4",
    name: "Cold & Flu Kit",
    description: "Paracetamol + Cough Syrup + Vitamin C",
    outletId: "outlet-4",
    items: [
      { productId: "ph1", productName: "Paracetamol 500mg", quantity: 1 },
      { productId: "ph5", productName: "Cough Syrup 100ml", quantity: 1 },
      { productId: "ph6", productName: "Vitamin C 1000mg", quantity: 1, variantId: "phv6a", variantName: "30 Tabs" },
    ],
    pricingType: "percentage_discount",
    pricingValue: 10,
    originalPrice: 6650,
    bundlePrice: 5985,
    status: "active",
  },
  // Grocery bundle (outlet-7)
  {
    id: "bundle-5",
    name: "Essentials Pack",
    description: "Rice + Oil + Tomatoes — save ₦500",
    outletId: "outlet-7",
    items: [
      { productId: "g1", productName: "Organic Apples", quantity: 2 },
      { productId: "g3", productName: "Fresh Milk 1L", quantity: 1 },
    ],
    pricingType: "fixed",
    pricingValue: 3500,
    originalPrice: 4200,
    bundlePrice: 3500,
    status: "active",
  },
];
