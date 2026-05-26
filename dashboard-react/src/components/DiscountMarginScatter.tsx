import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Percent, TrendingUp } from 'lucide-react';

interface ScatterPoint {
  id: string | number;
  discount: number; // Porcentagem de desconto (0 a 1)
  margin: number;   // Margem de lucro (-1 a 1)
  lucro: number;
  receita: number;
  produto: string;
}

interface DiscountMarginScatterProps {
  data: ScatterPoint[];
}

export default function DiscountMarginScatter({ data }: DiscountMarginScatterProps) {
  // Formatar valores como porcentagem
  const formatPct = (val: number) => 
    `${(val * 100).toFixed(0)}%`;

  const money = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-4">
      <div>
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Dispersão: Desconto vs Margem Comercial</h4>
        <p className="text-[10px] text-muted-foreground">Cada ponto representa uma venda individual. Vermelho indica prejuízo.</p>
      </div>

      <div className="h-[240px] bg-slate-50 border border-border/80 p-2 rounded-md">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Sem dados disponíveis para a dispersão.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              
              {/* Eixo X: Porcentagem de desconto */}
              <XAxis 
                type="number" 
                dataKey="discount" 
                name="Desconto" 
                tickFormatter={formatPct}
                stroke="#94a3b8" 
                fontSize={9}
                tickLine={false}
                domain={[0, 'auto']}
              />
              
              {/* Eixo Y: Margem de Lucro */}
              <YAxis 
                type="number" 
                dataKey="margin" 
                name="Margem" 
                tickFormatter={formatPct}
                stroke="#94a3b8" 
                fontSize={9}
                tickLine={false}
                domain={[-0.6, 0.6]}
              />

              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '11px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const info = payload[0].payload as ScatterPoint;
                    const isProfit = info.lucro >= 0;
                    return (
                      <div className="p-2.5 flex flex-col gap-1 rounded-md bg-card border border-border shadow-md">
                        <div className="font-semibold text-foreground border-b border-border pb-1">
                          Venda {info.id} - {info.produto}
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-muted-foreground">
                          <span>Desconto:</span>
                          <strong className="text-foreground text-right">{(info.discount * 100).toFixed(1)}%</strong>
                          <span>Margem:</span>
                          <strong className={`text-right font-bold ${isProfit ? 'text-success' : 'text-destructive'}`}>
                            {(info.margin * 100).toFixed(1)}%
                          </strong>
                          <span>Receita:</span>
                          <strong className="text-foreground text-right">{money(info.receita)}</strong>
                          <span>Lucro:</span>
                          <strong className={`text-right ${isProfit ? 'text-success' : 'text-destructive'}`}>
                            {money(info.lucro)}
                          </strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Linha de referência na margem 0% */}
              <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" />

              <Scatter name="Vendas" data={data}>
                {data.map((entry, index) => {
                  const isProfit = entry.lucro >= 0;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      // Verde para lucro positivo, Vermelho para prejuízo
                      fill={isProfit ? 'var(--color-success)' : 'var(--color-destructive)'}
                      fillOpacity={isProfit ? 0.6 : 0.85}
                      stroke={isProfit ? '#059669' : '#b91c1c'}
                      strokeWidth={1}
                      r={3.5}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
