import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Building2, Wallet, Pencil } from "lucide-react";
import { toast } from "sonner";
import { businessTypeList } from "@/data/businessTypes";

export interface OutletFormData {
  name: string;
  locationAddress: string;
  outletAddress: string;
  email: string;
  phone: string;
  currency: string;
  businessType: string;
  payBeforeOrder: boolean;
  payAfterOrder: boolean;
  disableMobileOrder: boolean;
  restrictMerging: boolean;
  restrictSettlement: boolean;
  bank: string;
  accountNumber: string;
  accountName: string;
  otpEmail: string;
}

const emptyForm: OutletFormData = {
  name: "", locationAddress: "", outletAddress: "", email: "", phone: "",
  currency: "", businessType: "", payBeforeOrder: false, payAfterOrder: false,
  disableMobileOrder: false, restrictMerging: false, restrictSettlement: false,
  bank: "", accountNumber: "", accountName: "", otpEmail: "",
};

interface OutletFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: Partial<OutletFormData>;
  onSubmit: (data: OutletFormData) => void;
}

export default function OutletFormDialog({ open, onOpenChange, mode, initialData, onSubmit }: OutletFormDialogProps) {
  const [form, setForm] = useState<OutletFormData>(emptyForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...initialData });
      setLogoPreview(null);
      setBannerPreview(null);
    }
  }, [open, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "logo") setLogoPreview(url);
    else setBannerPreview(url);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Outlet name is required");
      return;
    }
    onSubmit(form);
    onOpenChange(false);
  };

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            {isEdit ? <Pencil className="h-5 w-5 text-accent" /> : <Building2 className="h-5 w-5 text-accent" />}
            {isEdit ? "Edit Outlet" : "Add New Outlet"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Outlet Name</Label>
              <Input id="name" placeholder="e.g. Downtown Flagship" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="locationAddress">Location Address</Label>
              <Input id="locationAddress" placeholder="Location address" value={form.locationAddress} onChange={(e) => update("locationAddress", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="outletAddress">Outlet Address</Label>
              <Input id="outletAddress" placeholder="Outlet address" value={form.outletAddress} onChange={(e) => update("outletAddress", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Outlet Email</Label>
              <Input id="email" type="email" placeholder="outlet@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Outlet Phone</Label>
              <Input id="phone" type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Outlet Sale Currency</Label>
              <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={form.businessType} onValueChange={(v) => update("businessType", v)}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {businessTypeList.map((bt) => (
                    <SelectItem key={bt.id} value={bt.id}>{bt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Outlet Logo</Label>
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors bg-muted/30">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2 rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground text-sm">
                    <Upload className="h-5 w-5 mb-1" />
                    Upload Logo
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logo")} />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Outlet Banner</Label>
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors bg-muted/30">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover p-2 rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground text-sm">
                    <Upload className="h-5 w-5 mb-1" />
                    Upload Banner
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "banner")} />
              </label>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-heading font-semibold text-foreground">Order Settings</h3>
            <div className="space-y-3">
              {[
                { key: "payBeforeOrder", label: "Allow payment before order confirmation" },
                { key: "payAfterOrder", label: "Allow payment after order confirmation" },
                { key: "disableMobileOrder", label: "Disable order from mobile app — Show menu view only" },
                { key: "restrictMerging", label: "Restrict order merging and item transfer" },
                { key: "restrictSettlement", label: "Restrict order settlement" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer flex-1">{label}</Label>
                  <Switch
                    id={key}
                    checked={form[key as keyof OutletFormData] as boolean}
                    onCheckedChange={(v) => update(key, v)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent" />
              Wallet Payout Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <Select value={form.bank} onValueChange={(v) => update("bank", v)}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {[
                      "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank of Nigeria",
                      "First City Monument Bank (FCMB)", "Globus Bank", "Guaranty Trust Bank (GTBank)",
                      "Heritage Bank", "Jaiz Bank", "Keystone Bank", "Kuda Bank", "Lotus Bank",
                      "Moniepoint MFB", "Opay", "Palmpay", "Parallex Bank", "Polaris Bank",
                      "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered Bank",
                      "Sterling Bank", "SunTrust Bank", "Titan Trust Bank", "Union Bank of Nigeria",
                      "United Bank for Africa (UBA)", "Unity Bank", "VFD Microfinance Bank",
                      "Wema Bank", "Zenith Bank",
                    ].map((bank) => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" type="number" placeholder="0000000000" value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" placeholder="Account holder name" value={form.accountName} onChange={(e) => update("accountName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otpEmail">OTP Verification Email</Label>
                <Input id="otpEmail" type="email" placeholder="otp@example.com" value={form.otpEmail} onChange={(e) => update("otpEmail", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Outlet"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
