import { X, TrendingUp, AlertTriangle, ShoppingBag, BarChart3, Tag, User, MapPin } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface DetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'region' | 'vendedor' | 'categoria';
  entityName: string;
  metrics: {
    vendas: number;
    receita: number;
    lucro: number;
    margem: number;
    atraso: number;
  };
  // Dados de gráficos específicos passados dinamicamente
  chartData1: any[]; // Ex: Cidades da região, Categorias do vendedor, Regiões da categoria
  chartData2?: any[]; // Ex: Produtos do vendedor, Produtos da categoria
}

const COLORS = ['#0f172a', '#10b981', '#0ea5e9', '#64748b', '#94a3b8'];

function compactMoney(value: number) {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export default function DetailSidebar({ isOpen, onClose, entityType, entityName, metrics, chartData1, chartData2 }: DetailSidebarProps) {
  // Formatações
  const money = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  
  const pct = (val: number) => 
    `${(val * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  const getEntityIcon = () => {
    if (entityType === 'vendedor') return <User className="w-5 h-5 text-primary" />;
    if (entityType === 'categoria') return <Tag className="w-5 h-5 text-primary" />;
    return <MapPin className="w-5 h-5 text-primary" />;
  };

  const getEntityLabel = () => {
    if (entityType === 'vendedor') return 'Vendedor';
    if (entityType === 'categoria') return 'Categoria';
    return 'Região';
  };

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
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center border border-border">
              {getEntityIcon()}
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Detalhamento por {getEntityLabel()}
              </span>
              <h3 className="text-base font-bold text-foreground capitalize">{entityName}</h3>
            </div>
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
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Receita Bruta</span>
              <strong className="text-base font-bold text-foreground block mt-1">{money(metrics.receita)}</strong>
            </div>
            
            <div className="border border-border p-3 rounded-md bg-slate-50/60">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Volume Vendas</span>
              <strong className="text-base font-bold text-foreground block mt-1">{metrics.vendas} vendas</strong>
            </div>

            <div className="border border-border p-3 rounded-md bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Lucro Líquido</span>
                <strong className="text-base font-bold text-foreground block mt-1">{money(metrics.lucro)}</strong>
              </div>
              <span className="text-[10px] mt-1.5 flex items-center gap-1 text-success font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                {pct(metrics.margem)} margem
              </span>
            </div>

            <div className="border border-border p-3 rounded-md bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Taxa de Atraso</span>
                <strong className="text-base font-bold text-foreground block mt-1">
                  {Math.round(metrics.vendas * metrics.atraso)} atrasos
                </strong>
              </div>
              <span className={`text-[10px] mt-1.5 flex items-center gap-1 font-semibold ${
                metrics.atraso > 0.4 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {pct(metrics.atraso)} atrasos
              </span>
            </div>
          </div>

          {/* Gráfico Dinâmico 1 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {entityType === 'region' && 'Vendas por Cidade'}
                {entityType === 'vendedor' && 'Faturamento por Categoria'}
                {entityType === 'categoria' && 'Distribuição por Região'}
              </h4>
            </div>

            {chartData1.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Sem dados analíticos para exibir.</p>
            ) : (
              <div className="w-full bg-slate-50 border border-border/80 p-2 rounded-md">
                {entityType === 'categoria' ? (
                  // Pizza/Donut para categoria por região
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={chartData1}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="receita"
                          nameKey="name"
                        >
                          {chartData1.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            background: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '11px'
                          }}
                          formatter={(value: any) => [money(value), 'Faturamento']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground px-2 mt-2">
                      {chartData1.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="truncate text-foreground font-medium">{item.name}</span>
                          </div>
                          <span>{compactMoney(item.receita)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Gráfico de barras horizontal padrão para Região e Vendedor
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={chartData1}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                      <YAxis 
                        dataKey={entityType === 'region' ? 'cidade' : 'name'} 
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
                          fontSize: '11px'
                        }}
                        formatter={(value: any, name: any) => {
                          if (name === 'vendas') return [`${value} vendas`, 'Volume'];
                          if (name === 'receita') return [money(value), 'Faturamento'];
                          return [value, name];
                        }}
                      />
                      <Bar 
                        dataKey={entityType === 'region' ? 'vendas' : 'receita'} 
                        name={entityType === 'region' ? 'vendas' : 'receita'}
                        fill="var(--color-primary)" 
                        radius={[0, 4, 4, 0]} 
                        barSize={14} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>

          {/* Gráfico Dinâmico 2 (Produtos vendidos) - Apenas para Vendedores e Categorias */}
          {chartData2 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Top Produtos Vendidos (Faturamento)
                </h4>
              </div>

              {chartData2.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Sem dados de produtos para exibir.</p>
              ) : (
                <div className="w-full bg-slate-50 border border-border/80 p-2 rounded-md">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={chartData2}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                      <YAxis 
                        dataKey="name" 
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
                          fontSize: '11px'
                        }}
                        formatter={(value: any) => [money(value), 'Faturamento']}
                      />
                      <Bar 
                        dataKey="receita" 
                        fill="var(--color-success)" 
                        radius={[0, 4, 4, 0]} 
                        barSize={14} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Listagem em Tabela/Ranking da Entidade */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Tabela de Desempenho</h4>
            <div className="border border-border rounded-md overflow-hidden bg-card text-xs">
              <div className="grid grid-cols-3 bg-slate-50 p-2.5 font-semibold text-muted-foreground border-b border-border">
                <span>
                  {entityType === 'region' && 'Cidade'}
                  {entityType === 'vendedor' && 'Categoria'}
                  {entityType === 'categoria' && 'Região'}
                </span>
                <span className="text-right">Vendas</span>
                <span className="text-right">Receita</span>
              </div>
              <div className="divide-y divide-border">
                {chartData1.slice(0, 8).map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-3 p-2.5 hover:bg-slate-50 transition-colors">
                    <span className="font-medium text-foreground capitalize truncate">
                      {item.cidade || item.name}
                    </span>
                    <span className="text-right text-muted-foreground">
                      {item.vendas}
                    </span>
                    <span className="text-right font-medium text-foreground">
                      {money(item.receita)}
                    </span>
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
            Dados cruzados da Comercial Insight
          </span>
        </div>
      </aside>
    </>
  );
}
