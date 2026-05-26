import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Calendar } from 'lucide-react';

interface TimelinePoint {
  name: string; // Dia, mês ou trimestre
  sales: number;
  revenue: number;
}

interface SalesEvolutionChartProps {
  data: TimelinePoint[];
  period: string;
}

export default function SalesEvolutionChart({ data, period }: SalesEvolutionChartProps) {
  const money = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Evolução Histórica das Vendas</h4>
            <p className="text-[10px] text-muted-foreground">Faturamento bruto contra volume acumulado</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          {period === 'all' ? 'Anual' : period.startsWith('T') ? 'Trimestral' : 'Mensal'}
        </span>
      </div>

      <div className="h-[240px] bg-slate-50 border border-border/80 p-2 rounded-md">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Sem dados disponíveis para o período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorSalesVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false} 
                dy={6}
              />
              
              {/* Eixo Y Esquerdo - Faturamento */}
              <YAxis 
                yAxisId="left"
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              />
              
              {/* Eixo Y Direito - Volume de Vendas */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
                tickFormatter={(val) => `${val} un`}
              />

              <Tooltip 
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '11px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'revenue') return [money(value), 'Faturamento'];
                  if (name === 'sales') return [`${value} vendas`, 'Volume'];
                  return [value, name];
                }}
              />
              
              <Legend 
                verticalAlign="top" 
                height={32}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px' }}
                formatter={(value) => {
                  if (value === 'revenue') return <span className="text-muted-foreground font-semibold text-[10px]">Faturamento (R$)</span>;
                  if (value === 'sales') return <span className="text-muted-foreground font-semibold text-[10px]">Volume (Vendas)</span>;
                  return value;
                }}
              />

              {/* Volume como Área sombreada */}
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="sales" 
                fill="url(#colorSalesVal)"
                stroke="rgba(15, 23, 42, 0.2)"
                strokeWidth={1}
                activeDot={{ r: 4 }}
              />

              {/* Receita como Linha principal */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-success)" // Verde
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
