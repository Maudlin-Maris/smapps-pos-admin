import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { posOutlets, mockDeviceLinks, type POSBusiness } from "@/data/posData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Search, Monitor, Trash2, Copy, Store, Clock, Wifi, WifiOff, RefreshCw,
} from "lucide-react";

// ---------- Types ----------
interface LinkedTerminal {
  id: string;
  linkingId: string;
  deviceName: string;
  businessId: string;
  businessName: string;
  assignedOutlets: string[];
  linkedAt: string; // ISO string
  lastSeen: string; // ISO string
  status: "online" | "offline";
}

const TERMINALS_KEY = "smapps_linked_terminals";

// Seed from mockDeviceLinks on first load
function seedTerminals(): LinkedTerminal[] {
  const seeded: LinkedTerminal[] = Object.entries(mockDeviceLinks).map(([linkId, biz], i) => ({
    id: `term-${i + 1}`,
    linkingId: linkId,
    deviceName: `Terminal ${i + 1}`,
    businessId: biz.id,
    businessName: biz.name,
    assignedOutlets: biz.assignedOutlets,
    linkedAt: new Date(Date.now() - (30 - i * 5) * 86400000).toISOString(),
    lastSeen: new Date(Date.now() - i * 3600000).toISOString(),
    status: i === 0 ? "online" : "offline",
  }));
  localStorage.setItem(TERMINALS_KEY, JSON.stringify(seeded));
  return seeded;
}

function loadTerminals(): LinkedTerminal[] {
  try {
    const raw = localStorage.getItem(TERMINALS_KEY);
    if (!raw) return seedTerminals();
    const parsed = JSON.parse(raw) as LinkedTerminal[];
    return parsed.length ? parsed : seedTerminals();
  } catch {
    return seedTerminals();
  }
}

function saveTerminals(t: LinkedTerminal[]) {
  localStorage.setItem(TERMINALS_KEY, JSON.stringify(t));
}

function generateLinkingId(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `SMAPPS-${num}`;
}

export default function TerminalManagement() {
  const { hasPermission } = useAuth();
  const [terminals, setTerminals] = useState<LinkedTerminal[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkedTerminal | null>(null);

  // Register form
  const [formName, setFormName] = useState("");
  const [formOutlets, setFormOutlets] = useState<string[]>([]);
  const [generatedId, setGeneratedId] = useState("");
  const [showGenerated, setShowGenerated] = useState(false);

  useEffect(() => {
    setTerminals(loadTerminals());
  }, []);

  if (!hasPermission("terminals.manage")) {
    return <Navigate to="/" replace />;
  }

  const refresh = () => setTerminals(loadTerminals());

  const filtered = terminals.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.deviceName.toLowerCase().includes(q) ||
      t.linkingId.toLowerCase().includes(q) ||
      t.businessName.toLowerCase().includes(q)
    );
  });

  const openRegister = () => {
    setFormName("");
    setFormOutlets([]);
    setDialogOpen(true);
  };

  const toggleOutlet = (id: string) => {
    setFormOutlets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRegister = () => {
    if (!formName.trim()) {
      toast({ title: "Please enter a terminal name", variant: "destructive" });
      return;
    }
    if (!formOutlets.length) {
      toast({ title: "Please assign at least one outlet", variant: "destructive" });
      return;
    }

    const linkId = generateLinkingId();
    const newTerminal: LinkedTerminal = {
      id: `term-${Date.now()}`,
      linkingId: linkId,
      deviceName: formName.trim(),
      businessId: "biz-new",
      businessName: "My Business",
      assignedOutlets: formOutlets,
      linkedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      status: "offline",
    };

    const all = loadTerminals();
    saveTerminals([newTerminal, ...all]);
    refresh();
    setDialogOpen(false);
    setGeneratedId(linkId);
    setShowGenerated(true);
    toast({ title: "Terminal registered" });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const all = loadTerminals().filter((t) => t.id !== deleteTarget.id);
    saveTerminals(all);
    refresh();
    setDeleteTarget(null);
    toast({ title: "Terminal removed" });
  };

  const copyLinkingId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    toast({ title: "Linking ID copied" });
  };

  const outletName = (id: string) => posOutlets.find((o) => o.id === id)?.name ?? id;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold tracking-tight">Terminals</h1>
            <Badge variant="secondary" className="text-xs">{terminals.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage linked POS terminals and generate device linking IDs
          </p>
        </div>
        <Button size="sm" className="w-fit" onClick={openRegister}>
          <Plus className="h-4 w-4 mr-1" /> Register Terminal
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search terminals..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Terminal Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm">{t.deviceName}</h3>
                  <button
                    onClick={() => copyLinkingId(t.linkingId)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                    title="Copy Linking ID"
                  >
                    <span className="font-mono">{t.linkingId}</span>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {t.status === "online" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/20">
                    <Wifi className="h-3 w-3 mr-1" /> Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <WifiOff className="h-3 w-3 mr-1" /> Offline
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-sm mb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">Linked {formatDate(t.linkedAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">Last seen {formatRelative(t.lastSeen)}</span>
              </div>
            </div>

            <Separator className="mb-3" />

            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5 flex-1 min-w-0">
                {t.assignedOutlets.slice(0, 3).map((oid) => (
                  <div key={oid} className="flex items-center gap-2 text-xs">
                    <Store className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="font-medium truncate">{outletName(oid)}</span>
                  </div>
                ))}
                {t.assignedOutlets.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-5">
                    +{t.assignedOutlets.length - 3} more
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => setDeleteTarget(t)}
                title="Remove terminal"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
            <Monitor className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "No terminals match your search" : "No terminals registered yet"}
            </p>
          </div>
        )}
      </div>

      {/* Register Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register Terminal</DialogTitle>
            <DialogDescription>
              Create a new terminal and generate a linking ID for the POS device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="termName">Terminal name</Label>
              <Input
                id="termName"
                placeholder="e.g. Front Counter, Kitchen Display"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Assigned outlets</Label>
              <p className="text-xs text-muted-foreground">
                Select which outlets this terminal can access.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border p-3">
                {posOutlets.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={formOutlets.includes(o.id)}
                      onCheckedChange={() => toggleOutlet(o.id)}
                    />
                    <span className="truncate">{o.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister}>Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated ID reveal */}
      <Dialog open={showGenerated} onOpenChange={(o) => !o && setShowGenerated(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terminal Registered</DialogTitle>
            <DialogDescription>
              Use this linking ID on the POS device to connect it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 font-mono text-lg tracking-widest justify-center">
            <span>{generatedId}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => copyLinkingId(generatedId)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Enter this ID on the POS terminal's "Link This Device" screen.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowGenerated(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove terminal?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.deviceName}</strong> ({deleteTarget?.linkingId}) will be
              unlinked. The device will need to be re-registered to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Terminal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
