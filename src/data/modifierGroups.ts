// Reusable Modifier Groups — central catalog of optional add-ons (toppings,
// upgrades, sides, sauces, etc.) that can be attached to many catalog items.
// Inspired by Toast / Square. Stored in localStorage so admin edits persist
// across the mock session.
//
// At save time the catalog form flattens an item's selected modifier groups
// into the existing per-item `extras` array (using the group name as the
// extra's `category`). That way the POS — which already renders extras
// grouped by category — works without any changes.

export interface Modifier {
  id: string;
  name: string;
  /** Up-charge applied when this modifier is picked. Can be 0 (free option). */
  price: number;
  /** Optional link to a stocked inventory item so selling it deducts stock. */
  linkedInventoryItemId?: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  /** Internal note shown only to admins. */
  description?: string;
  /** Minimum modifiers a guest must pick. 0 = optional. */
  minSelect: number;
  /** Maximum modifiers a guest may pick. 0 = unlimited. */
  maxSelect: number;
  modifiers: Modifier[];
}

const STORAGE_KEY = "smapps_modifier_groups";

export const defaultModifierGroups: ModifierGroup[] = [
  {
    id: "mg-toppings",
    name: "Burger Toppings",
    description: "Optional add-ons for burgers and sandwiches.",
    minSelect: 0,
    maxSelect: 0,
    modifiers: [
      { id: "mod-cheese", name: "Extra Cheese", price: 500 },
      { id: "mod-bacon", name: "Bacon", price: 800 },
      { id: "mod-avocado", name: "Avocado", price: 1000 },
      { id: "mod-egg", name: "Fried Egg", price: 600 },
    ],
  },
  {
    id: "mg-coffee-options",
    name: "Coffee Options",
    description: "Customise hot drinks.",
    minSelect: 0,
    maxSelect: 3,
    modifiers: [
      { id: "mod-shot", name: "Extra Shot", price: 500 },
      { id: "mod-decaf", name: "Decaf", price: 0 },
      { id: "mod-oat", name: "Oat Milk", price: 400 },
      { id: "mod-soy", name: "Soy Milk", price: 400 },
    ],
  },
  {
    id: "mg-pizza-toppings",
    name: "Pizza Toppings",
    description: "Pick any combination — each topping is charged individually.",
    minSelect: 0,
    maxSelect: 0,
    modifiers: [
      { id: "mod-pepperoni", name: "Pepperoni", price: 700 },
      { id: "mod-mushrooms", name: "Mushrooms", price: 500 },
      { id: "mod-olives", name: "Olives", price: 400 },
      { id: "mod-jalapeno", name: "Jalapeños", price: 400 },
    ],
  },
];

export function loadModifierGroups(): ModifierGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultModifierGroups));
      return defaultModifierGroups;
    }
    return JSON.parse(raw) as ModifierGroup[];
  } catch {
    return defaultModifierGroups;
  }
}

export function saveModifierGroups(groups: ModifierGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function generateModifierGroupId(): string {
  return `mg_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateModifierId(): string {
  return `mod_${Math.random().toString(36).slice(2, 10)}`;
}
