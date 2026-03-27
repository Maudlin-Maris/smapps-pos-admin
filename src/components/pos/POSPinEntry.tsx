import { useState, useRef, useEffect, useCallback } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Delete, LogIn, Users } from "lucide-react";
import logoLight from "@/assets/logo-light.png";

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

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  if (showUserList) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)] p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src={logoLight} alt="Smapps" className="h-6 mx-auto mb-6 opacity-60" />
            <h2 className="text-xl font-bold text-white">Switch User</h2>
            <p className="text-[hsl(210,3%,60%)] text-sm mt-1">Select a profile or sign in as someone else</p>
          </div>

          <div className="space-y-2 mb-6">
            {signedInCashiers.map(cashier => (
              <button
                key={cashier.id}
                onClick={() => { selectCashier(cashier); setShowUserList(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  cashier.id === currentCashier?.id
                    ? "bg-[hsl(var(--accent))]/15 border-[hsl(var(--accent))]/40 text-white"
                    : "bg-[hsl(233,37%,14%)]/60 border-[hsl(233,30%,24%)] text-[hsl(210,3%,75%)] hover:bg-[hsl(233,37%,20%)]"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                  cashier.id === currentCashier?.id
                    ? "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]"
                    : "bg-[hsl(233,30%,24%)] text-[hsl(210,3%,75%)]"
                }`}>
                  {cashier.name.charAt(0)}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{cashier.name}</div>
                  <div className="text-xs text-[hsl(210,3%,50%)] capitalize">{cashier.role}</div>
                </div>
                {cashier.id === currentCashier?.id && (
                  <span className="text-[10px] font-medium text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 px-2 py-0.5 rounded-full">Current</span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-[hsl(233,30%,24%)] pt-4 space-y-2">
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start text-[hsl(210,3%,75%)] hover:text-white hover:bg-[hsl(233,37%,20%)] h-12"
            >
              <LogIn className="w-4 h-4 mr-3" /> Sign in as someone else
            </Button>
          </div>

          <div className="flex justify-center mt-6">
            <Button variant="ghost" onClick={() => setShowUserList(false)} className="text-[hsl(210,3%,60%)] hover:text-white hover:bg-[hsl(233,37%,20%)]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)] p-4"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
        else if (e.key === "Backspace") handleDelete();
      }}
    >
      <div className="w-full max-w-sm">
        {/* Profile */}
        <div className="text-center mb-8">
          <img src={logoLight} alt="Smapps" className="h-6 mx-auto mb-6 opacity-60" />
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[hsl(var(--accent))]/20 mb-4 text-2xl font-bold text-[hsl(var(--accent))]">
            {currentCashier?.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white">{currentCashier?.name}</h2>
          <p className="text-[hsl(210,3%,60%)] text-sm mt-1">
            {mode === "locked" ? "Screen locked — enter PIN to continue" : "Enter your 4-digit PIN"}
          </p>
        </div>

        {/* PIN dots */}
        <div className={`flex justify-center gap-4 mb-8 ${shake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length
                ? error ? "bg-[hsl(var(--destructive))] scale-110" : "bg-[hsl(var(--accent))] scale-110"
                : "bg-[hsl(233,30%,24%)]"
            }`} />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-[hsl(var(--destructive))] mb-4">Incorrect PIN. Try again.</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-8">
          {digits.map((d, i) => {
            if (d === "") return <div key={i} />;
            if (d === "del") return (
              <button key={i} onClick={handleDelete} className="flex items-center justify-center h-16 rounded-xl bg-[hsl(233,37%,14%)]/60 border border-[hsl(233,30%,24%)] text-[hsl(210,3%,75%)] hover:bg-[hsl(233,37%,20%)] active:scale-95 transition-all">
                <Delete className="w-5 h-5" />
              </button>
            );
            return (
              <button key={i} onClick={() => handleDigit(d)} className="flex items-center justify-center h-16 rounded-xl bg-[hsl(233,37%,14%)]/60 border border-[hsl(233,30%,24%)] text-white text-xl font-semibold hover:bg-[hsl(233,37%,20%)] active:scale-95 transition-all">
                {d}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {mode === "locked" ? (
            <>
              <Button variant="ghost" onClick={() => setShowUserList(true)} className="text-[hsl(210,3%,60%)] hover:text-white hover:bg-[hsl(233,37%,20%)]">
                <Users className="w-4 h-4 mr-2" /> Switch User
              </Button>
              <Button variant="ghost" onClick={logout} className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={logout} className="text-[hsl(210,3%,60%)] hover:text-white hover:bg-[hsl(233,37%,20%)]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Button>
          )}
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
