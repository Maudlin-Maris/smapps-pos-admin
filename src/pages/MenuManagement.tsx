import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = [
  {
    name: "Food & Beverages",
    subcategories: [
      { name: "Hot Drinks", items: 12 },
      { name: "Cold Drinks", items: 8 },
      { name: "Pastries", items: 15 },
      { name: "Sandwiches", items: 10 },
    ],
  },
  {
    name: "Hair Services",
    subcategories: [
      { name: "Haircut", items: 6 },
      { name: "Coloring", items: 8 },
      { name: "Styling", items: 5 },
    ],
  },
  {
    name: "Grocery",
    subcategories: [
      { name: "Fresh Produce", items: 42 },
      { name: "Dairy", items: 18 },
      { name: "Snacks", items: 35 },
    ],
  },
];

const menuItems = [
  { id: 1, name: "Cappuccino", category: "Hot Drinks", price: "$4.50", status: "active" },
  { id: 2, name: "Iced Latte", category: "Cold Drinks", price: "$5.00", status: "active" },
  { id: 3, name: "Croissant", category: "Pastries", price: "$3.25", status: "active" },
  { id: 4, name: "Club Sandwich", category: "Sandwiches", price: "$8.50", status: "inactive" },
  { id: 5, name: "Espresso", category: "Hot Drinks", price: "$3.00", status: "active" },
  { id: 6, name: "Men's Haircut", category: "Haircut", price: "$25.00", status: "active" },
  { id: 7, name: "Full Color", category: "Coloring", price: "$85.00", status: "active" },
  { id: 8, name: "Blowout", category: "Styling", price: "$35.00", status: "active" },
];

export default function MenuManagement() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (!selectedCategory || item.category === selectedCategory)
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Menu Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage items, categories and pricing</p>
        </div>
        <Button size="sm" className="w-fit">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Categories sidebar */}
        <Card className="p-4 lg:col-span-1">
          <h3 className="font-heading font-semibold text-sm mb-3">Categories</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                !selectedCategory ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
              )}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <div key={cat.name}>
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                  {cat.name}
                </p>
                {cat.subcategories.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => setSelectedCategory(sub.name)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                      selectedCategory === sub.name
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>{sub.name}</span>
                    <span className="text-xs">{sub.items}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* Items list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card className="divide-y divide-border">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-semibold text-sm hidden sm:block">{item.price}</span>
                  <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">
                    {item.status}
                  </Badge>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No items found
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
