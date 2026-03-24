import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Keyboard, ScanBarcode, X } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  value: string;
  onChange: (barcode: string) => void;
  placeholder?: string;
}

export default function BarcodeScanner({ value, onChange, placeholder = "Scan or enter barcode" }: BarcodeScannerProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"idle" | "scanning">("idle");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // External scanner: listens for rapid key input ending with Enter
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only capture when not focused on other inputs
    if (document.activeElement && document.activeElement !== inputRef.current && 
        (document.activeElement as HTMLElement).tagName === "INPUT") return;

    if (e.key === "Enter" && bufferRef.current.length >= 4) {
      onChange(bufferRef.current);
      bufferRef.current = "";
      toast.success("Barcode scanned!");
      e.preventDefault();
      return;
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { bufferRef.current = ""; }, 100);
    }
  }, [onChange]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const startCamera = async () => {
    setCameraOpen(true);
    setScannerMode("scanning");
  };

  useEffect(() => {
    if (!cameraOpen || !scannerRef.current) return;

    let scanner: any = null;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("barcode-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            onChange(decodedText);
            toast.success("Barcode scanned!");
            scanner.stop().catch(() => {});
            setCameraOpen(false);
            setScannerMode("idle");
          },
          () => {} // ignore errors during scanning
        );
      } catch (err) {
        toast.error("Camera access denied or not available");
        setCameraOpen(false);
        setScannerMode("idle");
      }
    };

    // Small delay to let the DOM render the container
    const timer = setTimeout(initScanner, 300);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [cameraOpen, onChange]);

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
    setCameraOpen(false);
    setScannerMode("idle");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startCamera}
          title="Scan with camera"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Use camera button or scan with an external barcode scanner
      </p>

      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              id="barcode-reader"
              ref={scannerRef}
              className="w-full min-h-[250px] rounded-lg overflow-hidden bg-muted"
            />
            <p className="text-sm text-muted-foreground text-center">
              Point your camera at the barcode
            </p>
            <Button variant="outline" className="w-full" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
