import type { MenuItem } from "@/components/menu/MenuItemForm";

export interface Department {
  id: string;
  name: string;
  outletId: number | string;
  assignedCategories: string[];
  assignedSubcategories: string[];
}


/** Build a map of category → subcategories from menu items */
export function getCategoryMap(items: MenuItem[]): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const item of items) {
    if (!map[item.category]) map[item.category] = new Set();
    if (item.subcategory) map[item.category].add(item.subcategory);
  }
  const result: Record<string, string[]> = {};
  for (const [cat, subs] of Object.entries(map)) {
    result[cat] = Array.from(subs).sort();
  }
  return result;
}

/** Count how many menu items a department covers */
export function getDeptItemCount(dept: Department, items: MenuItem[]): number {
  const cats = dept.assignedCategories ?? [];
  const subs = dept.assignedSubcategories ?? [];
  return items.filter((item) => {
    if (cats.includes(item.category)) return true;
    if (item.subcategory && subs.includes(`${item.category}::${item.subcategory}`)) return true;
    return false;
  }).length;
}

export const initialDepartments: Department[] = [
  { id: "dept-1", name: "Kitchen", outletId: 1, assignedCategories: ["Main"], assignedSubcategories: [] },
  { id: "dept-2", name: "Bar", outletId: 1, assignedCategories: ["Drinks"], assignedSubcategories: [] },
  { id: "dept-3", name: "Front of House", outletId: 1, assignedCategories: ["Appetizers"], assignedSubcategories: [] },
  { id: "dept-4", name: "Drive-Through", outletId: 1, assignedCategories: [], assignedSubcategories: [] },
  { id: "dept-5", name: "Sales Floor", outletId: 2, assignedCategories: [], assignedSubcategories: ["Main::Rice", "Appetizers::Snacks"] },
  { id: "dept-6", name: "Checkout", outletId: 2, assignedCategories: [], assignedSubcategories: [] },
  { id: "dept-7", name: "Customer Service", outletId: 2, assignedCategories: [], assignedSubcategories: [] },
  { id: "dept-8", name: "Stock Room", outletId: 2, assignedCategories: [], assignedSubcategories: [] },
  { id: "dept-9", name: "Counter", outletId: 3, assignedCategories: [], assignedSubcategories: ["Drinks::Cocktails", "Appetizers::Snacks", "Appetizers::Grills"] },
  { id: "dept-10", name: "Lounge Service", outletId: 3, assignedCategories: [], assignedSubcategories: ["Main::Rice", "Main::Protein"] },
  { id: "dept-11", name: "Dispensary", outletId: 4, assignedCategories: [], assignedSubcategories: [] },
  { id: "dept-12", name: "Front Desk", outletId: 4, assignedCategories: [], assignedSubcategories: [] },
  { id: "dept-13", name: "Warehouse", outletId: 4, assignedCategories: [], assignedSubcategories: [] },
];
