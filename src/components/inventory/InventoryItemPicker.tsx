import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetInventoryItems, useGetInventoryItem } from "@/services/api/inventory/item";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

interface InventoryItemPickerProps {
  selectedId?: string;
  onSelect: (id: string, item: any | null) => void;
  outletId?: string;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  triggerPlaceholder?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function InventoryItemPicker({
  selectedId,
  onSelect,
  outletId,
  className,
  triggerClassName,
  placeholder = "Search by name or SKU...",
  triggerPlaceholder = "Link inventory",
  disabled = false,
  "data-testid": dataTestId,
}: InventoryItemPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch search results
  const { data: searchRes, isLoading, isValidating } = useGetInventoryItems(
    isOpen
      ? {
          search: debouncedSearch.trim() || undefined,
          per_page: DEFAULT_PAGE_SIZE,
          outletId,
        }
      : undefined
  );

  const searchItems = searchRes?.data || [];

  // Fetch single item details if selectedId is set but not in current search results
  const { data: singleRes } = useGetInventoryItem(
    selectedId && !searchItems.some((i) => i.id === selectedId) ? selectedId : undefined
  );

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    const found = searchItems.find((i) => i.id === selectedId);
    if (found) return found;
    return singleRes || null;
  }, [selectedId, searchItems, singleRes]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear search on open change
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const handleClear = () => {
    onSelect("", null);
    setIsOpen(false);
  };

  const handleSelectItem = (item: any) => {
    onSelect(item.id, item);
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-2 relative", className)} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        disabled={disabled}
        data-testid={dataTestId}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn("group w-full justify-between font-normal h-9 text-xs px-2 truncate", triggerClassName)}
      >
        {selectedItem ? (
          <span className="truncate group-hover:text-accent-foreground">
            {selectedItem.name} · {selectedItem.sku}
          </span>
        ) : selectedId ? (
          <span className="truncate text-muted-foreground group-hover:text-accent-foreground">
            {selectedId}
          </span>
        ) : (
          <span className="text-muted-foreground group-hover:text-accent-foreground">
            {triggerPlaceholder}
          </span>
        )}
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 border border-border rounded-lg bg-popover shadow-md pointer-events-auto flex flex-col overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder={placeholder}
              className="flex h-9 w-full rounded-md bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[190px] overflow-y-auto p-1 min-h-0">
            {isLoading || isValidating ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching items...</span>
              </div>
            ) : searchItems.length === 0 && !selectedId ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No inventory items found.
              </div>
            ) : (
              <div className="space-y-0.5">
                {selectedId && (
                  <button
                    type="button"
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left"
                    onClick={handleClear}
                  >
                    <X className="h-3.5 w-3.5 mr-2" />
                    <span>Clear link</span>
                  </button>
                )}

                {searchItems.map((inv) => {
                  const isSelected = selectedId === inv.id;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      data-testid={`inventory-option-${inv.id}`}
                      className={cn(
                        "group relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors text-left",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => handleSelectItem(inv)}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 mr-2",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate">{inv.name}</div>
                        <div
                          className={cn(
                            "text-[10px] text-muted-foreground group-hover:text-accent-foreground/80 truncate",
                            isSelected ? "text-accent-foreground/80" : "text-muted-foreground"
                          )}
                        >
                          {inv.sku} {inv.stock !== undefined || inv.quantity !== undefined ? `· stock ${inv.quantity ?? inv.stock}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
