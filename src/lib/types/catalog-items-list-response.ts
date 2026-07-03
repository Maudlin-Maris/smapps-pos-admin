export interface CatalogItemsListResponse {
    data: CatalogItem[];
    meta: Meta;
}

export interface CatalogItem {
    id: string;
    outletId: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    price: number;
    sku: string;
    status: string;
    itemType: string;
    trackInventory: boolean;
    linkedInventoryItemId: string;
    modifierGroupIds: any[];
    images: string[];
    createdAt: Date;
}

export interface Meta {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}
