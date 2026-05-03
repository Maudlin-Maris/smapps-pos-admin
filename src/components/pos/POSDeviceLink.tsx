import { useState } from "react";
import { Link2, ArrowRight, AlertCircle } from "lucide-react";
import logoLight from "@/assets/logo-light.png";

interface Props {
  onLink: (linkingId: string) => boolean;
}

export default function POSDeviceLink({ onLink }: Props) {
  const [linkingId, setLinkingId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const id = linkingId.trim().toUpperCase();
    if (!id) {
      setError("Please enter a Device Linking ID");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate brief network delay
    setTimeout(() => {
      const success = onLink(id);
      if (!success) {
        setError("Invalid linking ID. Please check and try again.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logoLight} alt="Smapps" className="h-8 mx-auto mb-8 opacity-80" />
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[hsl(var(--accent))]/15 mb-6">
            <Link2 className="w-9 h-9 text-[hsl(var(--accent))]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link This Device</h1>
          <p className="text-[hsl(210,3%,55%)] text-sm leading-relaxed">
            Enter the Device Linking ID from your admin portal to connect this terminal to your business.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={linkingId}
              onChange={e => { setLinkingId(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. SMAPPS-001"
              className="w-full h-14 rounded-xl bg-[hsl(233,37%,14%)]/80 border border-[hsl(233,30%,24%)] text-white text-center text-lg font-mono tracking-widest placeholder:text-[hsl(210,3%,35%)] placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-[hsl(var(--accent))]/60 focus:ring-1 focus:ring-[hsl(var(--accent))]/30 transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !linkingId.trim()}
            className="w-full h-14 rounded-xl bg-[hsl(var(--accent))] text-white font-semibold text-base flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Link Device
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[hsl(210,3%,40%)] text-xs mt-8">
          Contact your administrator if you don't have a linking ID.
        </p>
      </div>
    </div>
  );
}
