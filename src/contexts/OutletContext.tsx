import { createContext, useContext, useState, type ReactNode } from "react";
import { type BusinessTypeId, getBusinessType, getFeatures, type BusinessTypeFeatures } from "@/data/businessTypes";

export interface OutletInfo {
  id: string;
  name: string;
  businessType: BusinessTypeId;
}

interface OutletContextType {
  selectedOutlet: OutletInfo | null;
  setSelectedOutlet: (outlet: OutletInfo | null) => void;
  features: BusinessTypeFeatures;
  isAllOutlets: boolean;
}

const defaultFeatures = getFeatures("restaurant");

const OutletContext = createContext<OutletContextType>({
  selectedOutlet: null,
  setSelectedOutlet: () => {},
  features: defaultFeatures,
  isAllOutlets: true,
});

export function OutletProvider({ children }: { children: ReactNode }) {
  const [selectedOutlet, setSelectedOutlet] = useState<OutletInfo | null>(null);

  const features = selectedOutlet
    ? getFeatures(selectedOutlet.businessType)
    : defaultFeatures;

  const isAllOutlets = !selectedOutlet;

  return (
    <OutletContext.Provider value={{ selectedOutlet, setSelectedOutlet, features, isAllOutlets }}>
      {children}
    </OutletContext.Provider>
  );
}

export function useOutletContext() {
  return useContext(OutletContext);
}
