export type PeriodFilter =
  | "all"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "m1"
  | "m2"
  | "m3"
  | "m4"
  | "m5"
  | "m6"
  | "m7"
  | "m8"
  | "m9"
  | "m10"
  | "m11"
  | "m12";

export type MapMetric = "receita" | "lucro" | "margem" | "atraso";

export interface SaleRow {
  id: number;
  dateIso: string;
  date: Date;
  month: number;
  quarter: number;
  client: string;
  clientType: string;
  relationshipMonths: number;
  incomeRange: string;
  segment: string;
  product: string;
  category: string;
  brand: string;
  productLine: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  revenue: number;
  unitCost: number;
  profit: number;
  region: string;
  city: string;
  channel: string;
  seller: string;
  target: number;
  hitTarget: boolean;
  deliveryDays: number;
  deliveryStatus: string;
}

export interface SalesFilters {
  period: PeriodFilter;
  channel: string;
  region: string;
}

export interface KpiSummary {
  sales: number;
  revenue: number;
  profit: number;
  margin: number;
  target: number;
  targetCompletion: number;
  delayedSales: number;
  delayRate: number;
  averageDiscount: number;
  quantity: number;
  ticket: number;
  negativeProfitSales: number;
  goalHitRate: number;
}

export interface DimensionMetric {
  name: string;
  sales: number;
  revenue: number;
  profit: number;
  margin: number;
  target: number;
  targetCompletion: number;
  quantity: number;
  ticket: number;
  averageDiscount: number;
  delayRate: number;
  goalHitRate: number;
  negativeProfitSales: number;
}

export interface DailyMetric {
  dateIso: string;
  date: Date;
  sales: number;
  revenue: number;
  profit: number;
  margin: number;
}

export interface MonthlyMetric {
  month: number;
  label: string;
  sales: number;
  revenue: number;
  profit: number;
  target: number;
  margin: number;
  delayRate: number;
}

export interface RegionMetric extends DimensionMetric {
  region: string;
}

export interface PresentationStage {
  id: string;
  step: string;
  title: string;
  narrative: string;
  talkingPoints: string[];
  evidence: Array<{ label: string; value: string; tone?: "lime" | "violet" | "red" }>;
  visual: string;
  conclusion: string;
}

export type CsvObject = Record<string, string>;
