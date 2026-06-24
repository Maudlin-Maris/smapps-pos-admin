import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Calendar, Clock, User, Phone, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGetOutlets } from "@/services/api/outlets";

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  duration: number; // minutes
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  notes: string;
  outletId: string;
}

const initialAppointments: Appointment[] = [
  { id: "a1", customerName: "Sarah Johnson", customerPhone: "+234 801 234 5678", serviceName: "Full Color", staffName: "Amara", date: "2026-03-24", time: "10:00", duration: 90, status: "scheduled", notes: "", outletId: "outlet-1" },
  { id: "a2", customerName: "Mike Chen", customerPhone: "+234 802 345 6789", serviceName: "Men's Haircut", staffName: "Tunde", date: "2026-03-24", time: "11:00", duration: 30, status: "in_progress", notes: "Fade style", outletId: "outlet-1" },
  { id: "a3", customerName: "Lisa Park", customerPhone: "+234 803 456 7890", serviceName: "Blowout", staffName: "Amara", date: "2026-03-24", time: "14:00", duration: 45, status: "completed", notes: "", outletId: "outlet-1" },
  { id: "a4", customerName: "James Brown", customerPhone: "+234 804 567 8901", serviceName: "Beard Trim", staffName: "Tunde", date: "2026-03-25", time: "09:00", duration: 20, status: "scheduled", notes: "", outletId: "outlet-1" },
];

const statusStyles: Record<Appointment["status"], string> = {
  scheduled: "bg-info/10 text-info",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

const statusLabels: Record<Appointment["status"], string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const emptyForm: Omit<Appointment, "id"> = {
  customerName: "", customerPhone: "", serviceName: "", staffName: "",
  date: new Date().toISOString().split("T")[0], time: "09:00",
  duration: 30, status: "scheduled", notes: "", outletId: "",
};

export default function ServiceBookings() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<Omit<Appointment, "id">>(emptyForm);

  const { data: outletsResponse } = useGetOutlets();
  const outlets = outletsResponse || [];
  const serviceOutlets = outlets.filter(o => ["salon", "barber"].includes(o.businessType));
  const isAllOutlets = selectedOutletId === "all";

  const filtered = appointments
    .filter(a => isAllOutlets || a.outletId === selectedOutletId)
    .filter(a => filterStatus === "all" || a.status === filterStatus)
    .filter(a =>
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      a.staffName.toLowerCase().includes(search.toLowerCase())
    );

  // Group by date
  const grouped = filtered.reduce((acc, apt) => {
    if (!acc[apt.date]) acc[apt.date] = [];
    acc[apt.date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(grouped).sort();

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, outletId: isAllOutlets ? "" : selectedOutletId });
    setDialogOpen(true);
  };

  const openEdit = (apt: Appointment) => {
    setEditing(apt);
    setForm({ ...apt });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.customerName.trim() || !form.serviceName.trim()) {
      toast.error("Customer name and service are required");
      return;
    }
    if (editing) {
      setAppointments(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a));
      toast.success("Appointment updated");
    } else {
      setAppointments(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
      toast.success("Appointment booked");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    toast.success("Appointment removed");
  };

  const handleStatusChange = (id: string, status: Appointment["status"]) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success(`Appointment marked as ${statusLabels[status].toLowerCase()}`);
  };

  const todayCount = appointments.filter(a => a.date === new Date().toISOString().split("T")[0] && a.status !== "cancelled").length;
  const scheduledCount = appointments.filter(a => a.status === "scheduled").length;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage service bookings and schedule</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {serviceOutlets.length > 0 && (
            <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                {serviceOutlets.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={openNew} className="w-fit">
            <Plus className="h-4 w-4 mr-1" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-heading font-bold">{todayCount}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-heading font-bold">{scheduledCount}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-heading font-bold text-success">{appointments.filter(a => a.status === "completed").length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-heading font-bold text-destructive">{appointments.filter(a => a.status === "cancelled" || a.status === "no_show").length}</p>
          <p className="text-xs text-muted-foreground">Cancelled/No-show</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search appointments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {sortedDates.map(date => {
          const isToday = date === new Date().toISOString().split("T")[0];
          return (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-heading font-semibold">
                  {isToday ? "Today" : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </h2>
                <Badge variant="secondary" className="text-[10px]">{grouped[date].length}</Badge>
              </div>
              <div className="grid gap-3">
                {grouped[date].sort((a, b) => a.time.localeCompare(b.time)).map(apt => (
                  <Card key={apt.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col items-center shrink-0 w-14">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
                          <span className="text-sm font-heading font-bold">{apt.time}</span>
                          <span className="text-[10px] text-muted-foreground">{apt.duration}min</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{apt.serviceName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate">{apt.customerName}</span>
                          </div>
                          {apt.customerPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{apt.customerPhone}</span>
                            </div>
                          )}
                          {apt.staffName && (
                            <p className="text-xs text-muted-foreground mt-0.5">Staff: {apt.staffName}</p>
                          )}
                          {apt.notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{apt.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn("text-xs capitalize", statusStyles[apt.status])}>
                          {statusLabels[apt.status]}
                        </Badge>
                        <div className="flex gap-1">
                          {apt.status === "scheduled" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => handleStatusChange(apt.id, "in_progress")} title="Start">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {apt.status === "in_progress" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => handleStatusChange(apt.id, "completed")} title="Complete">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(apt.status === "scheduled" || apt.status === "in_progress") && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleStatusChange(apt.id, "cancelled")} title="Cancel">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(apt)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(apt.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No appointments found</p>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Appointment" : "Book Appointment"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} placeholder="+234 800 000 0000" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service *</Label>
                <Input value={form.serviceName} onChange={e => setForm({ ...form, serviceName: e.target.value })} placeholder="e.g. Men's Haircut" />
              </div>
              <div className="space-y-2">
                <Label>Staff</Label>
                <Input value={form.staffName} onChange={e => setForm({ ...form, staffName: e.target.value })} placeholder="Assigned staff" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Appointment["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Book"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
