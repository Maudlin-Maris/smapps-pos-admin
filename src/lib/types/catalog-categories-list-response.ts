export interface CatalogCategoriesListReponse {
    data: Datum[];
    meta: Meta;
}

export interface Datum {
    id: string;
    name: string;
    description: string;
    sortOrder: number;
}

export interface Meta {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}
