import * as React from "react";
import { BarChart3, FileText, Menu, Presentation, Sparkles } from "lucide-react";
import { Button } from "./components/ui/button";
import { Sheet } from "./components/ui/sheet";
import { cn } from "./lib/utils";
import { DashboardView } from "./views/DashboardView";
import { DocumentationView } from "./views/DocumentationView";
import { PresentationView } from "./views/PresentationView";

type ViewId = "dashboard" | "documentacao" | "apresentacao";

const navItems: Array<{ id: ViewId; label: string; helper: string; icon: typeof BarChart3 }> = [
  { id: "dashboard", label: "Dashboard", helper: "KPIs e analises", icon: BarChart3 },
  { id: "documentacao", label: "Documentacao", helper: "Etapas e decisoes", icon: FileText },
  { id: "apresentacao", label: "Apresentacao Visual", helper: "Jornada oral", icon: Presentation },
];

function getHashView(): ViewId {
  const hash = window.location.hash.replace("#", "");
  if (hash === "documentacao" || hash === "apresentacao" || hash === "dashboard") return hash;
  return "dashboard";
}

function Sidebar({ current, onNavigate }: { current: ViewId; onNavigate: (view: ViewId) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-lime-signal/20 bg-lime-signal/12 text-lime-signal">
          <Sparkles className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Comercial Insight</p>
          <p className="text-xs text-muted-foreground">BI executivo 2024</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === current;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-all duration-200 ease-smooth active:translate-y-px",
                active
                  ? "border-violet-signal/35 bg-violet-signal/18 text-white"
                  : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-violet-100" : "text-slate-400")} strokeWidth={1.7} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{item.helper}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-md border border-white/10 bg-white/[0.045] p-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Base</p>
        <p className="mt-2 text-sm text-white">dados_empresa_tratado.csv</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Aplicacao estatica com filtros em memoria.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = React.useState<ViewId>(() => getHashView());
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onHashChange = () => setView(getHashView());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = React.useCallback((nextView: ViewId) => {
    window.location.hash = nextView;
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-[100dvh]">
      <aside className="glass-panel fixed bottom-4 left-4 top-4 hidden w-72 rounded-lg p-4 lg:block">
        <Sidebar current={view} onNavigate={navigate} />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="Navegacao">
        <Sidebar current={view} onNavigate={navigate} />
      </Sheet>

      <main className="lg:pl-80">
        <div className="sticky top-0 z-30 border-b border-white/10 bg-background/72 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Comercial Insight</p>
              <p className="text-xs text-muted-foreground">{navItems.find((item) => item.id === view)?.label}</p>
            </div>
            <Button variant="secondary" size="icon" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {view === "dashboard" ? <DashboardView /> : null}
          {view === "documentacao" ? <DocumentationView /> : null}
          {view === "apresentacao" ? <PresentationView /> : null}
        </div>
      </main>
    </div>
  );
}
