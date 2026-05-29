import * as React from "react";
import type { PeriodFilter, SaleRow } from "../../data/types";
import { dailyMetrics } from "../../lib/analytics";
import { formatCompactBRL, formatNumber, formatPercent } from "../../lib/format";
import { Tabs } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import { ReadingIconButton, ReadingPanel } from "../dashboard/reading-disclosure";

interface GithubSalesCalendarProps {
  rows: SaleRow[];
  year?: number;
}

const quarterTabs: Array<{ value: PeriodFilter; label: string }> = [
  { value: "all", label: "Ano" },
  { value: "q1", label: "T1" },
  { value: "q2", label: "T2" },
  { value: "q3", label: "T3" },
  { value: "q4", label: "T4" },
];

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  return copy;
}

function endOfWeek(date: Date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() + (6 - day));
  return copy;
}

function iso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function inQuarter(date: Date, view: PeriodFilter) {
  if (view === "all") return true;
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return view === `q${quarter}`;
}

export function GithubSalesCalendar({ rows, year = 2024 }: GithubSalesCalendarProps) {
  const [view, setView] = React.useState<PeriodFilter>("all");
  const [readingOpen, setReadingOpen] = React.useState(false);
  const calendarRef = React.useRef<HTMLDivElement | null>(null);
  const [hoveredDay, setHoveredDay] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    dateLabel: string;
    sales: number;
    revenue: number;
    profit: number;
    margin: number;
  } | null>(null);
  const metrics = React.useMemo(() => dailyMetrics(rows), [rows]);
  const map = React.useMemo(() => new Map(metrics.map((item) => [item.dateIso, item])), [metrics]);
  const maxRevenue = Math.max(...metrics.map((item) => item.revenue), 1);
  const formatter = React.useMemo(() => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }), []);
  const fullFormatter = React.useMemo(() => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), []);

  const days = React.useMemo(() => {
    const start = startOfWeek(new Date(year, 0, 1));
    const end = endOfWeek(new Date(year, 11, 31));
    const result: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [year]);

  const weeks = Math.ceil(days.length / 7);
  const tooltipStyle = hoveredDay
    ? {
        left: Math.max(8, Math.min(hoveredDay.x + 16, hoveredDay.width - 252)),
        top: Math.max(8, Math.min(hoveredDay.y + 16, hoveredDay.height - 174)),
      }
    : undefined;

  function updateHover(event: React.MouseEvent<HTMLSpanElement>, date: Date, item: ReturnType<typeof dailyMetrics>[number] | undefined) {
    const bounds = calendarRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setHoveredDay({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      width: bounds.width,
      height: bounds.height,
      dateLabel: fullFormatter.format(date),
      sales: item?.sales ?? 0,
      revenue: item?.revenue ?? 0,
      profit: item?.profit ?? 0,
      margin: item?.margin ?? 0,
    });
  }

  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Calendario anual de vendas</CardTitle>
          <CardDescription>Intensidade por receita diaria em 2024, respeitando os filtros globais.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tabs items={quarterTabs} value={view} onValueChange={(value) => setView(value as PeriodFilter)} />
          <ReadingIconButton
            open={readingOpen}
            ariaLabel="Ver leitura do calendario de vendas"
            onClick={() => setReadingOpen((current) => !current)}
          />
        </div>
      </CardHeader>
      {readingOpen ? (
        <div className="px-5 pb-3">
          <ReadingPanel
            reading={{
              sobre: "Cada quadrado representa um dia do ano. A cor fica mais intensa quando a receita diaria e maior dentro do recorte filtrado.",
              comoAnalisar: "Use os trimestres para procurar concentracao de vendas, dias sem movimento e picos que podem distorcer a leitura mensal.",
              insight: "Picos isolados ajudam a explicar variacao de receita, mas nao comprovam melhora operacional sem cruzar lucro, margem e meta.",
            }}
          />
        </div>
      ) : null}
      <CardContent>
        <ScrollArea className="pb-2">
          <div ref={calendarRef} className="relative min-w-[760px]" onMouseLeave={() => setHoveredDay(null)}>
            <div className="mb-2 grid grid-cols-[2.5rem_1fr] gap-3 text-[11px] text-muted-foreground">
              <div />
              <div className="grid grid-cols-12">
                {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[2.5rem_1fr] gap-3">
              <div className="grid grid-rows-7 gap-1 text-[11px] text-muted-foreground">
                <span>Seg</span>
                <span />
                <span>Qua</span>
                <span />
                <span>Sex</span>
                <span />
                <span>Dom</span>
              </div>
              <div
                className="grid grid-flow-col grid-rows-7 gap-1"
                style={{ gridTemplateColumns: `repeat(${weeks}, minmax(10px, 1fr))` }}
              >
                {days.map((date) => {
                  const dateIso = iso(date);
                  const item = map.get(dateIso);
                  const currentYear = date.getFullYear() === year;
                  const activeQuarter = inQuarter(date, view);
                  const ratio = item ? item.revenue / maxRevenue : 0;
                  const level = ratio === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;

                  return (
                    <span
                      key={dateIso}
                      className={cn(
                        "h-3 rounded-sm border border-white/[0.04] transition duration-150 hover:scale-125 hover:border-white/40",
                        !currentYear || !activeQuarter
                          ? "bg-white/[0.025] opacity-25"
                          : level === 0
                            ? "bg-white/[0.045]"
                            : level === 1
                              ? "bg-lime-signal/25"
                              : level === 2
                                ? "bg-lime-signal/45"
                                : level === 3
                                  ? "bg-lime-signal/70"
                                  : "bg-lime-signal",
                      )}
                      aria-label={`${formatter.format(date)}: ${item ? `${formatCompactBRL(item.revenue)} em ${formatNumber(item.sales)} vendas` : "sem venda"}`}
                      onMouseEnter={(event) => updateHover(event, date, item)}
                      onMouseMove={(event) => updateHover(event, date, item)}
                    />
                  );
                })}
              </div>
            </div>
            {hoveredDay ? (
              <div
                className="pointer-events-none absolute z-20 w-[15rem] rounded-md border border-white/14 bg-[#080c14] px-3.5 py-3 text-xs text-white shadow-2xl"
                style={tooltipStyle}
              >
                <div className="border-b border-white/10 pb-2">
                  <p className="text-[11px] text-slate-400">Dia</p>
                  <p className="mt-1 font-semibold text-white">{hoveredDay.dateLabel}</p>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <span className="text-slate-300">Receita</span>
                    <span className="metric-number text-right font-semibold text-violet-100">{formatCompactBRL(hoveredDay.revenue)}</span>
                  </div>
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <span className="text-slate-300">Vendas</span>
                    <span className="metric-number text-right font-semibold text-white">{formatNumber(hoveredDay.sales)}</span>
                  </div>
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <span className="text-slate-300">Lucro</span>
                    <span className={cn("metric-number text-right font-semibold", hoveredDay.profit < 0 ? "text-red-100" : "text-lime-signal")}>
                      {formatCompactBRL(hoveredDay.profit)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <span className="text-slate-300">Margem</span>
                    <span className={cn("metric-number text-right font-semibold", hoveredDay.margin < 0 ? "text-red-100" : "text-white")}>
                      {formatPercent(hoveredDay.margin)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
              <span>Menos</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={cn(
                    "h-3 w-3 rounded-sm border border-white/[0.04]",
                    level === 0
                      ? "bg-white/[0.045]"
                      : level === 1
                        ? "bg-lime-signal/25"
                        : level === 2
                          ? "bg-lime-signal/45"
                          : level === 3
                            ? "bg-lime-signal/70"
                            : "bg-lime-signal",
                  )}
                />
              ))}
              <span>Mais</span>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
