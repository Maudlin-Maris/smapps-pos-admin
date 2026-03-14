import type { MenuItem } from "@/components/menu/MenuItemForm";

export interface Department {
  id: string;
  name: string;
  outletId: number;
  menuItemIds: string[];
}

// Sample menu items that can be assigned to departments
export const sampleMenuItems: MenuItem[] = [
  {
    id: "mi-1", name: "Jollof Rice", description: "Classic Nigerian jollof", category: "Main", subcategory: "Rice",
    price: 2500, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "JR-001", status: "active", images: [], variants: [], trackInventory: true,
  },
  {
    id: "mi-2", name: "Grilled Chicken", description: "Seasoned grilled chicken", category: "Main", subcategory: "Protein",
    price: 3500, quantity: 30, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "GC-001", status: "active", images: [], variants: [], trackInventory: true,
  },
  {
    id: "mi-3", name: "Chapman", description: "Nigerian cocktail drink", category: "Drinks", subcategory: "Cocktails",
    price: 1500, quantity: 100, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "CH-001", status: "active", images: [], variants: [], trackInventory: false,
  },
  {
    id: "mi-4", name: "Pepper Soup", description: "Spicy goat meat pepper soup", category: "Main", subcategory: "Soup",
    price: 3000, quantity: 20, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "PS-001", status: "active", images: [], variants: [], trackInventory: true,
  },
  {
    id: "mi-5", name: "Small Chops", description: "Assorted finger foods", category: "Appetizers", subcategory: "Snacks",
    price: 2000, quantity: 40, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "SC-001", status: "active", images: [], variants: [], trackInventory: true,
  },
  {
    id: "mi-6", name: "Zobo Drink", description: "Hibiscus flower drink", category: "Drinks", subcategory: "Non-Alcoholic",
    price: 800, quantity: 60, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "ZD-001", status: "active", images: [], variants: [], trackInventory: false,
  },
  {
    id: "mi-7", name: "Fried Rice", description: "Chinese-style fried rice", category: "Main", subcategory: "Rice",
    price: 2800, quantity: 35, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "FR-001", status: "active", images: [], variants: [], trackInventory: true,
  },
  {
    id: "mi-8", name: "Suya", description: "Spiced grilled beef skewers", category: "Appetizers", subcategory: "Grills",
    price: 1800, quantity: 25, salePrice: null, salePeriodStart: null, salePeriodEnd: null,
    sku: "SY-001", status: "active", images: [], variants: [], trackInventory: true,
  },
];

export const initialDepartments: Department[] = [
  { id: "dept-1", name: "Kitchen", outletId: 1, menuItemIds: ["mi-1", "mi-2", "mi-4", "mi-7"] },
  { id: "dept-2", name: "Bar", outletId: 1, menuItemIds: ["mi-3", "mi-6"] },
  { id: "dept-3", name: "Front of House", outletId: 1, menuItemIds: ["mi-5", "mi-8"] },
  { id: "dept-4", name: "Drive-Through", outletId: 1, menuItemIds: [] },
  { id: "dept-5", name: "Sales Floor", outletId: 2, menuItemIds: ["mi-1", "mi-5"] },
  { id: "dept-6", name: "Checkout", outletId: 2, menuItemIds: [] },
  { id: "dept-7", name: "Customer Service", outletId: 2, menuItemIds: [] },
  { id: "dept-8", name: "Stock Room", outletId: 2, menuItemIds: [] },
  { id: "dept-9", name: "Counter", outletId: 3, menuItemIds: ["mi-3", "mi-5", "mi-8"] },
  { id: "dept-10", name: "Lounge Service", outletId: 3, menuItemIds: ["mi-1", "mi-2"] },
  { id: "dept-11", name: "Dispensary", outletId: 4, menuItemIds: [] },
  { id: "dept-12", name: "Front Desk", outletId: 4, menuItemIds: [] },
  { id: "dept-13", name: "Warehouse", outletId: 4, menuItemIds: [] },
];
