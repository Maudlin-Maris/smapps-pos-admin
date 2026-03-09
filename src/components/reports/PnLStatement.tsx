import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { PnLData } from "@/hooks/use-financial-data";

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function pct(part: number, total: number) {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

interface LineRowProps {
  label: string;
  amount: number;
  total?: number;
  bold?: boolean;
  positive?: boolean;
  indent?: boolean;
}

function LineRow({ label, amount, total, bold, positive, indent }: LineRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-2 px-3", bold && "font-semibold", indent && "pl-8")}>
      <span className={cn("text-sm", indent && "text-muted-foreground")}>{label}</span>
      <div className="flex items-center gap-4">
        {total !== undefined && (
          <span className="text-xs text-muted-foreground w-14 text-right">{pct(amount, total)}</span>
        )}
        <span className={cn(
          "text-sm font-mono w-24 text-right",
          bold && "font-bold",
          positive === true && "text-success",
          positive === false && "text-destructive"
        )}>
          {fmt(amount)}
        </span>
      </div>
    </div>
  );
}

interface Props {
  data: PnLData;
  dateFrom: Date;
  dateTo: Date;
}

export default function PnLStatement({ data, dateFrom, dateTo }: Props) {
  const totalRevenue = data.revenue.sales + data.revenue.otherIncome;
  const totalCOGS = data.costOfGoods.inventory + data.costOfGoods.directLabor;
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const netProfit = grossProfit - totalExpenses;

  return (
    <Card className="lg:col-span-2 p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-heading font-semibold text-sm">Income Statement</h2>
        <Badge variant="secondary" className="text-xs">
          {format(dateFrom, "MMM d")} – {format(dateTo, "MMM d, yyyy")}
        </Badge>
      </div>
      <div className="divide-y">
        <div>
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</p>
          </div>
          <LineRow label="Sales Revenue" amount={data.revenue.sales} total={totalRevenue} indent />
          <LineRow label="Other Income" amount={data.revenue.otherIncome} total={totalRevenue} indent />
          <div className="border-t border-dashed mx-3" />
          <LineRow label="Total Revenue" amount={totalRevenue} bold />
        </div>
        <div>
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost of Goods Sold</p>
          </div>
          <LineRow label="Inventory Costs" amount={data.costOfGoods.inventory} total={totalRevenue} indent />
          <LineRow label="Direct Labor" amount={data.costOfGoods.directLabor} total={totalRevenue} indent />
          <div className="border-t border-dashed mx-3" />
          <LineRow label="Total COGS" amount={totalCOGS} bold />
        </div>
        <div className="bg-success/5">
          <LineRow label="Gross Profit" amount={grossProfit} total={totalRevenue} bold positive={grossProfit >= 0} />
        </div>
        <div>
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Expenses</p>
          </div>
          <LineRow label="Rent" amount={data.expenses.rent} total={totalRevenue} indent />
          <LineRow label="Utilities" amount={data.expenses.utilities} total={totalRevenue} indent />
          <LineRow label="Salaries & Wages" amount={data.expenses.salaries} total={totalRevenue} indent />
          <LineRow label="Marketing" amount={data.expenses.marketing} total={totalRevenue} indent />
          <LineRow label="Maintenance" amount={data.expenses.maintenance} total={totalRevenue} indent />
          <LineRow label="Other Expenses" amount={data.expenses.other} total={totalRevenue} indent />
          <div className="border-t border-dashed mx-3" />
          <LineRow label="Total Expenses" amount={totalExpenses} bold />
        </div>
        <div className={cn(netProfit >= 0 ? "bg-success/5" : "bg-destructive/5")}>
          <LineRow label="Net Profit / (Loss)" amount={netProfit} total={totalRevenue} bold positive={netProfit >= 0} />
        </div>
      </div>
    </Card>
  );
}
