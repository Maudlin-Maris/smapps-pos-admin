import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useGetOutlets } from "@/services/api/outlets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, Monitor, Trash2, Copy, Store, Clock, Wifi, WifiOff, RefreshCw,
} from "lucide-react";

import {
  useGetTerminals,
  useCreateTerminal,
  useDeleteTerminal,
} from "@/services/api/terminals";
import type { TerminalRecord } from "@/lib/types/terminals";

export default function TerminalManagement() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const { data: terminalsList = [], isLoading: isTerminalsLoading, mutate } = useGetTerminals();
  const { data: outletsResponse } = useGetOutlets();
  const posOutlets = outletsResponse || [];

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TerminalRecord | null>(null);

  // Register form
  const [formName, setFormName] = useState("");
  const [formOutlet, setFormOutlet] = useState<string>("");
  const [generatedId, setGeneratedId] = useState("");
  const [showGenerated, setShowGenerated] = useState(false);

  const { trigger: createTerminal, isMutating: isCreating } = useCreateTerminal({
    onSuccess: (result) => {
      mutate();
      setDialogOpen(false);
      if (result) {
        setGeneratedId(result.deviceFingerprint || result.id);
        setShowGenerated(true);
        toast({ title: "Terminal registered" });
      }
    }
  });

  const { trigger: deleteTerminal, isMutating: isDeleting } = useDeleteTerminal(deleteTarget?.id, {
    onSuccess: () => {
      mutate();
      setDeleteTarget(null);
      toast({ title: "Terminal removed" });
    }
  });

  if (!hasPermission("terminals.manage")) {
    return <Navigate to="/" replace />;
  }

  const filtered = terminalsList.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.deviceFingerprint || "").toLowerCase().includes(q)
    );
  });

  const openRegister = () => {
    setFormName("");
    setFormOutlet("");
    setDialogOpen(true);
  };

  const handleRegister = async () => {
    if (!formName.trim()) {
      toast({ title: "Please enter a terminal name", variant: "destructive" });
      return;
    }
    if (!formOutlet) {
      toast({ title: "Please assign an outlet", variant: "destructive" });
      return;
    }

    try {
      await createTerminal({
        name: formName.trim(),
        outletId: formOutlet,
      });
    } catch (e) {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTerminal();
    } catch (e) {}
  };

  const copyLinkingId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    toast({ title: "Linking ID copied" });
  };

  const outletName = (id: string) => posOutlets.find((o) => o.id === id)?.name ?? id;

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatRelative = (iso?: string) => {
    if (!iso) return "Never";
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
            <Badge variant="secondary" className="text-xs">{terminalsList.length}</Badge>
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
        {isTerminalsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
              <div className="h-px bg-muted" />
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-muted rounded" />
                <div className="h-8 w-8 bg-muted rounded-md" />
              </div>
            </Card>
          ))
        ) : (
          filtered.map((t) => (
            <Card key={t.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm">{t.name}</h3>
                    {t.deviceFingerprint && (
                      <button
                        onClick={() => copyLinkingId(t.deviceFingerprint!)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                        title="Copy Linking ID"
                      >
                        <span className="font-mono">{t.deviceFingerprint}</span>
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
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
                  <span className="text-xs">Linked {formatDate(t.lastSeenAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">Last seen {formatRelative(t.lastSeenAt)}</span>
                </div>
              </div>

              <Separator className="mb-3" />

              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <Store className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="font-medium truncate">{outletName(t.outletId)}</span>
                  </div>
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
          ))
        )}

        {!isTerminalsLoading && filtered.length === 0 && (
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
              <Label htmlFor="termOutlet">Assigned outlet</Label>
              <p className="text-xs text-muted-foreground">
                A terminal can only be assigned to one outlet.
              </p>
              <Select value={formOutlet} onValueChange={setFormOutlet}>
                <SelectTrigger id="termOutlet">
                  <SelectValue placeholder="Select an outlet" />
                </SelectTrigger>
                <SelectContent>
                  {posOutlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={isCreating}>
              {isCreating ? "Registering..." : "Register"}
            </Button>
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
              <strong>{deleteTarget?.name}</strong> ({deleteTarget?.deviceFingerprint || deleteTarget?.id}) will be
              unlinked. The device will need to be re-registered to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing..." : "Remove Terminal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
