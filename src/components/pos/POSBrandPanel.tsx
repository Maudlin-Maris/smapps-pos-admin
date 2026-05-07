import { useState, useEffect } from "react";
import logoLight from "@/assets/logo-light.png";

interface Props {
  businessName?: string;
  subtitle?: string;
}

export default function POSBrandPanel({ businessName, subtitle }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-gradient-to-br from-[#1A2042] via-[#2A2856] to-[#47184E] items-center justify-center">
      {/* Abstract decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#D8245C]/10 blur-3xl" />
        <div className="absolute bottom-10 -right-10 w-96 h-96 rounded-full bg-[#47184E]/30 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-[#55C2F0]/5 blur-3xl" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 text-center px-12 max-w-md">
        <img src={logoLight} alt="Smapps POS" className="h-10 mx-auto mb-8" />

        <div className="text-5xl font-light text-white/90 tracking-wide mb-1">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-sm text-white/40 mb-10">
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>

        {businessName && (
          <h1 className="text-2xl font-bold text-white mb-2">{businessName}</h1>
        )}
        {subtitle && (
          <p className="text-white/50 text-sm leading-relaxed">{subtitle}</p>
        )}

        {!businessName && !subtitle && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Your point of sale system is ready. Link a device, select your outlet, and start selling.
            </p>
          </>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-white/20 text-xs">
          <div className="w-8 h-px bg-white/20" />
          <span>Powered by Smapps</span>
          <div className="w-8 h-px bg-white/20" />
        </div>
      </div>
    </div>
  );
}
