import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ResuablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPageOptions?: number[];
  className?: string;
}

export function ResuablePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  rowsPerPage,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 20, 50],
  className,
}: ResuablePaginationProps) {
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  // Generate pagination items
  const renderPageNumbers = () => {
    const pages = [];
    const siblingCount = 1;

    // Logic to determine range
    const startPage = Math.max(2, safePage - siblingCount);
    const endPage = Math.min(totalPages - 1, safePage + siblingCount);

    // Always show page 1
    pages.push(
      <Button
        key={1}
        variant={safePage === 1 ? "default" : "outline"}
        size="icon"
        className="h-8 w-8 text-xs rounded-md transition-all hover:scale-105"
        onClick={() => onPageChange(1)}
      >
        1
      </Button>
    );

    if (startPage > 2) {
      pages.push(
        <span key="dots-start" className="flex items-center justify-center h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={safePage === i ? "default" : "outline"}
          size="icon"
          className="h-8 w-8 text-xs rounded-md transition-all hover:scale-105"
          onClick={() => onPageChange(i)}
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages - 1) {
      pages.push(
        <span key="dots-end" className="flex items-center justify-center h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      );
    }

    // Always show last page if it exists and is > 1
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages}
          variant={safePage === totalPages ? "default" : "outline"}
          size="icon"
          className="h-8 w-8 text-xs rounded-md transition-all hover:scale-105"
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  const fromIndex = totalItems ? Math.min((safePage - 1) * (rowsPerPage || 10) + 1, totalItems) : 0;
  const toIndex = totalItems ? Math.min(safePage * (rowsPerPage || 10), totalItems) : 0;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-card/50 backdrop-blur-sm rounded-b-lg text-sm", className)}>
      <div className="flex flex-col sm:flex-row items-center gap-4 text-muted-foreground text-xs">
        {totalItems !== undefined && (
          <span className="font-medium">
            {totalItems > 0 ? `Showing ${fromIndex}–${toIndex} of ${totalItems} items` : "0 items"}
          </span>
        )}
        {onRowsPerPageChange && rowsPerPage !== undefined && (
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(v) => onRowsPerPageChange(Number(v))}
            >
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rowsPerPageOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md transition-all hover:scale-105"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {renderPageNumbers()}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md transition-all hover:scale-105"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
