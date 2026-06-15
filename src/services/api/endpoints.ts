export const API_BASE_URL = "https://api.smappsgroup.com";

export const API_ENDPOINTS = {
  LOGIN: "/api/admin/login",
  LIST_OUTLETS: "/api/admin/outlets",
  CREATE_OUTLET: "/api/admin/outlets",
  UPDATE_OUTLET: (id: number | string) => `/api/admin/outlets/${id}`,
  UPDATE_OUTLET_STATUS: (id: number | string) => `/api/admin/outlets/${id}/status`,

  // Catalog / Menu Management
  CREATE_CATEGORY: "/api/admin/catalog/categories",
  DELETE_CATEGORY: (id: number | string) => `/api/admin/catalog/categories/${id}`,
  LIST_CATEGORIES: "/api/admin/catalog/categories",
  UPDATE_CATEGORY: (id: number | string) => `/api/admin/catalog/categories/${id}`,

  CREATE_ITEM: "/api/admin/catalog/items",
  DELETE_ITEM: (id: number | string) => `/api/admin/catalog/items/${id}`,
  GET_ITEM: (id: number | string) => `/api/admin/catalog/items/${id}`,
  LIST_ITEMS: "/api/admin/catalog/items",
  UPDATE_ITEM: (id: number | string) => `/api/admin/catalog/items/${id}`,
  COPY_ITEMS_TO_OUTLET: "/api/admin/catalog/items/copy-to-outlet",
  CLONE_ITEM: (id: number | string) => `/api/admin/catalog/items/${id}/clone`,

  CREATE_MODIFIER_GROUP: "/api/admin/catalog/modifier-groups",
  LIST_MODIFIER_GROUPS: "/api/admin/catalog/modifier-groups",
  GET_MODIFIER_GROUP: (id: number | string) => `/api/admin/catalog/modifier-groups/${id}`,
  UPDATE_MODIFIER_GROUP: (id: number | string) => `/api/admin/catalog/modifier-groups/${id}`,
  DELETE_MODIFIER_GROUP: (id: number | string) => `/api/admin/catalog/modifier-groups/${id}`,

  CREATE_BUNDLE: "/api/admin/catalog/bundles",
  DELETE_BUNDLE: (id: number | string) => `/api/admin/catalog/bundles/${id}`,
  GET_BUNDLE: (id: number | string) => `/api/admin/catalog/bundles/${id}`,
  LIST_BUNDLES: "/api/admin/catalog/bundles",
  UPDATE_BUNDLE_STATUS: (id: number | string) => `/api/admin/catalog/bundles/${id}/status`,

  IMPORT_CATALOG: "/api/admin/catalog/import",
  IMPORT_CATALOG_PREVIEW: "/api/admin/catalog/import/preview",
  IMPORT_CATALOG_TEMPLATE: "/api/admin/catalog/import/template",

  // Inventory Management
  LIST_INVENTORY: "/api/admin/inventory",
  GET_INVENTORY: (id: number | string) => `/api/admin/inventory/${id}`,
  CREATE_INVENTORY: "/api/admin/inventory",
  UPDATE_INVENTORY: (id: number | string) => `/api/admin/inventory/${id}`,
  DELETE_INVENTORY: (id: number | string) => `/api/admin/inventory/${id}`,
  ADJUST_INVENTORY: (id: number | string) => `/api/admin/inventory/${id}/adjust`,

  // Inventory Categories
  LIST_INVENTORY_CATEGORIES: "/api/admin/inventory/categories",
  GET_INVENTORY_CATEGORY: (id: number | string) => `/api/admin/inventory/categories/${id}`,
  CREATE_INVENTORY_CATEGORY: "/api/admin/inventory/categories",
  UPDATE_INVENTORY_CATEGORY: (id: number | string) => `/api/admin/inventory/categories/${id}`,
  DELETE_INVENTORY_CATEGORY: (id: number | string) => `/api/admin/inventory/categories/${id}`,

  // Measuring Units
  LIST_UNITS: "/api/admin/inventory/units",
  GET_UNIT: (id: number | string) => `/api/admin/inventory/units/${id}`,
  CREATE_UNIT: "/api/admin/inventory/units",
  UPDATE_UNIT: (id: number | string) => `/api/admin/inventory/units/${id}`,
  DELETE_UNIT: (id: number | string) => `/api/admin/inventory/units/${id}`,

  // Composites (Recipes)
  LIST_COMPOSITES: "/api/admin/inventory/composites",
  GET_COMPOSITE: (id: number | string) => `/api/admin/inventory/composites/${id}`,
  CREATE_COMPOSITE: "/api/admin/inventory/composites",
  UPDATE_COMPOSITE: (id: number | string) => `/api/admin/inventory/composites/${id}`,
  DELETE_COMPOSITE: (id: number | string) => `/api/admin/inventory/composites/${id}`,

  // Substitute Groups
  LIST_SUBSTITUTE_GROUPS: "/api/admin/inventory/substitute-groups",
  GET_SUBSTITUTE_GROUP: (id: number | string) => `/api/admin/inventory/substitute-groups/${id}`,
  CREATE_SUBSTITUTE_GROUP: "/api/admin/inventory/substitute-groups",
  UPDATE_SUBSTITUTE_GROUP: (id: number | string) => `/api/admin/inventory/substitute-groups/${id}`,
  DELETE_SUBSTITUTE_GROUP: (id: number | string) => `/api/admin/inventory/substitute-groups/${id}`,

  // Reconciliations
  LIST_RECONCILIATIONS: "/api/admin/inventory/reconciliations",
  GET_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}`,
  CREATE_RECONCILIATION: "/api/admin/inventory/reconciliations",
  DELETE_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}`,
  DRAFT_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/draft`,
  SUBMIT_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/submit`,
  APPROVE_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/approve`,
  APPROVE_AND_POST_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/approve-and-post`,
  POST_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/post`,
  REJECT_RECONCILIATION: (id: number | string) => `/api/admin/inventory/reconciliations/${id}/reject`,

  // Transfers
  LIST_TRANSFERS: "/api/admin/inventory/transfers",
  GET_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}`,
  CREATE_TRANSFER: "/api/admin/inventory/transfers",
  UPDATE_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}`,
  DELETE_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}`,
  APPROVE_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/approve`,
  CANCEL_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/cancel`,
  DISPATCH_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/dispatch`,
  RECEIVE_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/receive`,
  REJECT_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/reject`,
  SUBMIT_TRANSFER: (id: number | string) => `/api/admin/inventory/transfers/${id}/submit`,
} as const;
