import { useState, useRef, useEffect } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Delete, LogIn, Users } from "lucide-react";
import logoDark from "@/assets/logo-dark.png";
import POSBrandPanel from "./POSBrandPanel";

interface POSPinEntryProps {
  mode: "pin" | "locked";
}

export default function POSPinEntry({ mode }: POSPinEntryProps) {
  const { currentCashier, signedInCashiers, loginWithPin, logout, selectCashier } = usePOS();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    setPin("");
    setError(false);
    setShowUserList(false);
  }, [currentCashier?.id]);

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
      }, 200);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const otherCashiers = signedInCashiers.filter(c => c.id !== currentCashier?.id);
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  // ─── Switch User list ───────────────────────────────
  if (showUserList) {
    return (
      <div className="min-h-screen flex bg-[#F8FAFC]">
        <POSBrandPanel subtitle="Switch between signed-in team members" />

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="lg:hidden text-center mb-6">
              <img src={logoDark} alt="Smapps" className="h-6 mx-auto mb-4" />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#1A2042]">Switch User</h2>
              <p className="text-[#6B7280] text-sm mt-1">Select a profile or sign in as someone else</p>
            </div>

            <div className="space-y-2 mb-6">
              {signedInCashiers.map(cashier => (
                <button
                  key={cashier.id}
                  onClick={() => { selectCashier(cashier); setShowUserList(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    cashier.id === currentCashier?.id
                      ? "bg-[#D8245C]/5 border-[#D8245C]/30 text-[#1A2042]"
                      : "bg-white border-[#E5E7EB] text-[#374151] hover:border-[#D8245C]/20 hover:shadow-sm"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                    cashier.id === currentCashier?.id
                      ? "bg-[#D8245C]/15 text-[#D8245C]"
                      : "bg-[#F1F5F9] text-[#6B7280]"
                  }`}>
                    {cashier.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{cashier.name}</div>
                    <div className="text-xs text-[#9CA3AF] capitalize">{cashier.role}</div>
                  </div>
                  {cashier.id === currentCashier?.id && (
                    <span className="text-[10px] font-semibold text-[#D8245C] bg-[#D8245C]/10 px-2 py-0.5 rounded-full">Current</span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full justify-start text-[#6B7280] hover:text-[#1A2042] hover:bg-[#F1F5F9] h-12"
              >
                <LogIn className="w-4 h-4 mr-3" /> Sign in as someone else
              </Button>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="ghost" onClick={() => setShowUserList(false)} className="text-[#6B7280] hover:text-[#D8245C] hover:bg-[#D8245C]/5">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PIN Entry (Lock screen) ────────────────────────
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <POSBrandPanel
        businessName={currentCashier?.name}
        subtitle={mode === "locked" ? "Screen locked" : "Enter your passcode"}
      />

      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-10"
        ref={containerRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
          else if (e.key === "Backspace") handleDelete();
        }}
      >
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-6">
            <img src={logoDark} alt="Smapps" className="h-6 mx-auto mb-4" />
          </div>

          {/* Profile */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D8245C]/10 mb-4 text-2xl font-bold text-[#D8245C]">
              {currentCashier?.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-[#1A2042]">{currentCashier?.name}</h2>
            <p className="text-[#6B7280] text-sm mt-2">
              {mode === "locked" ? "Screen locked — enter PIN to continue" : "Enter your 4-digit PIN"}
            </p>
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
            <p className="text-center text-sm text-[#DC2626] mb-4 font-medium">Incorrect PIN. Try again.</p>
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

          {/* Actions */}
          <div className="flex justify-center gap-4">
            {mode === "locked" ? (
              <>
                <Button variant="ghost" onClick={() => setShowUserList(true)} className="text-[#6B7280] hover:text-[#D8245C] hover:bg-[#D8245C]/5">
                  <Users className="w-4 h-4 mr-2" /> Switch User
                </Button>
                <Button variant="ghost" onClick={logout} className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/5">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={logout} className="text-[#6B7280] hover:text-[#D8245C] hover:bg-[#D8245C]/5">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            )}
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
