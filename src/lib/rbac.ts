// =====================================================================
// Role-Based Access Control (RBAC)
// Inspired by Toast POS, Square, and Vend: a fixed catalog of fine-grained
// permissions grouped by domain, plus three system roles (Admin, Manager,
// Cashier) and unlimited custom roles. Stored in localStorage (mock).
// =====================================================================

export type PermissionId =
  // Sales / POS
  | "sales.process"
  | "sales.refund"
  | "sales.discount.apply"
  | "sales.void"
  | "sales.reprint_receipt"
  | "sales.open_cash_drawer"
  // Catalog
  | "catalog.view"
  | "catalog.manage"
  | "catalog.bundles.manage"
  | "catalog.modifiers.manage"
  // Inventory
  | "inventory.view"
  | "inventory.adjust"
  | "inventory.receive"
  | "inventory.transfer"
  | "purchase_orders.manage"
  // Customers & Loyalty
  | "customers.view"
  | "customers.manage"
  | "loyalty.manage"
  // Reports & Finance
  | "reports.view"
  | "reports.financial"
  | "reports.export"
  | "expenses.manage"
  // Settings
  | "outlets.manage"
  | "cashiers.manage"
  | "subscription.manage"
  // Admin
  | "users.manage"
  | "roles.manage"
  | "terminals.manage";

export interface PermissionDef {
  id: PermissionId;
  label: string;
  description: string;
}

export interface PermissionGroup {
  group: string;
  permissions: PermissionDef[];
}

export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    group: "Sales & POS",
    permissions: [
      { id: "sales.process", label: "Process sales", description: "Ring up orders and accept payments" },
      { id: "sales.refund", label: "Issue refunds", description: "Refund completed transactions" },
      { id: "sales.discount.apply", label: "Apply discounts", description: "Apply manual or preset discounts at checkout" },
      { id: "sales.void", label: "Void items / orders", description: "Remove items or cancel an open order" },
      { id: "sales.reprint_receipt", label: "Reprint receipts", description: "Reprint receipts for past orders" },
      { id: "sales.open_cash_drawer", label: "Open cash drawer (no sale)", description: "Open the drawer outside of a sale" },
    ],
  },
  {
    group: "Catalog",
    permissions: [
      { id: "catalog.view", label: "View catalog", description: "Browse products, categories and variants" },
      { id: "catalog.manage", label: "Manage catalog", description: "Create, edit and delete products" },
      { id: "catalog.bundles.manage", label: "Manage promo bundles", description: "Configure promotional product bundles" },
      { id: "catalog.modifiers.manage", label: "Manage modifier groups", description: "Configure reusable add-ons (toppings, upgrades, options)" },
    ],
  },
  {
    group: "Inventory",
    permissions: [
      { id: "inventory.view", label: "View inventory", description: "See stock levels and history" },
      { id: "inventory.adjust", label: "Adjust stock", description: "Record stock adjustments and write-offs" },
      { id: "inventory.receive", label: "Receive stock", description: "Receive incoming inventory" },
      { id: "inventory.transfer", label: "Transfer between outlets", description: "Move stock between locations" },
      { id: "purchase_orders.manage", label: "Manage purchase orders", description: "Create and approve POs" },
    ],
  },
  {
    group: "Customers & Loyalty",
    permissions: [
      { id: "customers.view", label: "View customers", description: "Browse the customer directory" },
      { id: "customers.manage", label: "Manage customers", description: "Add, edit and delete customer records" },
      { id: "loyalty.manage", label: "Manage loyalty program", description: "Configure points, rewards and tiers" },
    ],
  },
  {
    group: "Reports & Finance",
    permissions: [
      { id: "reports.view", label: "View reports", description: "Access standard sales reports" },
      { id: "reports.financial", label: "View financial reports", description: "P&L, COGS and other financial breakdowns" },
      { id: "reports.export", label: "Export reports", description: "Download reports as CSV / PDF" },
      { id: "expenses.manage", label: "Manage expenses", description: "Record and edit business expenses" },
    ],
  },
  {
    group: "Settings",
    permissions: [
      { id: "outlets.manage", label: "Manage outlets", description: "Create and configure store locations" },
      { id: "cashiers.manage", label: "Manage cashiers", description: "Manage POS cashier accounts and PINs" },
      { id: "subscription.manage", label: "Manage subscription & billing", description: "Plan, payment methods and invoices" },
    ],
  },
  {
    group: "Administration",
    permissions: [
      { id: "users.manage", label: "Manage users", description: "Invite, edit and deactivate portal users" },
      { id: "roles.manage", label: "Manage roles & permissions", description: "Create roles and edit permission sets" },
      { id: "terminals.manage", label: "Manage terminals", description: "Register, view and remove linked POS terminals" },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionId[] = PERMISSION_CATALOG.flatMap((g) =>
  g.permissions.map((p) => p.id)
);

export function getPermissionLabel(id: PermissionId): string {
  for (const g of PERMISSION_CATALOG) {
    const p = g.permissions.find((p) => p.id === id);
    if (p) return p.label;
  }
  return id;
}

// =====================================================================
// Roles
// =====================================================================

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionId[];
  system?: boolean; // system roles can't be deleted; permissions can't be edited
}

const ROLES_KEY = "smapps_rbac_roles";

const MANAGER_PERMISSIONS: PermissionId[] = [
  "sales.process", "sales.refund", "sales.discount.apply", "sales.void",
  "sales.reprint_receipt", "sales.open_cash_drawer",
  "catalog.view", "catalog.manage", "catalog.bundles.manage", "catalog.modifiers.manage",
  "inventory.view", "inventory.adjust", "inventory.receive", "inventory.transfer",
  "purchase_orders.manage",
  "customers.view", "customers.manage", "loyalty.manage",
  "reports.view", "reports.financial", "reports.export",
  "expenses.manage",
];

const CASHIER_PERMISSIONS: PermissionId[] = [
  "sales.process", "sales.discount.apply", "sales.reprint_receipt",
  "catalog.view", "inventory.view", "customers.view",
];

export const SYSTEM_ROLES: Role[] = [
  {
    id: "role_admin",
    name: "Admin",
    description: "Full access to every feature, including user management.",
    permissions: ALL_PERMISSIONS,
    system: true,
  },
  {
    id: "role_manager",
    name: "Manager",
    description: "Runs day-to-day operations across catalog, inventory and reports.",
    permissions: MANAGER_PERMISSIONS,
    system: true,
  },
  {
    id: "role_cashier",
    name: "Cashier",
    description: "Processes sales at the POS. No administrative access.",
    permissions: CASHIER_PERMISSIONS,
    system: true,
  },
];

export function loadRoles(): Role[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (!raw) {
      localStorage.setItem(ROLES_KEY, JSON.stringify(SYSTEM_ROLES));
      return SYSTEM_ROLES;
    }
    const parsed: Role[] = JSON.parse(raw);
    // Always keep system roles fresh (in case permission catalog grew)
    const merged = [
      ...SYSTEM_ROLES.map((sys) => {
        const stored = parsed.find((r) => r.id === sys.id);
        return stored ? { ...sys, ...stored, permissions: sys.permissions, system: true } : sys;
      }),
      ...parsed.filter((r) => !SYSTEM_ROLES.some((s) => s.id === r.id)),
    ];
    return merged;
  } catch {
    return SYSTEM_ROLES;
  }
}

export function saveRoles(roles: Role[]) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

export function generateRoleId(): string {
  return `role_${Math.random().toString(36).slice(2, 10)}`;
}
