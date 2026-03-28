import { forwardRef } from "react";
import type { POSOrder, POSOutlet, POSCartItem } from "@/data/posData";
import { posCategories } from "@/data/posData";
import { initialDepartments } from "@/data/departments";
import { format } from "date-fns";

interface DocketGroup {
  departmentName: string;
  items: POSCartItem[];
}

interface Props {
  order: POSOrder;
  outlet: POSOutlet | null;
  /** If provided, only show docket for this department */
  departmentFilter?: string;
}

function groupItemsByDepartment(items: POSCartItem[], outletId: string): DocketGroup[] {
  // Get departments for this outlet (outletId in departments is a number, outlet ids are strings like "outlet-1")
  const outletNum = parseInt(outletId.replace("outlet-", ""));
  const departments = initialDepartments.filter((d) => d.outletId === outletNum);

  const groups: Map<string, POSCartItem[]> = new Map();
  const unassigned: POSCartItem[] = [];

  for (const item of items) {
    if (!item.categoryId) {
      unassigned.push(item);
      continue;
    }

    // Find category name for this categoryId
    const cat = posCategories.find((c) => c.id === item.categoryId);
    const categoryName = cat?.name?.replace(/^[^\w]*/, "").trim() || "";

    // Check which department handles this category
    let assigned = false;
    for (const dept of departments) {
      if (dept.assignedCategories.includes(categoryName) ||
          dept.assignedCategories.some(ac => {
            // Match by raw category name (departments use names without emoji)
            const catObj = posCategories.find(c => c.id === item.categoryId);
            return catObj?.name?.includes(ac);
          })) {
        const existing = groups.get(dept.name) || [];
        existing.push(item);
        groups.set(dept.name, existing);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      // Fallback: group by category name as department
      const deptName = getCategoryDepartment(item.categoryId);
      const existing = groups.get(deptName) || [];
      existing.push(item);
      groups.set(deptName, existing);
    }
  }

  if (unassigned.length > 0) {
    groups.set("General", unassigned);
  }

  return Array.from(groups.entries()).map(([departmentName, items]) => ({
    departmentName,
    items,
  }));
}

function getCategoryDepartment(categoryId: string): string {
  // Map category prefixes to logical departments
  if (categoryId.startsWith("rcat-")) {
    const cat = posCategories.find((c) => c.id === categoryId);
    const name = cat?.name || "";
    if (name.includes("Beverage") || name.includes("Alcohol")) return "Bar";
    if (name.includes("Dessert")) return "Pastry";
    return "Kitchen";
  }
  if (categoryId.startsWith("pcat-")) return "Dispensary";
  if (categoryId.startsWith("scat-")) return "Station";
  if (categoryId.startsWith("rtcat-")) return "Counter";
  if (categoryId.startsWith("gcat-")) return "Store";
  return "Kitchen";
}

const KitchenDocket = forwardRef<HTMLDivElement, Props>(({ order, outlet, departmentFilter }, ref) => {
  const allGroups = groupItemsByDepartment(order.items, order.outletId);
  const groups = departmentFilter
    ? allGroups.filter((g) => g.departmentName === departmentFilter)
    : allGroups;

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {groups.map((group) => (
        <div
          key={group.departmentName}
          className="bg-white text-black font-mono"
          style={{ width: "302px", padding: "8px 4px", fontSize: "12px", lineHeight: "1.4", pageBreakAfter: "always" }}
        >
          {/* Department header */}
          <div className="text-center" style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px" }}>
              {group.departmentName}
            </p>
            <p style={{ fontSize: "10px", color: "#666" }}>DOCKET</p>
          </div>

          <p style={{ textAlign: "center", margin: "4px 0", borderTop: "1px dashed #999" }} />

          {/* Order info */}
          <div style={{ marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span style={{ fontSize: "14px" }}>Order {order.orderNumber}</span>
              <span>{format(new Date(order.createdAt), "HH:mm")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ textTransform: "capitalize" }}>{order.type.replace("_", " ")}</span>
              {order.locationName && <span style={{ fontWeight: 600 }}>{order.locationName}</span>}
            </div>
            {order.customerName && <p>Customer: {order.customerName}</p>}
          </div>

          <p style={{ textAlign: "center", margin: "4px 0", borderTop: "1px dashed #999" }} />

          {/* Items — large and bold for kitchen readability */}
          <div style={{ marginBottom: "4px" }}>
            {group.items.map((item) => (
              <div key={item.id} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>
                  {item.quantity}x {item.productName}
                </div>
                {item.variantName && (
                  <p style={{ paddingLeft: "16px", fontSize: "12px", fontWeight: 600 }}>
                    ▸ {item.variantName}
                  </p>
                )}
                {item.extras.length > 0 && item.extras.map((e) => (
                  <p
                    key={e.id}
                    style={{ paddingLeft: "16px", fontSize: "12px", fontWeight: 600 }}
                  >
                    + {e.name}
                  </p>
                ))}
                {item.notes && (
                  <p style={{ paddingLeft: "16px", fontSize: "11px", fontStyle: "italic" }}>
                    Note: {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", margin: "4px 0", letterSpacing: "2px" }}>
            {"- ".repeat(20)}
          </p>

          <div className="text-center" style={{ fontSize: "10px", color: "#888" }}>
            <p>{outlet?.name || "Store"} · {format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

KitchenDocket.displayName = "KitchenDocket";
export { groupItemsByDepartment };
export default KitchenDocket;
