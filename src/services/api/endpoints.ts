export const API_BASE_URL = "https://api.smappsgroup.com";

export const API_ENDPOINTS = {
  LOGIN: "/api/admin/login",
  OUTLETS: "/api/admin/outlets",
  SINGLE_OUTLET: (id: number | string) => `/api/admin/outlets/${id}`,
  OUTLET_STATUS: (id: number | string) => `/api/admin/outlets/${id}/status`,

  // Outlet Sub-resources
  OUTLET_CATALOG_CATEGORIES: (outletId: number | string) => `/api/admin/outlets/${outletId}/catalog-categories`,
  OUTLET_DEPARTMENTS: (outletId: number | string) => `/api/admin/outlets/${outletId}/departments`,
  OUTLET_SINGLE_DEPARTMENT: (outletId: number | string, deptId: number | string) => `/api/admin/outlets/${outletId}/departments/${deptId}`,
  OUTLET_DEPARTMENT_CATEGORIES: (outletId: number | string, deptId: number | string) => `/api/admin/outlets/${outletId}/departments/${deptId}/categories`,
  OUTLET_DISCOUNTS: (outletId: number | string) => `/api/admin/outlets/${outletId}/discounts`,
  OUTLET_SINGLE_DISCOUNT: (outletId: number | string, id: number | string) => `/api/admin/outlets/${outletId}/discounts/${id}`,
  OUTLET_FEES: (outletId: number | string) => `/api/admin/outlets/${outletId}/fees`,
  OUTLET_SINGLE_FEE: (outletId: number | string, feeId: number | string) => `/api/admin/outlets/${outletId}/fees/${feeId}`,
  OUTLET_LOCATIONS: (outletId: number | string) => `/api/admin/outlets/${outletId}/locations`,
  OUTLET_SINGLE_LOCATION: (outletId: number | string, locationId: number | string) => `/api/admin/outlets/${outletId}/locations/${locationId}`,
  OUTLET_PAYMENT_METHODS: (outletId: number | string) => `/api/admin/outlets/${outletId}/payment-methods`,
  OUTLET_SINGLE_PAYMENT_METHOD: (outletId: number | string, pmId: number | string) => `/api/admin/outlets/${outletId}/payment-methods/${pmId}`,
  OUTLET_TIPS_PRESETS: (outletId: number | string) => `/api/admin/outlets/${outletId}/tips`,
  OUTLET_SINGLE_TIPS_PRESET: (outletId: number | string, id: number | string) => `/api/admin/outlets/${outletId}/tips/${id}`,

  // Catalog / Menu Management
  CATEGORIES: "/api/admin/catalog/categories",
  SINGLE_CATEGORY: (id: number | string) => `/api/admin/catalog/categories/${id}`,

  ITEMS: "/api/admin/catalog/items",
  SINGLE_ITEM: (id: number | string) => `/api/admin/catalog/items/${id}`,
  COPY_ITEMS_TO_OUTLET: "/api/admin/catalog/items/copy-to-outlet",
  CLONE_ITEM: (id: number | string) => `/api/admin/catalog/items/${id}/clone`,

  MODIFIER_GROUPS: "/api/admin/catalog/modifier-groups",
  SINGLE_MODIFIER_GROUP: (id: number | string) => `/api/admin/catalog/modifier-groups/${id}`,

  BUNDLES: "/api/admin/catalog/bundles",
  SINGLE_BUNDLE: (id: number | string) => `/api/admin/catalog/bundles/${id}`,
  UPDATE_BUNDLE_STATUS: (id: number | string) => `/api/admin/catalog/bundles/${id}/status`,

  IMPORT_CATALOG: "/api/admin/catalog/import",
  IMPORT_CATALOG_PREVIEW: "/api/admin/catalog/import/preview",
  IMPORT_CATALOG_TEMPLATE: "/api/admin/catalog/import/template",

  // Inventory Management
  INVENTORY: "/api/admin/inventory",
  SINGLE_INVENTORY: (id: number | string) => `/api/admin/inventory/${id}`,
  ADJUST_INVENTORY: (id: number | string) => `/api/admin/inventory/${id}/adjust`,

  // Inventory Categories
  INVENTORY_CATEGORIES: "/api/admin/inventory/categories",
  SINGLE_INVENTORY_CATEGORY: (id: number | string) => `/api/admin/inventory/categories/${id}`,

  // Measuring Units
  UNITS: "/api/admin/inventory/units",
  SINGLE_UNIT: (id: number | string) => `/api/admin/inventory/units/${id}`,

  // Composites (Recipes)
  COMPOSITES: "/api/admin/inventory/composites",
  SINGLE_COMPOSITE: (id: number | string) => `/api/admin/inventory/composites/${id}`,

  // Substitute Groups
  SUBSTITUTE_GROUPS: "/api/admin/inventory/substitute-groups",
  SINGLE_SUBSTITUTE_GROUP: (id: number | string) => `/api/admin/inventory/substitute-groups/${id}`,

  // Reconciliations
  RECONCILIATIONS: "/api/admin/inventory/reconciliations",
  SINGLE_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}`,
  DRAFT_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/draft`,
  SUBMIT_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/submit`,
  APPROVE_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/approve`,
  APPROVE_AND_POST_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/approve-and-post`,
  POST_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/post`,
  REJECT_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/reject`,

  // Transfers
  TRANSFERS: "/api/admin/inventory/transfers",
  SINGLE_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}`,
  APPROVE_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/approve`,
  CANCEL_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/cancel`,
  DISPATCH_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/dispatch`,
  RECEIVE_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/receive`,
  REJECT_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/reject`,
  SUBMIT_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/submit`,

  // Live Inventory & Snapshots
  LIST_ADJUSTMENTS: "/api/admin/inventory/adjustments",
  GET_BALANCE: "/api/admin/inventory/balance",
  LIST_BALANCES: "/api/admin/inventory/balances",
  BULK_RECEIVE: "/api/admin/inventory/bulk-receive",
  CREATE_LOCATION: "/api/admin/inventory/locations",
  LIST_LOCATIONS: "/api/admin/inventory/locations",
  LIST_MOVEMENTS: "/api/admin/inventory/movements",
  PICKER: "/api/admin/inventory/picker",
  REGENERATE_SNAPSHOTS: "/api/admin/inventory/snapshots/regenerate",
  LIST_SNAPSHOTS: "/api/admin/inventory/snapshots",
  SNAPSHOTS_SUMMARY: "/api/admin/inventory/snapshots/summary",
  LIST_SUBSTITUTION_LOGS: "/api/admin/inventory/substitution-logs",

  // Customers
  CUSTOMERS: "/api/admin/customers",
  SINGLE_CUSTOMER: (id: string | number) => `/api/admin/customers/${id}`,
  GET_CUSTOMER_TRANSACTIONS: (id: string | number) => `/api/admin/customers/${id}/transactions`,

  // Loyalty
  LOYALTY_REWARDS: "/api/admin/loyalty/rewards",
  SINGLE_LOYALTY_REWARD: (id: string | number) => `/api/admin/loyalty/rewards/${id}`,
  LIST_LOYALTY_ACTIVITY: "/api/admin/loyalty/activity",
  GET_LOYALTY_OUTLET_PERFORMANCE: "/api/admin/loyalty/outlet-performance",
  GET_LOYALTY_OVERVIEW: "/api/admin/loyalty/overview",
  GET_LOYALTY_SETTINGS: "/api/admin/loyalty/settings",
  GET_LOYALTY_TIER_BREAKDOWN: "/api/admin/loyalty/tier-breakdown",
  UPDATE_LOYALTY_SETTINGS: "/api/admin/loyalty/settings",
  UPDATE_LOYALTY_MEMBER_POINTS: (id: string | number) => `/api/admin/loyalty/members/${id}/points`,
  UPDATE_LOYALTY_PROGRAM_ENABLED: "/api/admin/loyalty/settings/program-enabled",

  // Expenses
  EXPENSES: "/api/admin/expenses",
  SINGLE_EXPENSE: (id: string | number) => `/api/admin/expenses/${id}`,

  // Tips Management
  TIPS: "/api/admin/tips",
  TIPS_PAYOUTS: "/api/admin/tips/payouts",
  CONFIRM_TIPS_PAYOUT: "/api/admin/tips/payouts/confirm",
  REVERSE_TIPS_PAYOUT: (id: string | number) => `/api/admin/tips/payouts/${id}/reverse`,
  SEND_TIPS_PAYOUT_OTP: "/api/admin/tips/payouts/send-otp",

  // Cashiers
  CASHIERS: "/api/cashiers",
  SINGLE_CASHIER: (id: string | number) => `/api/cashiers/${id}`,
  REGENERATE_CASHIER_PIN: (id: string | number) => `/api/cashiers/${id}/regenerate-pin`,

  // Users
  USERS: "/api/admin/users",
  SINGLE_USER: (id: string | number) => `/api/admin/users/${id}`,
  DEACTIVATE_USER: (id: string | number) => `/api/admin/users/${id}/deactivate`,

  // Roles & Permissions
  ROLES: "/api/admin/roles",
  SINGLE_ROLE: (id: string | number) => `/api/admin/roles/${id}`,
  ROLE_PERMISSIONS: "/api/admin/roles/permissions",

  // Terminals
  TERMINALS: "/api/admin/terminals",
  SINGLE_TERMINAL: (id: string | number) => `/api/admin/terminals/${id}`,
} as const;
