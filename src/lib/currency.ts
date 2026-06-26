export function formatNaira(amount: number | undefined): string {
  return amount ? "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";
}
