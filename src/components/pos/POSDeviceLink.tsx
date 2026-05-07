import { useState } from "react";
import { Link2, ArrowRight, AlertCircle } from "lucide-react";
import logoDark from "@/assets/logo-dark.png";
import POSBrandPanel from "./POSBrandPanel";

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
    setTimeout(() => {
      const success = onLink(id);
      if (!success) {
        setError("Invalid linking ID. Please check and try again.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <POSBrandPanel subtitle="Link this terminal to your business to get started with Smapps POS." />

      {/* Right interaction panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={logoDark} alt="Smapps" className="h-8 mx-auto mb-2" />
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D8245C]/10 mb-5">
              <Link2 className="w-7 h-7 text-[#D8245C]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A2042] mb-2">Link This Device</h1>
            <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs mx-auto">
              Enter the Device Linking ID from your admin portal to connect this terminal.
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
                className="w-full h-14 rounded-xl bg-white border-2 border-[#E5E7EB] text-[#1A2042] text-center text-lg font-mono tracking-widest placeholder:text-[#9CA3AF] placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-[#D8245C] focus:ring-2 focus:ring-[#D8245C]/20 transition-all shadow-sm"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-[#DC2626] bg-[#FEF2F2] rounded-xl px-4 py-3 border border-[#FECACA]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !linkingId.trim()}
              className="w-full h-14 rounded-xl bg-[#D8245C] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#C01F52] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#D8245C]/20"
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

          <p className="text-center text-[#9CA3AF] text-xs mt-8">
            Contact your administrator if you don't have a linking ID.
          </p>
        </div>
      </div>
    </div>
  );
}
