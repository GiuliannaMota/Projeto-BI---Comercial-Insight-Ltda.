import * as React from "react";
import { ArrowRight, ClipboardCheck, Gauge, Layers3, Map, Mic2, Route } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Tabs } from "../components/ui/tabs";
import { outputTables } from "../data/catalog";
import { decisionRows, presentationStages } from "../data/content";
import { cn } from "../lib/utils";

const stageIcons = [Route, Gauge, ClipboardCheck, Map, Layers3, Mic2];

export function PresentationView() {
  const [activeStageId, setActiveStageId] = React.useState(presentationStages[0].id);
  const activeStage = presentationStages.find((stage) => stage.id === activeStageId) ?? presentationStages[0];
  const activeIndex = presentationStages.findIndex((stage) => stage.id === activeStage.id);
  const ActiveIcon = stageIcons[activeIndex] ?? Route;

  return (
    <div className="space-y-6">
      <header className="grid gap-5 lg:grid-cols-[1fr_28rem] lg:items-end">
        <div>
          <Badge variant="violet">Apresentacao visual</Badge>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Uma jornada de apresentacao das etapas ate os insights finais.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            Roteiro visual para apoiar a fala: contexto, diagnostico, tratamento, analise, modelagem e decisoes recomendadas.
          </p>
        </div>
        <Card className="glass-panel p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Linha narrativa</p>
          <div className="mt-4 space-y-3">
            {presentationStages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageId(stage.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border p-3 text-left transition duration-200 ease-smooth active:translate-y-px",
                  stage.id === activeStage.id
                    ? "border-violet-signal/35 bg-violet-signal/18"
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]",
                )}
              >
                <span className="metric-number text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">{stage.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{stage.step}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </header>

      <div className="glass-panel sticky top-3 z-20 rounded-lg p-3">
        <Tabs
          items={presentationStages.map((stage) => ({ value: stage.id, label: `${stage.step}: ${stage.title}` }))}
          value={activeStage.id}
          onValueChange={setActiveStageId}
          className="w-full"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass-panel overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-lime-signal/25 bg-lime-signal/12 p-3 text-lime-signal">
                <ActiveIcon className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <div>
                <Badge>{activeStage.step}</Badge>
                <CardTitle className="mt-2 text-2xl">{activeStage.title}</CardTitle>
              </div>
            </div>
            <CardDescription>{activeStage.narrative}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {activeStage.evidence.map((item) => (
                <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  <p
                    className={cn(
                      "mt-2 metric-number text-2xl font-semibold",
                      item.tone === "red" ? "text-red-100" : item.tone === "violet" ? "text-violet-100" : "text-lime-signal",
                    )}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-md border border-white/10 bg-slate-950/30 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Pontos de fala</p>
              <ul className="mt-4 space-y-3">
                {activeStage.talkingPoints.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6 text-slate-200">
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-violet-100" strokeWidth={1.7} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Mini visualizacao</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{activeStage.visual}</p>
              </div>
              <div className="rounded-md border border-lime-signal/20 bg-lime-signal/10 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-lime-signal">Fechamento da etapa</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">{activeStage.conclusion}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Mapa de ritmo da apresentacao</CardTitle>
            <CardDescription>Distribuicao sugerida de peso narrativo por etapa.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {presentationStages.map((stage, index) => {
                const weights = [58, 72, 66, 92, 61, 86];
                const active = stage.id === activeStage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className={cn(
                      "w-full rounded-md border p-4 text-left transition duration-200 ease-smooth active:translate-y-px",
                      active ? "border-violet-signal/35 bg-violet-signal/16" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">{stage.step} - {stage.title}</span>
                      <span className="metric-number text-xs text-muted-foreground">{weights[index]}%</span>
                    </div>
                    <Progress value={weights[index]} tone={active ? "violet" : index === 1 || index === 5 ? "lime" : "red"} />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Insights para fechamento</CardTitle>
            <CardDescription>Mensagens executivas extraidas de `insights_executivos.csv`.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {outputTables.insights.slice(0, 6).map((insight, index) => (
                <div key={insight.Insight} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-start gap-3">
                    <span className="metric-number mt-1 text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-medium text-white">{insight.Insight}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight["Interpretação Executiva"]}</p>
                      <p className="mt-2 text-xs text-lime-signal">{insight["Decisão Recomendada"]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Plano em fala executiva</CardTitle>
            <CardDescription>Sequencia curta para transformar analise em decisao.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {decisionRows.map((row) => (
                <div key={row.join("-")} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant={row[3] === "Alta" ? "danger" : "violet"}>{row[3]}</Badge>
                    <span className="text-[11px] text-muted-foreground">{row[0]}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{row[1]}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row[2]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
