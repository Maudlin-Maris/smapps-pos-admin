import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const inventoryItems = [
  { id: 1, name: "Coffee Beans (Arabica)", sku: "CB-001", stock: 45, unit: "kg", min: 20, max: 100, status: "good" },
  { id: 2, name: "Whole Milk", sku: "ML-001", stock: 12, unit: "liters", min: 15, max: 60, status: "low" },
  { id: 3, name: "Sugar", sku: "SG-001", stock: 30, unit: "kg", min: 10, max: 50, status: "good" },
  { id: 4, name: "Paper Cups (12oz)", sku: "PC-012", stock: 150, unit: "pcs", min: 200, max: 1000, status: "low" },
  { id: 5, name: "Croissant Dough", sku: "CD-001", stock: 8, unit: "kg", min: 5, max: 25, status: "good" },
  { id: 6, name: "Shampoo (Professional)", sku: "SH-001", stock: 3, unit: "bottles", min: 5, max: 20, status: "critical" },
  { id: 7, name: "Hair Color Mix", sku: "HC-001", stock: 18, unit: "tubes", min: 10, max: 40, status: "good" },
  { id: 8, name: "Disposable Gloves", sku: "DG-001", stock: 2, unit: "boxes", min: 5, max: 20, status: "critical" },
  { id: 9, name: "Sandwich Bread", sku: "SB-001", stock: 24, unit: "loaves", min: 10, max: 50, status: "good" },
  { id: 10, name: "Napkins", sku: "NP-001", stock: 500, unit: "pcs", min: 200, max: 2000, status: "good" },
];

const compositeItems = [
  { id: 1, name: "Cappuccino", components: ["Coffee Beans (20g)", "Whole Milk (150ml)", "Paper Cup (1)"] },
  { id: 2, name: "Club Sandwich", components: ["Sandwich Bread (2 slices)", "Ham (50g)", "Lettuce (20g)"] },
  { id: 3, name: "Hair Coloring Service", components: ["Hair Color Mix (1 tube)", "Gloves (1 pair)", "Shampoo (30ml)"] },
];

export default function InventoryManagement() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"stock" | "composite">("stock");

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = inventoryItems.filter((i) => i.status === "low" || i.status === "critical").length;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track stock levels and composite items</p>
        </div>
        <Button size="sm" className="w-fit">
          <Plus className="h-4 w-4 mr-1" /> Add Stock Item
        </Button>
      </div>

      {/* Alert */}
      {lowStockCount > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-sm font-medium">{lowStockCount} items need restocking</p>
              <p className="text-xs text-muted-foreground">Items below minimum threshold</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("stock")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "stock" ? "bg-card shadow-sm" : "text-muted-foreground"
          )}
        >
          Stock Levels
        </button>
        <button
          onClick={() => setTab("composite")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "composite" ? "bg-card shadow-sm" : "text-muted-foreground"
          )}
        >
          Composite Items
        </button>
      </div>

      {tab === "stock" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-3">
            {filteredItems.map((item) => {
              const percentage = Math.round((item.stock / item.max) * 100);
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        item.status === "critical" ? "bg-destructive/10" : item.status === "low" ? "bg-warning/10" : "bg-success/10"
                      )}>
                        <Package className={cn(
                          "h-5 w-5",
                          item.status === "critical" ? "text-destructive" : item.status === "low" ? "text-warning" : "text-success"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-sm font-heading font-bold">{item.stock} <span className="text-muted-foreground font-normal text-xs">{item.unit}</span></p>
                        <p className="text-xs text-muted-foreground">Min: {item.min}</p>
                      </div>
                      <div className="w-24 hidden md:block">
                        <Progress
                          value={percentage}
                          className={cn(
                            "h-2",
                            item.status === "critical" && "[&>div]:bg-destructive",
                            item.status === "low" && "[&>div]:bg-warning",
                            item.status === "good" && "[&>div]:bg-success"
                          )}
                        />
                      </div>
                      <Badge
                        variant={item.status === "good" ? "default" : "secondary"}
                        className={cn(
                          "text-xs capitalize",
                          item.status === "critical" && "bg-destructive/10 text-destructive border-destructive/20",
                          item.status === "low" && "bg-warning/10 text-warning border-warning/20"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === "composite" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {compositeItems.map((item) => (
            <Card key={item.id} className="p-4">
              <h4 className="font-heading font-semibold text-sm mb-3">{item.name}</h4>
              <ul className="space-y-1.5">
                {item.components.map((comp, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                    {comp}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
