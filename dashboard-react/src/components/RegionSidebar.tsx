import { X, TrendingUp, AlertTriangle, ShoppingBag, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface CityStat {
  cidade: string;
  vendas: number;
  receita: number;
}

interface RegionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string;
  metrics: {
    vendas: number;
    receita: number;
    lucro: number;
    margem: number;
    atraso: number;
  };
  cityStats: CityStat[];
}

export default function RegionSidebar({ isOpen, onClose, regionName, metrics, cityStats }: RegionSidebarProps) {
  // Formatações
  const money = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  
  const pct = (val: number) => 
    `${(val * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Painel Deslizante Lateral */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Detalhamento Geográfico</span>
            <h3 className="text-base font-bold text-foreground">Região {regionName}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Grid de KPIs Rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border p-3 rounded-md bg-slate-50/60">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Receita Total</span>
              <strong className="text-base font-bold text-foreground block mt-1">{money(metrics.receita)}</strong>
            </div>
            
            <div className="border border-border p-3 rounded-md bg-slate-50/60">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Volume Vendas</span>
              <strong className="text-base font-bold text-foreground block mt-1">{metrics.vendas} vendas</strong>
            </div>

            <div className="border border-border p-3 rounded-md bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Lucro & Margem</span>
                <strong className="text-base font-bold text-foreground block mt-1">{money(metrics.lucro)}</strong>
              </div>
              <span className="text-[10px] mt-1.5 flex items-center gap-1 text-success font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                {pct(metrics.margem)} margem
              </span>
            </div>

            <div className="border border-border p-3 rounded-md bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Entregas Atrasadas</span>
                <strong className="text-base font-bold text-foreground block mt-1">
                  {Math.round(metrics.vendas * metrics.atraso)} atrasos
                </strong>
              </div>
              <span className={`text-[10px] mt-1.5 flex items-center gap-1 font-semibold ${
                metrics.atraso > 0.1 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {pct(metrics.atraso)} atrasos
              </span>
            </div>
          </div>

          {/* Gráfico de Cidades */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Vendas por Cidade</h4>
            </div>

            {cityStats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma cidade identificada nesta região.</p>
            ) : (
              <div className="w-full bg-slate-50 border border-border/80 p-2 rounded-md">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    layout="vertical"
                    data={cityStats}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                    <YAxis 
                      dataKey="cidade" 
                      type="category" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      width={80} 
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '11px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                      formatter={(value: any, name: any, props: any) => {
                        if (name === 'vendas') return [`${value} vendas`, 'Volume'];
                        if (name === 'receita') return [money(value), 'Faturamento'];
                        return [value, name];
                      }}
                    />
                    <Bar 
                      dataKey="vendas" 
                      name="vendas" 
                      fill="var(--color-primary)" 
                      radius={[0, 4, 4, 0]} 
                      barSize={14} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Listagem de Ranking de Cidades */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Ranking Detalhado</h4>
            <div className="border border-border rounded-md overflow-hidden bg-card text-xs">
              <div className="grid grid-cols-3 bg-slate-50 p-2.5 font-semibold text-muted-foreground border-b border-border">
                <span>Cidade</span>
                <span className="text-right">Vendas</span>
                <span className="text-right">Receita</span>
              </div>
              <div className="divide-y divide-border">
                {cityStats.map((city) => (
                  <div key={city.cidade} className="grid grid-cols-3 p-2.5 hover:bg-slate-50 transition-colors">
                    <span className="font-medium text-foreground capitalize">{city.cidade}</span>
                    <span className="text-right text-muted-foreground">{city.vendas}</span>
                    <span className="text-right font-medium text-foreground">{money(city.receita)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
            Dados filtrados por canal e período
          </span>
        </div>
      </aside>
    </>
  );
}
