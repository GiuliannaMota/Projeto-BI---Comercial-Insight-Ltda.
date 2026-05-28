import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Info, Lightbulb, BookOpen, BarChart3 } from "lucide-react";
import { Card } from "../ui/card";
import { cn } from "../../lib/utils";

export interface KpiReading {
  sobre: string;
  comoAnalisar: string;
  insight: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "lime" | "violet" | "red" | "neutral";
  delta?: number;
  deltaPolarity?: "positive" | "negative";
  reading?: KpiReading;
}

const toneClasses = {
  lime: "text-lime-signal bg-lime-signal/10 border-lime-signal/20",
  violet: "text-violet-100 bg-violet-signal/15 border-violet-signal/25",
  red: "text-red-100 bg-red-signal/12 border-red-signal/25",
  neutral: "text-slate-200 bg-white/[0.06] border-white/10",
};

const glowClasses = {
  lime: "hover-glow-lime",
  violet: "hover-glow-violet",
  red: "hover-glow-red",
  neutral: "hover-glow-neutral",
};

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
  delta,
  deltaPolarity = "positive",
  reading,
}: KpiCardProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const DeltaIcon = (delta ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight;
  const deltaIsGood = typeof delta === "number" ? (deltaPolarity === "negative" ? delta <= 0 : delta >= 0) : true;

  React.useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  return (
    <Card className={cn("group relative flex h-full flex-col overflow-visible p-4 hover-lift", glowClasses[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-md border p-2.5", toneClasses[tone])}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="flex items-center gap-2">
          {typeof delta === "number" ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded border px-1.5 py-1 text-[11px] font-medium metric-number",
                deltaIsGood ? "border-lime-signal/20 text-lime-signal" : "border-red-signal/25 text-red-100",
              )}
            >
              <DeltaIcon className="h-3 w-3" />
              {Math.abs(delta * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            </span>
          ) : null}
          {reading ? (
            <button
              ref={triggerRef}
              type="button"
              aria-label="Ver leitura do KPI"
              aria-expanded={popoverOpen}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200",
                popoverOpen
                  ? "border-lime-signal/30 bg-lime-signal/15 text-lime-signal"
                  : "border-white/10 bg-white/[0.045] text-muted-foreground hover:border-white/20 hover:bg-white/[0.09] hover:text-slate-200",
              )}
              onClick={() => setPopoverOpen((c) => !c)}
            >
              <Info className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className={cn("metric-number text-2xl font-semibold tracking-tight", tone === "red" ? "text-red-100" : "text-white")}>
          {value}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{helper}</p>
      </div>

      {reading && popoverOpen ? (
        <div ref={popoverRef} className="kpi-popover p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/[0.06]">
              <BookOpen className="h-3 w-3 text-slate-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sobre</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{reading.sobre}</p>
            </div>
          </div>

          <div className="border-t border-white/[0.08]" />

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-signal/12">
              <BarChart3 className="h-3 w-3 text-violet-100" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-100">Como ler</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{reading.comoAnalisar}</p>
            </div>
          </div>

          <div className="border-t border-white/[0.08]" />

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-lime-signal/12">
              <Lightbulb className="h-3 w-3 text-lime-signal" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-signal">Tip</p>
              <p className="mt-1 text-xs leading-relaxed text-lime-signal/90">{reading.insight}</p>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
