import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  PERMISSION_CATALOG,
  PermissionId,
  ALL_PERMISSIONS,
} from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Lock, Shield, Users as UsersIcon } from "lucide-react";
import { Navigate } from "react-router-dom";

import {
  useGetRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/services/api/roles-permissions";
import { useGetUsers } from "@/services/api/users";
import type { RoleRecord } from "@/lib/types/roles-permissions";

interface RoleForm {
  name: string;
  description: string;
  permissions: PermissionId[];
}

const emptyRole: RoleForm = { name: "", description: "", permissions: [] };

export default function RolesPermissions() {
  const { hasPermission, bumpRolesVersion } = useAuth();
  const { toast } = useToast();

  const { data: rolesList = [], isLoading: isRolesLoading, mutate } = useGetRoles();
  const { data: usersList = [] } = useGetUsers();

  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<RoleForm>(emptyRole);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState<RoleRecord | null>(null);

  const { trigger: createRole, isMutating: isCreating } = useCreateRole({
    onSuccess: () => {
      mutate();
      setDialogOpen(false);
      bumpRolesVersion();
      toast({ title: "Role created" });
    }
  });

  const { trigger: updateRole, isMutating: isUpdating } = useUpdateRole(editingRole?.id, {
    onSuccess: () => {
      mutate();
      setDialogOpen(false);
      bumpRolesVersion();
      toast({ title: "Role updated" });
    }
  });

  const { trigger: deleteRole, isMutating: isDeleting } = useDeleteRole(confirmDelete?.id, {
    onSuccess: () => {
      mutate();
      setConfirmDelete(null);
      bumpRolesVersion();
      toast({ title: "Role deleted" });
    }
  });

  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    usersList.forEach((u) => {
      const roleId = u.role?.id;
      if (roleId) {
        counts[roleId] = (counts[roleId] ?? 0) + 1;
      }
    });
    return counts;
  }, [usersList]);

  if (!hasPermission("roles.manage")) {
    return <Navigate to="/" replace />;
  }

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyRole);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (role: RoleRecord) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions] as PermissionId[],
    });
    setErrors({});
    setDialogOpen(true);
  };

  const togglePerm = (id: PermissionId) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter((p) => p !== id)
        : [...f.permissions, id],
    }));
  };

  const toggleGroup = (perms: PermissionId[]) => {
    const allSelected = perms.every((p) => form.permissions.includes(p));
    setForm((f) => ({
      ...f,
      permissions: allSelected
        ? f.permissions.filter((p) => !perms.includes(p))
        : Array.from(new Set([...f.permissions, ...perms])),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Role name is required" });
      return;
    }

    const isSystem = editingRole?.isSystem || (editingRole as any)?.system;

    if (editingRole) {
      try {
        if (isSystem) {
          // System roles: only description is editable
          await updateRole({ description: form.description.trim() });
        } else {
          await updateRole({
            name: form.name.trim(),
            description: form.description.trim(),
            permissions: form.permissions,
          });
        }
      } catch (e) {}
    } else {
      try {
        await createRole({
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: form.permissions,
        });
      } catch (e) {}
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const isSystem = confirmDelete.isSystem || (confirmDelete as any).system;
    if (isSystem) return;

    const count = confirmDelete.userCount ?? userCounts[confirmDelete.id] ?? 0;
    if (count > 0) {
      toast({
        title: "Can't delete role",
        description: "Reassign all users on this role first.",
        variant: "destructive",
      });
      setConfirmDelete(null);
      return;
    }

    try {
      await deleteRole();
    } catch (e) {}
  };

  const isSystemEdit = editingRole?.isSystem === true || (editingRole as any)?.system === true;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define what each role can do across the admin portal and POS.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> New role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isRolesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded shrink-0" />
                  <div className="h-5 w-32 bg-muted rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-4/5 bg-muted rounded" />
                </div>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="flex gap-2 pt-1">
                  <div className="h-8 flex-1 bg-muted rounded" />
                  <div className="h-8 w-10 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          rolesList.map((role) => {
            const isSystem = role.isSystem || (role as any).system;
            const count = role.userCount ?? userCounts[role.id] ?? 0;
            return (
              <Card key={role.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-semibold truncate">{role.name}</h3>
                        {isSystem && (
                          <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                            <Lock className="w-3 h-3" /> System
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {role.description || "No description"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" /> {count} users
                    </span>
                    <span>·</span>
                    <span>
                      {role.permissions?.length === ALL_PERMISSIONS.length
                        ? "All permissions"
                        : `${role.permissions?.length ?? 0} permissions`}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(role)}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      {isSystem ? "View" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isSystem}
                      onClick={() => setConfirmDelete(role)}
                      title={isSystem ? "System roles can't be deleted" : "Delete role"}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? (isSystemEdit ? `${editingRole.name} (System role)` : "Edit role") : "Create role"}
            </DialogTitle>
            <DialogDescription>
              {isSystemEdit
                ? "Permissions for system roles are locked. You can update the description for clarity."
                : "Pick the permissions this role should grant. Users assigned to this role will inherit them."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role name</Label>
                <Input
                  id="role-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isSystemEdit}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="role-desc">Description</Label>
                <Input
                  id="role-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short summary"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <span className="text-xs text-muted-foreground">
                  {form.permissions.length} of {ALL_PERMISSIONS.length} selected
                </span>
              </div>

              <div className="space-y-3">
                {PERMISSION_CATALOG.map((group) => {
                  const groupIds = group.permissions.map((p) => p.id);
                  const allOn = groupIds.every((id) => form.permissions.includes(id));
                  const someOn = !allOn && groupIds.some((id) => form.permissions.includes(id));
                  return (
                    <div key={group.group} className="rounded-md border">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
                        <span className="text-sm font-semibold">{group.group}</span>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          <Checkbox
                            checked={allOn ? true : someOn ? "indeterminate" : false}
                            onCheckedChange={() => !isSystemEdit && toggleGroup(groupIds)}
                            disabled={isSystemEdit}
                          />
                          Select all
                        </label>
                      </div>
                      <div className="divide-y">
                        {group.permissions.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer"
                          >
                            <Checkbox
                              className="mt-0.5"
                              checked={form.permissions.includes(p.id)}
                              onCheckedChange={() => !isSystemEdit && togglePerm(p.id)}
                              disabled={isSystemEdit}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{p.label}</div>
                              <div className="text-xs text-muted-foreground">{p.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingRole ? "Save changes" : "Create role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the {confirmDelete?.name} role. Users on this role must be
              reassigned first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
