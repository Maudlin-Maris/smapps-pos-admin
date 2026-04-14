export interface SwapOption {
  productId: string;
  productName: string;
  /** Optional: lock to a specific variant */
  variantId?: string;
  variantName?: string;
}

export interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
  /** If set, lock to this variant */
  variantId?: string;
  variantName?: string;
  /** Admin-configured allowed swap alternatives for this slot */
  swapOptions?: SwapOption[];
  /** Whether swapping is enabled for this slot */
  swappable?: boolean;
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
      {
        productId: "p1", productName: "Classic Beef Burger", quantity: 1, variantId: "v1a", variantName: "Single",
        swappable: true,
        swapOptions: [
          { productId: "p2", productName: "Chicken Burger", variantId: "v2a", variantName: "Single" },
          { productId: "p3", productName: "Veggie Burger" },
        ],
      },
      {
        productId: "p12", productName: "French Fries", quantity: 1, variantId: "v12a", variantName: "Regular",
        swappable: true,
        swapOptions: [
          { productId: "p13", productName: "Sweet Potato Fries" },
          { productId: "p14", productName: "Onion Rings" },
          { productId: "p15", productName: "Coleslaw" },
        ],
      },
      {
        productId: "p16", productName: "Coca-Cola", quantity: 1,
        swappable: true,
        swapOptions: [
          { productId: "p17", productName: "Sprite" },
          { productId: "p18", productName: "Fanta Orange" },
          { productId: "p19", productName: "Cappuccino", variantId: "v19b", variantName: "Regular" },
        ],
      },
    ],
    pricingType: "fixed",
    pricingValue: 7500,
    originalPrice: 8800,
    bundlePrice: 7500,
    status: "active",
  },
  {
    id: "bundle-2",
    name: "Pizza & Drinks Deal",
    description: "Any Medium Pizza + 2 Coca-Colas — 15% off",
    outletId: "outlet-1",
    items: [
      {
        productId: "p6", productName: "Margherita Pizza", quantity: 1, variantId: "v6b", variantName: "Medium 12\"",
        swappable: true,
        swapOptions: [
          { productId: "p7", productName: "Pepperoni Pizza", variantId: "v7b", variantName: "Medium 12\"" },
          { productId: "p8", productName: "BBQ Chicken Pizza", variantId: "v8b", variantName: "Medium 12\"" },
        ],
      },
      { productId: "p16", productName: "Coca-Cola", quantity: 2, swappable: false },
    ],
    pricingType: "percentage_discount",
    pricingValue: 15,
    originalPrice: 9100,
    bundlePrice: 7735,
    status: "active",
  },
  {
    id: "bundle-3",
    name: "Coffee & Cake",
    description: "Cappuccino + Chocolate Cake",
    outletId: "outlet-1",
    items: [
      { productId: "p19", productName: "Cappuccino", quantity: 1, variantId: "v19b", variantName: "Regular", swappable: false },
      { productId: "p21", productName: "Chocolate Cake", quantity: 1, swappable: false },
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
      { productId: "ph1", productName: "Paracetamol 500mg", quantity: 1, swappable: false },
      { productId: "ph5", productName: "Cough Syrup 100ml", quantity: 1, swappable: false },
      { productId: "ph6", productName: "Vitamin C 1000mg", quantity: 1, variantId: "phv6a", variantName: "30 Tabs", swappable: false },
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
      { productId: "g1", productName: "Organic Apples", quantity: 2, swappable: false },
      { productId: "g3", productName: "Fresh Milk 1L", quantity: 1, swappable: false },
    ],
    pricingType: "fixed",
    pricingValue: 3500,
    originalPrice: 4200,
    bundlePrice: 3500,
    status: "active",
  },
];
