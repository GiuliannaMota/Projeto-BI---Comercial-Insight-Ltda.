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
  ComposedChart,
  Line,
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
import { ReadingIconButton, ReadingPanel, ReadingPopover, type ReadingContent } from "../components/dashboard/reading-disclosure";
import { SectionHeader } from "../components/dashboard/section-header";
import { SectionNav, useActiveSection, type NavSection } from "../components/dashboard/section-nav";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs } from "../components/ui/tabs";
import { salesRows } from "../data/catalog";
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

function defaultChartReading(title: string, description: string): ReadingContent {
  return {
    sobre: description,
    comoAnalisar: `Leia ${title} pela ordem dos valores, pelo tamanho relativo das barras/linhas e pelos detalhes do tooltip ou rodape.`,
    insight: "Use o grafico como triagem. Quando a diferenca for pequena, trate como sinal para investigar antes de assumir que um grupo e claramente melhor.",
  };
}

function ChartShell({
  title,
  description,
  children,
  action,
  reading,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  reading?: ReadingContent;
}) {
  const [readingOpen, setReadingOpen] = React.useState(false);
  const chartReading = reading ?? defaultChartReading(title, description);

  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <ReadingIconButton
            open={readingOpen}
            ariaLabel={`Ver leitura do grafico ${title}`}
            onClick={() => setReadingOpen((current) => !current)}
          />
        </div>
      </CardHeader>
      {readingOpen ? (
        <div className="px-5 pb-3">
          <ReadingPanel reading={chartReading} />
        </div>
      ) : null}
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
  const [readingOpen, setReadingOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const toneClass = {
    lime: "border-lime-signal/25 bg-lime-signal/10 text-lime-signal",
    violet: "border-violet-signal/30 bg-violet-signal/14 text-violet-100",
    red: "border-red-signal/25 bg-red-signal/12 text-red-100",
    neutral: "border-white/10 bg-white/[0.055] text-slate-200",
  }[tone];
  const reading = {
    sobre: `${label}: ${title}. O valor exibido e ${value}.`,
    comoAnalisar: "Use este card como leitura resumida do recorte atual e compare com os rankings ou graficos da mesma secao.",
    insight: helper || "Sem detalhe adicional para o filtro atual.",
  };

  return (
    <Card className="h-full overflow-visible p-4">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("inline-flex rounded-md border px-2 py-1 text-[11px] font-medium", toneClass)}>{label}</div>
        <ReadingIconButton
          ref={triggerRef}
          open={readingOpen}
          ariaLabel={`Ver leitura do KPI ${label}`}
          className="h-7 w-7"
          onClick={() => setReadingOpen((current) => !current)}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-200">{title}</p>
      <p className="metric-number mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{helper}</p>
      <ReadingPopover
        anchorRef={triggerRef}
        open={readingOpen}
        reading={reading}
        onClose={() => setReadingOpen(false)}
      />
    </Card>
  );
}

function formatLeaderHelper(metric: DimensionMetric | undefined) {
  if (!metric) return "Sem dados para o filtro atual.";
  return `${formatNumber(metric.sales)} vendas / ${formatPercent(metric.margin)} margem`;
}

function InsightCallout({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-4 text-sm text-cyan-200">
      <strong className="block text-white mb-1">Conclusao analitica:</strong>
      {text}
    </div>
  );
}

const rankingTabItems = [
  { value: "product", label: "Produto" },
  { value: "category", label: "Categoria" },
];

const requestedActionPlanRows = [
  {
    problema: "Baixo atingimento de metas",
    evidencia: "Apenas 7,00% das vendas atingiram meta",
    impacto: "Dificulta avaliação comercial",
    recomendacao: "Recalibrar metas por região, canal, produto e vendedor",
    prioridade: "Alta",
  },
  {
    problema: "Descontos elevados reduzem margem",
    evidencia: "Margem cai de 29,97% para 9,19%",
    impacto: "Reduz rentabilidade",
    recomendacao: "Criar política formal de descontos",
    prioridade: "Alta",
  },
  {
    problema: "Vendas com prejuízo",
    evidencia: "123 vendas com lucro negativo",
    impacto: "Gera perda financeira",
    recomendacao: "Criar alerta ou bloqueio para margem negativa",
    prioridade: "Alta",
  },
  {
    problema: "Alta taxa de atrasos",
    evidencia: "51,90% das entregas atrasadas",
    impacto: "Afeta operação e experiência do cliente",
    recomendacao: "Monitorar atraso por canal, região e produto",
    prioridade: "Alta",
  },
  {
    problema: "Centro-Oeste com baixa margem",
    evidencia: "Margem de 17,97%",
    impacto: "Alto faturamento com baixa eficiência",
    recomendacao: "Revisar descontos, produtos e custos da região",
    prioridade: "Média",
  },
  {
    problema: "Produtos de alta receita com baixa margem",
    evidencia: "Monitor lidera receita, mas tem margem baixa",
    impacto: "Pode distorcer decisões comerciais",
    recomendacao: "Priorizar produtos com maior margem",
    prioridade: "Média",
  },
  {
    problema: "Avaliação focada só em receita",
    evidencia: "Vendedores com mais receita não são sempre os mais rentáveis",
    impacto: "Incentiva vendas pouco lucrativas",
    recomendacao: "Avaliar vendedores por lucro, margem e desconto",
    prioridade: "Média",
  },
];

const strategicRecommendations = [
  {
    title: "14.1 Revisar a política de descontos",
    body:
      "A empresa deve criar regras claras para concessão de descontos, especialmente acima de 15%, pois os dados mostram queda expressiva da margem em faixas de desconto mais altas.",
  },
  {
    title: "14.2 Criar controle para vendas com lucro negativo",
    body:
      "Vendas com prejuízo devem ser bloqueadas ou submetidas à aprovação gerencial. Isso evita que a empresa aumente faturamento, mas reduza lucro.",
  },
  {
    title: "14.3 Recalibrar metas comerciais",
    body:
      "A baixa taxa de atingimento de meta indica que os objetivos comerciais precisam ser revistos. As metas devem considerar região, canal, produto, vendedor, histórico e margem.",
  },
  {
    title: "14.4 Monitorar atrasos como KPI estratégico",
    body:
      "A taxa de atraso de 51,90% é muito elevada. A entrega deve ser acompanhada como parte da estratégia de negócio, e não apenas como operação logística.",
  },
  {
    title: "14.5 Replicar boas práticas da região Sul",
    body:
      "A região Sul apresentou o melhor desempenho financeiro. Suas práticas comerciais devem ser estudadas e adaptadas para outras regiões.",
  },
  {
    title: "14.6 Reforçar produtos de maior margem",
    body:
      "Produtos como Notebook, Impressora e Teclado devem receber atenção estratégica, pois apresentam margens superiores.",
  },
  {
    title: "14.7 Avaliar vendedores por rentabilidade",
    body:
      "A empresa deve criar rankings comerciais que considerem receita, lucro, margem, desconto médio, taxa de meta e vendas com prejuízo. Isso evita premiar apenas o volume de faturamento.",
  },
];

type DiscountBandMetric = {
  name: string;
  avgProfit: number;
  avgMargin: number;
  sales: number;
};

type SellerDiagnostic = {
  seller: DimensionMetric;
  score: number;
  priority: "Alta" | "Media" | "Baixa";
  issues: string[];
  strengths: string[];
};

function formatPp(value: number, digits = 1) {
  return `${formatDecimal(Math.abs(value) * 100, digits)} p.p.`;
}

function gapLabel(value: number) {
  const gap = Math.abs(value);
  if (gap < 0.01) return "muito pequena";
  if (gap < 0.03) return "leve";
  if (gap < 0.06) return "moderada";
  return "relevante";
}

function correlationLabel(value: number) {
  const abs = Math.abs(value);
  if (abs < 0.15) return "fraca";
  if (abs < 0.35) return "moderada";
  return "forte";
}

function rankOf(items: DimensionMetric[], name: string) {
  const index = items.findIndex((item) => item.name === name);
  return index >= 0 ? index + 1 : null;
}

function buildOverviewInsight(summary: KpiSummary) {
  return `No recorte atual, a empresa soma ${formatCompactBRL(summary.revenue)} de receita, ${formatCompactBRL(summary.profit)} de lucro e margem de ${formatPercent(summary.margin)}. O ponto mais claro nao e falta de faturamento, e sim consistencia: ${formatPercent(summary.goalHitRate)} das vendas bateram meta individual e ${formatPercent(summary.delayRate)} ficaram atrasadas. A leitura recomenda ajustar meta, margem e atraso em conjunto, sem concluir causa operacional direta sem uma base de custos logisticos.`;
}

function buildRegionInsight(regions: DimensionMetric[]) {
  if (!regions.length) return "Sem dados regionais para o filtro atual.";
  const revenueLeader = [...regions].sort((a, b) => b.revenue - a.revenue)[0];
  const bestMargin = [...regions].sort((a, b) => b.margin - a.margin)[0];
  const worstMargin = [...regions].sort((a, b) => a.margin - b.margin)[0];
  const marginGap = bestMargin.margin - worstMargin.margin;

  return `${revenueLeader.name} lidera a receita no recorte (${formatCompactBRL(revenueLeader.revenue)}). Em margem, ${bestMargin.name} aparece melhor (${formatPercent(bestMargin.margin)}) e ${worstMargin.name} fica no menor ponto (${formatPercent(worstMargin.margin)}), uma diferenca ${gapLabel(marginGap)} de ${formatPp(marginGap)}. A conclusao correta e investigar preco, mix e desconto nas regioes de menor margem, nao assumir uma reestruturacao ampla sem evidencias adicionais.`;
}

function buildProductInsight(productsByProfit: DimensionMetric[], productsByMargin: DimensionMetric[], categoriesByProfit: DimensionMetric[]) {
  if (!productsByProfit.length || !productsByMargin.length || !categoriesByProfit.length) return "Sem dados de produto para o filtro atual.";
  const profitLeader = productsByProfit[0];
  const marginLeader = productsByMargin[0];
  const categoryLeader = categoriesByProfit[0];
  const sameProduct = profitLeader.name === marginLeader.name;

  return `${profitLeader.name} lidera o lucro total (${formatCompactBRL(profitLeader.profit)}) e ${categoryLeader.name} e a categoria com maior contribuicao financeira. ${sameProduct ? "O mesmo produto tambem lidera margem, reforcando prioridade comercial." : `${marginLeader.name} tem a maior margem (${formatPercent(marginLeader.margin)}), mostrando que lucro absoluto e eficiencia percentual nao sao a mesma coisa.`} A decisao deve combinar lucro, margem e volume antes de alterar campanhas ou estoque.`;
}

function buildChannelInsight(online?: DimensionMetric, store?: DimensionMetric) {
  if (!online || !store) return "Sem comparacao completa entre Online e Loja para o filtro atual.";
  const revenueLeader = online.revenue >= store.revenue ? online : store;
  const profitLeader = online.profit >= store.profit ? online : store;
  const marginLeader = online.margin >= store.margin ? online : store;
  const delayLeader = online.delayRate <= store.delayRate ? online : store;
  const marginGap = online.margin - store.margin;
  const delayGap = online.delayRate - store.delayRate;

  return `${revenueLeader.name} lidera receita e ${profitLeader.name} lidera lucro no recorte. A diferenca de margem entre Online e Loja e ${gapLabel(marginGap)} (${formatPp(marginGap)}), enquanto a diferenca de atraso e ${gapLabel(delayGap)} (${formatPp(delayGap)}). Assim, ${marginLeader.name} pode ser tratado como referencia de eficiencia percentual e ${delayLeader.name} como melhor referencia operacional, mas a recomendacao deve preservar a distincao entre escala e margem.`;
}

function buildSellerInsight(sellersByProfit: DimensionMetric[], sellersByRevenue: DimensionMetric[], sellersByTarget: DimensionMetric[]) {
  if (!sellersByProfit.length) return "Sem dados de vendedores para o filtro atual.";
  const profitLeader = sellersByProfit[0];
  const revenueLeader = sellersByRevenue[0] ?? profitLeader;
  const targetLeader = sellersByTarget[0] ?? profitLeader;

  return `${profitLeader.name} lidera lucro (${formatCompactBRL(profitLeader.profit)}), ${revenueLeader.name} lidera receita (${formatCompactBRL(revenueLeader.revenue)}) e ${targetLeader.name} lidera cumprimento de meta (${formatPercent(targetLeader.targetCompletion)}). Como os lideres podem mudar conforme a metrica, a avaliacao comercial deve separar conversa de volume, rentabilidade, desconto e meta. O painel de one-on-one abaixo prioriza vendedores por gargalos relativos ao time no filtro atual.`;
}

function buildClientInsight(clientTypesByRevenue: DimensionMetric[], clientTypesByProfit: DimensionMetric[]) {
  if (!clientTypesByRevenue.length || !clientTypesByProfit.length) return "Sem dados de tipo de cliente para o filtro atual.";
  const revenueLeader = clientTypesByRevenue[0];
  const profitLeader = clientTypesByProfit[0];
  const bestMargin = [...clientTypesByProfit].sort((a, b) => b.margin - a.margin)[0];
  const marginGap = bestMargin.margin - revenueLeader.margin;

  return `${revenueLeader.name} lidera receita (${formatCompactBRL(revenueLeader.revenue)}) e ${profitLeader.name} lidera lucro (${formatCompactBRL(profitLeader.profit)}). ${bestMargin.name} tem a melhor margem (${formatPercent(bestMargin.margin)}), com diferenca ${gapLabel(marginGap)} de ${formatPp(marginGap)} frente ao lider de receita. A leitura correta e equilibrar retencao e aquisicao, sem afirmar que um perfil e muito superior quando a margem estiver proxima.`;
}

function buildDiscountInsight(summary: KpiSummary, correlation: number, bands: DiscountBandMetric[]) {
  const highBand = bands.find((band) => band.name === "Mais de 20%");
  const lowBand = bands.find((band) => band.name === "0.1% a 5%") ?? bands.find((band) => band.name === "Sem Desconto");
  const marginGap = lowBand && highBand ? lowBand.avgMargin / 100 - highBand.avgMargin / 100 : 0;

  return `A correlacao desconto x margem e ${formatDecimal(correlation, 2)} (${correlationLabel(correlation)}). O desconto medio do recorte e ${formatPercent(summary.averageDiscount)} e ha ${formatNumber(summary.negativeProfitSales)} vendas com lucro negativo. ${lowBand && highBand ? `Entre ${lowBand.name} e ${highBand.name}, a diferenca de margem media e ${gapLabel(marginGap)} (${formatPp(marginGap)}).` : "As faixas devem ser lidas junto com volume de vendas."} Isso aponta necessidade de regra de aprovacao, mas sem exagerar: desconto maior reduz margem quando nao vem compensado por mix, preco ou volume rentavel.`;
}

function buildDeliveryInsight(delivery: DimensionMetric[]) {
  if (!delivery.length) return "Sem dados logisticos para o filtro atual.";
  const delayed = delivery.find((item) => item.name.toLowerCase().includes("atras"));
  const onTime = delivery.find((item) => !item.name.toLowerCase().includes("atras"));
  if (!delayed || !onTime) return "A leitura de atraso precisa de pelo menos dois status de entrega no filtro atual.";
  const marginGap = onTime.margin - delayed.margin;
  const targetGap = onTime.targetCompletion - delayed.targetCompletion;

  return `Entregas atrasadas mostram margem de ${formatPercent(delayed.margin)} contra ${formatPercent(onTime.margin)} nas entregas no prazo, diferenca ${gapLabel(marginGap)} de ${formatPp(marginGap)}. Em cumprimento de meta, a diferenca e ${gapLabel(targetGap)} (${formatPp(targetGap)}). Isso sustenta tratar atraso como indicador de acompanhamento; nao sustenta afirmar sozinho que devolucoes ou custos logisticos reduzem margem sem uma tabela especifica de custos operacionais.`;
}

function buildBrandInsight(brands: DimensionMetric[], productLines: DimensionMetric[], summary: KpiSummary) {
  if (!brands.length || !productLines.length) return "Sem dados de marca ou linha para o filtro atual.";
  const brandLeader = brands[0];
  const lineLeader = productLines[0];
  const brandShare = summary.profit ? brandLeader.profit / summary.profit : 0;
  const lineShare = summary.profit ? lineLeader.profit / summary.profit : 0;

  return `${brandLeader.name} lidera lucro por marca (${formatCompactBRL(brandLeader.profit)}, ${formatPercent(brandShare)} do lucro do recorte) e ${lineLeader.name} lidera por linha (${formatCompactBRL(lineLeader.profit)}, ${formatPercent(lineShare)}). A concentracao existe se a participacao for alta, mas a acao correta e proteger os itens rentaveis e revisar os de baixa margem antes de reduzir espaco comercial.`;
}

function buildSellerDiagnostics(sellers: DimensionMetric[], team: KpiSummary): SellerDiagnostic[] {
  if (!sellers.length) return [];
  const avgProfitPerSeller = team.profit / sellers.length;

  return sellers
    .map((seller) => {
      const issues: string[] = [];
      const strengths: string[] = [];
      let score = 0;

      if (seller.margin + 0.02 < team.margin) {
        score += 2;
        issues.push(`Margem de ${formatPercent(seller.margin)} fica ${formatPp(team.margin - seller.margin)} abaixo da media do recorte (${formatPercent(team.margin)}). Revisar mix vendido, preco e excecoes de desconto.`);
      }
      if (seller.averageDiscount > team.averageDiscount + 0.01) {
        score += 1;
        issues.push(`Desconto medio de ${formatPercent(seller.averageDiscount)} esta acima da media (${formatPercent(team.averageDiscount)}). Validar justificativas comerciais e limites de aprovacao.`);
      }
      if (seller.targetCompletion + 0.03 < team.targetCompletion) {
        score += 2;
        issues.push(`Cumprimento de meta de ${formatPercent(seller.targetCompletion)} abaixo do recorte (${formatPercent(team.targetCompletion)}). Quebrar pipeline por produto, canal e tamanho de venda.`);
      }
      if (seller.delayRate > team.delayRate + 0.05) {
        score += 1;
        issues.push(`Taxa de atraso de ${formatPercent(seller.delayRate)} acima do recorte (${formatPercent(team.delayRate)}). Checar promessa de prazo, regiao e canal das vendas.`);
      }
      if (seller.negativeProfitSales > 0) {
        score += Math.min(3, seller.negativeProfitSales);
        issues.push(`${formatNumber(seller.negativeProfitSales)} vendas com lucro negativo. Rever casos antes da proxima rodada de metas.`);
      }

      if (seller.margin >= team.margin + 0.02) {
        strengths.push(`Margem ${formatPp(seller.margin - team.margin)} acima da media do recorte.`);
      }
      if (seller.profit >= avgProfitPerSeller) {
        strengths.push(`Lucro acima da media por vendedor (${formatCompactBRL(avgProfitPerSeller)}).`);
      }
      if (seller.targetCompletion >= team.targetCompletion + 0.03) {
        strengths.push("Cumprimento de meta acima da media do recorte.");
      }
      if (!strengths.length) {
        strengths.push("Sem destaque positivo claro no recorte; procurar boas praticas qualitativas na conversa.");
      }
      if (!issues.length) {
        issues.push("Sem gargalo quantitativo evidente. Use o one-on-one para documentar praticas replicaveis e riscos pontuais.");
      }

      const priority: SellerDiagnostic["priority"] = score >= 5 ? "Alta" : score >= 2 ? "Media" : "Baixa";

      return {
        seller,
        score,
        priority,
        issues,
        strengths,
      };
    })
    .sort((a, b) => b.score - a.score || a.seller.profit - b.seller.profit);
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
  const [selectedSeller, setSelectedSeller] = React.useState("");

  // States for P2 Product/Category Rankings
  const [rank1Tab, setRank1Tab] = React.useState<"product" | "category">("product");
  const [rank2Tab, setRank2Tab] = React.useState<"product" | "category">("product");
  const [rank3Tab, setRank3Tab] = React.useState<"product" | "category">("product");

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

  // P3 — Channels
  const channelMetrics = React.useMemo(() => aggregateBy(filteredRows, (row) => row.channel), [filteredRows]);
  const channelsByRevenue = React.useMemo(() => sortMetrics(channelMetrics, "revenue"), [channelMetrics]);
  const channelsByDelay = React.useMemo(() => sortMetrics(channelMetrics, "delayRate"), [channelMetrics]);
  const onlineMetric = React.useMemo(() => channelMetrics.find((m) => m.name.toLowerCase() === "online"), [channelMetrics]);
  const storeMetric = React.useMemo(() => channelMetrics.find((m) => m.name.toLowerCase() === "loja"), [channelMetrics]);

  // P2 — Products & Categories multidimensional
  const productsByProfit = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.product), "profit"), [filteredRows]);
  const productsByMargin = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.product), "margin"), [filteredRows]);
  const productsByQuantity = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.product), "quantity"), [filteredRows]);

  const categoriesByProfit = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.category), "profit"), [filteredRows]);
  const categoriesByMargin = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.category), "margin"), [filteredRows]);
  const categoriesByQuantity = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.category), "quantity"), [filteredRows]);

  // P4 — Sellers
  const sellerMetrics = React.useMemo(() => aggregateBy(filteredRows, (row) => row.seller), [filteredRows]);
  const sellersByProfit = React.useMemo(() => sortMetrics(sellerMetrics, "profit"), [sellerMetrics]);
  const sellersByRevenue = React.useMemo(() => sortMetrics(sellerMetrics, "revenue"), [sellerMetrics]);
  const sellersByTarget = React.useMemo(() => [...sellerMetrics].sort((a, b) => b.targetCompletion - a.targetCompletion), [sellerMetrics]);

  // P5 — Client type
  const clientTypesByProfit = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.clientType), "profit"), [filteredRows]);
  const clientTypesByRevenue = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.clientType), "revenue"), [filteredRows]);

  // P6 — Discount bands grouping
  const discountBandsData = React.useMemo(() => {
    const bands = [
      { id: "0", label: "Sem Desconto", min: 0, max: 0 },
      { id: "1", label: "0.1% a 5%", min: 0.0001, max: 0.05 },
      { id: "2", label: "5.1% a 10%", min: 0.05001, max: 0.10 },
      { id: "3", label: "10.1% a 20%", min: 0.10001, max: 0.20 },
      { id: "4", label: "Mais de 20%", min: 0.20001, max: 1.0 },
    ];

    return bands.map((band) => {
      const rowsInBand = filteredRows.filter((row) => {
        if (band.min === 0 && band.max === 0) {
          return row.discount === 0;
        }
        return row.discount > band.min && row.discount <= band.max;
      });

      const totalProfitInBand = rowsInBand.reduce((sum, r) => sum + r.profit, 0);
      const totalRevenueInBand = rowsInBand.reduce((sum, r) => sum + r.revenue, 0);
      const count = rowsInBand.length;

      return {
        name: band.label,
        avgProfit: count ? totalProfitInBand / count : 0,
        avgMargin: totalRevenueInBand ? (totalProfitInBand / totalRevenueInBand) * 100 : 0,
        sales: count,
      };
    });
  }, [filteredRows]);

  // Logistical metrics
  const delivery = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.deliveryStatus), "delayRate"), [filteredRows]);
  const regionsByDelay = React.useMemo(() => sortMetrics(regions, "delayRate"), [regions]);
  const negativeProducts = React.useMemo(() => topNegativeProfitGroups(filteredRows, (row) => row.product), [filteredRows]);
  const correlation = React.useMemo(() => pearsonDiscountMargin(filteredRows), [filteredRows]);
  const kpis = React.useMemo(() => buildKpis(summary, baseKpis), [summary, baseKpis]);

  // P8 — Brands and product lines
  const brands = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.brand), "profit"), [filteredRows]);
  const productLines = React.useMemo(() => sortMetrics(aggregateBy(filteredRows, (row) => row.productLine), "profit"), [filteredRows]);

  const sellerDiagnostics = React.useMemo(() => buildSellerDiagnostics(sellerMetrics, summary), [sellerMetrics, summary]);
  const sellerOptions = React.useMemo(
    () => sellerMetrics.map((seller) => ({ value: seller.name, label: seller.name })).sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    [sellerMetrics],
  );
  const defaultSeller = sellerDiagnostics[0]?.seller.name ?? "";

  React.useEffect(() => {
    if (!sellerDiagnostics.length) return;
    if (!sellerDiagnostics.some((diagnostic) => diagnostic.seller.name === selectedSeller)) {
      setSelectedSeller(defaultSeller);
    }
  }, [defaultSeller, selectedSeller, sellerDiagnostics]);

  const currentSellerDiagnostic =
    sellerDiagnostics.find((diagnostic) => diagnostic.seller.name === selectedSeller) ?? sellerDiagnostics[0];
  const currentSeller = currentSellerDiagnostic?.seller;
  const currentSellerRanks = currentSeller
    ? {
        profit: rankOf(sellersByProfit, currentSeller.name),
        revenue: rankOf(sellersByRevenue, currentSeller.name),
        target: rankOf(sellersByTarget, currentSeller.name),
      }
    : null;

  const channelOptions = React.useMemo(
    () => [{ value: "all", label: "Todos os canais" }, ...uniqueValues(salesRows, (row) => row.channel).map((value) => ({ value, label: value }))],
    [],
  );
  const regionOptions = React.useMemo(
    () => [{ value: "all", label: "Todas as regioes" }, ...uniqueValues(salesRows, (row) => row.region).map((value) => ({ value, label: value }))],
    [],
  );

  const products = productsByProfit;
  const categories = categoriesByProfit;

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
          description="Leitura de resultado, eficiencia e volume antes de abrir a analise setorizada por perguntas de negocio."
          badgeColor={BADGE_COLORS["sec-p0"]}
        />

        <InsightCallout text={buildOverviewInsight(summary)} />

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

        <InsightCallout text={buildRegionInsight(regions)} />

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
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{activeRegion ? "Foco no mapa" : "Maior receita"}</p>
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
                  <span className="text-muted-foreground">
                    Vendas <strong className="block text-white">{formatNumber(selectedRegion.sales)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Ticket Médio <strong className="block text-white">{formatCompactBRL(selectedRegion.ticket)}</strong>
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

        <InsightCallout text={buildProductInsight(productsByProfit, productsByMargin, categoriesByProfit)} />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ContextCard
            label="Produto mais vendido"
            title={productsByQuantity[0]?.name ?? "Sem produto"}
            value={productsByQuantity[0] ? formatNumber(productsByQuantity[0].quantity) : "-"}
            helper="Unidades físicas vendidas no período"
            tone="violet"
          />
          <ContextCard
            label="Categoria mais vendida"
            title={categoriesByQuantity[0]?.name ?? "Sem categoria"}
            value={categoriesByQuantity[0] ? formatNumber(categoriesByQuantity[0].quantity) : "-"}
            helper="Unidades físicas vendidas no período"
            tone="violet"
          />
          <ContextCard
            label="Produto maior margem"
            title={productsByMargin[0]?.name ?? "Sem produto"}
            value={productsByMargin[0] ? formatPercent(productsByMargin[0].margin) : "-"}
            helper="Margem de lucro média operacional"
            tone="lime"
          />
          <ContextCard
            label="Categoria maior margem"
            title={categoriesByMargin[0]?.name ?? "Sem categoria"}
            value={categoriesByMargin[0] ? formatPercent(categoriesByMargin[0].margin) : "-"}
            helper="Margem de lucro média operacional"
            tone="lime"
          />
          <ContextCard
            label="Produto maior lucro total"
            title={productsByProfit[0]?.name ?? "Sem produto"}
            value={productsByProfit[0] ? formatCompactBRL(productsByProfit[0].profit) : "-"}
            helper="Contribuição de lucro total acumulado"
            tone="lime"
          />
          <ContextCard
            label="Categoria maior lucro total"
            title={categoriesByProfit[0]?.name ?? "Sem categoria"}
            value={categoriesByProfit[0] ? formatCompactBRL(categoriesByProfit[0].profit) : "-"}
            helper="Contribuição de lucro total acumulado"
            tone="lime"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartShell
            title="Lucro Total"
            description="Ranking por lucro financeiro gerado."
            action={
              <Tabs
                items={rankingTabItems}
                value={rank1Tab}
                onValueChange={(value) => setRank1Tab(value as "product" | "category")}
              />
            }
          >
            <MetricBarList
              items={rank1Tab === "product" ? productsByProfit : categoriesByProfit}
              metric="profit"
              limit={8}
            />
          </ChartShell>

          <ChartShell
            title="Margem de Lucro"
            description="Ranking por margem percentual média."
            action={
              <Tabs
                items={rankingTabItems}
                value={rank2Tab}
                onValueChange={(value) => setRank2Tab(value as "product" | "category")}
              />
            }
          >
            <MetricBarList
              items={rank2Tab === "product" ? productsByMargin : categoriesByMargin}
              metric="margin"
              limit={8}
            />
          </ChartShell>

          <ChartShell
            title="Quantidade Vendida"
            description="Ranking por unidades físicas comercializadas."
            action={
              <Tabs
                items={rankingTabItems}
                value={rank3Tab}
                onValueChange={(value) => setRank3Tab(value as "product" | "category")}
              />
            }
          >
            <MetricBarList
              items={rank3Tab === "product" ? productsByQuantity : categoriesByQuantity}
              metric="quantity"
              limit={8}
            />
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

        <InsightCallout text={buildChannelInsight(onlineMetric, storeMetric)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="glass-panel border-cyan-500/20 bg-cyan-950/10 p-5">
            <Badge variant="violet" className="mb-3">Online (Volume e Execução)</Badge>
            <h4 className="text-lg font-semibold text-white">Canal Líder em Lucro, Receita, Meta e Vendas</h4>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>
                <span>Lucro:</span>
                <p className="text-sm font-semibold text-white">{onlineMetric ? formatCompactBRL(onlineMetric.profit) : "-"}</p>
              </div>
              <div>
                <span>Receita:</span>
                <p className="text-sm font-semibold text-white">{onlineMetric ? formatCompactBRL(onlineMetric.revenue) : "-"}</p>
              </div>
              <div>
                <span>Atingimento Meta:</span>
                <p className="text-sm font-semibold text-lime-signal">{onlineMetric ? formatPercent(onlineMetric.targetCompletion) : "-"}</p>
              </div>
              <div>
                <span>Vendas:</span>
                <p className="text-sm font-semibold text-white">{onlineMetric ? formatNumber(onlineMetric.sales) : "-"}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-panel border-lime-500/20 bg-lime-950/10 p-5">
            <Badge variant="success" className="mb-3">Loja Física (Rentabilidade)</Badge>
            <h4 className="text-lg font-semibold text-white">Canal Líder em Margem de Lucro</h4>
            <div className="mt-4 text-xs text-muted-foreground">
              <span>Margem de Lucro:</span>
              <p className="text-2xl font-bold text-lime-signal mt-1">{storeMetric ? formatPercent(storeMetric.margin) : "-"}</p>
              <p className="mt-3 text-[11px]">
                A operação física preserva a margem por venda reduzindo custos agregados e operando com menor índice de descontos.
              </p>
            </div>
          </Card>
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Eficiência Operacional e Margem por Canal</CardTitle>
            <CardDescription>Visão tabular e comparativa da rentabilidade do Online contra a Loja Física.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem de Lucro</TableHead>
                  <TableHead className="text-right">Cumprimento de Meta</TableHead>
                  <TableHead className="text-right">Taxa de Atraso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelMetrics.map((ch) => (
                  <TableRow key={ch.name}>
                    <TableCell className="font-medium text-white">{ch.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(ch.sales)}</TableCell>
                    <TableCell className="text-right">{formatCompactBRL(ch.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCompactBRL(ch.profit)}</TableCell>
                    <TableCell className="text-right font-semibold text-lime-signal">{formatPercent(ch.margin)}</TableCell>
                    <TableCell className="text-right">{formatPercent(ch.targetCompletion)}</TableCell>
                    <TableCell className="text-right text-red-100">{formatPercent(ch.delayRate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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

        <InsightCallout text={buildSellerInsight(sellersByProfit, sellersByRevenue, sellersByTarget)} />

        <div className="grid gap-3 sm:grid-cols-3">
          <ContextCard
            label="Maior Lucro"
            title={sellersByProfit[0]?.name ?? "Sem dados"}
            value={sellersByProfit[0] ? formatCompactBRL(sellersByProfit[0].profit) : "-"}
            helper={sellersByProfit[0] ? `${formatPercent(sellersByProfit[0].margin)} margem de lucro` : ""}
            tone="lime"
          />
          <ContextCard
            label="Maior Receita"
            title={sellersByRevenue[0]?.name ?? "Sem dados"}
            value={sellersByRevenue[0] ? formatCompactBRL(sellersByRevenue[0].revenue) : "-"}
            helper={sellersByRevenue[0] ? `${formatNumber(sellersByRevenue[0].sales)} transações realizadas` : ""}
            tone="violet"
          />
          <ContextCard
            label="Maior Cumprimento de Meta"
            title={sellersByTarget[0]?.name ?? "Sem dados"}
            value={sellersByTarget[0] ? formatPercent(sellersByTarget[0].targetCompletion) : "-"}
            helper={sellersByTarget[0] ? `Meta: ${formatCompactBRL(sellersByTarget[0].target)}` : ""}
            tone="lime"
          />
        </div>

        {currentSeller ? (
          <Card className="glass-panel">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Analise para one-on-one</CardTitle>
                <CardDescription>
                  Diagnostico por vendedor com base em margem, desconto, meta, atraso e vendas com prejuizo.
                </CardDescription>
              </div>
              <div className="w-full md:w-64">
                <Select
                  label="Vendedor em foco"
                  value={currentSeller.name}
                  options={sellerOptions}
                  onChange={(event) => setSelectedSeller(event.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Prioridade</p>
                  <div className="mt-2">
                    <Badge
                      variant={
                        currentSellerDiagnostic.priority === "Alta"
                          ? "danger"
                          : currentSellerDiagnostic.priority === "Media"
                            ? "warning"
                            : "success"
                      }
                    >
                      {currentSellerDiagnostic.priority}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Lucro</p>
                  <p className="metric-number mt-2 text-lg font-semibold text-white">{formatCompactBRL(currentSeller.profit)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    #{currentSellerRanks?.profit ?? "-"} de {sellersByProfit.length}
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Receita</p>
                  <p className="metric-number mt-2 text-lg font-semibold text-white">{formatCompactBRL(currentSeller.revenue)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    #{currentSellerRanks?.revenue ?? "-"} de {sellersByRevenue.length}
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Meta</p>
                  <p className="metric-number mt-2 text-lg font-semibold text-white">{formatPercent(currentSeller.targetCompletion)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    #{currentSellerRanks?.target ?? "-"} de {sellersByTarget.length}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-red-signal/20 bg-red-signal/12 p-4">
                  <p className="text-sm font-semibold text-red-100">Pontos para melhorar</p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
                    {currentSellerDiagnostic.issues.map((issue) => (
                      <li key={issue} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-signal" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-lime-signal/20 bg-lime-signal/10 p-4">
                  <p className="text-sm font-semibold text-lime-signal">Pontos para preservar</p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
                    {currentSellerDiagnostic.strengths.map((strength) => (
                      <li key={strength} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-signal" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartShell title="Ranking por Lucro Total" description="Todos os vendedores ordenados pelo lucro acumulado.">
            <MetricBarList items={sellersByProfit} metric="profit" limit={sellersByProfit.length} />
          </ChartShell>
          <ChartShell title="Ranking por Receita" description="Todos os vendedores ordenados pelo faturamento bruto.">
            <MetricBarList items={sellersByRevenue} metric="revenue" limit={sellersByRevenue.length} />
          </ChartShell>
          <ChartShell title="Ranking por Cumprimento de Meta" description="Todos os vendedores ordenados pelo cumprimento da meta comercial.">
            <MetricBarList items={sellersByTarget} metric="targetCompletion" limit={sellersByTarget.length} />
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

        <InsightCallout text={buildClientInsight(clientTypesByRevenue, clientTypesByProfit)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <ContextCard
            label="Tipo cliente maior receita"
            title={clientTypesByRevenue[0]?.name ?? "Sem dados"}
            value={clientTypesByRevenue[0] ? formatCompactBRL(clientTypesByRevenue[0].revenue) : "-"}
            helper={clientTypesByRevenue[0] ? `${formatNumber(clientTypesByRevenue[0].sales)} vendas no total` : ""}
            tone="violet"
          />
          <ContextCard
            label="Tipo cliente maior lucro"
            title={clientTypesByProfit[0]?.name ?? "Sem dados"}
            value={clientTypesByProfit[0] ? formatCompactBRL(clientTypesByProfit[0].profit) : "-"}
            helper={clientTypesByProfit[0] ? `${formatPercent(clientTypesByProfit[0].margin)} margem de lucro` : ""}
            tone="lime"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartShell title="Ranking por Receita" description="Tipos de cliente ordenados por faturamento bruto total.">
            <MetricBarList items={clientTypesByRevenue} metric="revenue" limit={4} />
          </ChartShell>
          <ChartShell title="Ranking por Lucro" description="Tipos de cliente ordenados por lucro total acumulado.">
            <MetricBarList items={clientTypesByProfit} metric="profit" limit={4} />
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

        <InsightCallout text={buildDiscountInsight(summary, correlation, discountBandsData)} />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {["averageDiscount", "negativeProfitSales"].map((key) => (
            <KpiCard key={key} {...kpis[key]} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <ChartShell
            title="Faixas de desconto vs Lucratividade"
            description="Lucro Médio (R$, Barra - Esquerda) e Margem Média (%, Linha - Direita) por faixa de desconto."
          >
            <div className="h-[24rem]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={discountBandsData} margin={{ left: 0, right: 18, top: 10, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactBRL}
                    width={70}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${formatDecimal(value, 0)}%`}
                    width={40}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        title={(label) => `Faixa: ${label}`}
                        nameFormatter={(name) => (name === "avgProfit" ? "Lucro Médio" : "Margem Média")}
                        valueFormatter={(value, name) =>
                          name === "avgProfit"
                            ? formatCompactBRL(Number(value))
                            : `${formatDecimal(Number(value), 2)}%`
                        }
                      />
                    }
                  />
                  <Bar yAxisId="left" dataKey="avgProfit" name="avgProfit" fill="#b5e24a" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="avgMargin" name="avgMargin" stroke="#7c5cff" strokeWidth={3} activeDot={{ r: 6 }} />
                </ComposedChart>
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

        <InsightCallout text={buildDeliveryInsight(delivery)} />

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
                <div key={item.name} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{item.name}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vendas:</span>
                      <span className="font-semibold text-white">{formatNumber(item.sales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Receita:</span>
                      <span className="font-semibold text-white">{formatCompactBRL(item.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lucro:</span>
                      <span className={cn("font-semibold", item.profit < 0 ? "text-red-100" : "text-lime-signal")}>
                        {formatCompactBRL(item.profit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Margem:</span>
                      <span className="font-semibold text-white">{formatPercent(item.margin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ating. Meta:</span>
                      <span className="font-semibold text-white">{formatPercent(item.targetCompletion)}</span>
                    </div>
                  </div>
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

        <InsightCallout text={buildBrandInsight(brands, productLines, summary)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <ContextCard
            label="Marca Líder em Lucro"
            title={brands[0]?.name ?? "Sem dados"}
            value={brands[0] ? formatCompactBRL(brands[0].profit) : "-"}
            helper={brands[0] ? `${formatPercent(brands[0].margin)} margem / ${formatNumber(brands[0].sales)} vendas` : ""}
            tone="lime"
          />
          <ContextCard
            label="Linha de Produto Líder em Lucro"
            title={productLines[0]?.name ?? "Sem dados"}
            value={productLines[0] ? formatCompactBRL(productLines[0].profit) : "-"}
            helper={productLines[0] ? `${formatPercent(productLines[0].margin)} margem / ${formatNumber(productLines[0].sales)} vendas` : ""}
            tone="violet"
          />
        </div>

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
            <CardTitle>Plano de ação</CardTitle>
            <CardDescription>Problemas priorizados, evidências, impacto e recomendação executiva.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problema identificado</TableHead>
                  <TableHead>Evidência</TableHead>
                  <TableHead>Impacto</TableHead>
                  <TableHead>Recomendação</TableHead>
                  <TableHead>Prioridade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestedActionPlanRows.map((item, idx) => (
                  <TableRow key={`action-${idx}`}>
                    <TableCell className="font-medium text-white">{item.problema}</TableCell>
                    <TableCell>{item.evidencia}</TableCell>
                    <TableCell>{item.impacto}</TableCell>
                    <TableCell>{item.recomendacao}</TableCell>
                    <TableCell>
                      <Badge variant={item.prioridade === "Alta" ? "danger" : "warning"}>
                        {item.prioridade}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>14. Recomendações Estratégicas Finais</CardTitle>
            <CardDescription>Direcionamentos finais para gestão comercial, margem e operação.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-2">
              {strategicRecommendations.map((item) => (
                <div key={item.title} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
