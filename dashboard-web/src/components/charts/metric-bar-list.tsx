import type { DimensionMetric } from "../../data/types";
import { formatBRL, formatCompactBRL, formatNumber, formatPercent } from "../../lib/format";
import { cn } from "../../lib/utils";

interface MetricBarListProps {
  items: DimensionMetric[];
  metric?: "revenue" | "profit" | "margin" | "delayRate" | "quantity" | "negativeProfitSales" | "targetCompletion";
  limit?: number;
  dangerMetric?: boolean;
}

function metricValue(item: DimensionMetric, metric: NonNullable<MetricBarListProps["metric"]>) {
  return item[metric];
}

function formatMetric(value: number, metric: NonNullable<MetricBarListProps["metric"]>) {
  if (metric === "revenue" || metric === "profit") return formatCompactBRL(value);
  if (metric === "margin" || metric === "delayRate" || metric === "targetCompletion") return formatPercent(value);
  return formatNumber(value);
}

function barColorClass(danger: boolean, metric: NonNullable<MetricBarListProps["metric"]>) {
  if (danger) return "metric-bar-fill-red";
  if (metric === "revenue" || metric === "targetCompletion") return "metric-bar-fill-violet";
  return "metric-bar-fill-lime";
}

export function MetricBarList({ items, metric = "profit", limit = 6, dangerMetric = false }: MetricBarListProps) {
  const visible = items.slice(0, limit);
  const max = Math.max(...visible.map((item) => Math.abs(metricValue(item, metric))), 1);

  return (
    <div className="space-y-1">
      {visible.map((item, index) => {
        const value = metricValue(item, metric);
        const width = Math.max(4, (Math.abs(value) / max) * 100);
        const danger = dangerMetric || item.profit < 0 || item.margin < 0;

        return (
          <div key={item.name} className="metric-bar-row">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="metric-number w-5 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span className="truncate font-medium text-slate-200">{item.name}</span>
              </div>
              <span className={cn("metric-number whitespace-nowrap", danger ? "text-red-100" : "text-white")}>
                {formatMetric(value, metric)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn("metric-bar-fill h-full rounded-full", barColorClass(danger, metric))}
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{item.sales} vendas</span>
              <span>{formatPercent(item.margin)} margem</span>
            </div>
          </div>
        );
      })}
      {!visible.length ? <p className="text-sm text-muted-foreground">Sem dados para o filtro atual.</p> : null}
      {visible[0] && metric === "profit" ? (
        <p className="text-[11px] text-muted-foreground">Maior lucro: {formatBRL(visible[0].profit)}</p>
      ) : null}
    </div>
  );
}
