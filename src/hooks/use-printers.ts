import { useState, useCallback } from "react";
import type { POSPrinter } from "@/components/pos/PrinterManagementDialog";
import { initialDepartments } from "@/data/departments";
import { groupItemsByDepartment } from "@/components/pos/KitchenDocket";
import type { POSOrder, POSOutlet } from "@/data/posData";
import { toast } from "sonner";

const STORAGE_KEY = "pos_printers";

function loadPrinters(): POSPrinter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePrinters(printers: POSPrinter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
}

export function usePrinters(outletId: string) {
  const [printers, setPrinters] = useState<POSPrinter[]>(() => loadPrinters().filter(p => p.outletId === outletId));

  const updatePrinters = useCallback((newPrinters: POSPrinter[]) => {
    setPrinters(newPrinters);
    // Save all printers (other outlets + current)
    const otherOutletPrinters = loadPrinters().filter(p => p.outletId !== outletId);
    savePrinters([...otherOutletPrinters, ...newPrinters]);
  }, [outletId]);

  const routeOrderToPrinters = useCallback((order: POSOrder, outlet: POSOutlet | null) => {
    const enabledPrinters = printers.filter(p => p.enabled && p.assignedDepartments.length > 0);
    if (enabledPrinters.length === 0) return;

    const docketGroups = groupItemsByDepartment(order.items, order.outletId);

    const outletNum = parseInt(outletId.replace("outlet-", ""));
    const departments = initialDepartments.filter(d => d.outletId === outletNum);

    let printedCount = 0;

    for (const printer of enabledPrinters) {
      // Find which departments this printer handles that have items in this order
      const matchingDepts = printer.assignedDepartments.filter(deptId => {
        const dept = departments.find(d => d.id === deptId);
        if (!dept) return false;
        return docketGroups.some(g => g.departmentName === dept.name);
      });

      if (matchingDepts.length > 0) {
        const deptNames = matchingDepts.map(id => departments.find(d => d.id === id)?.name).filter(Boolean);
        printedCount++;
        // In a real app, this would send print data to the printer via its connection
        console.log(`[Auto-Print] Routing docket to "${printer.name}" for departments: ${deptNames.join(", ")}`);
      }
    }

    if (printedCount > 0) {
      toast.success(`Dockets sent to ${printedCount} printer${printedCount > 1 ? "s" : ""}`, {
        description: "Auto-routed based on department assignments",
        duration: 3000,
      });
    }
  }, [printers, outletId]);

  return { printers, updatePrinters, routeOrderToPrinters };
}
