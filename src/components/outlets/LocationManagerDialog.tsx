import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Printer, QrCode, MapPin, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import {
  loadOutletLocations,
  saveOutletLocations,
  buildLocationMenuUrl,
  type OutletLocation,
} from "@/data/outletLocations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: number;
  outletName: string;
}

type View = "list" | "form" | "qr";

export default function LocationManagerDialog({ open, onOpenChange, outletId, outletName }: Props) {
  const [all, setAll] = useState<OutletLocation[]>([]);
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<OutletLocation | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [qrLocation, setQrLocation] = useState<OutletLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OutletLocation | null>(null);

  useEffect(() => {
    if (open) {
      setAll(loadOutletLocations());
      setView("list");
    }
  }, [open]);

  const locations = useMemo(
    () => all.filter((l) => l.outletId === outletId),
    [all, outletId]
  );

  const persist = (next: OutletLocation[]) => {
    setAll(next);
    saveOutletLocations(next);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setView("form");
  };

  const openEdit = (loc: OutletLocation) => {
    setEditing(loc);
    setForm({ name: loc.name, description: loc.description || "" });
    setView("form");
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    if (editing) {
      const next = all.map((l) =>
        l.id === editing.id ? { ...l, name: form.name.trim(), description: form.description.trim() } : l
      );
      persist(next);
      toast.success(`Updated "${form.name}"`);
    } else {
      const newLoc: OutletLocation = {
        id: `loc-${Date.now()}`,
        outletId,
        name: form.name.trim(),
        description: form.description.trim(),
        createdAt: new Date().toISOString(),
      };
      persist([...all, newLoc]);
      toast.success(`Added "${form.name}"`);
    }
    setView("list");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    persist(all.filter((l) => l.id !== deleteTarget.id));
    toast.success(`Removed "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  const printQRCodes = (locs: OutletLocation[]) => {
    if (locs.length === 0) {
      toast.error("No locations to print");
      return;
    }
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      toast.error("Popup blocked. Allow popups to print.");
      return;
    }
    const cards = locs
      .map((loc) => {
        const url = buildLocationMenuUrl(outletId, loc.id);
        return `
          <div class="card">
            <div class="brand">${outletName}</div>
            <div class="title">${loc.name}</div>
            ${loc.description ? `<div class="desc">${loc.description}</div>` : ""}
            <div class="qr">${qrSvgString(url)}</div>
            <div class="instr">Scan to view our menu</div>
            <div class="url">${url}</div>
          </div>
        `;
      })
      .join("");
    win.document.write(`
      <html>
        <head>
          <title>QR Menu — ${outletName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 16px; background: #fff; color: #111; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .card { border: 2px dashed #999; border-radius: 12px; padding: 20px; text-align: center; page-break-inside: avoid; }
            .brand { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #666; margin-bottom: 4px; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
            .desc { font-size: 12px; color: #666; margin-bottom: 12px; }
            .qr { display: flex; justify-content: center; margin: 12px 0; }
            .qr svg { width: 200px; height: 200px; }
            .instr { font-size: 14px; font-weight: 600; margin-top: 8px; }
            .url { font-size: 10px; color: #888; word-break: break-all; margin-top: 6px; }
            @media print { body { padding: 0; } .grid { gap: 8px; } }
          </style>
        </head>
        <body>
          <div class="grid">${cards}</div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 200); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              {view !== "list" && (
                <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1" onClick={() => setView("list")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <MapPin className="h-5 w-5 text-accent" />
              {view === "list" && `Locations — ${outletName}`}
              {view === "form" && (editing ? "Edit Location" : "Add Location")}
              {view === "qr" && qrLocation && `QR Menu — ${qrLocation.name}`}
            </DialogTitle>
            {view === "list" && (
              <DialogDescription>
                Manage tables, zones, or pickup spots. Each gets a unique QR code that links to your menu.
              </DialogDescription>
            )}
          </DialogHeader>

          {view === "list" && (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{locations.length} location{locations.length !== 1 ? "s" : ""}</Badge>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => printQRCodes(locations)} disabled={locations.length === 0}>
                    <Printer className="h-3.5 w-3.5 mr-1.5" /> Print All
                  </Button>
                  <Button size="sm" onClick={openAdd}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Location
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 -mx-1 px-1">
                {locations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No locations yet. Add tables, booths, or pickup spots.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{loc.name}</div>
                          {loc.description && (
                            <div className="text-xs text-muted-foreground truncate">{loc.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View QR" onClick={() => { setQrLocation(loc); setView("qr"); }}>
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Print QR" onClick={() => printQRCodes([loc])}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(loc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteTarget(loc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {view === "form" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="loc-name">Location Name</Label>
                <Input
                  id="loc-name"
                  placeholder="e.g. Table 5, Patio, Bar 1"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-desc">Description (optional)</Label>
                <Textarea
                  id="loc-desc"
                  placeholder="e.g. Window seat, seats 4"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
                <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Location"}</Button>
              </div>
            </div>
          )}

          {view === "qr" && qrLocation && (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 py-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{outletName}</p>
                <p className="text-xl font-heading font-bold mt-1">{qrLocation.name}</p>
                {qrLocation.description && (
                  <p className="text-sm text-muted-foreground">{qrLocation.description}</p>
                )}
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-dashed border-border">
                <QRCodeSVG value={buildLocationMenuUrl(outletId, qrLocation.id)} size={220} level="M" />
              </div>
              <p className="text-sm font-medium">Scan to view our menu</p>
              <p className="text-[11px] text-muted-foreground break-all max-w-md text-center px-4">
                {buildLocationMenuUrl(outletId, qrLocation.id)}
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setView("list")}>Back</Button>
                <Button onClick={() => printQRCodes([qrLocation])}>
                  <Printer className="h-4 w-4 mr-1.5" /> Print QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The QR code for this location will stop working. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Render a QR SVG to string for the print window (no React in print doc).
function qrSvgString(value: string): string {
  // Lightweight: use a remote-free approach by rendering via QRCodeSVG-equivalent algorithm is heavy.
  // Use Google Chart-free fallback: leverage the qrcode.react component server-side via renderToStaticMarkup.
  // Simpler: use an inline data URI img generated from canvas at runtime.
  // Here we use a lightweight encoder by dynamic import not available; fallback to <img> via qrserver.
  const encoded = encodeURIComponent(value);
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}" width="200" height="200" alt="QR" />`;
}
