import * as XLSX from "@/lib/xlsx-compat";
import { format } from "date-fns";
import type { SalesRecord } from "@/hooks/use-financial-data";
import {
  outletPaymentSplits,
  aggregateItems,
  filterSales,
} from "@/components/reports/salesData";
import { aggregateItemsByDepartment } from "@/components/reports/departmentMapping";

const cur = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (from: Date, to: Date) =>
  `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;

// ───────────────────────── Sales Summary ─────────────────────────

export interface SalesSummaryExport {
  outletLabel: string;
  selectedOutlets: string[];
  dateFrom: Date;
  dateTo: Date;
  filteredSales: SalesRecord[];
  outlets?: any[];
}

function buildSalesSummary({ selectedOutlets, dateFrom, dateTo, filteredSales, outlets = [] }: SalesSummaryExport) {
  const totalSales = filteredSales.reduce((s, r) => s + r.totalSales, 0);
  const totalOther = filteredSales.reduce((s, r) => s + r.otherIncome, 0);
  const totalRevenue = totalSales + totalOther;
  const avgPerTxn = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  // by date — cap to today
  const grouped: Record<string, { sales: number; orders: number }> = {};
  filteredSales.forEach((s) => {
    if (!grouped[s.date]) grouped[s.date] = { sales: 0, orders: 0 };
    grouped[s.date].sales += s.totalSales;
    grouped[s.date].orders += 1;
  });
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const rangeEnd = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
  const end = rangeEnd > todayMid ? todayMid : rangeEnd;
  const cursor = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
  const byDate: { date: string; sales: number; orders: number }[] = [];
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    byDate.push({ date: key, ...(grouped[key] || { sales: 0, orders: 0 }) });
    cursor.setDate(cursor.getDate() + 1);
  }
  byDate.sort((a, b) => b.date.localeCompare(a.date));

  // by outlet
  const ogrp: Record<string, { sales: number; otherIncome: number; count: number }> = {};
  filteredSales.forEach((s) => {
    if (!ogrp[s.outletId]) ogrp[s.outletId] = { sales: 0, otherIncome: 0, count: 0 };
    ogrp[s.outletId].sales += s.totalSales;
    ogrp[s.outletId].otherIncome += s.otherIncome;
    ogrp[s.outletId].count += 1;
  });
  const byOutlet = Object.entries(ogrp).map(([id, v]) => ({
    outletName: outlets.find((o) => o.id === id)?.name || id,
    sales: v.sales,
    otherIncome: v.otherIncome,
    transactions: v.count,
    total: v.sales + v.otherIncome,
  }));

  // by cashier
  const cgrp: Record<string, { sales: number; otherIncome: number; count: number }> = {};
  filteredSales.forEach((s) => {
    const name = s.cashier || "Unknown";
    if (!cgrp[name]) cgrp[name] = { sales: 0, otherIncome: 0, count: 0 };
    cgrp[name].sales += s.totalSales;
    cgrp[name].otherIncome += s.otherIncome;
    cgrp[name].count += 1;
  });
  const byCashier = Object.entries(cgrp)
    .map(([cashier, v]) => ({ cashier, total: v.sales + v.otherIncome, transactions: v.count }))
    .sort((a, b) => b.total - a.total);

  // payment methods
  const methods: Record<string, number> = {};
  selectedOutlets.forEach((outletId) => {
    const splits = outletPaymentSplits[outletId];
    if (!splits) return;
    const outletSalesTotal = filteredSales
      .filter((s) => s.outletId === outletId)
      .reduce((sum, s) => sum + s.totalSales, 0);
    Object.entries(splits).forEach(([method, pct]) => {
      methods[method] = (methods[method] || 0) + outletSalesTotal * pct;
    });
  });
  const paymentMethods = Object.entries(methods).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  return { totalSales, totalOther, totalRevenue, avgPerTxn, byDate, byOutlet, byCashier, paymentMethods };
}

export function exportSalesSummaryExcel(input: SalesSummaryExport) {
  const data = buildSalesSummary(input);
  const wb = XLSX.utils.book_new();
  const period = fmtDate(input.dateFrom, input.dateTo);

  const overview = [
    ["Sales Summary"],
    ["Period", period],
    ["Outlet", input.outletLabel],
    [],
    ["Total Revenue", data.totalRevenue],
    ["Total Sales", data.totalSales],
    ["Other Income", data.totalOther],
    ["Transactions", input.filteredSales.length],
    ["Avg / Transaction", Math.round(data.avgPerTxn)],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overview);
  ws1["!cols"] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Overview");

  const dateRows = [["Date", "Orders", "Sales"], ...data.byDate.map((r) => [r.date, r.orders, r.sales])];
  const ws2 = XLSX.utils.aoa_to_sheet(dateRows);
  ws2["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "By Date");

  if (data.byOutlet.length) {
    const rows = [
      ["Outlet", "Transactions", "Sales", "Other Income", "Total"],
      ...data.byOutlet.map((o) => [o.outletName, o.transactions, o.sales, o.otherIncome, o.total]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "By Outlet");
  }

  if (data.byCashier.length) {
    const rows = [
      ["Cashier", "Transactions", "Total"],
      ...data.byCashier.map((c) => [c.cashier, c.transactions, c.total]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "By Cashier");
  }

  if (data.paymentMethods.length) {
    const rows = [
      ["Payment Method", "Amount"],
      ...data.paymentMethods.map((p) => [p.name, p.value]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "Payment Methods");
  }

  XLSX.writeFile(wb, `Sales_Summary_${format(input.dateFrom, "yyyy-MM-dd")}_${format(input.dateTo, "yyyy-MM-dd")}.xlsx`);
}

export function exportSalesSummaryPDF(input: SalesSummaryExport) {
  const data = buildSalesSummary(input);
  const period = fmtDate(input.dateFrom, input.dateTo);

  const tableHTML = (
    title: string,
    headers: string[],
    rows: (string | number)[][],
    rightAlignFromCol = 1
  ) => `
    <h2>${title}</h2>
    <table class="data">
      <thead><tr>${headers
        .map((h, i) => `<th style="text-align:${i >= rightAlignFromCol ? "right" : "left"}">${h}</th>`)
        .join("")}</tr></thead>
      <tbody>${rows
        .map(
          (r) =>
            `<tr>${r
              .map(
                (c, i) =>
                  `<td style="text-align:${i >= rightAlignFromCol ? "right" : "left"};${
                    i >= rightAlignFromCol ? "font-family:monospace;" : ""
                  }">${c}</td>`
              )
              .join("")}</tr>`
        )
        .join("")}</tbody>
    </table>`;

  const html = `<!DOCTYPE html><html><head><title>Sales Summary</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color:#1a1a1a; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 24px 0 8px; color:#333; }
  .meta { font-size: 12px; color:#666; margin-bottom: 16px; }
  .kpi-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border:1px solid #e5e5e5; border-radius:8px; padding:10px 12px; }
  .kpi-label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:.5px; }
  .kpi-value { font-size:16px; font-weight:700; margin-top:2px; }
  table.data { width:100%; border-collapse:collapse; font-size:12px; }
  table.data th { padding:6px 8px; border-bottom:2px solid #ddd; font-size:11px; text-transform:uppercase; color:#888; }
  table.data td { padding:5px 8px; border-bottom:1px solid #eee; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>Sales Summary</h1>
<p class="meta">${period} · ${input.outletLabel}</p>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Total Revenue</div><div class="kpi-value">${cur(data.totalRevenue)}</div></div>
  <div class="kpi"><div class="kpi-label">Total Sales</div><div class="kpi-value">${cur(data.totalSales)}</div></div>
  <div class="kpi"><div class="kpi-label">Transactions</div><div class="kpi-value">${input.filteredSales.length}</div></div>
  <div class="kpi"><div class="kpi-label">Avg / Txn</div><div class="kpi-value">${cur(data.avgPerTxn)}</div></div>
</div>
${tableHTML("Sales by Date", ["Date", "Orders", "Sales"], data.byDate.map((r) => [r.date, r.orders, cur(r.sales)]))}
${data.byOutlet.length ? tableHTML("Sales by Outlet", ["Outlet", "Txns", "Sales", "Other", "Total"], data.byOutlet.map((o) => [o.outletName, o.transactions, cur(o.sales), cur(o.otherIncome), cur(o.total)])) : ""}
${data.byCashier.length ? tableHTML("Sales by Cashier", ["Cashier", "Txns", "Total"], data.byCashier.map((c) => [c.cashier, c.transactions, cur(c.total)])) : ""}
${data.paymentMethods.length ? tableHTML("Payment Methods", ["Method", "Amount"], data.paymentMethods.map((p) => [p.name, cur(p.value)])) : ""}
</body></html>`;

  openPrint(html);
}

// ───────────────────────── Sales by Item ─────────────────────────

export interface ItemsExport {
  outletLabel: string;
  selectedOutlets: string[];
  dateFrom: Date;
  dateTo: Date;
  outlets?: any[];
}

export function exportSalesByItemExcel(input: ItemsExport) {
  const items = aggregateItems(input.selectedOutlets);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const totalRev = items.reduce((s, i) => s + i.revenue, 0);

  const wb = XLSX.utils.book_new();
  const rows = [
    ["Sales by Item"],
    ["Period", fmtDate(input.dateFrom, input.dateTo)],
    ["Outlet", input.outletLabel],
    [],
    ["Item", "Category", "Qty", "Revenue", "% of Revenue"],
    ...items.map((i) => [
      i.name,
      i.category,
      i.qty,
      i.revenue,
      totalRev > 0 ? `${((i.revenue / totalRev) * 100).toFixed(1)}%` : "0%",
    ]),
    [],
    ["Total", "", totalQty, totalRev, ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Sales by Item");
  XLSX.writeFile(wb, `Sales_By_Item_${format(input.dateFrom, "yyyy-MM-dd")}_${format(input.dateTo, "yyyy-MM-dd")}.xlsx`);
}

export function exportSalesByItemPDF(input: ItemsExport) {
  const items = aggregateItems(input.selectedOutlets);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const totalRev = items.reduce((s, i) => s + i.revenue, 0);
  const period = fmtDate(input.dateFrom, input.dateTo);

  const rows = items
    .map(
      (i) => `<tr>
      <td>${i.name}</td>
      <td>${i.category}</td>
      <td style="text-align:right;font-family:monospace;">${i.qty}</td>
      <td style="text-align:right;font-family:monospace;">${cur(i.revenue)}</td>
      <td style="text-align:right;">${totalRev > 0 ? ((i.revenue / totalRev) * 100).toFixed(1) : "0"}%</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Sales by Item</title>
<style>
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:32px; color:#1a1a1a; max-width:900px; margin:0 auto; }
  h1 { font-size:20px; margin:0 0 4px; }
  .meta { font-size:12px; color:#666; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { padding:6px 8px; border-bottom:2px solid #ddd; text-align:left; font-size:11px; text-transform:uppercase; color:#888; }
  td { padding:5px 8px; border-bottom:1px solid #eee; }
  tr.total td { border-top:2px solid #333; font-weight:700; }
  @media print { body { padding:0; } }
</style></head><body>
<h1>Sales by Item</h1>
<p class="meta">${period} · ${input.outletLabel}</p>
<table>
  <thead><tr><th>Item</th><th>Category</th><th style="text-align:right">Qty</th><th style="text-align:right">Revenue</th><th style="text-align:right">% of Revenue</th></tr></thead>
  <tbody>${rows}
    <tr class="total"><td>Total</td><td></td><td style="text-align:right;font-family:monospace;">${totalQty}</td><td style="text-align:right;font-family:monospace;">${cur(totalRev)}</td><td></td></tr>
  </tbody>
</table>
</body></html>`;
  openPrint(html);
}

// ─────────────────────── Sales by Category ──────────────────────

export function exportSalesByCategoryExcel(input: ItemsExport) {
  const items = aggregateItems(input.selectedOutlets);
  const catMap: Record<string, { qty: number; revenue: number }> = {};
  items.forEach((i) => {
    if (!catMap[i.category]) catMap[i.category] = { qty: 0, revenue: 0 };
    catMap[i.category].qty += i.qty;
    catMap[i.category].revenue += i.revenue;
  });
  const totalRev = items.reduce((s, i) => s + i.revenue, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const cats = Object.entries(catMap)
    .map(([category, v]) => ({
      category,
      qty: v.qty,
      revenue: v.revenue,
      pct: totalRev > 0 ? `${((v.revenue / totalRev) * 100).toFixed(1)}%` : "0%",
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const wb = XLSX.utils.book_new();
  const rows = [
    ["Sales by Category"],
    ["Period", fmtDate(input.dateFrom, input.dateTo)],
    ["Outlet", input.outletLabel],
    [],
    ["Category", "Qty", "Revenue", "% of Revenue"],
    ...cats.map((c) => [c.category, c.qty, c.revenue, c.pct]),
    [],
    ["Total", totalQty, totalRev, ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 26 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Sales by Category");
  XLSX.writeFile(wb, `Sales_By_Category_${format(input.dateFrom, "yyyy-MM-dd")}_${format(input.dateTo, "yyyy-MM-dd")}.xlsx`);
}

export function exportSalesByCategoryPDF(input: ItemsExport) {
  const items = aggregateItems(input.selectedOutlets);
  const catMap: Record<string, { qty: number; revenue: number }> = {};
  items.forEach((i) => {
    if (!catMap[i.category]) catMap[i.category] = { qty: 0, revenue: 0 };
    catMap[i.category].qty += i.qty;
    catMap[i.category].revenue += i.revenue;
  });
  const totalRev = items.reduce((s, i) => s + i.revenue, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const cats = Object.entries(catMap)
    .map(([category, v]) => ({ category, qty: v.qty, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const rows = cats
    .map(
      (c) => `<tr>
      <td>${c.category}</td>
      <td style="text-align:right;font-family:monospace;">${c.qty}</td>
      <td style="text-align:right;font-family:monospace;">${cur(c.revenue)}</td>
      <td style="text-align:right;">${totalRev > 0 ? ((c.revenue / totalRev) * 100).toFixed(1) : "0"}%</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Sales by Category</title>
<style>
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:32px; color:#1a1a1a; max-width:900px; margin:0 auto; }
  h1 { font-size:20px; margin:0 0 4px; }
  .meta { font-size:12px; color:#666; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { padding:6px 8px; border-bottom:2px solid #ddd; text-align:left; font-size:11px; text-transform:uppercase; color:#888; }
  td { padding:5px 8px; border-bottom:1px solid #eee; }
  tr.total td { border-top:2px solid #333; font-weight:700; }
  @media print { body { padding:0; } }
</style></head><body>
<h1>Sales by Category</h1>
<p class="meta">${fmtDate(input.dateFrom, input.dateTo)} · ${input.outletLabel}</p>
<table>
  <thead><tr><th>Category</th><th style="text-align:right">Qty</th><th style="text-align:right">Revenue</th><th style="text-align:right">% of Revenue</th></tr></thead>
  <tbody>${rows}
    <tr class="total"><td>Total</td><td style="text-align:right;font-family:monospace;">${totalQty}</td><td style="text-align:right;font-family:monospace;">${cur(totalRev)}</td><td></td></tr>
  </tbody>
</table>
</body></html>`;
  openPrint(html);
}

// ─────────────────────── Sales by Department ──────────────────────

export function exportSalesByDepartmentExcel(input: ItemsExport) {
  const rows = aggregateItemsByDepartment(input.selectedOutlets, input.outlets || []);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  const wb = XLSX.utils.book_new();
  const data = [
    ["Sales by Department"],
    ["Period", fmtDate(input.dateFrom, input.dateTo)],
    ["Outlet", input.outletLabel],
    [],
    ["Department", "Outlet", "Qty", "Revenue", "% of Revenue"],
    ...rows.map((r) => [
      r.department,
      r.outletName,
      r.qty,
      r.revenue,
      totalRev > 0 ? `${((r.revenue / totalRev) * 100).toFixed(1)}%` : "0%",
    ]),
    [],
    ["Total", "", totalQty, totalRev, ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 26 }, { wch: 26 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Sales by Department");
  XLSX.writeFile(wb, `Sales_By_Department_${format(input.dateFrom, "yyyy-MM-dd")}_${format(input.dateTo, "yyyy-MM-dd")}.xlsx`);
}

export function exportSalesByDepartmentPDF(input: ItemsExport) {
  const rows = aggregateItemsByDepartment(input.selectedOutlets, input.outlets || []);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  const body = rows
    .map(
      (r) => `<tr>
      <td>${r.department}</td>
      <td>${r.outletName}</td>
      <td style="text-align:right;font-family:monospace;">${r.qty}</td>
      <td style="text-align:right;font-family:monospace;">${cur(r.revenue)}</td>
      <td style="text-align:right;">${totalRev > 0 ? ((r.revenue / totalRev) * 100).toFixed(1) : "0"}%</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Sales by Department</title>
<style>
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:32px; color:#1a1a1a; max-width:900px; margin:0 auto; }
  h1 { font-size:20px; margin:0 0 4px; }
  .meta { font-size:12px; color:#666; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { padding:6px 8px; border-bottom:2px solid #ddd; text-align:left; font-size:11px; text-transform:uppercase; color:#888; }
  td { padding:5px 8px; border-bottom:1px solid #eee; }
  tr.total td { border-top:2px solid #333; font-weight:700; }
  @media print { body { padding:0; } }
</style></head><body>
<h1>Sales by Department</h1>
<p class="meta">${fmtDate(input.dateFrom, input.dateTo)} · ${input.outletLabel}</p>
<table>
  <thead><tr><th>Department</th><th>Outlet</th><th style="text-align:right">Qty</th><th style="text-align:right">Revenue</th><th style="text-align:right">% of Revenue</th></tr></thead>
  <tbody>${body}
    <tr class="total"><td>Total</td><td></td><td style="text-align:right;font-family:monospace;">${totalQty}</td><td style="text-align:right;font-family:monospace;">${cur(totalRev)}</td><td></td></tr>
  </tbody>
</table>
</body></html>`;
  openPrint(html);
}

// ─────────────────────── Transactions ──────────────────────

export interface TxnExport {
  outletLabel: string;
  dateFrom: Date;
  dateTo: Date;
  rows: {
    orderId: string;
    date: string;
    customerPhone: string;
    amount: string;
    cashier: string;
    location: string;
    paymentStatus: string;
    paymentSummary: string;
    orderStatus: string;
  }[];
}

export function exportTransactionsPDF(input: TxnExport) {
  const body = input.rows
    .map(
      (t) => `<tr>
      <td style="font-family:monospace;">${t.orderId}</td>
      <td>${t.date}</td>
      <td>${t.customerPhone}</td>
      <td style="text-align:right;font-family:monospace;">${t.amount}</td>
      <td>${t.cashier}</td>
      <td>${t.location}</td>
      <td>${t.paymentStatus}</td>
      <td>${t.paymentSummary}</td>
      <td>${t.orderStatus}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Transactions</title>
<style>
  @page { size: landscape; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:24px; color:#1a1a1a; }
  h1 { font-size:18px; margin:0 0 4px; }
  .meta { font-size:11px; color:#666; margin-bottom:14px; }
  table { width:100%; border-collapse:collapse; font-size:10px; }
  th { padding:5px 6px; border-bottom:2px solid #ddd; text-align:left; font-size:10px; text-transform:uppercase; color:#888; }
  td { padding:4px 6px; border-bottom:1px solid #eee; vertical-align:top; }
  @media print { body { padding:0; } }
</style></head><body>
<h1>Transactions</h1>
<p class="meta">${fmtDate(input.dateFrom, input.dateTo)} · ${input.outletLabel} · ${input.rows.length} transaction(s)</p>
<table>
  <thead><tr>
    <th>Order ID</th><th>Date</th><th>Phone</th><th style="text-align:right">Amount</th>
    <th>Cashier</th><th>Location</th><th>Payment</th><th>Method</th><th>Order</th>
  </tr></thead>
  <tbody>${body}</tbody>
</table>
</body></html>`;
  openPrint(html);
}

// ─────────────────────── helpers ──────────────────────

function openPrint(html: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

// re-export filterSales for callers that need it
export { filterSales };
