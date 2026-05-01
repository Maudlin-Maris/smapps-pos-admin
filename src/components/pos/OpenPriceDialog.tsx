import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira } from "@/lib/currency";
import { DollarSign } from "lucide-react";

interface Props {
  open: boolean;
  productName: string;
  onConfirm: (price: number) => void;
  onClose: () => void;
}

export default function OpenPriceDialog({ open, productName, onConfirm, onClose }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const numericValue = parseFloat(value) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericValue > 0) {
      onConfirm(numericValue);
    }
  };

  // Quick amount buttons for common Nigerian price points
  const quickAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4 text-primary" />
            Enter Price
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-3">{productName}</p>
            <Label htmlFor="open-price" className="text-xs text-muted-foreground">
              Selling Price (₦)
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₦</span>
              <Input
                ref={inputRef}
                id="open-price"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-lg font-semibold h-12"
                inputMode="decimal"
              />
            </div>
            {numericValue > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Amount: {formatNaira(numericValue)}
              </p>
            )}
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setValue(String(amt))}
                className="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                {formatNaira(amt)}
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={numericValue <= 0}>
              Add to Cart
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
