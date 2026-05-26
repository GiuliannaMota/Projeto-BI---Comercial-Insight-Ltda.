import { useMemo, useState } from 'react';
import { Calendar, ChevronRight, Info } from 'lucide-react';

interface SaleRow {
  data: string;
  receita: number;
  desconto: number;
}

interface GithubSalesCalendarProps {
  sales: SaleRow[];
}

// Helpers
function formatDateBRL(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getQuarter(month: number) {
  return Math.ceil(month / 3);
}

const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function GithubSalesCalendar({ sales }: GithubSalesCalendarProps) {
  const [activeQuarter, setActiveQuarter] = useState<number | 'all'>('all');
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    revenue: number;
    avgDiscount: number;
    x: number;
    y: number;
  } | null>(null);

  // 1. Agrupar vendas por dia
  const dailyStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number; discountSum: number }> = {};
    
    sales.forEach((sale) => {
      const dateStr = sale.data;
      if (!dateStr) return;
      
      if (!stats[dateStr]) {
        stats[dateStr] = { count: 0, revenue: 0, discountSum: 0 };
      }
      
      stats[dateStr].count += 1;
      stats[dateStr].revenue += sale.receita;
      stats[dateStr].discountSum += sale.desconto;
    });
    
    return stats;
  }, [sales]);

  // 2. Gerar todos os dias de 2024
  const allDays2024 = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayOfWeek: number;
      month: number; // 1-12
      dayOfMonth: number;
      weekIndex: number;
    }> = [];
    
    const start = new Date(2024, 0, 1); // 1 Jan 2024
    const end = new Date(2024, 11, 31);  // 31 Dez 2024
    
    let current = new Date(start);
    let weekIndex = 0;
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay(); // 0 (Dom) a 6 (Sáb)
      const month = current.getMonth() + 1; // 1 a 12
      const dayOfMonth = current.getDate();
      
      days.push({
        dateStr,
        dayOfWeek,
        month,
        dayOfMonth,
        weekIndex,
      });
      
      // Se for Sábado, a próxima semana começa
      if (dayOfWeek === 6) {
        weekIndex += 1;
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, []);

  // 3. Filtrar dias de acordo com o trimestre selecionado
  const filteredDays = useMemo(() => {
    if (activeQuarter === 'all') {
      return allDays2024;
    }
    
    const days = allDays2024.filter((day) => getQuarter(day.month) === activeQuarter);
    
    // Re-normalizar weekIndex para as colunas ficarem alinhadas à esquerda no zoom
    const firstWeekIndex = days[0]?.weekIndex ?? 0;
    return days.map((day) => ({
      ...day,
      weekIndex: day.weekIndex - firstWeekIndex,
    }));
  }, [allDays2024, activeQuarter]);

  // 4. Calcular o número de colunas (semanas) necessárias para desenhar
  const columnsCount = useMemo(() => {
    if (filteredDays.length === 0) return 0;
    const maxWeek = Math.max(...filteredDays.map((d) => d.weekIndex));
    return maxWeek + 1;
  }, [filteredDays]);

  // 5. Organizar os dias por coluna para renderização estruturada em grid
  const gridData = useMemo(() => {
    const grid: Array<Array<{
      dateStr: string;
      dayOfWeek: number;
      month: number;
      dayOfMonth: number;
      weekIndex: number;
      count: number;
      revenue: number;
      avgDiscount: number;
    } | null>> = Array.from({ length: 7 }, () => Array(columnsCount).fill(null));

    filteredDays.forEach((day) => {
      const stats = dailyStats[day.dateStr] || { count: 0, revenue: 0, discountSum: 0 };
      const avgDiscount = stats.count > 0 ? stats.discountSum / stats.count : 0;
      
      grid[day.dayOfWeek][day.weekIndex] = {
        ...day,
        count: stats.count,
        revenue: stats.revenue,
        avgDiscount,
      };
    });

    return grid;
  }, [filteredDays, dailyStats, columnsCount]);

  // 6. Encontrar os pontos de início dos meses para colocar as labels no topo do grid
  const monthLabels = useMemo(() => {
    const labels: Array<{ text: string; colIndex: number }> = [];
    const seenMonths = new Set<number>();
    
    filteredDays.forEach((day) => {
      if (!seenMonths.has(day.month)) {
        seenMonths.add(day.month);
        // Só exibe o nome se a coluna for razoavelmente espaçada
        labels.push({
          text: monthNames[day.month - 1],
          colIndex: day.weekIndex,
        });
      }
    });
    
    return labels;
  }, [filteredDays]);

  // Determinar a escala de cores (Clean Tech: tons de azul escuro ou verde)
  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 hover:bg-slate-200';
    if (count <= 2) return 'bg-emerald-100/80 hover:bg-emerald-200 text-emerald-950';
    if (count <= 4) return 'bg-emerald-300/85 hover:bg-emerald-400 text-emerald-950';
    if (count <= 6) return 'bg-emerald-500 hover:bg-emerald-600 text-white';
    return 'bg-primary hover:opacity-90 text-white'; // Azul escuro
  };

  const handleMouseEnter = (e: React.MouseEvent, dayData: any) => {
    if (!dayData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay({
      date: dayData.dateStr,
      count: dayData.count,
      revenue: dayData.revenue,
      avgDiscount: dayData.avgDiscount,
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
  };

  const totalSalesInPeriod = useMemo(() => {
    return filteredDays.reduce((sum, day) => sum + (dailyStats[day.dateStr]?.count || 0), 0);
  }, [filteredDays, dailyStats]);

  const totalRevenueInPeriod = useMemo(() => {
    return filteredDays.reduce((sum, day) => sum + (dailyStats[day.dateStr]?.revenue || 0), 0);
  }, [filteredDays, dailyStats]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controles de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Frequência de Vendas Diárias</h3>
            <p className="text-xs text-muted-foreground">Distribuição de vendas no ano de 2024</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 bg-muted p-0.5 rounded-md self-start sm:self-center">
          <button
            onClick={() => setActiveQuarter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer ${
              activeQuarter === 'all'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ano Completo
          </button>
          {[1, 2, 3, 4].map((q) => (
            <button
              key={q}
              onClick={() => setActiveQuarter(q)}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer ${
                activeQuarter === q
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              T{q}
            </button>
          ))}
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        <div className="w-full flex flex-col pt-4 px-1 min-w-[640px] md:min-w-0">
          {/* Labels dos Meses */}
          <div className="relative h-5 flex text-[9px] sm:text-[10px] text-muted-foreground font-medium mb-1">
            <div className="w-6 sm:w-7 lg:w-8 shrink-0" /> {/* Margem para as labels de dia */}
            <div className="flex-1 relative">
              {monthLabels.map((label, idx) => (
                <span
                  key={idx}
                  className="absolute"
                  style={{ left: `${(label.colIndex / columnsCount) * 100}%` }}
                >
                  {label.text}
                </span>
              ))}
            </div>
          </div>

          {/* Grid de Quadradinhos */}
          <div className="flex items-stretch">
            {/* Labels dos Dias da Semana */}
            <div className="w-6 sm:w-7 lg:w-8 shrink-0 flex flex-col justify-between text-[8px] sm:text-[9px] text-muted-foreground font-medium pr-1.5 py-0.5">
              <span>Dom</span>
              <span>Ter</span>
              <span>Qui</span>
              <span>Sáb</span>
            </div>

            {/* O Grid Principal */}
            <div className="flex-1 flex flex-col gap-[2px] md:gap-[3px]">
              {gridData.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-[2px] md:gap-[3px]">
                  {row.map((dayData, colIndex) => {
                    if (!dayData) {
                      return (
                        <div
                          key={colIndex}
                          className="flex-1 aspect-square rounded-[1px] md:rounded-[1.5px] bg-transparent"
                        />
                      );
                    }

                    return (
                      <div
                        key={colIndex}
                        onMouseEnter={(e) => handleMouseEnter(e, dayData)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`flex-1 aspect-square rounded-[1px] md:rounded-[1.5px] transition-all cursor-pointer ${getColorClass(
                          dayData.count
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-between mt-3 text-[9px] sm:text-[10px] text-muted-foreground border-t border-border/60 pt-2 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                Dica: passe o mouse para ver os detalhes
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span>Menos</span>
              <div className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[1.5px] bg-slate-100" />
              <div className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[1.5px] bg-emerald-100" />
              <div className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[1.5px] bg-emerald-300" />
              <div className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[1.5px] bg-emerald-500" />
              <div className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[1.5px] bg-primary" />
              <span>Mais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo do Período */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 border border-border p-3 rounded-md">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vendas no Período</span>
          <strong className="block text-lg font-bold text-foreground">{totalSalesInPeriod} vendas</strong>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Faturamento</span>
          <strong className="block text-lg font-bold text-foreground">
            {totalRevenueInPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </strong>
        </div>
        <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-border/80 pt-2 md:pt-0 md:pl-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Média Diária</span>
            <strong className="block text-sm font-semibold text-foreground">
              {(totalSalesInPeriod / filteredDays.length).toFixed(1)} vendas/dia
            </strong>
          </div>
        </div>
      </div>

      {/* Tooltip flutuante absoluto */}
      {hoveredDay && (
        <div
          className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full flex flex-col gap-1 rounded-md bg-card border border-border p-2.5 shadow-md fade-in text-xs"
          style={{ left: hoveredDay.x, top: hoveredDay.y }}
        >
          <div className="font-semibold text-foreground border-b border-border pb-1">
            {formatDateBRL(hoveredDay.date)}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-muted-foreground">
            <span>Vendas:</span>
            <strong className="text-foreground text-right">{hoveredDay.count}</strong>
            <span>Faturamento:</span>
            <strong className="text-foreground text-right">
              {hoveredDay.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </strong>
            {hoveredDay.count > 0 && (
              <>
                <span>Média Desc.:</span>
                <strong className="text-foreground text-right">
                  {(hoveredDay.avgDiscount * 100).toFixed(1)}%
                </strong>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
