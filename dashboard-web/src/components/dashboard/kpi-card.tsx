import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "../ui/card";
import { cn } from "../../lib/utils";
import { ReadingIconButton, ReadingPopover, type ReadingContent } from "./reading-disclosure";

export type KpiReading = ReadingContent;

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
  const [readingOpen, setReadingOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const DeltaIcon = (delta ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight;
  const deltaIsGood = typeof delta === "number" ? (deltaPolarity === "negative" ? delta <= 0 : delta >= 0) : true;

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-visible p-4 hover-lift",
        glowClasses[tone],
        readingOpen && "z-30",
      )}
    >
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
            <ReadingIconButton
              ref={triggerRef}
              open={readingOpen}
              ariaLabel="Ver leitura do KPI"
              className="h-7 w-7"
              onClick={() => setReadingOpen((current) => !current)}
            />
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

      {reading && readingOpen ? (
        <ReadingPopover
          anchorRef={triggerRef}
          open={readingOpen}
          reading={reading}
          onClose={() => setReadingOpen(false)}
        />
      ) : null}
    </Card>
  );
}
