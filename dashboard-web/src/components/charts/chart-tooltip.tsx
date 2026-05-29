import * as React from "react";
import { formatCompactBRL, formatDecimal } from "../../lib/format";
import { cn } from "../../lib/utils";

type TooltipValue = string | number | Array<string | number>;

interface TooltipPayloadItem {
  name?: string | number;
  dataKey?: string | number;
  value?: TooltipValue;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipContentProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
  title?: string | ((label: string | number | undefined, payload: TooltipPayloadItem[]) => React.ReactNode);
  nameFormatter?: (name: string, item: TooltipPayloadItem) => React.ReactNode;
  valueFormatter?: (value: TooltipValue, name: string, item: TooltipPayloadItem) => React.ReactNode;
  className?: string;
}

function defaultValueFormatter(value: TooltipValue) {
  if (Array.isArray(value)) return value.join(" - ");
  if (typeof value === "number") return formatDecimal(value, 2);
  return value;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ChartTooltipContent({
  active,
  label,
  payload,
  title,
  nameFormatter,
  valueFormatter,
  className,
}: ChartTooltipContentProps) {
  const items = (payload ?? []).filter((item) => item.value !== undefined && item.value !== null);

  if (!active || !items.length) return null;

  const heading = typeof title === "function" ? title(label, items) : title ?? label;

  return (
    <div
      className={cn(
        "min-w-[14rem] rounded-md border border-white/14 bg-[#080c14] px-3.5 py-3 text-xs text-white shadow-2xl",
        className,
      )}
    >
      {heading ? <div className="mb-2 border-b border-white/10 pb-2 text-[11px] font-medium text-slate-300">{heading}</div> : null}
      <div className="space-y-2">
        {items.map((item) => {
          const rawName = String(item.name ?? item.dataKey ?? "Valor");
          const color = item.color ?? "#cbd5e1";
          return (
            <div key={`${rawName}-${String(item.value)}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-slate-300">{nameFormatter ? nameFormatter(rawName, item) : rawName}</span>
              <span className="metric-number font-semibold text-white">
                {valueFormatter ? valueFormatter(item.value as TooltipValue, rawName, item) : defaultValueFormatter(item.value as TooltipValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScatterSaleTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const discount = toNumber(point.discount);
  const margin = toNumber(point.margin);
  const revenue = toNumber(point.revenue);
  const profit = toNumber(point.profit);

  const rows = [
    { label: "Região", value: String(point.region ?? "-") },
    { label: "Canal", value: String(point.channel ?? "-") },
    { label: "Desconto", value: `${formatDecimal(discount, 1)}%`, tone: "text-violet-100" },
    { label: "Margem", value: `${formatDecimal(margin, 1)}%`, tone: margin < 0 ? "text-red-100" : "text-lime-signal" },
    { label: "Receita", value: formatCompactBRL(revenue), tone: "text-white" },
    { label: "Lucro", value: formatCompactBRL(profit), tone: profit < 0 ? "text-red-100" : "text-lime-signal" },
  ];

  return (
    <div className="min-w-[16rem] rounded-md border border-white/14 bg-[#080c14] px-3.5 py-3 text-xs text-white shadow-2xl">
      <div className="border-b border-white/10 pb-2">
        <p className="text-[11px] text-slate-400">Venda analisada</p>
        <p className="mt-1 max-w-[14rem] font-semibold leading-snug text-white">{String(point.product ?? "Produto")}</p>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[6rem_1fr] gap-3">
            <span className="text-slate-300">{row.label}</span>
            <span className={cn("metric-number text-right font-semibold text-white", row.tone)}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
