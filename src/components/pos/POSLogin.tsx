import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User, Eye, EyeOff, LogIn } from "lucide-react";

export default function POSLogin() {
  const { loginWithCredentials } = usePOS();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const success = loginWithCredentials(username, password);
      if (!success) setError("Invalid username or password");
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)] p-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--accent))]/20 mb-4">
            <Lock className="w-8 h-8 text-[hsl(var(--accent))]" />
          </div>
          <h1 className="text-2xl font-bold text-white font-heading">Point of Sale</h1>
          <p className="text-[hsl(210,3%,60%)] mt-1">Sign in to start your shift</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[hsl(233,37%,14%)]/80 backdrop-blur-xl border border-[hsl(233,30%,24%)] rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[hsl(210,3%,75%)]">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(210,3%,50%)]" />
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoFocus
                className="pl-10 bg-[hsl(233,37%,10%)] border-[hsl(233,30%,24%)] text-white placeholder:text-[hsl(210,3%,40%)] focus-visible:ring-[hsl(var(--accent))]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[hsl(210,3%,75%)]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(210,3%,50%)]" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pl-10 pr-10 bg-[hsl(233,37%,10%)] border-[hsl(233,30%,24%)] text-white placeholder:text-[hsl(210,3%,40%)] focus-visible:ring-[hsl(var(--accent))]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(210,3%,50%)] hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || !username} className="w-full h-12 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90 text-base font-semibold">
            {loading ? <span className="animate-spin">⏳</span> : <><LogIn className="w-5 h-5 mr-2" /> Sign In</>}
          </Button>

          <div className="text-center">
            <p className="text-xs text-[hsl(210,3%,50%)]">Demo: username <span className="text-[hsl(var(--accent))]">sarah</span>, any password</p>
          </div>
        </form>
      </div>
    </div>
  );
}
