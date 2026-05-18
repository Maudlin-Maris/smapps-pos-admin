import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CashierProfileDialog({ open, onClose }: Props) {
  const { currentCashier, availableOutlets } = usePOS();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  if (!currentCashier) return null;

  const assignedOutletNames = availableOutlets
    .filter(o => currentCashier.assignedOutlets.includes(o.id))
    .map(o => o.name);

  const resetForms = () => {
    setShowPasswordForm(false);
    setShowPinForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setShowNewPassword(false);
  };

  const handleChangePassword = () => {
    if (!currentPassword.trim()) {
      toast.error("Enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Password updated successfully");
    resetForms();
  };

  const handleChangePin = () => {
    if (currentPin !== currentCashier.pin) {
      toast.error("Current PIN is incorrect");
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    toast.success("PIN updated successfully");
    resetForms();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { resetForms(); onClose(); } }}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-sm p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Profile
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {currentCashier.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-foreground">{currentCashier.name}</p>
              <p className="text-sm text-muted-foreground">@{currentCashier.username}</p>
              {currentCashier.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" /> {currentCashier.email}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="ml-auto capitalize">{currentCashier.role}</Badge>
          </div>

          {assignedOutletNames.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Assigned Outlets</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {assignedOutletNames.map(name => (
                  <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Change Password */}
          {!showPasswordForm ? (
            <Button variant="outline" className="w-full gap-2" onClick={() => { setShowPasswordForm(true); setShowPinForm(false); }}>
              <Lock className="w-4 h-4" /> Change Password
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Change Password
              </p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Current Password</Label>
                  <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">New Password</Label>
                  <div className="relative">
                    <Input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="h-8 text-sm pr-8" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Confirm New Password</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</Button>
                <Button size="sm" className="flex-1" onClick={handleChangePassword}>Update Password</Button>
              </div>
            </div>
          )}

          {/* Change PIN */}
          {!showPinForm ? (
            <Button variant="outline" className="w-full gap-2" onClick={() => { setShowPinForm(true); setShowPasswordForm(false); }}>
              <KeyRound className="w-4 h-4" /> Change PIN
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Change PIN
              </p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Current PIN</Label>
                  <Input type="password" inputMode="numeric" maxLength={4} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4-digit PIN" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">New PIN</Label>
                  <Input type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4-digit PIN" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Confirm New PIN</Label>
                  <Input type="password" inputMode="numeric" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4-digit PIN" className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setShowPinForm(false); setCurrentPin(""); setNewPin(""); setConfirmPin(""); }}>Cancel</Button>
                <Button size="sm" className="flex-1" onClick={handleChangePin}>Update PIN</Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
