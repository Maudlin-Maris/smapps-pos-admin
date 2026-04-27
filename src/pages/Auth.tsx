import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import logoLight from "@/assets/logo-light.png";
import authHero from "@/assets/auth-hero.jpg";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Sign in failed", description: error, variant: "destructive" });
      return;
    }
    navigate("/", { replace: true });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error, newPassword } = await resetPassword(forgotEmail);
    setForgotLoading(false);
    if (error) {
      toast({ title: "Reset failed", description: error, variant: "destructive" });
      return;
    }
    toast({
      title: "New password sent",
      description: `A new password has been emailed to ${forgotEmail}. (Demo: ${newPassword})`,
    });
    setForgotOpen(false);
    setForgotEmail("");
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-[hsl(233,37%,12%)] via-[hsl(233,37%,18%)] to-[hsl(293,52%,20%)]">
      {/* Left: hero panel (hidden on small screens) */}
      <div className="hidden lg:flex relative w-1/2 xl:w-3/5 overflow-hidden border-r border-[hsl(233,30%,24%)] bg-[hsl(233,40%,9%)]">
        {/* Ambient color glows behind the artwork */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[hsl(var(--accent))]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-[hsl(293,52%,40%)]/25 blur-3xl pointer-events-none" />
        <img
          src={authHero}
          alt="Isometric retail point of sale illustration"
          width={1280}
          height={1600}
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none select-none [image-rendering:auto]"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[hsl(233,40%,9%)] to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[hsl(233,40%,9%)] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-end p-12 w-full">
          <div className="space-y-4 max-w-md rounded-2xl bg-[hsl(233,40%,8%)]/70 backdrop-blur-md border border-white/10 p-6 shadow-2xl">
            <h2 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              Run your retail business with confidence.
            </h2>
            <p className="text-base text-[hsl(210,3%,85%)] leading-relaxed">
              One unified platform for sales, inventory, customers and insights — across every outlet.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["Multi-outlet", "Loyalty", "Real-time reports", "Inventory"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm text-white border border-white/15"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-[hsl(210,3%,65%)] pt-2">© {new Date().getFullYear()} Smapps. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
        {/* Decorative blobs for mobile/tablet */}
        <div className="lg:hidden absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[hsl(var(--accent))]/20 blur-3xl pointer-events-none" />
        <div className="lg:hidden absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[hsl(293,52%,40%)]/30 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <img src={logoLight} alt="Smapps" className="h-9 mx-auto mb-5" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Admin Portal
          </h1>
          <p className="text-sm text-[hsl(210,3%,70%)] mt-2">
            Sign in to manage your retail operations
          </p>
        </div>

        <div className="bg-[hsl(233,37%,14%)]/80 backdrop-blur-xl border border-[hsl(233,30%,24%)] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[hsl(210,3%,80%)] text-sm">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(210,3%,50%)]" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="pl-10 h-11 bg-[hsl(233,37%,10%)] border-[hsl(233,30%,24%)] text-white placeholder:text-[hsl(210,3%,40%)] focus-visible:ring-[hsl(var(--accent))]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[hsl(210,3%,80%)] text-sm">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-xs text-[hsl(var(--accent))] hover:text-[hsl(196,84%,75%)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(210,3%,50%)]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-11 bg-[hsl(233,37%,10%)] border-[hsl(233,30%,24%)] text-white placeholder:text-[hsl(210,3%,40%)] focus-visible:ring-[hsl(var(--accent))]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(210,3%,50%)] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full h-11 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90 font-semibold"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[hsl(233,30%,24%)] flex items-center justify-center gap-2 text-xs text-[hsl(210,3%,55%)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure session protected by Smapps</span>
          </div>
        </div>

        <p className="text-center text-xs text-[hsl(210,3%,55%)] mt-6">
          Need an account? Contact your system administrator.
        </p>
        <p className="text-center text-[10px] text-[hsl(210,3%,45%)] mt-2">
          Demo: <span className="text-[hsl(var(--accent))]">admin@smapps.com</span> / admin123
        </p>
      </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email and we'll generate a new password and send it to your inbox.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email address</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={forgotLoading || !forgotEmail}>
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send new password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
