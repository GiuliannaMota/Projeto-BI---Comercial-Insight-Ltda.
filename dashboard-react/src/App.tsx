import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  DollarSign, 
  Filter, 
  Award, 
  ShoppingCart,
  ChevronDown,
  Activity,
  Users,
  Target
} from 'lucide-react';

import './styles.css';
import GithubSalesCalendar from './components/GithubSalesCalendar';
import BrazilMapcn from './components/BrazilMapcn';
import DetailSidebar from './components/DetailSidebar';
import SalesEvolutionChart from './components/SalesEvolutionChart';
import DiscountMarginScatter from './components/DiscountMarginScatter';
import ChannelComparison from './components/ChannelComparison';

import dadosTratadosRaw from '../../dados_empresa_tratado.csv?raw';
import insightsRaw from '../../outputs_etapa7/insights_executivos.csv?raw';
import planoRaw from '../../outputs_etapa7/plano_acao.csv?raw';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

type CsvRow = Record<string, string>;

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .toLowerCase()
    .trim();
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function num(value: string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function field(row: CsvRow, label: string) {
  const target = normalizeKey(label);
  const key = Object.keys(row).find((item) => normalizeKey(item) === target);
  return key ? row[key] : '';
}

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function compactMoney(value: number) {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
  return money(value);
}

function pct(value: number) {
  return `${(value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function getDiscountRange(discount: number) {
  if (discount <= 0.05) return '0% a 5%';
  if (discount <= 0.10) return '5% a 10%';
  if (discount <= 0.15) return '10% a 15%';
  if (discount <= 0.20) return '15% a 20%';
  return 'Acima de 20%';
}

export default function App() {
  // Filtros Globais
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'Online' | 'Loja'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Estado do Mapa & Sidebar de Detalhes
  const [detailEntity, setDetailEntity] = useState<{
    type: 'region' | 'vendedor' | 'categoria';
    name: string;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Carregar dados originais
  const rawSales = useMemo(() => {
    return parseCsv(dadosTratadosRaw).map((row) => ({
      id_venda: row.id_venda,
      data: row.data,
      mes: row.mes,
      trimestre: row.trimestre,
      cliente: row.cliente,
      tipo_cliente: row.tipo_cliente,
      tempo_relacionamento_meses: num(row.tempo_relacionamento_meses),
      faixa_renda: row.faixa_renda,
      segmento: row.segmento,
      produto: row.produto,
      categoria: row.categoria,
      marca: row.marca,
      linha_produto: row.linha_produto,
      quantidade: num(row.quantidade),
      preco_unitario: num(row.preco_unitario),
      desconto: num(row.desconto),
      receita: num(row.receita),
      custo_unitario: num(row.custo_unitario),
      lucro: num(row.lucro),
      regiao: row.regiao,
      cidade: row.cidade,
      canal_venda: row.canal_venda,
      vendedor: row.vendedor,
      meta_venda: num(row.meta_venda),
      atingiu_meta: row.atingiu_meta,
      prazo_entrega_dias: num(row.prazo_entrega_dias),
      status_entrega: row.status_entrega,
    }));
  }, []);

  const rawInsights = useMemo(() => parseCsv(insightsRaw), []);
  const rawPlano = useMemo(() => parseCsv(planoRaw), []);

  // Filtragem Dinâmica dos Dados
  const filteredSales = useMemo(() => {
    return rawSales.filter((row) => {
      // 1. Filtro de Canal de Venda
      if (selectedChannel !== 'all' && row.canal_venda !== selectedChannel) {
        return false;
      }
      // 2. Filtro de Período (Trimestres ou Meses de 2024)
      if (selectedPeriod !== 'all') {
        if (selectedPeriod.startsWith('T')) {
          const q = selectedPeriod.substring(1);
          if (row.trimestre !== q) return false;
        } else {
          // É o número do mês ('1', '2', ..., '12')
          if (row.mes !== selectedPeriod) return false;
        }
      }
      return true;
    });
  }, [rawSales, selectedChannel, selectedPeriod]);

  // Cálculos de KPIs em Tempo Real baseado nos filtros
  const kpis = useMemo(() => {
    const totalVendas = filteredSales.length;
    const receitaTotal = filteredSales.reduce((sum, r) => sum + r.receita, 0);
    const lucroTotal = filteredSales.reduce((sum, r) => sum + r.lucro, 0);
    const metaTotal = filteredSales.reduce((sum, r) => sum + r.meta_venda, 0);
    
    const atingiramMetaCount = filteredSales.filter(r => r.atingiu_meta === 'Sim').length;
    const atrasadasCount = filteredSales.filter(r => r.status_entrega === 'Atrasado').length;
    
    const margemLucro = receitaTotal ? lucroTotal / receitaTotal : 0;
    const taxaMeta = totalVendas ? atingiramMetaCount / totalVendas : 0;
    const taxaAtraso = totalVendas ? atrasadasCount / totalVendas : 0;
    
    const metaGap = metaTotal - receitaTotal;
    const lucroNegativo = filteredSales.filter(r => r.lucro < 0).length;

    return {
      vendas: totalVendas,
      receita: receitaTotal,
      lucro: lucroTotal,
      meta: metaTotal,
      margem: margemLucro,
      taxaMeta,
      taxaAtraso,
      metaGap,
      lucroNegativo
    };
  }, [filteredSales]);

  // Gráfico de Linha/Área - Evolução Histórica (Dinâmico)
  const timelineData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; sales: number; revenue: number }>();
    
    filteredSales.forEach(sale => {
      const date = sale.data;
      if (!date) return;
      const curr = dailyMap.get(date) || { date, sales: 0, revenue: 0 };
      curr.sales += 1;
      curr.revenue += sale.receita;
      dailyMap.set(date, curr);
    });
    
    const sortedDays = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
    
    if (selectedPeriod === 'all') {
      // Agrupar por Mês para o ano inteiro para evitar excesso de pontos no gráfico
      const monthlyMap = new Map<number, { name: string; sales: number; revenue: number }>();
      for (let m = 1; m <= 12; m++) {
        monthlyMap.set(m, { name: monthNames[m - 1].slice(0, 3), sales: 0, revenue: 0 });
      }
      
      sortedDays.forEach(day => {
        const m = Number(day.date.split('-')[1]);
        const curr = monthlyMap.get(m)!;
        curr.sales += day.sales;
        curr.revenue += day.revenue;
      });
      return [...monthlyMap.values()];
    } else if (selectedPeriod.startsWith('T')) {
      // Agrupar nos 3 meses do trimestre correspondente
      const q = Number(selectedPeriod.substring(1));
      const monthsInQuarter = [3 * q - 2, 3 * q - 1, 3 * q];
      const monthlyMap = new Map<number, { name: string; sales: number; revenue: number }>();
      monthsInQuarter.forEach(m => {
        monthlyMap.set(m, { name: monthNames[m - 1], sales: 0, revenue: 0 });
      });
      
      sortedDays.forEach(day => {
        const m = Number(day.date.split('-')[1]);
        if (monthsInQuarter.includes(m)) {
          const curr = monthlyMap.get(m)!;
          curr.sales += day.sales;
          curr.revenue += day.revenue;
        }
      });
      return [...monthlyMap.values()];
    } else {
      // Mostrar dias individuais do mês selecionado
      const m = Number(selectedPeriod);
      const daysInMonthMap = new Map<number, { name: string; sales: number; revenue: number }>();
      const daysInMonth = new Date(2024, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        daysInMonthMap.set(d, { name: `${d}`, sales: 0, revenue: 0 });
      }
      
      sortedDays.forEach(day => {
        const [_, monthStr, dayStr] = day.date.split('-');
        if (Number(monthStr) === m) {
          const d = Number(dayStr);
          const curr = daysInMonthMap.get(d);
          if (curr) {
            curr.sales += day.sales;
            curr.revenue += day.revenue;
          }
        }
      });
      return [...daysInMonthMap.values()];
    }
  }, [filteredSales, selectedPeriod]);

  // Gráfico de Dispersão: Desconto vs Margem por Venda
  const scatterData = useMemo(() => {
    return filteredSales.map((r) => ({
      id: r.id_venda,
      discount: r.desconto,
      margin: r.receita ? r.lucro / r.receita : 0,
      lucro: r.lucro,
      receita: r.receita,
      produto: r.produto
    }));
  }, [filteredSales]);

  // Gráfico Comparativo de Canais Recharts
  const channelData = useMemo(() => {
    const channels = ['Online', 'Loja'];
    return channels.map(ch => {
      const chRows = filteredSales.filter(r => r.canal_venda === ch);
      const receita = chRows.reduce((sum, r) => sum + r.receita, 0);
      const lucro = chRows.reduce((sum, r) => sum + r.lucro, 0);
      const vendas = chRows.length;
      const margem = receita ? lucro / receita : 0;
      return { 
        name: ch, 
        vendas, 
        receita, 
        lucro, 
        margem 
      };
    });
  }, [filteredSales]);

  // Cálculo das estatísticas regionais dinâmicas (para o mapa e ranking)
  const regionStats = useMemo(() => {
    const regions = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
    return regions.map(reg => {
      const regionRows = filteredSales.filter(r => r.regiao === reg);
      const receita = regionRows.reduce((sum, r) => sum + r.receita, 0);
      const lucro = regionRows.reduce((sum, r) => sum + r.lucro, 0);
      const vendas = regionRows.length;
      const margem = receita ? lucro / receita : 0;
      const atraso = vendas ? regionRows.filter(r => r.status_entrega === 'Atrasado').length / vendas : 0;
      
      return { 
        name: reg, 
        vendas, 
        receita, 
        lucro, 
        margem, 
        atraso 
      };
    }).sort((a, b) => b.receita - a.receita);
  }, [filteredSales]);

  // Estatísticas das Cidades da região selecionada para a Sidebar
  const cityStatsForSelectedRegion = useMemo(() => {
    const name = detailEntity?.name;
    if (!name || detailEntity?.type !== 'region') return [];
    const regionRows = filteredSales.filter(r => r.regiao === name);
    const citiesMap = new Map<string, { vendas: number; receita: number }>();
    
    regionRows.forEach(row => {
      const city = row.cidade || 'Não identificado';
      const curr = citiesMap.get(city) || { vendas: 0, receita: 0 };
      curr.vendas += 1;
      curr.receita += row.receita;
      citiesMap.set(city, curr);
    });
    
    return [...citiesMap.entries()].map(([cidade, stats]) => ({
      cidade,
      vendas: stats.vendas,
      receita: stats.receita
    })).sort((a, b) => b.vendas - a.vendas);
  }, [filteredSales, detailEntity]);

  // Cálculo das Faixas de Desconto
  const discountData = useMemo(() => {
    const discountRanges = ['0% a 5%', '5% a 10%', '10% a 15%', '15% a 20%', 'Acima de 20%'];
    return discountRanges.map(range => {
      const rangeRows = filteredSales.filter(r => getDiscountRange(r.desconto) === range);
      const receita = rangeRows.reduce((sum, r) => sum + r.receita, 0);
      const lucro = rangeRows.reduce((sum, r) => sum + r.lucro, 0);
      const margem = receita ? lucro / receita : 0;
      return { 
        name: range, 
        vendas: rangeRows.length,
        receita, 
        lucro, 
        margem 
      };
    });
  }, [filteredSales]);

  // Cálculo das Categorias
  const categoryData = useMemo(() => {
    const categoriesMap = new Map<string, { lucro: number; receita: number; vendas: number }>();
    filteredSales.forEach(row => {
      const cat = row.categoria || 'Outros';
      const curr = categoriesMap.get(cat) || { lucro: 0, receita: 0, vendas: 0 };
      curr.lucro += row.lucro;
      curr.receita += row.receita;
      curr.vendas += 1;
      categoriesMap.set(cat, curr);
    });
    return [...categoriesMap.entries()].map(([name, stats]) => ({
      name,
      lucro: stats.lucro,
      receita: stats.receita,
      vendas: stats.vendas,
      margem: stats.receita ? stats.lucro / stats.receita : 0
    })).sort((a, b) => b.lucro - a.lucro);
  }, [filteredSales]);

  // Top 5 Produtos por receita
  const topProducts = useMemo(() => {
    const productsMap = new Map<string, { receita: number; lucro: number; vendas: number }>();
    filteredSales.forEach(row => {
      const prod = row.produto || 'Outros';
      const curr = productsMap.get(prod) || { receita: 0, lucro: 0, vendas: 0 };
      curr.receita += row.receita;
      curr.lucro += row.lucro;
      curr.vendas += 1;
      productsMap.set(prod, curr);
    });
    return [...productsMap.entries()].map(([name, stats]) => ({
      name,
      receita: stats.receita,
      lucro: stats.lucro,
      vendas: stats.vendas,
      margem: stats.receita ? stats.lucro / stats.receita : 0
    })).sort((a, b) => b.receita - a.receita).slice(0, 5);
  }, [filteredSales]);

  // Top 5 Vendedores por lucro
  const topSellers = useMemo(() => {
    const sellersMap = new Map<string, { lucro: number; vendas: number; metaReached: number }>();
    filteredSales.forEach(row => {
      const seller = row.vendedor || 'Outros';
      const curr = sellersMap.get(seller) || { lucro: 0, vendas: 0, metaReached: 0 };
      curr.lucro += row.lucro;
      curr.vendas += 1;
      curr.metaReached += row.atingiu_meta === 'Sim' ? 1 : 0;
      sellersMap.set(seller, curr);
    });
    return [...sellersMap.entries()].map(([name, stats]) => ({
      name,
      lucro: stats.lucro,
      vendas: stats.vendas,
      metaRate: stats.vendas ? stats.metaReached / stats.vendas : 0
    })).sort((a, b) => b.lucro - a.lucro).slice(0, 5);
  }, [filteredSales]);

  // Estatísticas Dinâmicas para a nova Sidebar Unificada
  const detailSidebarData = useMemo(() => {
    if (!detailEntity) {
      return {
        metrics: { vendas: 0, receita: 0, lucro: 0, margem: 0, atraso: 0 },
        chartData1: [],
        chartData2: []
      };
    }

    const { type, name } = detailEntity;

    if (type === 'region') {
      const stats = regionStats.find(r => r.name === name) || { vendas: 0, receita: 0, lucro: 0, margem: 0, atraso: 0 };
      return {
        metrics: stats,
        chartData1: cityStatsForSelectedRegion, // Vendas por cidade
        chartData2: undefined
      };
    }

    if (type === 'vendedor') {
      const vendedorRows = filteredSales.filter(r => r.vendedor === name);
      const receita = vendedorRows.reduce((sum, r) => sum + r.receita, 0);
      const lucro = vendedorRows.reduce((sum, r) => sum + r.lucro, 0);
      const vendas = vendedorRows.length;
      const margem = receita ? lucro / receita : 0;
      const atraso = vendas ? vendedorRows.filter(r => r.status_entrega === 'Atrasado').length / vendas : 0;

      // Sub-Gráfico 1: Vendas por Categoria para este vendedor
      const catMap = new Map<string, { name: string; receita: number; vendas: number }>();
      vendedorRows.forEach(row => {
        const cat = row.categoria || 'Outros';
        const curr = catMap.get(cat) || { name: cat, receita: 0, vendas: 0 };
        curr.receita += row.receita;
        curr.vendas += 1;
        catMap.set(cat, curr);
      });

      // Sub-Gráfico 2: Vendas por Produto para este vendedor
      const prodMap = new Map<string, { name: string; receita: number; vendas: number }>();
      vendedorRows.forEach(row => {
        const prod = row.produto || 'Outros';
        const curr = prodMap.get(prod) || { name: prod, receita: 0, vendas: 0 };
        curr.receita += row.receita;
        curr.vendas += 1;
        prodMap.set(prod, curr);
      });

      return {
        metrics: { vendas, receita, lucro, margem, atraso },
        chartData1: [...catMap.values()].sort((a, b) => b.receita - a.receita),
        chartData2: [...prodMap.values()].sort((a, b) => b.receita - a.receita).slice(0, 5)
      };
    }

    // Categoria
    const categoriaRows = filteredSales.filter(r => r.categoria === name);
    const receita = categoriaRows.reduce((sum, r) => sum + r.receita, 0);
    const lucro = categoriaRows.reduce((sum, r) => sum + r.lucro, 0);
    const vendas = categoriaRows.length;
    const margem = receita ? lucro / receita : 0;
    const atraso = vendas ? categoriaRows.filter(r => r.status_entrega === 'Atrasado').length / vendas : 0;

    // Sub-Gráfico 1: Vendas da Categoria por Região
    const regMap = new Map<string, { name: string; receita: number; vendas: number }>();
    categoriaRows.forEach(row => {
      const reg = row.regiao || 'Outros';
      const curr = regMap.get(reg) || { name: reg, receita: 0, vendas: 0 };
      curr.receita += row.receita;
      curr.vendas += 1;
      regMap.set(reg, curr);
    });

    // Sub-Gráfico 2: Vendas da Categoria por Produto (Marcas/Modelos)
    const prodMap = new Map<string, { name: string; receita: number; vendas: number }>();
    categoriaRows.forEach(row => {
      const prod = row.produto || 'Outros';
      const curr = prodMap.get(prod) || { name: prod, receita: 0, vendas: 0 };
      curr.receita += row.receita;
      curr.vendas += 1;
      prodMap.set(prod, curr);
    });

    return {
      metrics: { vendas, receita, lucro, margem, atraso },
      chartData1: [...regMap.values()].sort((a, b) => b.receita - a.receita),
      chartData2: [...prodMap.values()].sort((a, b) => b.receita - a.receita).slice(0, 5)
    };
  }, [detailEntity, filteredSales, regionStats, cityStatsForSelectedRegion]);

  const handleRegionDblClick = (regionName: string) => {
    setDetailEntity({ type: 'region', name: regionName });
    setIsSidebarOpen(true);
  };

  const periodLabelMap: Record<string, string> = {
    all: 'Ano Completo (2024)',
    T1: '1º Trimestre (T1)',
    T2: '2º Trimestre (T2)',
    T3: '3º Trimestre (T3)',
    T4: '4º Trimestre (T4)',
    '1': 'Janeiro',
    '2': 'Fevereiro',
    '3': 'Março',
    '4': 'Abril',
    '5': 'Maio',
    '6': 'Junho',
    '7': 'Julho',
    '8': 'Agosto',
    '9': 'Setembro',
    '10': 'Outubro',
    '11': 'Novembro',
    '12': 'Dezembro'
  };

  const COLORS = ['#0f172a', '#10b981', '#0ea5e9', '#64748b', '#94a3b8'];

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {/* Sidebar de Navegação Lateral - Estilo Vercel */}
      <aside className="w-64 border-r border-border bg-card shrink-0 sticky top-0 h-screen hidden lg:flex flex-col">
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tight">
            CI
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Comercial Insight</h2>
            <span className="text-[10px] text-muted-foreground">Dashboard Analytics</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          <a href="#overview" className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-100 transition-colors">
            <Activity className="w-4 h-4" />
            Visão Geral
          </a>
          <a href="#github-calendar" className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-100 transition-colors">
            <ShoppingCart className="w-4 h-4" />
            Histórico Diário
          </a>
          <a href="#mapa-brasil" className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-100 transition-colors">
            <Target className="w-4 h-4" />
            Geográfico
          </a>
          <a href="#plano-acao" className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-100 transition-colors">
            <CheckCircle className="w-4 h-4" />
            Plano de Ação
          </a>
        </nav>

        <div className="p-4 border-t border-border bg-slate-50 text-[10px] text-muted-foreground flex flex-col gap-1">
          <span>Versão 2.0.0</span>
          <span>Base Comercial 2024</span>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Header com Filtros Gerais */}
        <header className="sticky top-0 bg-card/85 backdrop-blur-md border-b border-border z-30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">Painel Executivo Comercial</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Mapeamento de KPIs, metas e densidade regional</p>
          </div>

          {/* Área de Filtros Gerais */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filtro por Canal de Venda */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-border p-0.5 rounded-md">
              <button
                onClick={() => setSelectedChannel('all')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer ${
                  selectedChannel === 'all'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedChannel('Online')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer ${
                  selectedChannel === 'Online'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setSelectedChannel('Loja')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer ${
                  selectedChannel === 'Loja'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Loja
              </button>
            </div>

            {/* Filtro por Período */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card hover:bg-slate-50 text-xs font-medium rounded-md shadow-xs text-foreground cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                {periodLabelMap[selectedPeriod]}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 border border-border bg-card rounded-md shadow-lg z-50 p-1 flex flex-col gap-0.5 text-xs text-foreground fade-in">
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Geral</div>
                  <button
                    onClick={() => { setSelectedPeriod('all'); setIsDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-sm hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Ano Completo (2024)
                  </button>

                  <div className="border-t border-border/60 my-1" />
                  <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trimestres</div>
                  {['T1', 'T2', 'T3', 'T4'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setSelectedPeriod(t); setIsDropdownOpen(false); }}
                      className="w-full text-left px-2.5 py-1 rounded-sm hover:bg-slate-100 cursor-pointer"
                    >
                      {periodLabelMap[t]}
                    </button>
                  ))}

                  <div className="border-t border-border/60 my-1" />
                  <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Meses</div>
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedPeriod(m); setIsDropdownOpen(false); }}
                        className="w-full text-left px-2.5 py-1 rounded-sm hover:bg-slate-100 cursor-pointer"
                      >
                        {periodLabelMap[m]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Workspace do Dashboard */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          
          {/* Seção 1: KPIs Principais Reativos */}
          <section id="overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Faturamento */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Receita Total</span>
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-2.5">
                <strong className="text-xl font-bold tracking-tight text-foreground block">{money(kpis.receita)}</strong>
                <span className={`text-[10px] block mt-1 font-medium ${kpis.metaGap > 0 ? 'text-amber-600' : 'text-success'}`}>
                  {kpis.metaGap > 0 
                    ? `Falta ${money(kpis.metaGap)} para a meta` 
                    : `Meta batida por ${money(Math.abs(kpis.metaGap))}`
                  }
                </span>
              </div>
            </div>

            {/* KPI 2: Lucro Total */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Lucro Líquido</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="mt-2.5">
                <strong className="text-xl font-bold tracking-tight text-foreground block">{money(kpis.lucro)}</strong>
                <span className="text-[10px] text-success font-semibold flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {pct(kpis.margem)} de margem comercial
                </span>
              </div>
            </div>

            {/* KPI 3: Taxa de Metas */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Taxa Atingimento Metas</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2.5">
                <strong className="text-xl font-bold tracking-tight text-foreground block">{pct(kpis.taxaMeta)}</strong>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  {kpis.vendas ? `${Math.round(kpis.vendas * kpis.taxaMeta)} de ${kpis.vendas} vendas` : 'Sem vendas'}
                </span>
              </div>
            </div>

            {/* KPI 4: Entregas Atrasadas */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Taxa de Atrasos</span>
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="mt-2.5">
                <strong className={`text-xl font-bold tracking-tight block ${kpis.taxaAtraso > 0.4 ? 'text-destructive' : 'text-foreground'}`}>
                  {pct(kpis.taxaAtraso)}
                </strong>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  {kpis.vendas ? `${Math.round(kpis.vendas * kpis.taxaAtraso)} entregas atrasadas` : 'Sem entregas'}
                </span>
              </div>
            </div>

          </section>

          {/* Gráfico de Evolução Histórica (Novo) */}
          <section className="grid grid-cols-1 gap-6">
            <SalesEvolutionChart data={timelineData} period={selectedPeriod} />
          </section>

          {/* Seção 2: Calendário de Vendas Estilo GitHub */}
          <section id="github-calendar" className="border border-border rounded-md bg-card p-4 shadow-xs">
            <GithubSalesCalendar sales={filteredSales} />
          </section>

          {/* Seção 3: Mapa do Brasil + Gráficos de Faturamento Regional e Canais */}
          <section id="mapa-brasil" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Mapa Interativo Mapcn */}
            <div className="lg:col-span-8">
              <BrazilMapcn 
                regionStats={regionStats} 
                onRegionDblClick={handleRegionDblClick}
                selectedRegion={detailEntity?.type === 'region' ? detailEntity.name : undefined}
              />
            </div>

            {/* Donut de Faturamento por Região e Comparativo de Canais */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Donut */}
              <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col justify-between h-[220px]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Faturamento Regional</h4>
                    <p className="text-[9px] text-muted-foreground">Participação proporcional de receita</p>
                  </div>
                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Dê 2 cliques no mapa</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-1/2 flex justify-center">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={regionStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="receita"
                        >
                          {regionStats.map((entry, index) => (
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
                  </div>

                  <div className="w-1/2 flex flex-col gap-1 text-[10px] text-muted-foreground">
                    {regionStats.slice(0, 3).map((reg, idx) => (
                      <div key={reg.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="truncate font-semibold text-foreground">{reg.name}</span>
                        </div>
                        <span>{pct(kpis.receita ? reg.receita / kpis.receita : 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Canal Comparativo */}
              <ChannelComparison data={channelData} />

            </div>

          </section>

          {/* Seção 4: Gráfico de Dispersão, Faixa de Descontos e Lucro por Categoria */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico de Dispersão (Novo) */}
            <DiscountMarginScatter data={scatterData} />

            {/* Gráfico de Lucro por Categoria */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Lucro Líquido por Categoria</h4>
                  <p className="text-[10px] text-muted-foreground">Rentabilidade líquida (Dê dois cliques nas categorias para detalhar)</p>
                </div>
                <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Duplo clique</span>
              </div>

              <div className="h-[240px] bg-slate-50 border border-border/80 p-2 rounded-md">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={9} 
                      tickLine={false}
                      tickFormatter={(val) => compactMoney(val)}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '11px'
                      }}
                      formatter={(value: any) => [money(value), 'Lucro Líquido']}
                    />
                    <Bar 
                      dataKey="lucro" 
                      fill="var(--color-primary)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                      onClick={(data: any) => {
                        if (data && data.name) {
                          setDetailEntity({ type: 'categoria', name: data.name });
                          setIsSidebarOpen(true);
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Elasticidade Margem por Faixa de Desconto */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Impacto de Margem por Faixa de Desconto</h4>
                <p className="text-[10px] text-muted-foreground">Relação agregada entre desconto concedido e margem média</p>
              </div>

              <div className="h-[220px] bg-slate-50 border border-border/80 p-2 rounded-md">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={discountData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={9} 
                      tickLine={false}
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '11px'
                      }}
                      formatter={(value: any) => [pct(value), 'Margem Média']}
                    />
                    <Bar 
                      dataKey="margem" 
                      fill="var(--color-success)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lista Estilizada de Categorias com Duplo Clique */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Tabela de Rentabilidade por Categoria</h4>
                <p className="text-[10px] text-muted-foreground">Lista executiva detalhada. Dê dois cliques em uma linha para abrir a análise.</p>
              </div>

              <div className="flex flex-col divide-y divide-border text-xs">
                {categoryData.map((cat) => (
                  <div 
                    key={cat.name} 
                    onDoubleClick={() => {
                      setDetailEntity({ type: 'categoria', name: cat.name });
                      setIsSidebarOpen(true);
                    }}
                    className="py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-1 rounded-sm transition-all"
                    title="Dê dois cliques para ver o detalhamento"
                  >
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    <div className="flex gap-4 text-right">
                      <div>
                        <span className="text-[9px] text-muted-foreground block">Lucro Líquido</span>
                        <strong className="text-foreground font-semibold">{compactMoney(cat.lucro)}</strong>
                      </div>
                      <div className="min-w-[60px]">
                        <span className="text-[9px] text-muted-foreground block">Margem</span>
                        <span className="text-success font-semibold">{pct(cat.margem)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>

          {/* Seção 5: Rankings de Vendedores e Produtos */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Vendedores por Lucro (Duplo Clique) */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Vendedores Destaque (Lucro)</h4>
                <p className="text-[10px] text-muted-foreground">Desempenho financeiro individual. Dê dois cliques para abrir a análise do vendedor.</p>
              </div>

              <div className="flex flex-col divide-y divide-border text-xs">
                {topSellers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">Sem dados de vendedores para os filtros ativos.</p>
                ) : (
                  topSellers.map((seller) => (
                    <div 
                      key={seller.name} 
                      onDoubleClick={() => {
                        setDetailEntity({ type: 'vendedor', name: seller.name });
                        setIsSidebarOpen(true);
                      }}
                      className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-1 rounded-sm transition-all"
                      title="Dê dois cliques para ver o detalhamento"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="w-4.5 h-4.5 text-amber-500" />
                        <span className="font-semibold text-foreground">{seller.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Lucro Líquido</span>
                          <strong className="text-foreground font-semibold">{compactMoney(seller.lucro)}</strong>
                        </div>
                        <div className="min-w-[70px]">
                          <span className="text-[10px] text-muted-foreground block">Metas Atingidas</span>
                          <span className="text-success font-semibold">{pct(seller.metaRate)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Produtos por Receita */}
            <div className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Produtos Mais Vendidos (Faturamento)</h4>
                <p className="text-[10px] text-muted-foreground">Volume de faturamento e margem de lucro por produto</p>
              </div>

              <div className="flex flex-col divide-y divide-border text-xs">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">Sem dados de produtos para os filtros ativos.</p>
                ) : (
                  topProducts.map((product) => (
                    <div key={product.name} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-4.5 h-4.5 text-primary" />
                        <span className="font-semibold text-foreground">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Receita Bruta</span>
                          <strong className="text-foreground font-semibold">{compactMoney(product.receita)}</strong>
                        </div>
                        <div className="min-w-[70px]">
                          <span className="text-[10px] text-muted-foreground block">Margem</span>
                          <span className="text-success font-semibold">{pct(product.margem)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>

          {/* Seção 6: Plano de Ação */}
          <section id="plano-acao" className="border border-border rounded-md bg-card p-4 shadow-xs flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Plano de Ação Estratégico</h4>
              <p className="text-[10px] text-muted-foreground">Ações comerciais e operacionais mapeadas a partir das análises do BI</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-3">Prioridade</th>
                    <th className="p-3">Ação</th>
                    <th className="p-3">Objetivo</th>
                    <th className="p-3">Responsável</th>
                    <th className="p-3">Prazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rawPlano.map((plano, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          plano.Prioridade === 'Alta' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-slate-200 text-muted-foreground'
                        }`}>
                          {plano.Prioridade}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-foreground">{field(plano, 'Acao')}</td>
                      <td className="p-3 text-muted-foreground">{plano.Objetivo}</td>
                      <td className="p-3 font-medium text-foreground">{field(plano, 'Area Responsavel')}</td>
                      <td className="p-3 text-muted-foreground font-semibold">{plano.Prazo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

      {/* Dynamic DetailSidebar Drawer (Unified for Region, Vendedor, Categoria) */}
      {detailEntity && (
        <DetailSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          entityType={detailEntity.type}
          entityName={detailEntity.name}
          metrics={detailSidebarData.metrics}
          chartData1={detailSidebarData.chartData1}
          chartData2={detailSidebarData.chartData2}
        />
      )}
    </div>
  );
}
