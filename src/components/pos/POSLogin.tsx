import { useState, useRef, useEffect, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Delete, ArrowLeft, Search, Store, Unlink } from "lucide-react";
import { posCashiers } from "@/data/posData";
import logoDark from "@/assets/logo-dark.png";
import POSBrandPanel from "./POSBrandPanel";

export default function POSLogin() {
  const { selectCashierForPin, loginWithPin, linkedBusiness, currentOutlet, unlinkDevice } = usePOS();
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<typeof posCashiers[0] | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    containerRef.current?.focus();
  }, [selectedCashier]);

  const outletCashiers = useMemo(() => {
    if (!currentOutlet) return posCashiers;
    return posCashiers.filter(c => c.assignedOutlets.includes(currentOutlet.id));
  }, [currentOutlet]);

  const filteredCashiers = useMemo(() => {
    if (!search.trim()) return outletCashiers;
    const q = search.toLowerCase();
    return outletCashiers.filter(c => c.name.toLowerCase().includes(q));
  }, [outletCashiers, search]);

  const handleSelectCashier = (cashier: typeof posCashiers[0]) => {
    setSelectedCashier(cashier);
    selectCashierForPin(cashier);
    setPin("");
    setError(false);
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      setTimeout(() => {
        const success = loginWithPin(newPin);
        if (!success) {
          setError(true);
          setShake(true);
          setTimeout(() => { setShake(false); setPin(""); }, 500);
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleBack = () => {
    setSelectedCashier(null);
    setPin("");
    setError(false);
    setSearch("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  // Colour palette for avatar backgrounds
  const avatarColors = [
    { bg: "bg-[#D8245C]/10", text: "text-[#D8245C]" },
    { bg: "bg-[#47184E]/10", text: "text-[#47184E]" },
    { bg: "bg-[#55C2F0]/15", text: "text-[#0E7490]" },
    { bg: "bg-[#49B574]/10", text: "text-[#16A34A]" },
    { bg: "bg-[#E6B322]/10", text: "text-[#D97706]" },
    { bg: "bg-[#1A2042]/10", text: "text-[#1A2042]" },
  ];

  // ─── Cashier Selection ──────────────────────────────
  if (!selectedCashier) {
    return (
      <div className="min-h-screen flex bg-[#F8FAFC]">
        <POSBrandPanel
          businessName={linkedBusiness?.name}
          subtitle={currentOutlet ? `Terminal — ${currentOutlet.name}` : undefined}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 pt-5 pb-4">
            <div className="max-w-2xl mx-auto">
              {/* Mobile logo & business */}
              <div className="lg:hidden text-center mb-3">
                <img src={logoDark} alt="Smapps" className="h-6 mx-auto mb-2" />
                {linkedBusiness && (
                  <h2 className="text-sm font-semibold text-[#1A2042]">{linkedBusiness.name}</h2>
                )}
              </div>

              {currentOutlet && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#6B7280] mb-3">
                  <Store className="w-3 h-3" />
                  {currentOutlet.name}
                </div>
              )}

              <h1 className="text-center text-xl font-bold text-[#1A2042] mb-1">Who's clocking in?</h1>
              <p className="text-center text-[#9CA3AF] text-sm mb-4">Tap your name to sign in</p>

              <div className="relative max-w-xs mx-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search staff..."
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#F1F5F9] border border-[#E5E7EB] text-sm text-[#1A2042] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#D8245C] focus:ring-2 focus:ring-[#D8245C]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Scrollable cashier grid */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredCashiers.map((cashier, idx) => {
                  const color = avatarColors[idx % avatarColors.length];
                  return (
                    <button
                      key={cashier.id}
                      onClick={() => handleSelectCashier(cashier)}
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border-2 border-[#E5E7EB] hover:border-[#D8245C]/30 hover:shadow-lg hover:shadow-[#D8245C]/5 active:scale-[0.97] transition-all duration-150"
                    >
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${color.bg} text-lg font-bold ${color.text}`}>
                        {cashier.name.charAt(0)}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-[#1A2042]">{cashier.name}</div>
                        <div className="text-[10px] text-[#9CA3AF] capitalize mt-0.5">{cashier.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredCashiers.length === 0 && (
                <div className="text-center py-16 text-[#9CA3AF] text-sm">
                  No staff found matching "{search}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PIN Entry ──────────────────────────────────────
  const selectedColor = avatarColors[outletCashiers.findIndex(c => c.id === selectedCashier.id) % avatarColors.length] || avatarColors[0];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <POSBrandPanel
        businessName={selectedCashier.name}
        subtitle={currentOutlet?.name || "Enter your passcode"}
      />

      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-10"
        ref={containerRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
          else if (e.key === "Backspace") handleDelete();
          else if (e.key === "Escape") handleBack();
        }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-2">
            <img src={logoDark} alt="Smapps" className="h-6 mx-auto mb-4" />
          </div>

          {/* Profile */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${selectedColor.bg} mb-4 text-2xl font-bold ${selectedColor.text}`}>
              {selectedCashier.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-[#1A2042]">{selectedCashier.name}</h2>
            {currentOutlet && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF] mt-1">
                <Store className="w-3 h-3" />
                {currentOutlet.name}
              </div>
            )}
            <p className="text-[#6B7280] text-sm mt-3">Enter your 4-digit passcode</p>
          </div>

          {/* PIN dots */}
          <div className={`flex justify-center gap-5 mb-8 ${shake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? error ? "bg-[#DC2626] scale-125" : "bg-[#D8245C] scale-125"
                  : "bg-[#E5E7EB]"
              }`} />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-[#DC2626] mb-4 font-medium">Incorrect passcode</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto mb-8">
            {digits.map((d, i) => {
              if (d === "") return <div key={i} />;
              if (d === "del") return (
                <button key={i} onClick={handleDelete} className="flex items-center justify-center h-16 rounded-2xl bg-[#F1F5F9] border border-[#E5E7EB] text-[#6B7280] hover:bg-[#E5E7EB] active:scale-95 transition-all">
                  <Delete className="w-5 h-5" />
                </button>
              );
              return (
                <button key={i} onClick={() => handleDigit(d)} className="flex items-center justify-center h-16 rounded-2xl bg-white border-2 border-[#E5E7EB] text-[#1A2042] text-xl font-semibold hover:bg-[#F1F5F9] hover:border-[#D8245C]/20 active:scale-95 transition-all shadow-sm">
                  {d}
                </button>
              );
            })}
          </div>

          {/* Switch User */}
          <div className="flex justify-center">
            <button onClick={handleBack} className="flex items-center gap-2 text-[#6B7280] hover:text-[#D8245C] transition-colors px-4 py-2 rounded-xl hover:bg-[#D8245C]/5 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Switch User
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
