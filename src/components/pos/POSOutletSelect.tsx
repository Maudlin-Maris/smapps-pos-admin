import { useState } from "react";
import { Store, MapPin, Unlink } from "lucide-react";
import { type POSOutlet } from "@/data/posData";
import logoDark from "@/assets/logo-dark.png";
import POSBrandPanel from "./POSBrandPanel";

interface Props {
  businessName: string;
  outlets: POSOutlet[];
  onSelect: (outlet: POSOutlet) => void;
  onUnlink?: () => void;
}

export default function POSOutletSelect({ businessName, outlets, onSelect, onUnlink }: Props) {
  const [confirmUnlink, setConfirmUnlink] = useState(false);
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

          {onUnlink && (
            <>
              <button
                onClick={() => setConfirmUnlink(true)}
                className="mt-8 mx-auto flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Unlink this device
              </button>

              {confirmUnlink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#1A2042]">Unlink Device?</h3>
                    <p className="text-sm text-[#6B7280]">
                      This will disconnect the terminal from <strong>{businessName}</strong>. You'll need a new linking ID to reconnect.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmUnlink(false)}
                        className="flex-1 h-11 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onUnlink}
                        className="flex-1 h-11 rounded-xl bg-[#DC2626] text-white text-sm font-semibold hover:bg-[#B91C1C] transition-colors"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
