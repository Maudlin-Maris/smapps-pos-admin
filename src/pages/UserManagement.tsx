import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetOutlets } from "@/services/api/outlets";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, UserX, UserCheck, Search, ShieldAlert, Mail, Phone, Store, Building2, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";

import {
  useGetUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
} from "@/services/api/users";
import { useGetRoles } from "@/services/api/roles-permissions";
import type { UserRecord } from "@/lib/types/users";

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: string;
  outlet_ids: string[];
  status: "active" | "inactive";
}

const emptyForm: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role_id: "role_cashier",
  outlet_ids: [],
  status: "active",
};

export default function UserManagement() {
  const { user: currentUser, hasPermission } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: usersList = [], isLoading: isUsersLoading, mutate } = useGetUsers({
    search: debouncedSearch.trim() || undefined,
  });
  const { data: rolesList = [] } = useGetRoles();
  const { data: outletsResponse } = useGetOutlets();
  const outlets = outletsResponse || [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserRecord | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<UserRecord | null>(null);

  const { trigger: createUser, isMutating: isCreating } = useCreateUser({
    onSuccess: () => {
      mutate();
      setDialogOpen(false);
      toast({ title: "User created", description: "Invitation email has been sent to the user." });
    }
  });

  const { trigger: updateUser, isMutating: isUpdating } = useUpdateUser(editingId, {
    onSuccess: () => {
      mutate();
      setDialogOpen(false);
      toast({ title: "User updated" });
    }
  });

  const { trigger: deactivateUser, isMutating: isDeactivating } = useDeactivateUser(confirmDeactivate?.id, {
    onSuccess: (result) => {
      mutate();
      setConfirmDeactivate(null);
      toast({ title: result.isActive ? "User reactivated" : "User deactivated" });
    }
  });

  const { trigger: reactivateUser } = useUpdateUser(reactivateTarget?.id, {
    onSuccess: () => {
      mutate();
      setReactivateTarget(null);
      toast({ title: "User reactivated" });
    }
  });

  useEffect(() => {
    if (reactivateTarget) {
      reactivateUser({ status: "active" });
    }
  }, [reactivateTarget]);

  if (!hasPermission("users.manage")) {
    return <Navigate to="/" replace />;
  }

  const filtered = usersList;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (u: UserRecord) => {
    setEditingId(u.id);
    setForm({
      first_name: u.firstName || "",
      last_name: u.lastName || "",
      email: u.email,
      phone: u.phone || "",
      role_id: u.role?.id || "",
      outlet_ids: u.outlets || [],
      status: u.isActive ? "active" : "inactive",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.role_id) e.role_id = "Role is required";

    const dup = usersList.find(
      (u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== editingId,
    );
    if (dup) e.email = "Another user already uses this email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    if (editingId) {
      try {
        await updateUser({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
          status: form.status,
          role_id: form.role_id,
          outlets: form.outlet_ids,
        });
      } catch (e) {}
    } else {
      try {
        await createUser({
          email: form.email.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
          role_id: form.role_id,
          status: form.status,
          outlets: form.outlet_ids,
        });
      } catch (e) {}
    }
  };

  const toggleStatus = (u: UserRecord) => {
    if (u.isActive) {
      setConfirmDeactivate(u);
    } else {
      setReactivateTarget(u);
    }
  };

  const roleName = (id: string) => rolesList.find((r) => r.id === id)?.name ?? "—";

  const outletLabel = (ids: string[]) => {
    if (!ids || !ids.length) return "All outlets";
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

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage portal users, their roles and assigned outlets
          </p>
        </div>
        <Button size="sm" className="w-fit" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isUsersLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-36 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
              <div className="h-px bg-muted" />
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-muted rounded" />
                <div className="h-5 w-12 bg-muted rounded" />
              </div>
            </Card>
          ))
        ) : (
          filtered.map((u) => {
            const isSelf = currentUser?.id === u.id;
            const assignedOutlets = u.outlets && u.outlets.length
              ? outlets.filter((o) => u.outlets.includes(o.id))
              : [];
            const displayName = u.displayName || `${u.firstName} ${u.lastName}`;
            return (
              <Card key={u.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                      {initials(displayName)}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-sm">
                        {displayName}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {!u.outlets || u.outlets.length === 0
                          ? "All outlets"
                          : `${u.outlets.length} outlet${u.outlets.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit user"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isSelf}
                      title={
                        isSelf
                          ? "You can't deactivate yourself"
                          : u.isActive
                          ? "Deactivate user"
                          : "Reactivate user"
                      }
                      onClick={() => toggleStatus(u)}
                    >
                      {u.isActive ? (
                        <UserX className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-success" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-xs">{u.email}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate text-xs">{u.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs">{u.role?.name || roleName(u.role?.id ?? "")}</span>
                  </div>
                </div>

                <Separator className="mb-3" />

                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1 min-w-0">
                    {!u.outlets || u.outlets.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs">
                        <Store className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span className="font-medium">All outlets</span>
                      </div>
                    ) : (
                      assignedOutlets.slice(0, 3).map((o) => (
                        <div key={o.id} className="flex items-center gap-2 text-xs">
                          <Store className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="font-medium truncate">{o.name}</span>
                        </div>
                      ))
                    )}
                    {assignedOutlets.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-5">
                        +{assignedOutlets.length - 3} more
                      </p>
                    )}
                  </div>
                  {u.isActive ? (
                    <Badge className="bg-success/15 text-success hover:bg-success/15 border-success/20 shrink-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground shrink-0">
                      Inactive
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })
        )}

        {!isUsersLoading && filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "No users match your search" : "No users yet"}
            </p>
          </div>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this user's details, role or outlet access."
                : "An invitation email will be sent to the user when you save."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  aria-invalid={!!errors.first_name}
                />
                {errors.first_name && (
                  <p className="text-xs text-destructive">{errors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  aria-invalid={!!errors.last_name}
                />
                {errors.last_name && (
                  <p className="text-xs text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  disabled={!!editingId}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
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
                    {rolesList.map((r) => (
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
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deactivate user?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeactivate?.displayName || `${confirmDeactivate?.firstName} ${confirmDeactivate?.lastName}`} will no longer be able to sign in to the admin portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeactivate && toggleStatus(confirmDeactivate)}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
