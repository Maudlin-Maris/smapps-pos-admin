import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { posOutlets, posProducts, posCategories } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Phone, Mail, QrCode } from "lucide-react";

/**
 * Customer-facing catalog page reached by scanning the outlet's QR code.
 * No auth — read-only view of the outlet's menu / products.
 */
export default function PublicMenu() {
  const { outletId } = useParams<{ outletId: string }>();
  const outlet = posOutlets.find((o) => o.id === outletId) ?? posOutlets[0];
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const products = useMemo(
    () => posProducts.filter((p) => p.outletId === outlet.id && p.inStock),
    [outlet.id],
  );

  const categories = useMemo(() => {
    const ids = new Set(products.map((p) => p.categoryId));
    return posCategories.filter((c) => ids.has(c.id));
  }, [products]);

  const filtered = products.filter(
    (p) =>
      (activeCategory === "all" || p.categoryId === activeCategory) &&
      (query.trim() === "" || p.name.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <QrCode className="h-3.5 w-3.5" /> Digital Menu
          </div>
          <h1 className="text-xl font-bold font-heading">{outlet.name}</h1>
          <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {outlet.address && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {outlet.address}
              </p>
            )}
            {outlet.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> {outlet.phone}
              </p>
            )}
            {outlet.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> {outlet.email}
              </p>
            )}
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search the menu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-none mt-3 -mx-4 px-4 pb-1">
            <Button
              size="sm"
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              className="h-8 shrink-0"
            >
              All
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={activeCategory === c.id ? "default" : "outline"}
                onClick={() => setActiveCategory(c.id)}
                className="h-8 shrink-0"
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            No items match your search.
          </div>
        )}
        {filtered.map((p) => {
          const cat = posCategories.find((c) => c.id === p.categoryId);
          const priceMin =
            p.variants && p.variants.length
              ? Math.min(...p.variants.map((v) => v.price))
              : p.price;
          const priceMax =
            p.variants && p.variants.length
              ? Math.max(...p.variants.map((v) => v.price))
              : p.price;
          return (
            <Card key={p.id} className="p-4 flex gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {cat && (
                    <Badge variant="outline" className="text-[10px] h-4">
                      {cat.name}
                    </Badge>
                  )}
                </div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-sm font-semibold mt-1">
                  {priceMin === priceMax
                    ? formatNaira(priceMin)
                    : `${formatNaira(priceMin)} – ${formatNaira(priceMax)}`}
                </p>
              </div>
              {p.image && (
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-16 w-16 rounded-md object-cover shrink-0"
                />
              )}
            </Card>
          );
        })}
      </main>

      <footer className="max-w-3xl mx-auto p-4 pt-2 text-center text-[11px] text-muted-foreground">
        Powered by Smapps POS · Prices in ₦
      </footer>
    </div>
  );
}
