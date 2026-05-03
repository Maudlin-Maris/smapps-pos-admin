import { Store, MapPin } from "lucide-react";
import { type POSOutlet } from "@/data/posData";
import logoLight from "@/assets/logo-light.png";

interface Props {
  businessName: string;
  outlets: POSOutlet[];
  onSelect: (outlet: POSOutlet) => void;
}

export default function POSOutletSelect({ businessName, outlets, onSelect }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src={logoLight} alt="Smapps" className="h-7 mx-auto mb-6 opacity-70" />
          <h1 className="text-xl font-bold text-white mb-1">{businessName}</h1>
          <p className="text-[hsl(210,3%,55%)] text-sm">Select an outlet to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {outlets.map(outlet => (
            <button
              key={outlet.id}
              onClick={() => onSelect(outlet)}
              className="flex items-start gap-4 p-5 rounded-2xl bg-[hsl(233,37%,14%)]/70 border border-[hsl(233,30%,24%)] hover:bg-[hsl(233,37%,20%)] hover:border-[hsl(var(--accent))]/40 active:scale-[0.97] transition-all text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/15 shrink-0">
                <Store className="w-6 h-6 text-[hsl(var(--accent))]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{outlet.name}</div>
                {outlet.address && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-[hsl(210,3%,50%)]">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{outlet.address}</span>
                  </div>
                )}
                <div className="text-[10px] text-[hsl(210,3%,40%)] mt-1 capitalize">{outlet.businessType.replace("_", " ")}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
