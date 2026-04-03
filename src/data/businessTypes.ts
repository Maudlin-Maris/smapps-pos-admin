import {
  UtensilsCrossed,
  ShoppingCart,
  Pill,
  Scissors,
  Wine,
  Shirt,
  Smartphone,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type BusinessTypeId =
  | "restaurant"
  | "grocery"
  | "supermarket"
  | "pharmacy"
  | "salon"
  | "barber"
  | "wine_store"
  | "clothing"
  | "electronics"
  | "hair_seller"
  | "retail";

export interface BusinessTypeFeatures {
  hasMenu: boolean;          // Food menu (restaurant, coffee shop)
  hasProducts: boolean;      // Product catalog (retail, grocery)
  hasServices: boolean;      // Service bookings (salon, barber)
  hasBarcode: boolean;       // Barcode scanning for inventory
  hasVariants: boolean;      // Size/color variants
  hasExpiry: boolean;        // Expiry date tracking
  hasBatchTracking: boolean; // Batch number tracking
  hasComposites: boolean;    // Composite/recipe items
  hasDineIn: boolean;        // Dine-in service option
  hasTakeaway: boolean;      // Takeaway option
  hasAppointments: boolean;  // Appointment scheduling
  hasExtras: boolean;        // Extras/sides/toppings/addons
  menuLabel: string;         // What to call the "menu" section
  extrasLabel: string;       // What to call extras (Extras, Sides, Toppings, Add-ons)
  itemLabel: string;         // What to call an individual item
  itemsLabel: string;        // Plural
}

export interface BusinessType {
  id: BusinessTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
  features: BusinessTypeFeatures;
}

export const businessTypes: Record<BusinessTypeId, BusinessType> = {
  restaurant: {
    id: "restaurant",
    label: "Restaurant / Bar / Lounge",
    description: "Food service with dine-in and takeaway",
    icon: UtensilsCrossed,
    features: {
      hasMenu: true, hasProducts: false, hasServices: false,
      hasBarcode: false, hasVariants: true, hasExpiry: false,
      hasBatchTracking: false, hasComposites: true,
      hasDineIn: true, hasTakeaway: true, hasAppointments: false, hasExtras: true,
      menuLabel: "Menu", itemLabel: "Menu Item", itemsLabel: "Menu Items", extrasLabel: "Extras / Sides / Toppings",
    },
  },
  grocery: {
    id: "grocery",
    label: "Grocery Store",
    description: "Fresh produce, packaged goods, daily essentials",
    icon: ShoppingCart,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: false, hasExpiry: true,
      hasBatchTracking: true, hasComposites: false,
      hasDineIn: false, hasTakeaway: true, hasAppointments: false, hasExtras: false,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products", extrasLabel: "Add-ons",
    },
  },
  supermarket: {
    id: "supermarket",
    label: "Supermarket",
    description: "Large-scale retail with multiple departments",
    icon: ShoppingBag,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: true, hasExpiry: true,
      hasBatchTracking: true, hasComposites: false,
      hasDineIn: false, hasTakeaway: true, hasAppointments: false, hasExtras: true,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products", extrasLabel: "Add-ons",
    },
  },
  pharmacy: {
    id: "pharmacy",
    label: "Pharmacy",
    description: "Pharmaceutical and healthcare products",
    icon: Pill,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: false, hasExpiry: true,
      hasBatchTracking: true, hasComposites: false,
      hasDineIn: false, hasTakeaway: false, hasAppointments: false, hasExtras: false,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products", extrasLabel: "Add-ons",
    },
  },
  salon: {
    id: "salon",
    label: "Hair Salon",
    description: "Haircuts, styling, coloring, and beauty services",
    icon: Scissors,
    features: {
      hasMenu: false, hasProducts: true, hasServices: true,
      hasBarcode: false, hasVariants: false, hasExpiry: false,
      hasBatchTracking: false, hasComposites: true,
      hasDineIn: false, hasTakeaway: false, hasAppointments: true, hasExtras: true,
      menuLabel: "Services & Products", itemLabel: "Service", itemsLabel: "Services", extrasLabel: "Add-on Services",
    },
  },
  barber: {
    id: "barber",
    label: "Barber Shop",
    description: "Men's grooming, haircuts, and shaving",
    icon: Scissors,
    features: {
      hasMenu: false, hasProducts: true, hasServices: true,
      hasBarcode: false, hasVariants: false, hasExpiry: false,
      hasBatchTracking: false, hasComposites: true,
      hasDineIn: false, hasTakeaway: false, hasAppointments: true, hasExtras: true,
      menuLabel: "Services & Products", itemLabel: "Service", itemsLabel: "Services", extrasLabel: "Add-on Services",
    },
  },
  wine_store: {
    id: "wine_store",
    label: "Wine & Liquor Store",
    description: "Wines, spirits, and specialty beverages",
    icon: Wine,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: true, hasExpiry: false,
      hasBatchTracking: true, hasComposites: false,
      hasDineIn: false, hasTakeaway: true, hasAppointments: false, hasExtras: true,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products", extrasLabel: "Add-ons",
    },
  },
  clothing: {
    id: "clothing",
    label: "Clothing Store",
    description: "Apparel, footwear, and fashion accessories",
    icon: Shirt,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: true, hasExpiry: false,
      hasBatchTracking: false, hasComposites: false,
      hasDineIn: false, hasTakeaway: false, hasAppointments: false, hasExtras: true,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products", extrasLabel: "Add-ons",
    },
  },
  electronics: {
    id: "electronics",
    label: "Electronics Store",
    description: "Gadgets, devices, and tech accessories",
    icon: Smartphone,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: true, hasExpiry: false,
      hasBatchTracking: true, hasComposites: false,
      hasDineIn: false, hasTakeaway: false, hasAppointments: false,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products",
    },
  },
  hair_seller: {
    id: "hair_seller",
    label: "Hair / Wig Store",
    description: "Wigs, extensions, and hair accessories",
    icon: ShoppingBag,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: true, hasExpiry: false,
      hasBatchTracking: false, hasComposites: false,
      hasDineIn: false, hasTakeaway: false, hasAppointments: false,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products",
    },
  },
  retail: {
    id: "retail",
    label: "General Retail",
    description: "General merchandise and convenience store",
    icon: ShoppingCart,
    features: {
      hasMenu: false, hasProducts: true, hasServices: false,
      hasBarcode: true, hasVariants: true, hasExpiry: false,
      hasBatchTracking: false, hasComposites: false,
      hasDineIn: false, hasTakeaway: false, hasAppointments: false,
      menuLabel: "Products", itemLabel: "Product", itemsLabel: "Products",
    },
  },
};

export const businessTypeList = Object.values(businessTypes);

export function getBusinessType(id: string): BusinessType {
  return businessTypes[id as BusinessTypeId] || businessTypes.retail;
}

export function getFeatures(businessTypeId: string): BusinessTypeFeatures {
  return getBusinessType(businessTypeId).features;
}
