import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  CheckCircle2,
  DollarSign,
  Package,
  Percent,
  Receipt,
  RotateCcw,
  Target,
  TrendingUp,
  TriangleAlert,
  Truck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { BrazilMapcn } from "../components/charts/brazil-mapcn";
import { ChartTooltipContent, ScatterSaleTooltip } from "../components/charts/chart-tooltip";
import { GithubSalesCalendar } from "../components/charts/github-sales-calendar";
import { MetricBarList } from "../components/charts/metric-bar-list";
import { KpiCard, type KpiReading } from "../components/dashboard/kpi-card";
import { SectionHeader } from "../components/dashboard/section-header";
import { SectionNav, useActiveSection, type NavSection } from "../components/dashboard/section-nav";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { outputTables, salesRows } from "../data/catalog";
import type { DimensionMetric, KpiSummary, MapMetric, SalesFilters } from "../data/types";
import {
  aggregateBy,
  aggregateRegions,
  applyFilters,
  compareToBase,
  dateRangeLabel,
  discountScatter,
  monthlyTrend,
  pearsonDiscountMargin,
  periodOptions,
  sortMetrics,
  summarizeKpis,
  topNegativeProfitGroups,
  uniqueValues,
} from "../lib/analytics";
import { formatCompactBRL, formatDecimal, formatNumber, formatPercent } from "../lib/format";
import { cn } from "../lib/utils";

/* ─── Section definitions ───────────────────────────────────── */

const SECTIONS: NavSection[] = [
  { id: "sec-p0", badge: "P0", label: "Visao Geral", color: "220" },
  { id: "sec-p1", badge: "P1", label: "Regioes", color: "190" },
  { id: "sec-p2", badge: "P2", label: "Produtos", color: "45" },
  { id: "sec-p3", badge: "P3", label: "Canais", color: "83" },
  { id: "sec-p4", badge: "P4", label: "Vendedores", color: "260" },
  { id: "sec-p5", badge: "P5", label: "Clientes", color: "330" },
  { id: "sec-p6", badge: "P6", label: "Descontos", color: "356" },
  { id: "sec-p7", badge: "P7", label: "Logistica", color: "28" },
  { id: "sec-p8", badge: "P8", label: "Marcas", color: "170" },
  { id: "sec-acao", badge: "⚡", label: "Plano", color: "83" },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

const BADGE_COLORS: Record<string, string> = {
  "sec-p0": "border-slate-400/30 bg-slate-400/10 text-slate-300",
  "sec-p1": "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  "sec-p2": "border-amber-400/30 bg-amber-400/10 text-amber-300",
  "sec-p3": "border-lime-signal/30 bg-lime-signal/10 text-lime-signal",
  "sec-p4": "border-violet-signal/30 bg-violet-signal/14 text-violet-100",
  "sec-p5": "border-rose-400/30 bg-rose-400/10 text-rose-300",
  "sec-p6": "border-red-signal/30 bg-red-signal/12 text-red-100",
  "sec-p7": "border-orange-400/30 bg-orange-400/10 text-orange-300",
  "sec-p8": "border-teal-400/30 bg-teal-400/10 text-teal-300",
  "sec-acao": "border-lime-signal/30 bg-lime-signal/10 text-lime-signal",
};

/* ─── Gradient hues per section ─────────────────────────────── */

const GRADIENT_SCHEMES: Record<string, { accent: number; secondary: number }> = {
  "sec-p0": { accent: 220, secondary: 260 },
  "sec-p1": { accent: 190, secondary: 210 },
  "sec-p2": { accent: 45, secondary: 30 },
  "sec-p3": { accent: 83, secondary: 120 },
  "sec-p4": { accent: 260, secondary: 280 },
  "sec-p5": { accent: 330, secondary: 350 },
  "sec-p6": { accent: 356, secondary: 10 },
  "sec-p7": { accent: 28, secondary: 40 },
  "sec-p8": { accent: 170, secondary: 190 },
  "sec-acao": { accent: 83, secondary: 260 },
};

/* ─── Types ─────────────────────────────────────────────────── */

type KpiDefinition = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "lime" | "violet" | "red" | "neutral";
  delta?: number;
  deltaPolarity?: "positive" | "negative";
  reading: KpiReading;
};

/* ─── CSV key resolver (handles encoding-corrupted headers) ── */

function csvVal(obj: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    if (key in obj) return obj[key];
  }
  // Fuzzy fallback: find first key containing any candidate as substring
  const keys = Object.keys(obj);
  for (const cand of candidates) {
    const found = keys.find((k) => k.toLowerCase().includes(cand.toLowerCase()));
    if (found) return obj[found];
  }
  return "";
}

/* ─── Helpers ───────────────────────────────────────────────── */

const trendMetricNames: Record<string, string> = {
  revenue: "Receita",
  profit: "Lucro",
};

function tooltipNumber(value: string | number | Array<string | number>) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ChartShell({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ContextCard({
  label,
  title,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  title: string;
  value: string;
  helper: string;
  tone?: "lime" | "violet" | "red" | "neutral";
}) {
  const toneClass = {
    lime: "border-lime-signal/25 bg-lime-signal/10 text-lime-signal",
    violet: "border-violet-signal/30 bg-violet-signal/14 text-violet-100",
    red: "border-red-signal/25 bg-red-signal/12 text-red-100",
    neutral: "border-white/10 bg-white/[0.055] text-slate-200",
  }[tone];

  return (
    <Card className="h-full p-4">
      <div className={cn("inline-flex rounded-md border px-2 py-1 text-[11px] font-medium", toneClass)}>{label}</div>
      <p className="mt-4 text-sm font-medium text-slate-200">{title}</p>
      <p className="metric-number mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{helper}</p>
    </Card>
  );
}

function formatLeaderHelper(metric: DimensionMetric | undefined) {
  if (!metric) return "Sem dados para o filtro atual.";
  return `${formatNumber(metric.sales)} vendas / ${formatPercent(metric.margin)} margem`;
}

/* ─── KPI builder ───────────────────────────────────────────── */

function buildKpis(summary: KpiSummary, baseKpis: KpiSummary): Record<string, KpiDefinition> {
  return {
    revenue: {
      label: "Receita",
      value: formatCompactBRL(summary.revenue),
      helper: `${formatNumber(summary.sales)} vendas no filtro`,
      icon: DollarSign,
      tone: "lime",
      delta: compareToBase(summary, baseKpis, "revenue"),
      reading: {
        sobre: "Soma do valor vendido apos aplicar os filtros de periodo, canal e regiao.",
        comoAnalisar: "Use junto com lucro e margem. Receita alta sem margem saudavel pode indicar mix fraco ou desconto excessivo.",
        insight: "A escala comercial deve ser preservada, mas a decisao principal do projeto e proteger margem antes de perseguir volume isolado.",
      },
    },
    profit: {
      label: "Lucro",
      value: formatCompactBRL(summary.profit),
      helper: "Resultado financeiro acumulado",
      icon: TrendingUp,
      tone: summary.profit < 0 ? "red" : "lime",
      delta: compareToBase(summary, baseKpis, "profit"),
      reading: {
        sobre: "Receita menos custos, consolidando o ganho financeiro real das vendas filtradas.",
        comoAnalisar: "Compare com receita. Se a receita cresce e o lucro nao acompanha, ha perda de eficiencia no mix, preco ou desconto.",
        insight: "Os cortes de prejuizo devem mirar produtos e vendas com margem negativa antes de expandir metas comerciais.",
      },
    },
    margin: {
      label: "Margem",
      value: formatPercent(summary.margin),
      helper: "Lucro dividido por receita",
      icon: Percent,
      tone: summary.margin < 0.18 ? "red" : "lime",
      delta: compareToBase(summary, baseKpis, "margin"),
      reading: {
        sobre: "Percentual da receita que permanece como lucro.",
        comoAnalisar: "Leia como qualidade da venda. Margem baixa pede revisao de preco, descontos, custo ou mix de produtos.",
        insight: "A governanca de margem e o eixo central para evitar que vendas grandes escondam destruicao de valor.",
      },
    },
    quantity: {
      label: "Quantidade",
      value: formatNumber(summary.quantity),
      helper: "Unidades vendidas",
      icon: Package,
      tone: "violet",
      delta: compareToBase(summary, baseKpis, "quantity"),
      reading: {
        sobre: "Total de unidades comercializadas no recorte selecionado.",
        comoAnalisar: "Combine com ticket medio e margem. Volume alto ajuda escala, mas nao garante resultado financeiro.",
        insight: "Use quantidade para detectar pressao operacional e validar se o mix lider compensa em lucro.",
      },
    },
    ticket: {
      label: "Ticket Medio",
      value: formatCompactBRL(summary.ticket),
      helper: "Receita media por venda",
      icon: Receipt,
      tone: "neutral",
      delta: compareToBase(summary, baseKpis, "ticket"),
      reading: {
        sobre: "Receita media gerada por cada venda.",
        comoAnalisar: "Ticket maior e positivo quando vem acompanhado de margem e meta. Isolado, pode apenas refletir produtos caros.",
        insight: "A leitura por canal e produto ajuda a separar aumento de valor real de simples concentracao em vendas maiores.",
      },
    },
    averageDiscount: {
      label: "Desconto Medio",
      value: formatPercent(summary.averageDiscount),
      helper: "Media concedida por venda",
      icon: BadgePercent,
      tone: summary.averageDiscount > 0.12 ? "red" : "violet",
      delta: compareToBase(summary, baseKpis, "averageDiscount"),
      deltaPolarity: "negative",
      reading: {
        sobre: "Media de desconto aplicado nas vendas filtradas.",
        comoAnalisar: "Observe se descontos maiores realmente elevam receita, meta e lucro. Sem essa compensacao, eles reduzem margem.",
        insight: "O scatter desconto x margem deve orientar limites comerciais por produto e canal.",
      },
    },
    negativeProfitSales: {
      label: "Lucro Negativo",
      value: formatNumber(summary.negativeProfitSales),
      helper: "Vendas que destruiram valor",
      icon: TriangleAlert,
      tone: summary.negativeProfitSales > 0 ? "red" : "lime",
      delta: compareToBase(summary, baseKpis, "negativeProfitSales"),
      deltaPolarity: "negative",
      reading: {
        sobre: "Quantidade de vendas com lucro abaixo de zero.",
        comoAnalisar: "Priorize os agrupamentos com mais ocorrencias e maior perda. Poucas vendas podem explicar grande parte do problema.",
        insight: "O plano deve bloquear combinacoes de produto, desconto e canal que geram prejuizo recorrente.",
      },
    },
    targetCompletion: {
      label: "Cumprimento da Meta",
      value: formatPercent(summary.targetCompletion),
      helper: `${formatCompactBRL(summary.target)} de referencia`,
      icon: Target,
      tone: summary.targetCompletion < 0.9 ? "red" : "violet",
      delta: compareToBase(summary, baseKpis, "targetCompletion"),
      reading: {
        sobre: "Receita realizada dividida pela meta comercial do recorte.",
        comoAnalisar: "Abaixo de 90% exige foco em execucao. Acima de 100% deve ser validado contra margem e desconto.",
        insight: "Meta batida com margem pressionada nao resolve o problema; vendedor, canal e desconto precisam ser vistos juntos.",
      },
    },
    goalHitRate: {
      label: "Vendas na Meta",
      value: formatPercent(summary.goalHitRate),
      helper: "Percentual de vendas que bateram meta",
      icon: CheckCircle2,
      tone: summary.goalHitRate < 0.5 ? "red" : "lime",
      delta: compareToBase(summary, baseKpis, "goalHitRate"),
      reading: {
        sobre: "Participacao das vendas marcadas como atingindo a meta.",
        comoAnalisar: "Mostra consistencia da execucao, nao apenas o resultado agregado. Taxa baixa indica dependencia de poucos casos fortes.",
        insight: "Use o ranking de vendedores para replicar praticas dos grupos consistentes sem ampliar descontos ruins.",
      },
    },
    delayRate: {
      label: "Atrasos",
      value: formatPercent(summary.delayRate),
      helper: `${formatNumber(summary.delayedSales)} vendas atrasadas`,
      icon: Truck,
      tone: summary.delayRate > 0.5 ? "red" : "violet",
      delta: compareToBase(summary, baseKpis, "delayRate"),
      deltaPolarity: "negative",
      reading: {
        sobre: "Percentual de vendas com status de entrega atrasado.",
        comoAnalisar: "Cruze com canal e regiao. Atraso elevado pode afetar recompra, satisfacao e capacidade de cumprir planos comerciais.",
        insight: "A operacao logistica precisa de rotina de priorizacao para os canais e regioes com maior taxa de atraso.",
      },
    },
  };
}

/* ─── Main view ─────────────────────────────────────────────── */

export function DashboardView() {
  const [filters, setFilters] = React.useState<SalesFilters>({ period: "all", channel: "all", region: "all" });
  const [mapMetric, setMapMetric] = React.useState<MapMetric>("receita");
  const [activeRegion, setActiveRegion] = React.useState<string | null>(null);
  const [showExecBar, setShowExecBar] = React.useState(false);

  const { activeId, progress } = useActiveSection(SECTION_IDS);

  /* ── Dynamic gradient ─────────────────────────────── */
  React.useEffect(() => {
    const scheme = GRADIENT_SCHEMES[activeId];
    if (!scheme) return;
    const root = document.documentElement;
    root.style.setProperty("--grad-accent-h", String(scheme.accent));
    root.style.setProperty("--grad-secondary-h", String(scheme.secondary));
  }, [activeId]);

  /* ── Show executive bar after scrolling past P0 ──── */
  React.useEffect(() => {
    const p0 = document.getElementById("sec-p0");
    if (!p0) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowExecBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(p0);
    return () => observer.disconnect();
  }, []);

  /* ── Data derivations ─────────────────────────────── */
  const baseKpis = React.useMemo(() => summarizeKpis(salesRows), []);
  const filteredRows = React.useMemo(() => applyFilters(salesRows, filters), [filters]);
  const summary = React.useMemo(() => summarizeKpis(filteredRows), [filteredRows]);
  const trend = React.useMemo(() => monthlyTrend(filteredRows), [filteredRows]);
  const scatter = React.useMemo(() => discountScatter(filteredRows), [filteredRows]);
  const regions = React.useMemo(() => aggregateRegions(filteredRows), [filteredRows]);
  const channelMetrics = React.useMemo(() => aggregateBy(filteredRows, (row) => row.channel), [filteredRows]);
  const channelsByRevenue = React.useMemo(() => sortMetrics(channelMetrics, "revenue"), [channelMetrics]);
  const channelsByDelay = React.useMemo(() => sortMetrics(channelMetrics, "delayRate"), [channelMetrics]);
  const products = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.product), "profit"), [filteredRows]);
  const categories = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.category), "profit"), [filteredRows]);
  const sellers = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.seller), "profit"), [filteredRows]);
  const delivery = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.deliveryStatus), "delayRate"), [filteredRows]);
  const regionsByDelay = React.useMemo(() => sortMetrics(regions, "delayRate"), [regions]);
  const negativeProducts = React.useMemo(() => topNegativeProfitGroups(filteredRows, (row) => row.product), [filteredRows]);
  const correlation = React.useMemo(() => pearsonDiscountMargin(filteredRows), [filteredRows]);
  const kpis = React.useMemo(() => buildKpis(summary, baseKpis), [summary, baseKpis]);

  // P5 — Client type
  const clientTypes = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.clientType), "profit"), [filteredRows]);
  // P8 — Brands and product lines
  const brands = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.brand), "profit"), [filteredRows]);
  const productLines = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.productLine), "profit"), [filteredRows]);

  const channelOptions = React.useMemo(
    () => [{ value: "all", label: "Todos os canais" }, ...uniqueValues(salesRows, (row) => row.channel).map((value) => ({ value, label: value }))],
    [],
  );
  const regionOptions = React.useMemo(
    () => [{ value: "all", label: "Todas as regioes" }, ...uniqueValues(salesRows, (row) => row.region).map((value) => ({ value, label: value }))],
    [],
  );

  const selectedRegion = activeRegion ? regions.find((region) => region.region === activeRegion) : regions[0];
  const regionRankingMetric =
    mapMetric === "atraso" ? "delayRate" : mapMetric === "margem" ? "margin" : mapMetric === "lucro" ? "profit" : "revenue";
  const regionLeader = regions[0];
  const productLeader = products[0];
  const categoryLeader = categories[0];

  /* ── Active section label for exec bar ────────────── */
  const activeSectionMeta = SECTIONS.find((s) => s.id === activeId);

  return (
    <div className="space-y-10 pb-20 xl:pr-12">
      {/* ── Section Nav (minimap) ────────────────── */}
      <SectionNav sections={SECTIONS} activeId={activeId} progress={progress} />

      {/* ── Header ──────────────────────────────── */}
      <header className="grid gap-4 lg:grid-cols-[1fr_28rem] lg:items-end">
        <div>
          <Badge variant="violet">Dashboard analitico</Badge>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Comercial Insight Ltda. em leitura financeira, comercial e operacional.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            Analise de 2024 setorizada por perguntas de negocio. Cada secao responde uma pergunta com KPIs, graficos e insights acionaveis.
          </p>
        </div>
        <Card className="glass-panel p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Filtro atual</p>
          <p className="mt-2 text-xl font-semibold text-white">{dateRangeLabel(filteredRows)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <span>
              Canal: <strong className="text-slate-200">{filters.channel === "all" ? "Todos" : filters.channel}</strong>
            </span>
            <span>
              Regiao: <strong className="text-slate-200">{filters.region === "all" ? "Todas" : filters.region}</strong>
            </span>
          </div>
        </Card>
      </header>

      {/* ── Sticky filters ──────────────────────── */}
      <div className="glass-panel sticky top-3 z-20 rounded-lg p-3">
        <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_auto] md:items-end">
          <Select
            label="Data / periodo"
            value={filters.period}
            options={periodOptions}
            onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value as SalesFilters["period"] }))}
          />
          <Select
            label="Canal"
            value={filters.channel}
            options={channelOptions}
            onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value }))}
          />
          <Select
            label="Regiao"
            value={filters.region}
            options={regionOptions}
            onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
          />
          <Button variant="secondary" className="h-10" onClick={() => setFilters({ period: "all", channel: "all", region: "all" })}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* ── Executive sticky bar ────────────────── */}
      {showExecBar ? (
        <div className="executive-bar sticky top-[4.5rem] z-[19] -mx-4 -mt-4 px-4 py-2.5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Receita</span>
                <span className="metric-number text-sm font-semibold text-lime-signal">{formatCompactBRL(summary.revenue)}</span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Lucro</span>
                <span className="metric-number text-sm font-semibold text-white">{formatCompactBRL(summary.profit)}</span>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Margem</span>
                <span className={cn("metric-number text-sm font-semibold", summary.margin < 0.18 ? "text-red-100" : "text-lime-signal")}>
                  {formatPercent(summary.margin)}
                </span>
              </div>
            </div>
            {activeSectionMeta ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-400">
                <span className="font-bold text-slate-200">{activeSectionMeta.badge}</span>
                {activeSectionMeta.label}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════ */}
      {/* P0 — Visão Geral                           */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p0"
          badge="P0"
          question="Visao geral: saude financeira e tendencias"
          description="Leitura de resultado, eficiência e volume antes de abrir a analise setorizada por perguntas de negocio."
          badgeColor={BADGE_COLORS["sec-p0"]}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {["revenue", "profit", "margin", "quantity", "ticket"].map((key) => (
            <KpiCard key={key} {...kpis[key]} />
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {["averageDiscount", "negativeProfitSales", "targetCompletion", "goalHitRate", "delayRate"].map((key) => (
            <KpiCard key={key} {...kpis[key]} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <ChartShell title="Evolucao temporal" description="Receita e lucro mensal em 2024, respeitando os filtros globais.">
            <div className="h-[23rem]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="profit" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#b5e24a" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#b5e24a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={formatCompactBRL} width={76} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        title={(label) => `Mes: ${label ?? "-"}`}
                        nameFormatter={(name) => trendMetricNames[name] ?? name}
                        valueFormatter={(value) => formatCompactBRL(tooltipNumber(value))}
                      />
                    }
                  />
                  <Area type="monotone" dataKey="revenue" name="revenue" stroke="#7c5cff" strokeWidth={2} fill="url(#revenue)" />
                  <Area type="monotone" dataKey="profit" name="profit" stroke="#b5e24a" strokeWidth={2} fill="url(#profit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>

          <GithubSalesCalendar rows={filteredRows} />
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P1 — Regiões x receita x margem            */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p1"
          badge="P1"
          question="Quais regioes geram maior receita e quais apresentam menor margem?"
          description="KPIs: receita, lucro, margem, taxa de atraso por regiao. Sul como referencia, Centro-Oeste como alerta."
          badgeColor={BADGE_COLORS["sec-p1"]}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ContextCard
            label="Regiao destaque"
            title={regionLeader?.name ?? "Sem regiao"}
            value={regionLeader ? formatCompactBRL(regionLeader.revenue) : "-"}
            helper={formatLeaderHelper(regionLeader)}
            tone="violet"
          />
          <ContextCard
            label="Melhor margem"
            title={(() => { const best = [...regions].sort((a, b) => b.margin - a.margin)[0]; return best?.name ?? "-"; })()}
            value={(() => { const best = [...regions].sort((a, b) => b.margin - a.margin)[0]; return best ? formatPercent(best.margin) : "-"; })()}
            helper="Regiao com melhor margem de lucro"
            tone="lime"
          />
          <ContextCard
            label="Menor margem"
            title={(() => { const worst = [...regions].sort((a, b) => a.margin - b.margin)[0]; return worst?.name ?? "-"; })()}
            value={(() => { const worst = [...regions].sort((a, b) => a.margin - b.margin)[0]; return worst ? formatPercent(worst.margin) : "-"; })()}
            helper="Regiao que requer auditoria de custos e descontos"
            tone="red"
          />
          <ContextCard
            label="Maior atraso"
            title={regionsByDelay[0]?.name ?? "-"}
            value={regionsByDelay[0] ? formatPercent(regionsByDelay[0].delayRate) : "-"}
            helper="Taxa de entrega atrasada por regiao"
            tone="red"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <BrazilMapcn
            regionStats={regions}
            metric={mapMetric}
            onMetricChange={setMapMetric}
            activeRegion={activeRegion}
            onRegionHover={setActiveRegion}
          />
          <ChartShell title="Leitura regional" description="Ranking regional e detalhe do estado/regiao em foco.">
            {selectedRegion ? (
              <div className="mb-5 rounded-md border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{activeRegion ? "Hover no mapa" : "Maior receita"}</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedRegion.region}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Receita <strong className="block text-white">{formatCompactBRL(selectedRegion.revenue)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Lucro <strong className="block text-white">{formatCompactBRL(selectedRegion.profit)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Margem <strong className="block text-white">{formatPercent(selectedRegion.margin)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Atraso <strong className="block text-red-100">{formatPercent(selectedRegion.delayRate)}</strong>
                  </span>
                </div>
              </div>
            ) : null}
            <MetricBarList items={regions} metric={regionRankingMetric} limit={5} dangerMetric={mapMetric === "atraso"} />
          </ChartShell>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P2 — Produtos e categorias                 */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p2"
          badge="P2"
          question="Quais produtos e categorias sao mais vendidos e geram maior lucro?"
          description="KPIs: receita, lucro, margem, quantidade e ticket medio por produto e categoria."
          badgeColor={BADGE_COLORS["sec-p2"]}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ContextCard
            label="Produto lider"
            title={productLeader?.name ?? "Sem produto"}
            value={productLeader ? formatCompactBRL(productLeader.profit) : "-"}
            helper={formatLeaderHelper(productLeader)}
          />
          <ContextCard
            label="Categoria lider"
            title={categoryLeader?.name ?? "Sem categoria"}
            value={categoryLeader ? formatCompactBRL(categoryLeader.profit) : "-"}
            helper={formatLeaderHelper(categoryLeader)}
            tone="lime"
          />
          <ContextCard
            label="Maior receita"
            title={(() => { const top = sortMetrics(products, "revenue")[0]; return top?.name ?? "-"; })()}
            value={(() => { const top = sortMetrics(products, "revenue")[0]; return top ? formatCompactBRL(top.revenue) : "-"; })()}
            helper="Produto lider em receita (nem sempre maior lucro)"
            tone="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartShell title="Produtos" description="Ranking por lucro total.">
            <MetricBarList items={products} metric="profit" limit={8} />
          </ChartShell>
          <ChartShell title="Categorias" description="Concentracao de resultado por categoria.">
            <MetricBarList items={categories} metric="profit" limit={6} />
          </ChartShell>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P3 — Online vs Loja                        */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p3"
          badge="P3"
          question="O canal online apresenta desempenho melhor ou pior que a loja?"
          description="Compara receita, lucro, margem, atingimento de metas e atraso entre Online e Loja."
          badgeColor={BADGE_COLORS["sec-p3"]}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartShell title="Canais por receita" description="Ranking por receita e leitura de margem por canal.">
            <MetricBarList items={channelsByRevenue} metric="revenue" limit={4} />
          </ChartShell>
          <ChartShell title="Comparacao detalhada" description="Metricas lado a lado por canal.">
            <div className="grid gap-4">
              {channelsByRevenue.map((ch) => (
                <div key={ch.name} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                  <h4 className="text-sm font-semibold text-white">{ch.name}</h4>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Receita</span>
                      <p className="metric-number mt-0.5 font-semibold text-white">{formatCompactBRL(ch.revenue)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lucro</span>
                      <p className="metric-number mt-0.5 font-semibold text-white">{formatCompactBRL(ch.profit)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margem</span>
                      <p className={cn("metric-number mt-0.5 font-semibold", ch.margin < 0.18 ? "text-red-100" : "text-lime-signal")}>
                        {formatPercent(ch.margin)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vendas</span>
                      <p className="metric-number mt-0.5 font-semibold text-white">{formatNumber(ch.sales)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Meta</span>
                      <p className={cn("metric-number mt-0.5 font-semibold", ch.targetCompletion < 0.9 ? "text-red-100" : "text-lime-signal")}>
                        {formatPercent(ch.targetCompletion)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atraso</span>
                      <p className={cn("metric-number mt-0.5 font-semibold", ch.delayRate > 0.5 ? "text-red-100" : "text-lime-signal")}>
                        {formatPercent(ch.delayRate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartShell>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P4 — Vendedores                            */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p4"
          badge="P4"
          question="Quais vendedores possuem melhor desempenho em receita, lucro e metas?"
          description="Ranking multidimensional por lucro, margem, cumprimento de meta e desconto medio."
          badgeColor={BADGE_COLORS["sec-p4"]}
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <ChartShell title="Vendedores" description="Ranking por lucro total e qualidade de margem.">
            <MetricBarList items={sellers} metric="profit" limit={8} />
          </ChartShell>
          <ChartShell title="Consistencia por vendedor" description="Cumprimento da meta dos principais vendedores por lucro.">
            <div className="space-y-4">
              {sellers.slice(0, 6).map((seller) => (
                <div key={seller.name}>
                  <div className="mb-1.5 flex justify-between gap-3 text-xs text-muted-foreground">
                    <span className="truncate">{seller.name}</span>
                    <span className="metric-number text-slate-200">{formatPercent(seller.targetCompletion)}</span>
                  </div>
                  <Progress value={seller.targetCompletion * 100} tone={seller.targetCompletion < 0.9 ? "red" : "lime"} />
                </div>
              ))}
            </div>
          </ChartShell>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P5 — Clientes recorrentes vs novos         */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p5"
          badge="P5"
          question="Clientes recorrentes geram maior receita e lucro do que novos?"
          description="Compara tipo de cliente por receita, lucro, margem, vendas e taxa de atraso."
          badgeColor={BADGE_COLORS["sec-p5"]}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartShell title="Tipo de cliente" description="Ranking por lucro total.">
            <MetricBarList items={clientTypes} metric="profit" limit={4} />
          </ChartShell>
          <ChartShell title="Comparacao detalhada" description="Metricas lado a lado por tipo de cliente.">
            <div className="grid gap-4">
              {clientTypes.map((ct) => (
                <div key={ct.name} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                  <h4 className="text-sm font-semibold text-white">{ct.name}</h4>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Receita</span>
                      <p className="metric-number mt-0.5 font-semibold text-white">{formatCompactBRL(ct.revenue)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lucro</span>
                      <p className="metric-number mt-0.5 font-semibold text-white">{formatCompactBRL(ct.profit)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margem</span>
                      <p className={cn("metric-number mt-0.5 font-semibold", ct.margin < 0.18 ? "text-red-100" : "text-lime-signal")}>
                        {formatPercent(ct.margin)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vendas</span>
                      <p className="metric-number mt-0.5 font-semibold text-white">{formatNumber(ct.sales)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Meta</span>
                      <p className={cn("metric-number mt-0.5 font-semibold", ct.goalHitRate < 0.1 ? "text-red-100" : "text-lime-signal")}>
                        {formatPercent(ct.goalHitRate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atraso</span>
                      <p className={cn("metric-number mt-0.5 font-semibold", ct.delayRate > 0.5 ? "text-red-100" : "text-lime-signal")}>
                        {formatPercent(ct.delayRate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartShell>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P6 — Descontos e margem                    */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p6"
          badge="P6"
          question="O nivel de desconto concedido impacta negativamente a margem?"
          description="KPIs: desconto medio, vendas com lucro negativo, correlacao desconto x margem."
          badgeColor={BADGE_COLORS["sec-p6"]}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {["averageDiscount", "negativeProfitSales"].map((key) => (
            <KpiCard key={key} {...kpis[key]} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.82fr]">
          <ChartShell
            title="Desconto x margem"
            description={`Dispersao por venda. Correlacao de Pearson no filtro: ${formatDecimal(correlation, 3)}.`}
          >
            <div className="h-[24rem]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 0, right: 18, top: 10, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    type="number"
                    dataKey="discount"
                    name="Desconto"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) => `${formatDecimal(Number(value), 0)}%`}
                  />
                  <YAxis
                    type="number"
                    dataKey="margin"
                    name="Margem"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) => `${formatDecimal(Number(value), 0)}%`}
                  />
                  <ZAxis type="number" dataKey="revenue" range={[28, 220]} />
                  <ChartTooltip cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.24)" }} content={<ScatterSaleTooltip />} />
                  <Scatter data={scatter} fill="#b5e24a" fillOpacity={0.62}>
                    {scatter.map((item, index) => (
                      <Cell key={`${item.product}-${index}`} fill={item.margin < 0 ? "#e25765" : item.discount > 20 ? "#7c5cff" : "#b5e24a"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>

          <ChartShell title="Lucro negativo" description="Produtos que concentram vendas com prejuizo.">
            <MetricBarList items={negativeProducts} metric="negativeProfitSales" limit={8} dangerMetric />
          </ChartShell>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P7 — Logística e atrasos                   */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p7"
          badge="P7"
          question="Existe relacao entre atraso na entrega e pior desempenho comercial?"
          description="Impacto de atrasos por status, canal e regiao para orientar priorizacao operacional."
          badgeColor={BADGE_COLORS["sec-p7"]}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard {...kpis.delayRate} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <ChartShell title="Status de entrega" description="Receita por status de entrega e margem associada.">
            <div className="h-[17rem]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={delivery} layout="vertical" margin={{ left: 6, right: 18, top: 4, bottom: 4 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={78} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        title={(label) => String(label ?? "Status")}
                        nameFormatter={() => "Receita"}
                        valueFormatter={(value) => formatCompactBRL(tooltipNumber(value))}
                      />
                    }
                  />
                  <Bar dataKey="revenue" name="revenue" radius={[0, 4, 4, 0]}>
                    {delivery.map((item) => (
                      <Cell key={item.name} fill={item.name === "Atrasado" ? "#e25765" : "#b5e24a"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {delivery.map((item) => (
                <div key={item.name} className="rounded-md border border-white/10 bg-white/[0.045] p-3">
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className="metric-number mt-1 text-lg font-semibold text-white">{formatNumber(item.sales)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatPercent(item.margin)} margem</p>
                </div>
              ))}
            </div>
          </ChartShell>

          <div className="grid gap-6">
            <ChartShell title="Atraso por canal" description="Canais ordenados pela taxa de atraso.">
              <MetricBarList items={channelsByDelay} metric="delayRate" limit={4} dangerMetric />
            </ChartShell>
            <ChartShell title="Atraso por regiao" description="Regioes ordenadas pela taxa de atraso.">
              <MetricBarList items={regionsByDelay} metric="delayRate" limit={5} dangerMetric />
            </ChartShell>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* P8 — Marcas e linhas de produto            */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-p8"
          badge="P8"
          question="Quais marcas ou linhas de produto apresentam maior contribuicao para o lucro?"
          description="Ranking por marca e linha de produto, priorizando lucro e margem."
          badgeColor={BADGE_COLORS["sec-p8"]}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartShell title="Marcas" description="Ranking por lucro total por marca.">
            <MetricBarList items={brands} metric="profit" limit={8} />
          </ChartShell>
          <ChartShell title="Linhas de produto" description="Ranking por lucro total por linha de produto.">
            <MetricBarList items={productLines} metric="profit" limit={6} />
          </ChartShell>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* Plano de Ação (tabela compacta)             */}
      {/* ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <SectionHeader
          id="sec-acao"
          badge="⚡"
          question="Plano de acao: o que a empresa deve fazer?"
          description="Recomendacoes consolidadas para governanca de margem, metas e logistica."
          badgeColor={BADGE_COLORS["sec-acao"]}
        />

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Plano de acao completo</CardTitle>
            <CardDescription>Acoes priorizadas extraidas dos outputs finais da etapa 7.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Acao</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Prioridade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outputTables.actionPlan.map((item, idx) => (
                  <TableRow key={`action-${idx}`}>
                    <TableCell>{csvVal(item, "Prazo")}</TableCell>
                    <TableCell className="font-medium text-white">{csvVal(item, "Ação", "Acao", "ão")}</TableCell>
                    <TableCell>{csvVal(item, "Objetivo")}</TableCell>
                    <TableCell>{csvVal(item, "Área Responsável", "rea Respons", "Area")}</TableCell>
                    <TableCell>
                      <Badge variant={csvVal(item, "Prioridade") === "Alta" ? "danger" : "violet"}>{csvVal(item, "Prioridade")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
