import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { PnLData, StoredAdjustment } from "@/hooks/use-financial-data";

function fmt(n: number) {
  return Number(n.toFixed(2));
}

const CONSUMPTION_TYPES = ["remove", "damaged"];

// ── Excel Export ──────────────────────────────────────────────

export function exportPnLToExcel(
  data: PnLData,
  cogsItems: COGSItemRow[],
  dateFrom: Date,
  dateTo: Date,
  outletLabel: string
) {
  const wb = XLSX.utils.book_new();
  const period = `${format(dateFrom, "MMM d, yyyy")} – ${format(dateTo, "MMM d, yyyy")}`;

  // P&L sheet
  const totalRevenue = data.revenue.sales + data.revenue.otherIncome;
  const totalCOGS = data.costOfGoods.inventory + data.costOfGoods.directLabor;
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const netProfit = grossProfit - totalExpenses;

  const pnlRows = [
    ["Income Statement"],
    ["Period", period],
    ["Outlet", outletLabel],
    [],
    ["REVENUE", "", "Amount"],
    ["", "Sales Revenue", fmt(data.revenue.sales)],
    ["", "Other Income", fmt(data.revenue.otherIncome)],
    ["", "Total Revenue", fmt(totalRevenue)],
    [],
    ["COST OF GOODS SOLD"],
    ["", "Inventory Costs", fmt(data.costOfGoods.inventory)],
    ["", "Direct Labor", fmt(data.costOfGoods.directLabor)],
    ["", "Total COGS", fmt(totalCOGS)],
    [],
    ["GROSS PROFIT", "", fmt(grossProfit)],
    [],
    ["OPERATING EXPENSES"],
    ["", "Rent", fmt(data.expenses.rent)],
    ["", "Utilities", fmt(data.expenses.utilities)],
    ["", "Salaries & Wages", fmt(data.expenses.salaries)],
    ["", "Marketing", fmt(data.expenses.marketing)],
    ["", "Maintenance", fmt(data.expenses.maintenance)],
    ["", "Other Expenses", fmt(data.expenses.other)],
    ["", "Total Expenses", fmt(totalExpenses)],
    [],
    ["NET PROFIT / (LOSS)", "", fmt(netProfit)],
  ];

  const pnlWs = XLSX.utils.aoa_to_sheet(pnlRows);
  pnlWs["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, pnlWs, "P&L Statement");

  // COGS Breakdown sheet
  if (cogsItems.length > 0) {
    const cogsRows = [
      ["COGS Breakdown by Item"],
      ["Period", period],
      ["Outlet", outletLabel],
      [],
      ["Item", "Qty Used", "Avg Cost", "Total Cost", "% of COGS"],
      ...cogsItems.map((i) => [i.name, i.totalQty, fmt(i.avgCostPrice), fmt(i.totalCost), `${i.pctOfCOGS}%`]),
    ];
    const cogsWs = XLSX.utils.aoa_to_sheet(cogsRows);
    cogsWs["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, cogsWs, "COGS Breakdown");
  }

  const filename = `PnL_Report_${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ── PDF Export (print-based) ─────────────────────────────────

export function exportPnLToPDF(
  data: PnLData,
  cogsItems: COGSItemRow[],
  dateFrom: Date,
  dateTo: Date,
  outletLabel: string
) {
  const period = `${format(dateFrom, "MMM d, yyyy")} – ${format(dateTo, "MMM d, yyyy")}`;
  const totalRevenue = data.revenue.sales + data.revenue.otherIncome;
  const totalCOGS = data.costOfGoods.inventory + data.costOfGoods.directLabor;
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const netProfit = grossProfit - totalExpenses;

  const cur = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const pnlLine = (label: string, amount: number, bold = false, indent = false) =>
    `<tr style="${bold ? "font-weight:700;" : ""}">
      <td style="padding:4px 8px;${indent ? "padding-left:28px;color:#666;" : ""}">${label}</td>
      <td style="padding:4px 8px;text-align:right;font-family:monospace;">${cur(amount)}</td>
    </tr>`;

  const cogsTableRows = cogsItems
    .map(
      (i) =>
        `<tr>
          <td style="padding:4px 8px;">${i.name}</td>
          <td style="padding:4px 8px;text-align:right;font-family:monospace;">${i.totalQty}</td>
          <td style="padding:4px 8px;text-align:right;font-family:monospace;">${cur(i.avgCostPrice)}</td>
          <td style="padding:4px 8px;text-align:right;font-family:monospace;">${cur(i.totalCost)}</td>
          <td style="padding:4px 8px;text-align:right;">${i.pctOfCOGS}%</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><title>P&L Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .section-header td { padding: 12px 8px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
  .subtotal td { border-top: 1px dashed #ddd; }
  .total td { border-top: 2px solid #333; font-weight: 700; font-size: 14px; }
  .positive td:last-child { color: #16a34a; }
  .negative td:last-child { color: #dc2626; }
  .cogs-table { font-size: 13px; }
  .cogs-table th { padding: 6px 8px; border-bottom: 2px solid #ddd; text-align: left; font-size: 11px; text-transform: uppercase; color: #888; }
  .cogs-table td { border-bottom: 1px solid #eee; }
  h2 { font-size: 16px; margin: 32px 0 8px; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h1>Income Statement</h1>
<p class="meta">${period} · ${outletLabel}</p>
<table>
  <tr class="section-header"><td colspan="2">Revenue</td></tr>
  ${pnlLine("Sales Revenue", data.revenue.sales, false, true)}
  ${pnlLine("Other Income", data.revenue.otherIncome, false, true)}
  <tr class="subtotal">${pnlLine("Total Revenue", totalRevenue, true).replace(/<\/?tr[^>]*>/g, "")}</tr>
  <tr class="section-header"><td colspan="2">Cost of Goods Sold</td></tr>
  ${pnlLine("Inventory Costs", data.costOfGoods.inventory, false, true)}
  ${pnlLine("Direct Labor", data.costOfGoods.directLabor, false, true)}
  <tr class="subtotal">${pnlLine("Total COGS", totalCOGS, true).replace(/<\/?tr[^>]*>/g, "")}</tr>
  <tr class="${grossProfit >= 0 ? "positive" : "negative"} total">${pnlLine("Gross Profit", grossProfit, true).replace(/<\/?tr[^>]*>/g, "")}</tr>
  <tr class="section-header"><td colspan="2">Operating Expenses</td></tr>
  ${pnlLine("Rent", data.expenses.rent, false, true)}
  ${pnlLine("Utilities", data.expenses.utilities, false, true)}
  ${pnlLine("Salaries & Wages", data.expenses.salaries, false, true)}
  ${pnlLine("Marketing", data.expenses.marketing, false, true)}
  ${pnlLine("Maintenance", data.expenses.maintenance, false, true)}
  ${pnlLine("Other Expenses", data.expenses.other, false, true)}
  <tr class="subtotal">${pnlLine("Total Expenses", totalExpenses, true).replace(/<\/?tr[^>]*>/g, "")}</tr>
  <tr class="${netProfit >= 0 ? "positive" : "negative"} total">${pnlLine("Net Profit / (Loss)", netProfit, true).replace(/<\/?tr[^>]*>/g, "")}</tr>
</table>
${cogsItems.length > 0 ? `
<h2>COGS Breakdown by Item</h2>
<table class="cogs-table">
  <thead><tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Avg Cost</th><th style="text-align:right">Total</th><th style="text-align:right">%</th></tr></thead>
  <tbody>${cogsTableRows}</tbody>
</table>` : ""}
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// ── Shared COGS item builder ────────────────────────────────

export interface COGSItemRow {
  name: string;
  totalQty: number;
  avgCostPrice: number;
  totalCost: number;
  pctOfCOGS: string;
}

export function buildCOGSItems(
  adjustments: StoredAdjustment[],
  itemNames: Record<string, string>
): COGSItemRow[] {
  const consumption = adjustments.filter((a) => CONSUMPTION_TYPES.includes(a.type));

  const grouped: Record<string, { totalCost: number; totalQty: number; name: string }> = {};
  for (const a of consumption) {
    if (!grouped[a.inventoryItemId]) {
      grouped[a.inventoryItemId] = { totalCost: 0, totalQty: 0, name: itemNames[a.inventoryItemId] || `Item ${a.inventoryItemId}` };
    }
    grouped[a.inventoryItemId].totalCost += a.costTotal;
    grouped[a.inventoryItemId].totalQty += a.quantityChange;
  }

  const totalCOGS = Object.values(grouped).reduce((s, g) => s + g.totalCost, 0);

  return Object.values(grouped)
    .map((g) => ({
      name: g.name,
      totalQty: g.totalQty,
      avgCostPrice: g.totalQty > 0 ? g.totalCost / g.totalQty : 0,
      totalCost: g.totalCost,
      pctOfCOGS: totalCOGS > 0 ? ((g.totalCost / totalCOGS) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}
