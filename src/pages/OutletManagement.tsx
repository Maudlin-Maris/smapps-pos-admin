import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Phone, Clock, Pencil, Power } from "lucide-react";
import OutletFormDialog, { type OutletFormData } from "@/components/outlets/OutletFormDialog";
import { toast } from "sonner";

interface OutletData {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours: string;
  status: "open" | "closed";
  todaySales: string;
  staff: number;
  formData?: Partial<OutletFormData>;
}

const initialOutlets: OutletData[] = [
  { id: 1, name: "Downtown Flagship", address: "123 Main Street, Downtown", phone: "+1 (555) 123-4567", hours: "7:00 AM - 10:00 PM", status: "open", todaySales: "$3,420", staff: 8 },
  { id: 2, name: "Mall Branch", address: "456 Shopping Center Blvd, Level 2", phone: "+1 (555) 234-5678", hours: "10:00 AM - 9:00 PM", status: "open", todaySales: "$2,180", staff: 5 },
  { id: 3, name: "Airport Kiosk", address: "Terminal 3, Gate B12", phone: "+1 (555) 345-6789", hours: "5:00 AM - 11:00 PM", status: "open", todaySales: "$1,850", staff: 3 },
  { id: 4, name: "Suburban Store", address: "789 Oak Avenue, Westside", phone: "+1 (555) 456-7890", hours: "8:00 AM - 8:00 PM", status: "closed", todaySales: "$0", staff: 4 },
];

export default function OutletManagement() {
  const [outlets, setOutlets] = useState<OutletData[]>(initialOutlets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingOutlet, setEditingOutlet] = useState<OutletData | null>(null);

  const handleAdd = () => {
    setDialogMode("add");
    setEditingOutlet(null);
    setDialogOpen(true);
  };

  const handleEdit = (outlet: OutletData) => {
    setDialogMode("edit");
    setEditingOutlet(outlet);
    setDialogOpen(true);
  };

  const handleToggleStatus = (id: number) => {
    setOutlets((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const newStatus = o.status === "open" ? "closed" : "open";
        toast.success(`${o.name} is now ${newStatus}`);
        return { ...o, status: newStatus };
      })
    );
  };

  const handleSubmit = (data: OutletFormData) => {
    if (dialogMode === "add") {
      const newOutlet: OutletData = {
        id: Date.now(),
        name: data.name,
        address: data.outletAddress || data.locationAddress,
        phone: data.phone,
        hours: "9:00 AM - 9:00 PM",
        status: "closed",
        todaySales: "$0",
        staff: 0,
        formData: data,
      };
      setOutlets((prev) => [...prev, newOutlet]);
      toast.success(`Outlet "${data.name}" created successfully`);
    } else if (editingOutlet) {
      setOutlets((prev) =>
        prev.map((o) =>
          o.id === editingOutlet.id
            ? { ...o, name: data.name, address: data.outletAddress || data.locationAddress || o.address, phone: data.phone || o.phone, formData: data }
            : o
        )
      );
      toast.success(`Outlet "${data.name}" updated successfully`);
    }
  };

  const getInitialData = (): Partial<OutletFormData> | undefined => {
    if (!editingOutlet) return undefined;
    return {
      name: editingOutlet.name,
      outletAddress: editingOutlet.address,
      phone: editingOutlet.phone,
      ...editingOutlet.formData,
    };
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Outlets</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your business locations</p>
        </div>
        <Button size="sm" className="w-fit" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Outlet
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {outlets.map((outlet) => (
          <Card key={outlet.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-heading font-semibold">{outlet.name}</h3>
                <Badge
                  variant="secondary"
                  className={`mt-1 text-xs capitalize ${
                    outlet.status === "open"
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {outlet.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={outlet.status === "open" ? "Close outlet" : "Open outlet"}
                  onClick={() => handleToggleStatus(outlet.id)}
                >
                  <Power className={`h-4 w-4 ${outlet.status === "open" ? "text-success" : "text-muted-foreground"}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Edit outlet"
                  onClick={() => handleEdit(outlet)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{outlet.address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{outlet.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{outlet.hours}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Sales</p>
                <p className="text-lg font-heading font-bold">{outlet.todaySales}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Staff</p>
                <p className="text-lg font-heading font-bold">{outlet.staff}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <OutletFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={getInitialData()}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
