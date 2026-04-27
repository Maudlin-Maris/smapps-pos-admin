import { useState, useEffect } from "react";
import { useAuth, loadUsers, saveUsers, generatePassword, MockUser } from "@/contexts/AuthContext";
import { loadRoles, Role } from "@/lib/rbac";
import { outlets } from "@/data/outlets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, UserX, UserCheck, Copy, Search, ShieldAlert } from "lucide-react";
import { Navigate } from "react-router-dom";

interface FormState {
  display_name: string;
  email: string;
  role_id: string;
  outlet_ids: string[];
  status: "active" | "inactive";
}

const emptyForm: FormState = {
  display_name: "",
  email: "",
  role_id: "role_cashier",
  outlet_ids: [],
  status: "active",
};

export default function UserManagement() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<MockUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [generatedFor, setGeneratedFor] = useState<string>("");
  const [confirmDeactivate, setConfirmDeactivate] = useState<MockUser | null>(null);

  useEffect(() => {
    setUsers(loadUsers());
    setRoles(loadRoles());
  }, []);

  if (!hasPermission("users.manage")) {
    return <Navigate to="/" replace />;
  }

  const refresh = () => setUsers(loadUsers());

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (u: MockUser) => {
    setEditingId(u.id);
    setForm({
      display_name: u.display_name,
      email: u.email,
      role_id: u.role_id,
      outlet_ids: u.outlet_ids,
      status: u.status,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.display_name.trim()) e.display_name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.role_id) e.role_id = "Role is required";
    // unique email
    const dup = users.find(
      (u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== editingId,
    );
    if (dup) e.email = "Another user already uses this email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const all = loadUsers();
    if (editingId) {
      const idx = all.findIndex((u) => u.id === editingId);
      if (idx === -1) return;
      all[idx] = {
        ...all[idx],
        display_name: form.display_name.trim(),
        email: form.email.trim(),
        role_id: form.role_id,
        outlet_ids: form.outlet_ids,
        status: form.status,
        role: form.role_id === "role_admin" ? "admin" : form.role_id === "role_manager" ? "manager" : "staff",
      };
      saveUsers(all);
      toast({ title: "User updated" });
      setDialogOpen(false);
      refresh();
    } else {
      const password = generatePassword(12);
      const newUser: MockUser = {
        id: `u_${Math.random().toString(36).slice(2, 10)}`,
        email: form.email.trim(),
        password,
        display_name: form.display_name.trim(),
        phone: "",
        avatar_url: null,
        role: form.role_id === "role_admin" ? "admin" : form.role_id === "role_manager" ? "manager" : "staff",
        role_id: form.role_id,
        outlet_ids: form.outlet_ids,
        status: form.status,
        created_at: new Date().toISOString(),
      };
      saveUsers([...all, newUser]);
      setDialogOpen(false);
      setGeneratedPassword(password);
      setGeneratedFor(newUser.email);
      refresh();
      toast({ title: "User created" });
    }
  };

  const toggleStatus = (u: MockUser) => {
    const all = loadUsers();
    const idx = all.findIndex((x) => x.id === u.id);
    if (idx === -1) return;
    all[idx] = { ...all[idx], status: u.status === "active" ? "inactive" : "active" };
    saveUsers(all);
    refresh();
    toast({ title: u.status === "active" ? "User deactivated" : "User reactivated" });
    setConfirmDeactivate(null);
  };

  const copyPassword = async () => {
    if (!generatedPassword) return;
    await navigator.clipboard.writeText(generatedPassword);
    toast({ title: "Password copied to clipboard" });
  };

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "—";

  const outletLabel = (ids: string[]) => {
    if (!ids.length) return "All outlets";
    if (ids.length === 1) return outlets.find((o) => o.id === ids[0])?.name ?? "—";
    return `${ids.length} outlets`;
  };

  const toggleOutlet = (id: string) => {
    setForm((f) => ({
      ...f,
      outlet_ids: f.outlet_ids.includes(id)
        ? f.outlet_ids.filter((x) => x !== id)
        : [...f.outlet_ids, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage portal users, their roles and assigned outlets.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> New user
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Outlets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.display_name}
                      {currentUser?.id === u.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleName(u.role_id)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {outletLabel(u.outlet_ids)}
                    </TableCell>
                    <TableCell>
                      {u.status === "active" ? (
                        <Badge className="bg-success/15 text-success hover:bg-success/15 border-success/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={currentUser?.id === u.id}
                          title={currentUser?.id === u.id ? "You can't deactivate yourself" : undefined}
                          onClick={() => setConfirmDeactivate(u)}
                        >
                          {u.status === "active" ? (
                            <UserX className="w-4 h-4 text-destructive" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-success" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this user's details, role or outlet access."
                : "A temporary password will be generated when you save."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  aria-invalid={!!errors.display_name}
                />
                {errors.display_name && (
                  <p className="text-xs text-destructive">{errors.display_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Outlet access</Label>
              <p className="text-xs text-muted-foreground">
                Leave all unchecked to grant access to every outlet.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border p-3">
                {outlets.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={form.outlet_ids.includes(o.id)}
                      onCheckedChange={() => toggleOutlet(o.id)}
                    />
                    <span className="truncate">{o.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? "Save changes" : "Create user"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generated password reveal */}
      <Dialog open={!!generatedPassword} onOpenChange={(o) => !o && setGeneratedPassword(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary password</DialogTitle>
            <DialogDescription>
              Share this password with <span className="font-medium text-foreground">{generatedFor}</span>.
              It won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 font-mono text-sm">
            <span className="flex-1 break-all">{generatedPassword}</span>
            <Button type="button" size="sm" variant="ghost" onClick={copyPassword}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
            <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <span>
              Ask the user to change this password on first sign-in via Profile → Change password.
            </span>
          </div>
          <DialogFooter>
            <Button onClick={() => setGeneratedPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDeactivate?.status === "active" ? "Deactivate user?" : "Reactivate user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeactivate?.status === "active"
                ? `${confirmDeactivate?.display_name} will no longer be able to sign in to the admin portal.`
                : `${confirmDeactivate?.display_name} will be able to sign in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeactivate && toggleStatus(confirmDeactivate)}
              className={
                confirmDeactivate?.status === "active"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmDeactivate?.status === "active" ? "Deactivate" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
