import { useState, useRef, useEffect } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Delete, ArrowLeft } from "lucide-react";
import { posCashiers } from "@/data/posData";
import logoLight from "@/assets/logo-light.png";

export default function POSLogin() {
  const { selectCashierForPin, loginWithPin } = usePOS();
  const [selectedCashier, setSelectedCashier] = useState<typeof posCashiers[0] | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    containerRef.current?.focus();
  }, [selectedCashier]);

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
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  // Staff selection screen
  if (!selectedCashier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)] p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl font-light text-white tracking-wide mb-1">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-[hsl(210,3%,50%)] mb-6">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <img src={logoLight} alt="Smapps" className="h-7 mx-auto mb-6 opacity-70" />
            <h1 className="text-xl font-bold text-white">Who's clocking in?</h1>
            <p className="text-[hsl(210,3%,50%)] text-sm mt-1">Tap your name to enter passcode</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {posCashiers.map(cashier => (
              <button
                key={cashier.id}
                onClick={() => handleSelectCashier(cashier)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[hsl(233,37%,14%)]/70 border border-[hsl(233,30%,24%)] hover:bg-[hsl(233,37%,20%)] hover:border-[hsl(var(--accent))]/40 active:scale-[0.97] transition-all duration-150"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15 text-lg font-bold text-[hsl(var(--accent))]">
                  {cashier.name.charAt(0)}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">{cashier.name}</div>
                  <div className="text-[10px] text-[hsl(210,3%,50%)] capitalize">{cashier.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PIN entry screen
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)] p-4"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
        else if (e.key === "Backspace") handleDelete();
        else if (e.key === "Escape") handleBack();
      }}
    >
      <div className="w-full max-w-sm">
        {/* Profile */}
        <div className="text-center mb-8">
          <div className="text-5xl font-light text-white tracking-wide mb-1">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-[hsl(210,3%,50%)] mb-6">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <img src={logoLight} alt="Smapps" className="h-6 mx-auto mb-6 opacity-60" />
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[hsl(var(--accent))]/20 mb-4 text-2xl font-bold text-[hsl(var(--accent))]">
            {selectedCashier.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white">{selectedCashier.name}</h2>
          <p className="text-[hsl(210,3%,60%)] text-sm mt-1">Enter your 4-digit passcode</p>
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
          <p className="text-center text-sm text-[hsl(var(--destructive))] mb-4">Incorrect passcode</p>
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

        {/* Switch User */}
        <div className="flex justify-center">
          <button onClick={handleBack} className="flex items-center gap-2 text-[hsl(210,3%,60%)] hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-[hsl(233,37%,20%)]">
            <ArrowLeft className="w-4 h-4" /> Switch User
          </button>
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
