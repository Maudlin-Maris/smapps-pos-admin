import type { BusinessTypeId } from "./businessTypes";

export interface Outlet {
  id: string;
  name: string;
  businessType: BusinessTypeId;
}

export const outlets: Outlet[] = [
  { id: "outlet-1", name: "Downtown Flagship", businessType: "restaurant" },
  { id: "outlet-2", name: "Mall Branch", businessType: "retail" },
  { id: "outlet-3", name: "Airport Kiosk", businessType: "restaurant" },
  { id: "outlet-4", name: "Suburban Store", businessType: "pharmacy" },
];
