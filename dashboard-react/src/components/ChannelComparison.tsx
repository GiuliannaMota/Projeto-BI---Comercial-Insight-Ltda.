import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ShoppingBag, TrendingUp } from 'lucide-react';

interface ChannelPoint {
  name: string; // Online, Loja
  vendas: number;
  receita: number;
  lucro: number;
  margem: number;
}

interface ChannelComparisonProps {
  data: ChannelPoint[];
}

export default function ChannelComparison({ data }: ChannelComparisonProps) {
  const money = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const pct = (val: number) => 
    `${(val * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  return (
    <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-4">
      <div>
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Comparativo de Canais de Venda</h4>
        <p className="text-[10px] text-muted-foreground">Comparação direta de volume financeiro e margem líquida entre canais</p>
      </div>

      <div className="h-[220px] bg-slate-50 border border-border/80 p-2 rounded-md">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Sem dados disponíveis para comparação.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
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
                  if (name === 'receita') return [money(value), 'Faturamento'];
                  if (name === 'lucro') {
                    const info = props.payload as ChannelPoint;
                    return [`${money(value)} (${pct(info.margem)})`, 'Lucro Líquido (Margem)'];
                  }
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
                  if (value === 'receita') return <span className="text-muted-foreground font-semibold text-[10px]">Faturamento (R$)</span>;
                  if (value === 'lucro') return <span className="text-muted-foreground font-semibold text-[10px]">Lucro Líquido (R$)</span>;
                  return value;
                }}
              />
              <Bar 
                dataKey="receita" 
                name="receita" 
                fill="var(--color-chart-5)" // Steel blue
                radius={[4, 4, 0, 0]} 
                barSize={32} 
              />
              <Bar 
                dataKey="lucro" 
                name="lucro" 
                fill="var(--color-success)" // Verde
                radius={[4, 4, 0, 0]} 
                barSize={32} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
