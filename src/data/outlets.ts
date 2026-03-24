import type { BusinessTypeId } from "./businessTypes";

export interface Outlet {
  id: string;
  name: string;
  businessType: BusinessTypeId;
}

export const outlets: Outlet[] = [
  // Restaurant / Bar / Lounge
  { id: "outlet-1", name: "Downtown Flagship", businessType: "restaurant" },
  { id: "outlet-2", name: "Mall Branch", businessType: "retail" },
  { id: "outlet-3", name: "Airport Kiosk", businessType: "restaurant" },
  // Pharmacy
  { id: "outlet-4", name: "Suburban Pharmacy", businessType: "pharmacy" },
  // Salon
  { id: "outlet-5", name: "Glow Beauty Salon", businessType: "salon" },
  // Barber
  { id: "outlet-6", name: "Sharp Cuts Barber", businessType: "barber" },
  // Grocery
  { id: "outlet-7", name: "FreshMart Grocery", businessType: "grocery" },
  // Supermarket
  { id: "outlet-8", name: "MegaMart Supermarket", businessType: "supermarket" },
  // Wine & Liquor
  { id: "outlet-9", name: "Vine & Spirit", businessType: "wine_store" },
  // Clothing
  { id: "outlet-10", name: "Urban Threads", businessType: "clothing" },
  // Electronics
  { id: "outlet-11", name: "TechZone", businessType: "electronics" },
  // Hair / Wig Store
  { id: "outlet-12", name: "Crown Hair Gallery", businessType: "hair_seller" },
];
