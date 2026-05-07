import { Store, MapPin } from "lucide-react";
import { type POSOutlet } from "@/data/posData";
import logoDark from "@/assets/logo-dark.png";
import POSBrandPanel from "./POSBrandPanel";

interface Props {
  businessName: string;
  outlets: POSOutlet[];
  onSelect: (outlet: POSOutlet) => void;
}

export default function POSOutletSelect({ businessName, outlets, onSelect }: Props) {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <POSBrandPanel businessName={businessName} subtitle="Choose the outlet you'd like to open on this terminal." />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile-only header */}
          <div className="lg:hidden text-center mb-6">
            <img src={logoDark} alt="Smapps" className="h-7 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#1A2042]">{businessName}</h2>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-[#1A2042] mb-1 lg:text-2xl">Select Outlet</h1>
            <p className="text-[#6B7280] text-sm">Tap the location to continue</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outlets.map(outlet => (
              <button
                key={outlet.id}
                onClick={() => onSelect(outlet)}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border-2 border-[#E5E7EB] hover:border-[#D8245C]/40 hover:shadow-lg hover:shadow-[#D8245C]/5 active:scale-[0.97] transition-all text-left group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8245C]/10 shrink-0 group-hover:bg-[#D8245C]/15 transition-colors">
                  <Store className="w-6 h-6 text-[#D8245C]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A2042] truncate">{outlet.name}</div>
                  {outlet.address && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-[#9CA3AF]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{outlet.address}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-[#9CA3AF] mt-1 capitalize">{outlet.businessType.replace("_", " ")}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
