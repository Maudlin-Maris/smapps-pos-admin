import { forwardRef } from "react";
import type { POSOrder, POSOutlet } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";

interface Props {
  order: POSOrder;
  outlet: POSOutlet | null;
}

const ThermalReceipt = forwardRef<HTMLDivElement, Props>(({ order, outlet }, ref) => {
  const subtotal = order.items.reduce((s, i) => s + i.totalPrice, 0);
  const discount = order.discountAmount || 0;
  const tip = order.tipAmount || 0;

  return (
    <div
      ref={ref}
      className="bg-white text-black font-mono"
      style={{ width: "302px", padding: "8px 4px", fontSize: "12px", lineHeight: "1.4" }}
    >
      {/* Header */}
      <div className="text-center" style={{ marginBottom: "8px" }}>
        <p style={{ fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>
          {outlet?.name || "Store"}
        </p>
        {outlet?.address && (
          <p style={{ fontSize: "10px", lineHeight: "1.3" }}>{outlet.address}</p>
        )}
        {outlet?.phone && <p style={{ fontSize: "10px" }}>Tel: {outlet.phone}</p>}
        {outlet?.email && <p style={{ fontSize: "10px" }}>{outlet.email}</p>}
      </div>

      {/* Divider */}
      <p style={{ textAlign: "center", margin: "4px 0", borderTop: "1px dashed #999" }} />

      {/* Order info */}
      <div style={{ marginBottom: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order: {order.orderNumber}</span>
          <span>{format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ textTransform: "capitalize" }}>
            {order.type.replace("_", " ")}
          </span>
          {order.locationName && <span>{order.locationName}</span>}
        </div>
        {order.customerName && <p>Customer: {order.customerName}</p>}
      </div>

      <p style={{ textAlign: "center", margin: "4px 0", borderTop: "1px dashed #999" }} />

      {/* Items */}
      <div style={{ marginBottom: "4px" }}>
        {order.items.map((item) => {
          const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0) * item.quantity;
          const baseTotal = item.unitPrice * item.quantity;
          return (
            <div key={item.id} style={{ marginBottom: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ maxWidth: "200px" }}>
                  {item.quantity}x {item.productName}
                </span>
                <span>{formatNaira(item.totalPrice)}</span>
              </div>
              {item.variantName && (
                <p style={{ paddingLeft: "12px", fontSize: "10px", color: "#555" }}>
                  {item.variantName}
                </p>
              )}
              {item.extras.length > 0 && item.extras.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingLeft: "12px",
                    fontSize: "10px",
                    color: "#555",
                  }}
                >
                  <span>+ {e.name}</span>
                  <span>{formatNaira(e.price)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: "center", margin: "4px 0", borderTop: "1px dashed #999" }} />

      {/* Totals */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount{order.discountName ? ` (${order.discountName})` : ""}</span>
            <span>-{formatNaira(discount)}</span>
          </div>
        )}
        {tip > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tip</span>
            <span>{formatNaira(tip)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "14px",
            marginTop: "4px",
          }}
        >
          <span>TOTAL</span>
          <span>{formatNaira(order.totalAmount)}</span>
        </div>
      </div>

      {/* Payments */}
      {order.payments.length > 0 && (
        <>
          <p style={{ textAlign: "center", margin: "4px 0", borderTop: "1px dashed #999" }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: "2px" }}>Payment</p>
            {order.payments.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ textTransform: "capitalize" }}>{p.method}</span>
                <span>{formatNaira(p.amount)}</span>
              </div>
            ))}
            {order.paidAmount > order.totalAmount && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                <span>Change</span>
                <span>{formatNaira(order.paidAmount - order.totalAmount)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <p style={{ textAlign: "center", margin: "12px 0 4px", borderTop: "1px dashed #999" }} />
      <div className="text-center" style={{ fontSize: "10px" }}>
        <p>Thank you for your patronage!</p>
        <p style={{ marginTop: "2px", color: "#888" }}>
          {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
        </p>
      </div>
    </div>
  );
});

ThermalReceipt.displayName = "ThermalReceipt";
export default ThermalReceipt;
