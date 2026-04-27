import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/logo-dark.png";
import authHero from "@/assets/auth-hero.jpg";

const REMEMBER_KEY = "smapps_remember_email";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    if (remember) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
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

  const hasError = !!formError;

  return (
    <div className="min-h-screen w-full flex bg-[#F7F7F8]">
      {/* Left: illustration panel (hidden on small screens) */}
      <aside className="hidden lg:flex relative w-1/2 xl:w-[55%] flex-col justify-between p-12 bg-[#FAFAFB] border-r border-[#DCDDDE] overflow-hidden">
        {/* Soft accent glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#55C2F0]/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-[#E6B322]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-[#D8245C]/10 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <img src={logoDark} alt="Smapps" className="h-7 w-auto" />
        </div>

        <div className="relative flex-1 flex items-center justify-center py-8">
          <div className="relative w-full max-w-lg aspect-square">
            <div className="absolute inset-0 rounded-[32px] bg-white shadow-[0_1px_2px_rgba(26,32,66,0.04),0_8px_32px_-8px_rgba(26,32,66,0.10)] border border-[#DCDDDE]" />
            <img
              src={authHero}
              alt="Retail point of sale illustration"
              width={1024}
              height={1024}
              loading="eager"
              decoding="async"
              className="relative w-full h-full object-contain p-6"
            />
          </div>
        </div>

        <div className="relative max-w-md space-y-3">
          <h2 className="text-2xl font-semibold text-[#1A2042] tracking-tight">
            Everything your store needs, in one place.
          </h2>
          <p className="text-sm text-[#1A2042]/65 leading-relaxed">
            Sales, inventory, customers and reports — designed for daily operations across every outlet.
          </p>
          <p className="text-xs text-[#1A2042]/55 pt-4">
            © {new Date().getFullYear()} Smapps. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Right: form panel */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoDark} alt="Smapps" className="h-8 w-auto" />
          </div>

          <div className="mb-8">
            <p className="text-xs font-medium text-[hsl(196,84%,40%)] uppercase tracking-wider mb-2">
              Login as Admin
            </p>
            <h1 className="text-[28px] leading-tight font-semibold text-[hsl(233,37%,18%)] tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-[hsl(233,10%,46%)] mt-2">
              Sign in to your admin portal to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[hsl(233,37%,18%)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="you@company.com"
                autoComplete="email"
                aria-invalid={hasError}
                className={cn(
                  "h-11 rounded-[10px] bg-white border-[hsl(230,15%,88%)] text-[hsl(233,37%,18%)] placeholder:text-[hsl(233,10%,60%)] transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-[hsl(196,84%,55%)]/30 focus-visible:border-[hsl(196,84%,55%)] focus-visible:ring-offset-0",
                  hasError && "border-[hsl(341,73%,55%)] focus-visible:border-[hsl(341,73%,55%)] focus-visible:ring-[hsl(341,73%,55%)]/25",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-[hsl(233,37%,18%)]">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-xs font-medium text-[hsl(196,84%,40%)] hover:text-[hsl(196,84%,32%)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={hasError}
                  className={cn(
                    "h-11 rounded-[10px] bg-white border-[hsl(230,15%,88%)] pr-10 text-[hsl(233,37%,18%)] placeholder:text-[hsl(233,10%,60%)] transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-[hsl(196,84%,55%)]/30 focus-visible:border-[hsl(196,84%,55%)] focus-visible:ring-offset-0",
                    hasError && "border-[hsl(341,73%,55%)] focus-visible:border-[hsl(341,73%,55%)] focus-visible:ring-[hsl(341,73%,55%)]/25",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(233,10%,55%)] hover:text-[hsl(233,37%,18%)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {hasError && (
                <p className="flex items-center gap-1.5 text-xs text-[hsl(341,73%,49%)] mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                className="h-4 w-4 rounded border-[hsl(230,15%,80%)] data-[state=checked]:bg-[hsl(196,84%,45%)] data-[state=checked]:border-[hsl(196,84%,45%)]"
              />
              <Label htmlFor="remember" className="text-sm font-normal text-[hsl(233,10%,40%)] cursor-pointer">
                Remember me on this device
              </Label>
            </div>

            <Button
              type="submit"
              disabled={submitting || !email || !password}
              className={cn(
                "w-full h-11 rounded-[10px] font-semibold text-[15px]",
                "bg-[hsl(233,37%,18%)] text-white shadow-sm",
                "hover:bg-[hsl(233,37%,24%)] hover:shadow-md",
                "active:bg-[hsl(233,37%,14%)]",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-[hsl(233,10%,55%)] mt-8">
            Need an account? Contact your system administrator.
          </p>
          <p className="text-center text-[11px] text-[hsl(233,10%,60%)] mt-2">
            Demo: <span className="font-medium text-[hsl(196,84%,40%)]">admin@smapps.com</span> / admin123
          </p>
        </div>
      </main>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email and we'll generate a new password and send it to your inbox.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email address</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11 rounded-[10px]"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} className="rounded-[10px]">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={forgotLoading || !forgotEmail}
                className="rounded-[10px] bg-[hsl(233,37%,18%)] hover:bg-[hsl(233,37%,24%)] text-white"
              >
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send new password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
