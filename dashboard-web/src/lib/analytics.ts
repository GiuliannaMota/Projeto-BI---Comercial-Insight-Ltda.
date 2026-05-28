import type {
  DailyMetric,
  DimensionMetric,
  KpiSummary,
  MonthlyMetric,
  PeriodFilter,
  RegionMetric,
  SaleRow,
  SalesFilters,
} from "../data/types";

export const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: "all", label: "Ano completo" },
  { value: "q1", label: "1o trimestre" },
  { value: "q2", label: "2o trimestre" },
  { value: "q3", label: "3o trimestre" },
  { value: "q4", label: "4o trimestre" },
  { value: "m1", label: "Jan" },
  { value: "m2", label: "Fev" },
  { value: "m3", label: "Mar" },
  { value: "m4", label: "Abr" },
  { value: "m5", label: "Mai" },
  { value: "m6", label: "Jun" },
  { value: "m7", label: "Jul" },
  { value: "m8", label: "Ago" },
  { value: "m9", label: "Set" },
  { value: "m10", label: "Out" },
  { value: "m11", label: "Nov" },
  { value: "m12", label: "Dez" },
];

export const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function matchesPeriod(row: SaleRow, period: PeriodFilter) {
  if (period === "all") return true;
  if (period.startsWith("q")) return row.quarter === Number(period.slice(1));
  return row.month === Number(period.slice(1));
}

export function uniqueValues(rows: SaleRow[], selector: (row: SaleRow) => string) {
  return Array.from(new Set(rows.map(selector))).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function applyFilters(rows: SaleRow[], filters: SalesFilters) {
  return rows.filter((row) => {
    if (!matchesPeriod(row, filters.period)) return false;
    if (filters.channel !== "all" && row.channel !== filters.channel) return false;
    if (filters.region !== "all" && row.region !== filters.region) return false;
    return true;
  });
}

function emptyKpis(): KpiSummary {
  return {
    sales: 0,
    revenue: 0,
    profit: 0,
    margin: 0,
    target: 0,
    targetCompletion: 0,
    delayedSales: 0,
    delayRate: 0,
    averageDiscount: 0,
    quantity: 0,
    ticket: 0,
    negativeProfitSales: 0,
    goalHitRate: 0,
  };
}

export function summarizeKpis(rows: SaleRow[]): KpiSummary {
  if (!rows.length) return emptyKpis();

  const summary = rows.reduce(
    (acc, row) => {
      acc.revenue += row.revenue;
      acc.profit += row.profit;
      acc.target += row.target;
      acc.quantity += row.quantity;
      acc.discount += row.discount;
      if (row.deliveryStatus === "Atrasado") acc.delayedSales += 1;
      if (row.profit < 0) acc.negativeProfitSales += 1;
      if (row.hitTarget) acc.goalHits += 1;
      return acc;
    },
    {
      revenue: 0,
      profit: 0,
      target: 0,
      quantity: 0,
      discount: 0,
      delayedSales: 0,
      negativeProfitSales: 0,
      goalHits: 0,
    },
  );

  return {
    sales: rows.length,
    revenue: summary.revenue,
    profit: summary.profit,
    margin: summary.revenue ? summary.profit / summary.revenue : 0,
    target: summary.target,
    targetCompletion: summary.target ? summary.revenue / summary.target : 0,
    delayedSales: summary.delayedSales,
    delayRate: summary.delayedSales / rows.length,
    averageDiscount: summary.discount / rows.length,
    quantity: summary.quantity,
    ticket: summary.revenue / rows.length,
    negativeProfitSales: summary.negativeProfitSales,
    goalHitRate: summary.goalHits / rows.length,
  };
}

export function aggregateBy(rows: SaleRow[], selector: (row: SaleRow) => string): DimensionMetric[] {
  const groups = new Map<string, SaleRow[]>();
  rows.forEach((row) => {
    const key = selector(row) || "Nao informado";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  return Array.from(groups.entries())
    .map(([name, group]) => ({
      name,
      ...summarizeKpis(group),
    }))
    .map((metric) => ({
      name: metric.name,
      sales: metric.sales,
      revenue: metric.revenue,
      profit: metric.profit,
      margin: metric.margin,
      target: metric.target,
      targetCompletion: metric.targetCompletion,
      quantity: metric.quantity,
      ticket: metric.ticket,
      averageDiscount: metric.averageDiscount,
      delayRate: metric.delayRate,
      goalHitRate: metric.goalHitRate,
      negativeProfitSales: metric.negativeProfitSales,
    }));
}

export function sortMetrics(
  metrics: DimensionMetric[],
  by: "revenue" | "profit" | "margin" | "quantity" | "delayRate" | "negativeProfitSales" = "profit",
) {
  return [...metrics].sort((a, b) => b[by] - a[by]);
}

export function aggregateRegions(rows: SaleRow[]): RegionMetric[] {
  return sortMetrics(aggregateBy(rows, (row) => row.region), "revenue").map((metric) => ({
    ...metric,
    region: metric.name,
  }));
}

export function dailyMetrics(rows: SaleRow[]): DailyMetric[] {
  const groups = new Map<string, SaleRow[]>();
  rows.forEach((row) => groups.set(row.dateIso, [...(groups.get(row.dateIso) ?? []), row]));

  return Array.from(groups.entries())
    .map(([dateIso, group]) => {
      const kpis = summarizeKpis(group);
      return {
        dateIso,
        date: group[0].date,
        sales: kpis.sales,
        revenue: kpis.revenue,
        profit: kpis.profit,
        margin: kpis.margin,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function monthlyTrend(rows: SaleRow[]): MonthlyMetric[] {
  return monthLabels.map((label, index) => {
    const month = index + 1;
    const monthRows = rows.filter((row) => row.month === month);
    const kpis = summarizeKpis(monthRows);
    return {
      month,
      label,
      sales: kpis.sales,
      revenue: kpis.revenue,
      profit: kpis.profit,
      target: kpis.target,
      margin: kpis.margin,
      delayRate: kpis.delayRate,
    };
  });
}

export function discountScatter(rows: SaleRow[]) {
  return rows.map((row) => ({
    discount: row.discount * 100,
    margin: row.revenue ? (row.profit / row.revenue) * 100 : 0,
    revenue: row.revenue,
    profit: row.profit,
    product: row.product,
    region: row.region,
    channel: row.channel,
  }));
}

export function topNegativeProfitGroups(rows: SaleRow[], selector: (row: SaleRow) => string) {
  return aggregateBy(
    rows.filter((row) => row.profit < 0),
    selector,
  ).sort((a, b) => b.negativeProfitSales - a.negativeProfitSales || a.profit - b.profit);
}

export function compareToBase(filtered: KpiSummary, base: KpiSummary, key: keyof KpiSummary) {
  const baseValue = Number(base[key]);
  const filteredValue = Number(filtered[key]);
  if (!Number.isFinite(baseValue) || baseValue === 0) return 0;
  return filteredValue / baseValue - 1;
}

export function pearsonDiscountMargin(rows: SaleRow[]) {
  if (rows.length < 2) return 0;
  const values = rows.map((row) => ({
    x: row.discount,
    y: row.revenue ? row.profit / row.revenue : 0,
  }));
  const avgX = values.reduce((sum, value) => sum + value.x, 0) / values.length;
  const avgY = values.reduce((sum, value) => sum + value.y, 0) / values.length;
  const numerator = values.reduce((sum, value) => sum + (value.x - avgX) * (value.y - avgY), 0);
  const denominatorX = Math.sqrt(values.reduce((sum, value) => sum + (value.x - avgX) ** 2, 0));
  const denominatorY = Math.sqrt(values.reduce((sum, value) => sum + (value.y - avgY) ** 2, 0));
  return denominatorX && denominatorY ? numerator / (denominatorX * denominatorY) : 0;
}

export function dateRangeLabel(rows: SaleRow[]) {
  if (!rows.length) return "Sem vendas no filtro";
  const sorted = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${formatter.format(sorted[0].date)} a ${formatter.format(sorted[sorted.length - 1].date)}`;
}
