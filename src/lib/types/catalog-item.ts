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
