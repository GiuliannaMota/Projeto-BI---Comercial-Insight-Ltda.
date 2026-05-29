import * as React from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Database,
  GitBranch,
  ListChecks,
  Network,
  Target,
  TriangleAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipContent } from "../components/charts/chart-tooltip";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs } from "../components/ui/tabs";
import { formatCompactBRL, formatDecimal, formatNumber } from "../lib/format";
import { cn } from "../lib/utils";

type StageId = "etapa1" | "etapa2" | "etapa3" | "etapa4" | "etapa5";

type Stage = {
  id: StageId;
  step: string;
  title: string;
  badge: string;
  summary: string;
};

const stages: Stage[] = [
  {
    id: "etapa1",
    step: "Etapa 1",
    title: "Entendimento do negócio",
    badge: "Contexto",
    summary: "Definição da empresa, desafios, problema de negócio, perguntas analíticas e KPIs relacionados.",
  },
  {
    id: "etapa2",
    step: "Etapa 2",
    title: "Diagnóstico dos dados",
    badge: "Base",
    summary: "Leitura da estrutura da base, tipos de atributos e inconsistências encontradas antes do tratamento.",
  },
  {
    id: "etapa3",
    step: "Etapa 3",
    title: "Pré-processamento",
    badge: "Tratamento",
    summary: "Correções aplicadas para remover duplicidades, preencher ausências, recalcular campos e preservar sinais de negócio.",
  },
  {
    id: "etapa4",
    step: "Etapa 4",
    title: "Análise de dados",
    badge: "Análise",
    summary: "KPIs gerais, análise descritiva e análises por região, canal, produto, cliente, marca, desconto e lucro negativo.",
  },
  {
    id: "etapa5",
    step: "Etapa 5",
    title: "Modelagem para BI",
    badge: "Modelo",
    summary: "Definição do grão, tabela fato, dimensões e estrutura em esquema estrela para análise recorrente.",
  },
];

const stageIcons: Record<StageId, typeof BriefcaseBusiness> = {
  etapa1: BriefcaseBusiness,
  etapa2: Database,
  etapa3: ListChecks,
  etapa4: BarChart3,
  etapa5: GitBranch,
};

const chartTick = { fill: "#94a3b8", fontSize: 12 };
const gridStroke = "rgba(255,255,255,0.08)";
const lime = "#b5e24a";
const violet = "#7c5cff";
const red = "#e25765";
const slate = "#94a3b8";

const qualityIssuesData = [
  { name: "Valores nulos", value: 204 },
  { name: "Lucro negativo", value: 126 },
  { name: "Região Exterior", value: 30 },
  { name: "Duplicidades", value: 20 },
  { name: "Qtd. igual a zero", value: 10 },
  { name: "Receita inconsistente", value: 10 },
  { name: "Lucro inconsistente", value: 10 },
];

const financialKpisData = [
  { name: "Receita", value: 15196118.48 },
  { name: "Lucro", value: 3081804.68 },
  { name: "Meta", value: 18353644.52 },
];

const operatingKpisData = [
  { name: "Cumprimento da meta", value: 82.8 },
  { name: "Vendas que atingiram meta", value: 7 },
  { name: "Entregas atrasadas", value: 51.9 },
];

const generalKpiCards = [
  { label: "Total de vendas", value: "1.000", detail: "Registros únicos considerados após o tratamento.", tone: "neutral" as const },
  { label: "Receita total", value: "R$ 15,20 mi", detail: "Faturamento consolidado no período analisado.", tone: "violet" as const },
  { label: "Lucro total", value: "R$ 3,08 mi", detail: "Resultado após custos associados às vendas.", tone: "lime" as const },
  { label: "Margem de lucro", value: "20,28%", detail: "Rentabilidade média da operação.", tone: "lime" as const },
  { label: "Quantidade vendida", value: "6.062", detail: "Unidades vendidas na base final.", tone: "neutral" as const },
  { label: "Ticket médio", value: "R$ 15.196,12", detail: "Receita média por venda.", tone: "neutral" as const },
  { label: "Desconto médio", value: "12,82%", detail: "Média dos descontos concedidos.", tone: "violet" as const },
  { label: "Meta total", value: "R$ 18,35 mi", detail: "Objetivo comercial consolidado.", tone: "neutral" as const },
  { label: "Cumprimento da meta total", value: "82,80%", detail: "Atingimento agregado frente à meta.", tone: "lime" as const },
  { label: "Vendas que atingiram meta", value: "7,00%", detail: "Percentual de vendas individuais acima da meta.", tone: "red" as const },
  { label: "Entregas atrasadas", value: "51,90%", detail: "Percentual de entregas com atraso.", tone: "red" as const },
];

const regionalData = [
  { name: "Sul", receita: 3314347.57, lucro: 732603.31, margem: 22.1, meta: 4.78, atraso: 55.02 },
  { name: "Centro-Oeste", receita: 3265071.81, lucro: 586749.5, margem: 17.97, meta: 5.45, atraso: 49.01 },
  { name: "Norte", receita: 3247788.94, lucro: 689213.02, margem: 21.22, meta: 10.53, atraso: 52.15 },
  { name: "Sudeste", receita: 2720463.9, lucro: 527492.37, margem: 19.39, meta: 6.53, atraso: 52.76 },
  { name: "Nordeste", receita: 2648447.26, lucro: 545746.48, margem: 20.61, meta: 7.73, atraso: 50.28 },
];

const channelData = [
  { name: "Online", vendas: 522, receita: 8092223.75, lucro: 1600532.77, margem: 19.78, meta: 7.47, atraso: 48.85 },
  { name: "Loja", vendas: 478, receita: 7103894.73, lucro: 1481271.91, margem: 20.85, meta: 6.49, atraso: 55.23 },
];

const categoryData = [
  { name: "Informática", receita: 7297489.87, lucro: 1502208.18, margem: 20.59 },
  { name: "Periféricos", receita: 5432341.12, lucro: 1091976.41, margem: 20.1 },
  { name: "Telefonia", receita: 1934879.54, lucro: 399791.66, margem: 20.66 },
  { name: "Outros", receita: 531407.95, lucro: 87828.43, margem: 16.53 },
];

const productData = [
  { name: "Monitor", receita: 2463025.32, lucro: 448537.86, margem: 18.21 },
  { name: "Teclado", receita: 1973461.44, lucro: 425008.67, margem: 21.54 },
  { name: "Mouse", receita: 1962335.25, lucro: 389571.59, margem: 19.85 },
  { name: "Smartphone", receita: 1946475.42, lucro: 402535.95, margem: 20.68 },
  { name: "Impressora", receita: 1859469.92, lucro: 419170.28, margem: 22.54 },
  { name: "Headset", receita: 1697277.71, lucro: 310612.35, margem: 18.3 },
  { name: "Notebook", receita: 1647800.91, lucro: 386693.22, margem: 23.47 },
  { name: "Tablet", receita: 1646272.9, lucro: 299674.76, margem: 18.2 },
];

const customerTypeData = [
  { name: "Recorrente", vendas: 519, receita: 7853078.63, lucro: 1578620.64, margem: 20.1, atraso: 48.55 },
  { name: "Novo", vendas: 481, receita: 7343039.85, lucro: 1503184.04, margem: 20.47, atraso: 55.51 },
];

const brandData = [
  { name: "Alpha", receita: 4304476, lucro: 944584.34, margem: 21.94 },
  { name: "Gamma", receita: 3811107, lucro: 726318.26, margem: 19.06 },
  { name: "Beta", receita: 3560377, lucro: 731897.15, margem: 20.56 },
  { name: "Delta", receita: 3520158, lucro: 679004.93, margem: 19.29 },
];

const lineData = [
  { name: "Padrão", receita: 5183979, lucro: 1004273, margem: 19.37 },
  { name: "Econômico", receita: 5084052, lucro: 1052582, margem: 20.7 },
  { name: "Premium", receita: 4928087, lucro: 1024950, margem: 20.8 },
];

const discountData = [
  { name: "0% a 5%", receita: 3360463.69, lucro: 1007026.97, margem: 29.97 },
  { name: "5% a 10%", receita: 2729813.81, lucro: 664347.31, margem: 24.34 },
  { name: "10% a 15%", receita: 3435365.48, lucro: 667703.57, margem: 19.44 },
  { name: "15% a 20%", receita: 3335380.14, lucro: 528110.87, margem: 15.83 },
  { name: "Acima de 20%", receita: 2335095.36, lucro: 214616.26, margem: 9.19 },
];

const businessQuestions = [
  {
    question: "Quais regiões geram maior receita e quais apresentam menor margem de lucro?",
    kpis: "Receita total, lucro total e margem de lucro por região.",
  },
  {
    question: "Quais produtos e categorias são mais vendidos e quais geram maior lucro?",
    kpis: "Quantidade vendida, receita total e lucro total por categoria e produto.",
  },
  {
    question: "O canal online apresenta desempenho melhor ou pior que o canal loja?",
    kpis: "Receita, lucro e taxa de atingimento de meta por canal.",
  },
  {
    question: "Quais vendedores possuem melhor desempenho comercial?",
    kpis: "Receita, lucro e taxa de atingimento de meta por vendedor.",
  },
  {
    question: "Clientes recorrentes geram maior receita e lucro do que clientes novos?",
    kpis: "Receita, lucro e ticket médio por tipo de cliente.",
  },
  {
    question: "O nível de desconto concedido impacta negativamente a margem de lucro?",
    kpis: "Desconto médio e margem de lucro.",
  },
  {
    question: "Existe relação entre atraso na entrega e pior desempenho comercial?",
    kpis: "Taxa de entrega, ticket médio e taxa de atingimento de meta.",
  },
  {
    question: "Quais marcas ou linhas de produto apresentam maior contribuição para o lucro total?",
    kpis: "Lucro total por marca e linha de produto.",
  },
];

function toNumber(value: unknown) {
  if (Array.isArray(value)) return toNumber(value[0]);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAxisBRL(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$${formatDecimal(value / 1_000_000, 0)}mi`;
  if (abs >= 1_000) return `R$${formatDecimal(value / 1_000, 0)}mil`;
  return `R$${formatDecimal(value, 0)}`;
}

function CodeText({ children }: { children: React.ReactNode }) {
  return <code className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.78rem] text-slate-100">{children}</code>;
}

function MatrixTable({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`${rowIndex}-${cellIndex}`} className={cellIndex === 0 ? "font-medium text-white" : undefined}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ContentBlock({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass-panel", className)}>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        {description ? <CardDescription className="text-[13px]">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChartBlock({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        <CardDescription className="text-[13px]">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        {footer ? <div className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-muted-foreground">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}

function EvidenceCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "lime" | "violet" | "red";
}) {
  const toneClass = {
    neutral: "border-white/10 bg-white/[0.045]",
    lime: "border-lime-signal/25 bg-lime-signal/10",
    violet: "border-violet-signal/25 bg-violet-signal/10",
    red: "border-red-signal/25 bg-red-signal/10",
  }[tone];

  return (
    <div className={cn("rounded-md border p-4", toneClass)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="metric-number mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-300">{detail}</p>
    </div>
  );
}

function AnalysisNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-slate-200">
      {children}
    </div>
  );
}

function FinancialKpiChart() {
  return (
    <ChartBlock
      title="Escala financeira do projeto"
      description="Receita, lucro e meta total usados como ponto de partida para a leitura executiva."
      footer="A distância entre receita e meta mostra que o volume total ficou abaixo do objetivo, mesmo com lucro positivo."
    >
      <div className="h-[18rem]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={financialKpisData} layout="vertical" margin={{ left: 10, right: 18, top: 8, bottom: 4 }}>
            <CartesianGrid stroke={gridStroke} horizontal={false} />
            <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} tickFormatter={(value) => formatAxisBRL(Number(value))} />
            <YAxis type="category" dataKey="name" width={70} tick={chartTick} axisLine={false} tickLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  title={(label) => String(label ?? "Indicador")}
                  nameFormatter={() => "Valor"}
                  valueFormatter={(value) => formatCompactBRL(toNumber(value))}
                />
              }
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30} isAnimationActive={false}>
              {financialKpisData.map((item) => (
                <Cell key={item.name} fill={item.name === "Lucro" ? lime : item.name === "Meta" ? violet : slate} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartBlock>
  );
}

function Etapa1() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ContentBlock title="Empresa Comercial Insight Ltda." className="xl:min-h-[20rem]">
          <p className="text-base leading-7 text-slate-200">
            A Comercial Insight Ltda. é uma empresa do setor de vendas que comercializa diferentes categorias, linhas e produtos de
            tecnologia, incluindo informática, periféricos, telefonia e outros itens. A operação atua em diferentes regiões do Brasil e
            utiliza dois canais comerciais principais: loja física e online.
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Essa definição é importante porque a análise precisa comparar desempenho por região, canal, produto, cliente e vendedor sem
            reduzir o diagnóstico apenas ao volume de faturamento.
          </p>
        </ContentBlock>

        <ContentBlock title="Desafios apresentados" className="xl:min-h-[20rem]">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Variação no desempenho de vendas entre regiões e períodos.",
              "Redução de margem de lucro em determinadas regiões.",
              "Inconsistências entre canais de venda e resultados financeiros.",
              "Dificuldades em compreender o comportamento dos clientes.",
            ].map((challenge) => (
              <div key={challenge} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm leading-6 text-slate-200">{challenge}</p>
              </div>
            ))}
          </div>
        </ContentBlock>
      </section>

      <ContentBlock title="Problema de negócio" description="Pergunta central que orienta as análises e os filtros do dashboard.">
        <div className="rounded-md border border-lime-signal/25 bg-lime-signal/10 p-5">
          <p className="max-w-4xl text-lg font-medium leading-7 text-white">
            Como utilizar seus dados de vendas para melhorar seu desempenho financeiro e operacional?
          </p>
        </div>
      </ContentBlock>

      <ContentBlock title="Perguntas de negócio e KPIs relacionados" description="Cada pergunta vira uma seção analítica, um gráfico ou um ranking da dashboard.">
        <div className="grid gap-3 lg:grid-cols-2">
          {businessQuestions.map((item, index) => (
            <div key={item.question} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="metric-number rounded border border-violet-signal/25 bg-violet-signal/12 px-2 py-1 text-xs font-semibold text-violet-100">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium leading-5 text-white">{item.question}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.kpis}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContentBlock>
    </div>
  );
}

function Etapa2() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <EvidenceCard label="Registros originais" value="1.020" detail="Volume antes da remoção de duplicidades completas." tone="violet" />
        <EvidenceCard label="Colunas" value="27" detail="Atributos de venda, cliente, produto, canal, entrega e meta." />
        <EvidenceCard label="Período analisado" value="2024" detail="Vendas entre 01/01/2024 e 30/12/2024." tone="lime" />
        <EvidenceCard label="Base tratada" value="1.000" detail="Registros únicos após o tratamento inicial." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ContentBlock title="Tipos de colunas e atributos" description="Classificação usada para decidir como analisar e tratar cada campo.">
          <MatrixTable
            headers={["Categoria", "Tipo de dado", "Atributos"]}
            rows={[
              ["Identificador", "Qualitativo nominal", <CodeText>id_venda</CodeText>],
              ["Temporais", "Time series", <span><CodeText>data</CodeText>, <CodeText>mes</CodeText>, <CodeText>trimestre</CodeText></span>],
              [
                "Categóricas nominais",
                "Qualitativo nominal",
                "cliente, tipo_cliente, segmento, produto, categoria, marca, regiao, cidade, canal_venda, vendedor e status_entrega",
              ],
              ["Categóricas ordinais", "Qualitativo ordinal", "faixa_renda, linha_produto e atingiu_meta"],
              ["Numéricas discretas", "Quantitativo discreto", "quantidade, tempo_relacionamento_meses e prazo_entrega_dias"],
              ["Numéricas contínuas", "Quantitativo contínuo", "preco_unitario, desconto, receita, custo_unitario, lucro e meta_venda"],
            ]}
          />
        </ContentBlock>

        <ChartBlock
          title="Principais inconsistências encontradas"
          description="Quantidade de ocorrências identificadas antes do pré-processamento."
          footer="Valores nulos são o maior problema técnico. Lucro negativo é relevante para gestão, mas foi preservado para análise de rentabilidade."
        >
          <div className="h-[22rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityIssuesData} layout="vertical" margin={{ left: 12, right: 18, top: 4, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} horizontal={false} />
                <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={126} tick={chartTick} axisLine={false} tickLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      title={(label) => String(label ?? "Inconsistência")}
                      nameFormatter={() => "Ocorrências"}
                      valueFormatter={(value) => formatNumber(toNumber(value))}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                  {qualityIssuesData.map((item) => (
                    <Cell key={item.name} fill={item.name === "Lucro negativo" ? red : item.name === "Valores nulos" ? violet : lime} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBlock>
      </section>

      <ContentBlock title="Inconsistências detalhadas">
        <MatrixTable
          headers={["Problema identificado", "Quantidade"]}
          rows={[
            ["Linhas duplicadas", "20"],
            ["IDs de venda duplicados", "20"],
            ["Total de valores nulos", "204"],
            ["Colunas com valores nulos", "faixa_renda, preco_unitario, desconto e custo_unitario"],
            ["Registros com quantidade igual a zero", "10"],
            ["Registros com região Exterior", "30"],
            ["Inconsistências na receita", "10"],
            ["Inconsistências no lucro", "10"],
            ["Datas inválidas", "0"],
            ["Inconsistências em mês e trimestre", "0"],
          ]}
        />
      </ContentBlock>
    </div>
  );
}

function Etapa3() {
  return (
    <div className="space-y-6">
      <ContentBlock title="Antes e depois do tratamento" description="Resumo dos principais ajustes realizados antes da análise.">
        <MatrixTable
          headers={["Problema", "Antes", "Depois"]}
          rows={[
            ["Registros totais", "1.020", "1.000"],
            ["Linhas duplicadas", "20", "0"],
            ["Faixa de renda ausente", "51", "0"],
            ["Preço unitário ausente", "51", "0"],
            ["Desconto ausente", "51", "0"],
            ["Custo unitário ausente", "51", "0"],
            ["Quantidade igual a zero", "10", "0"],
            ["Região inconsistente", "30", "0"],
            ["Receita inconsistente", "10", "0"],
            ["Lucro inconsistente", "10", "0"],
            ["Outliers", "98", "Mantidos"],
            ["Lucro negativo", "126 vendas", "Mantidas"],
          ]}
        />
      </ContentBlock>

      <ContentBlock title="Pré-processamento aplicado">
        <MatrixTable
          headers={["Problema identificado", "Antes do tratamento", "Depois do tratamento", "Como foi tratado"]}
          rows={[
            ["Registros totais", "1.020", "1.000", "Removidas as linhas duplicadas completas, mantendo apenas registros únicos de venda."],
            ["Linhas duplicadas", "20", "0", "Aplicada remoção de duplicidades com base em linhas exatamente iguais."],
            ["Faixa de renda ausente", "51", "0", "Preenchida pela moda de grupos semelhantes, considerando principalmente tipo_cliente e segmento."],
            ["Preço unitário ausente", "51", "0", "Recalculado pela fórmula: preco_unitario = receita / (quantidade * (1 - desconto))."],
            ["Desconto ausente", "51", "0", "Preenchido pela mediana de grupos semelhantes, como produto, categoria e linha de produto."],
            ["Custo unitário ausente", "51", "0", "Recalculado pela fórmula: custo_unitario = (receita - lucro) / quantidade."],
            ["Quantidade = 0", "10", "0", "Recalculada pela fórmula: quantidade = receita / [preço_unitario * (1 - desconto)]."],
            ["Região inconsistente", "30", "0", "Corrigida com base na cidade, usando mapeamento entre cidades brasileiras e regiões geográficas."],
            ["Receita inconsistente", "10", "0", "Corrigida pela fórmula: receita = quantidade * preco_unitario * (1 - desconto)."],
            ["Lucro inconsistente", "10", "0", "Corrigido pela fórmula: lucro = receita - (quantidade * custo_unitario)."],
            ["Outliers", "98", "Mantidos na base", "Não foram removidos, pois podem representar vendas reais de maior valor."],
            ["Lucro negativo", "126 vendas com lucro negativo", "Mantidas na base", "Não foi tratado como erro; foi mantido como alerta de negócio para análise posterior."],
          ]}
        />
      </ContentBlock>
    </div>
  );
}

function Etapa4() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <EvidenceCard label="Total de vendas" value="1.000" detail="Base final usada nas análises." />
        <EvidenceCard label="Margem de lucro" value="20,28%" detail="Rentabilidade geral após custos." tone="lime" />
        <EvidenceCard label="Desconto médio" value="12,82%" detail="Suficiente para exigir política comercial." tone="violet" />
        <EvidenceCard label="Entregas atrasadas" value="51,90%" detail="Taxa elevada para acompanhamento operacional." tone="red" />
      </section>

      <ContentBlock title="4.2.9 Análise de lucro negativo">
        <div className="grid gap-3 sm:grid-cols-2">
          <EvidenceCard label="Receita das vendas negativas" value="R$ 1,59 mi" detail="Volume vendido em transações com lucro abaixo de zero." tone="red" />
          <EvidenceCard label="Prejuízo total" value="R$ -100,84 mil" detail="Perda financeira consolidada nessas vendas." tone="red" />
        </div>
      </ContentBlock>

      <section className="grid gap-6 xl:grid-cols-2">
        <FinancialKpiChart />

        <ChartBlock
          title="Indicadores operacionais"
          description="Meta total, atingimento por venda e atraso de entrega em percentual."
          footer="O cumprimento agregado de meta é 82,80%, mas apenas 7,00% das vendas individuais atingiram meta."
        >
          <div className="h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatingKpisData} layout="vertical" margin={{ left: 8, right: 18, top: 8, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} horizontal={false} />
                <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} tickFormatter={(value) => `${formatDecimal(Number(value), 0)}%`} />
                <YAxis type="category" dataKey="name" width={158} tick={chartTick} axisLine={false} tickLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      title={(label) => String(label ?? "Indicador")}
                      nameFormatter={() => "Percentual"}
                      valueFormatter={(value) => `${formatDecimal(toNumber(value), 2)}%`}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={26} isAnimationActive={false}>
                  {operatingKpisData.map((item) => (
                    <Cell key={item.name} fill={item.name === "Entregas atrasadas" ? red : item.name === "Cumprimento da meta" ? lime : violet} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBlock>
      </section>

      <ContentBlock title="KPIs gerais">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {generalKpiCards.map((item) => (
            <EvidenceCard key={item.label} label={item.label} value={item.value} detail={item.detail} tone={item.tone} />
          ))}
        </div>
      </ContentBlock>

      <ContentBlock title='4.1 Análise descritiva - "Como os dados estão distribuídos?"'>
        <MatrixTable
          headers={["Atributos", "O que foi analisado", "O que foi calculado / gerado", "Para que serviu"]}
          rows={[
            ["Identificador", "id_venda", "Quantidade de IDs únicos, duplicados e sequência dos registros", "Confirmar unicidade e consistência da identificação das vendas"],
            ["Atributos temporais", "data, mês e trimestre", "Período da base, volume mensal, volume trimestral, vendas por dia da semana e série diária", "Entender como as vendas se distribuem ao longo do tempo"],
            ["Atributos qualitativos", "Cliente, produto, canal, vendedor, entrega, faixa de renda e demais categorias", "Valores únicos, moda, frequência absoluta, frequência relativa e frequência acumulada", "Entender a composição da base e as categorias mais frequentes"],
            ["Atributos quantitativos", "Quantidade, relacionamento, prazo, preço, desconto, receita, custo, lucro e meta", "Média, mediana, moda, mínimo, máximo, amplitude, desvio padrão, quartis, IQR, assimetria e curtose", "Entender a distribuição numérica e identificar variações relevantes"],
          ]}
        />
      </ContentBlock>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartBlock
          title="Margem por região"
          description="A diferença entre regiões existe, mas deve ser lida com proporção."
          footer="Sul tem a maior margem, enquanto Centro-Oeste combina alta receita com margem menor."
        >
          <div className="h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} />
                <YAxis tick={chartTick} axisLine={false} tickLine={false} tickFormatter={(value) => `${formatDecimal(Number(value), 0)}%`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      title={(label) => `Região: ${String(label ?? "")}`}
                      nameFormatter={() => "Margem"}
                      valueFormatter={(value) => `${formatDecimal(toNumber(value), 2)}%`}
                    />
                  }
                />
                <Bar dataKey="margem" radius={[4, 4, 0, 0]} barSize={42} isAnimationActive={false}>
                  {regionalData.map((item) => (
                    <Cell key={item.name} fill={item.name === "Centro-Oeste" ? red : item.name === "Sul" ? lime : violet} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBlock>

        <ChartBlock
          title="Canal de venda"
          description="Online tem mais receita e lucro; loja tem margem levemente maior."
          footer="A diferença de margem é pequena: 20,85% na loja contra 19,78% no online."
        >
          <div className="h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} />
                <YAxis tick={chartTick} axisLine={false} tickLine={false} tickFormatter={formatCompactBRL} width={74} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      title={(label) => `Canal: ${String(label ?? "")}`}
                      nameFormatter={(name) => (name === "receita" ? "Receita" : "Lucro")}
                      valueFormatter={(value) => formatCompactBRL(toNumber(value))}
                    />
                  }
                />
                <Bar dataKey="receita" name="receita" fill={violet} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="lucro" name="lucro" fill={lime} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBlock>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ContentBlock title="4.2.1 Análise por região">
          <MatrixTable
            headers={["Região", "Receita", "Lucro", "Margem", "Taxa de meta", "Taxa de atraso"]}
            rows={regionalData.map((item) => [
              item.name,
              formatCompactBRL(item.receita),
              formatCompactBRL(item.lucro),
              `${formatDecimal(item.margem, 2)}%`,
              `${formatDecimal(item.meta, 2)}%`,
              `${formatDecimal(item.atraso, 2)}%`,
            ])}
          />
        </ContentBlock>

        <ContentBlock title="4.2.2 Análise por canal de venda">
          <MatrixTable
            headers={["Canal", "Vendas", "Receita", "Lucro", "Margem", "Taxa de meta", "Taxa de atraso"]}
            rows={channelData.map((item) => [
              item.name,
              formatNumber(item.vendas),
              formatCompactBRL(item.receita),
              formatCompactBRL(item.lucro),
              `${formatDecimal(item.margem, 2)}%`,
              `${formatDecimal(item.meta, 2)}%`,
              `${formatDecimal(item.atraso, 2)}%`,
            ])}
          />
        </ContentBlock>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartBlock
          title="Receita e lucro por categoria"
          description="Informática concentra a maior receita e também o maior lucro absoluto."
          footer="A categoria Outros tem menor escala e menor margem, portanto deve ser analisada separadamente antes de qualquer decisão de corte."
        >
          <div className="h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} />
                <YAxis tick={chartTick} axisLine={false} tickLine={false} tickFormatter={formatCompactBRL} width={74} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      title={(label) => `Categoria: ${String(label ?? "")}`}
                      nameFormatter={(name) => (name === "receita" ? "Receita" : "Lucro")}
                      valueFormatter={(value) => formatCompactBRL(toNumber(value))}
                    />
                  }
                />
                <Bar dataKey="receita" name="receita" fill={violet} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="lucro" name="lucro" fill={lime} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBlock>

        <ChartBlock
          title="Margem por produto"
          description="Produtos com receita alta nem sempre são os mais rentáveis."
          footer="Notebook, Impressora e Teclado aparecem com margens superiores às de Monitor e Tablet."
        >
          <div className="h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} layout="vertical" margin={{ left: 14, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} horizontal={false} />
                <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} tickFormatter={(value) => `${formatDecimal(Number(value), 0)}%`} />
                <YAxis type="category" dataKey="name" width={86} tick={chartTick} axisLine={false} tickLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      title={(label) => `Produto: ${String(label ?? "")}`}
                      nameFormatter={() => "Margem"}
                      valueFormatter={(value) => `${formatDecimal(toNumber(value), 2)}%`}
                    />
                  }
                />
                <Bar dataKey="margem" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
                  {productData.map((item) => (
                    <Cell key={item.name} fill={item.margem >= 21 ? lime : item.margem < 18.5 ? red : violet} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBlock>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ContentBlock title="4.2.3 Análise por categoria">
          <MatrixTable
            headers={["Categoria", "Receita", "Lucro", "Margem"]}
            rows={categoryData.map((item) => [item.name, formatCompactBRL(item.receita), formatCompactBRL(item.lucro), `${formatDecimal(item.margem, 2)}%`])}
          />
        </ContentBlock>

        <ContentBlock title="4.2.4 Análise por produto">
          <MatrixTable
            headers={["Produto", "Receita", "Lucro", "Margem"]}
            rows={productData.map((item) => [item.name, formatCompactBRL(item.receita), formatCompactBRL(item.lucro), `${formatDecimal(item.margem, 2)}%`])}
          />
        </ContentBlock>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ContentBlock title="4.2.5 Análise por tipo de cliente">
          <MatrixTable
            headers={["Tipo de cliente", "Vendas", "Receita", "Lucro", "Margem", "Taxa de atraso"]}
            rows={customerTypeData.map((item) => [
              item.name,
              formatNumber(item.vendas),
              formatCompactBRL(item.receita),
              formatCompactBRL(item.lucro),
              `${formatDecimal(item.margem, 2)}%`,
              `${formatDecimal(item.atraso, 2)}%`,
            ])}
          />
          <AnalysisNote>
            Clientes recorrentes têm maior receita total por volume, enquanto clientes novos mostram margem ligeiramente maior. A diferença
            de margem é pequena, então a leitura correta é de equilíbrio, não de superioridade forte.
          </AnalysisNote>
        </ContentBlock>

        <ContentBlock title="4.2.6 Análise por marca e linha de produto">
          <div className="space-y-5">
            <MatrixTable
              headers={["Marca", "Receita", "Lucro", "Margem"]}
              rows={brandData.map((item) => [item.name, formatCompactBRL(item.receita), formatCompactBRL(item.lucro), `${formatDecimal(item.margem, 2)}%`])}
            />
            <MatrixTable
              headers={["Linha de produto", "Receita", "Lucro", "Margem"]}
              rows={lineData.map((item) => [item.name, formatCompactBRL(item.receita), formatCompactBRL(item.lucro), `${formatDecimal(item.margem, 2)}%`])}
            />
          </div>
        </ContentBlock>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartBlock
          title="Desconto vs margem"
          description="A queda de margem acompanha o aumento da faixa de desconto."
          footer="Aqui a diferença é material: a margem cai de 29,97% para 9,19% entre as faixas extremas."
        >
          <div className="h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={discountData} margin={{ left: 0, right: 18, top: 8, bottom: 4 }}>
                <CartesianGrid stroke={gridStroke} />
                <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={chartTick} axisLine={false} tickLine={false} tickFormatter={formatCompactBRL} width={74} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${formatDecimal(Number(value), 0)}%`}
                  width={44}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      title={(label) => `Faixa: ${String(label ?? "")}`}
                      nameFormatter={(name) => (name === "lucro" ? "Lucro" : "Margem")}
                      valueFormatter={(value, name) => (name === "lucro" ? formatCompactBRL(toNumber(value)) : `${formatDecimal(toNumber(value), 2)}%`)}
                    />
                  }
                />
                <Bar yAxisId="left" dataKey="lucro" name="lucro" fill={lime} radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="margem"
                  name="margem"
                  stroke={red}
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartBlock>

        <ContentBlock title="4.2.7 Análise por desconto">
          <MatrixTable
            headers={["Faixa de desconto", "Receita", "Lucro", "Margem"]}
            rows={discountData.map((item) => [item.name, formatCompactBRL(item.receita), formatCompactBRL(item.lucro), `${formatDecimal(item.margem, 2)}%`])}
          />
        </ContentBlock>
      </section>

    </div>
  );
}

function SchemaNode({
  title,
  description,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  description: string;
  icon: typeof BriefcaseBusiness;
  tone?: "neutral" | "lime" | "violet";
}) {
  const toneClass = {
    neutral: "border-white/10 bg-white/[0.04] text-slate-300",
    lime: "border-lime-signal/25 bg-lime-signal/10 text-lime-signal",
    violet: "border-violet-signal/25 bg-violet-signal/10 text-violet-100",
  }[tone];

  return (
    <div className={cn("rounded-md border p-4", toneClass)}>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
        <p className="font-mono text-sm font-semibold text-white">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-300">{description}</p>
    </div>
  );
}

function Etapa5() {
  return (
    <div className="space-y-6">
      <ContentBlock title="Grão da tabela fato" description="Unidade mínima de análise do modelo.">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <p className="text-base leading-7 text-slate-200">
            Cada linha da tabela fato representa uma venda individual realizada pela empresa. Essa definição garante que receita, lucro,
            desconto, meta e entrega sejam calculados a partir da mesma unidade de análise.
          </p>
          <pre className="overflow-x-auto rounded-md border border-lime-signal/25 bg-lime-signal/10 p-5 font-mono text-sm text-slate-100">
            1 linha = 1 venda = 1 id_venda
          </pre>
        </div>
      </ContentBlock>

      <ContentBlock title="Esquema estrela" description="Tabela fato no centro, dimensões ao redor para orientar filtros, rankings e cruzamentos.">
        <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr_1fr] xl:items-stretch">
          <div className="grid gap-3">
            <SchemaNode title="dim_tempo" description="Data, mês, trimestre, semestre e ano para leitura temporal." icon={Database} />
            <SchemaNode title="dim_cliente" description="Tipo de cliente, faixa de renda e segmento para entender perfil de compra." icon={BriefcaseBusiness} />
            <SchemaNode title="dim_produto" description="Produto, categoria, marca e linha para comparar mix e rentabilidade." icon={Network} />
          </div>

          <div className="rounded-lg border border-lime-signal/35 bg-lime-signal/12 p-6 shadow-glass">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="success">Tabela fato</Badge>
              <span className="font-mono text-xs text-lime-signal">fato_vendas</span>
            </div>
            <h3 className="mt-5 font-mono text-2xl font-semibold tracking-tight text-white">fato_vendas</h3>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Concentra as métricas transacionais da venda e recebe chaves para cruzamento com tempo, cliente, produto, geografia, canal,
              vendedor e entrega.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {["quantidade", "preco_unitario", "desconto", "receita", "custo_unitario", "lucro", "meta_venda", "atingiu_meta_flag", "prazo_entrega_dias"].map(
                (field) => (
                  <div key={field} className="rounded border border-white/10 bg-slate-950/35 px-3 py-2 font-mono text-xs text-slate-100">
                    {field}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <SchemaNode title="dim_geografia" description="Cidade e região para localizar diferenças de receita, margem e atraso." icon={GitBranch} />
            <SchemaNode title="dim_canal" description="Comparação entre loja e online em receita, lucro, meta e entrega." icon={Target} />
            <SchemaNode title="dim_vendedor" description="Avaliação comercial individual por receita, lucro, margem e meta." icon={BarChart3} />
            <SchemaNode title="dim_entrega" description="Status e prazo de entrega para acompanhar impacto operacional." icon={TriangleAlert} tone="violet" />
          </div>
        </div>
      </ContentBlock>

      <section className="grid gap-6 xl:grid-cols-2">
        <ContentBlock title="5.1 Tabela fato">
          <MatrixTable
            headers={["Campo", "Descrição"]}
            rows={[
              [<CodeText>quantidade</CodeText>, "Quantidade vendida"],
              [<CodeText>preco_unitario</CodeText>, "Preço unitário"],
              [<CodeText>desconto</CodeText>, "Percentual de desconto"],
              [<CodeText>receita</CodeText>, "Receita da venda"],
              [<CodeText>custo_unitario</CodeText>, "Custo unitário"],
              [<CodeText>lucro</CodeText>, "Lucro da venda"],
              [<CodeText>meta_venda</CodeText>, "Meta associada"],
              [<CodeText>atingiu_meta_flag</CodeText>, "Indicador binário de meta"],
              [<CodeText>prazo_entrega_dias</CodeText>, "Prazo de entrega"],
            ]}
          />
        </ContentBlock>

        <ContentBlock title="5.2 Dimensões">
          <MatrixTable
            headers={["Dimensão", "Finalidade"]}
            rows={[
              [<CodeText>dim_tempo</CodeText>, "Analisar vendas por data, mês, trimestre, semestre e ano"],
              [<CodeText>dim_cliente</CodeText>, "Analisar tipo de cliente, faixa de renda e segmento"],
              [<CodeText>dim_produto</CodeText>, "Analisar produto, categoria, marca e linha"],
              [<CodeText>dim_geografia</CodeText>, "Analisar cidade e região"],
              [<CodeText>dim_canal</CodeText>, "Comparar loja e online"],
              [<CodeText>dim_vendedor</CodeText>, "Avaliar desempenho comercial individual"],
              [<CodeText>dim_entrega</CodeText>, "Analisar status da entrega"],
            ]}
          />
        </ContentBlock>
      </section>
    </div>
  );
}

function renderStage(id: StageId) {
  if (id === "etapa1") return <Etapa1 />;
  if (id === "etapa2") return <Etapa2 />;
  if (id === "etapa3") return <Etapa3 />;
  if (id === "etapa4") return <Etapa4 />;
  return <Etapa5 />;
}

export function PresentationView() {
  const [activeStageId, setActiveStageId] = React.useState<StageId>("etapa1");
  const activeStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];
  const ActiveIcon = stageIcons[activeStage.id];

  return (
    <div className="space-y-6">
      <header>
        <Badge variant="violet">Etapas do projeto</Badge>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
          Roteiro de apresentação do projeto de BI.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          Estrutura organizada por etapa: entendimento do negócio, diagnóstico, pré-processamento, análise de dados e modelagem para BI.
        </p>
      </header>

      <div className="glass-panel sticky top-3 z-20 rounded-lg p-3">
        <Tabs
          items={stages.map((stage) => ({ value: stage.id, label: `${stage.step}: ${stage.title}` }))}
          value={activeStage.id}
          onValueChange={(value) => setActiveStageId(value as StageId)}
          className="w-full"
        />
      </div>

      <Card className="glass-panel p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-lime-signal/25 bg-lime-signal/12 p-3 text-lime-signal">
              <ActiveIcon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div>
              <Badge>{activeStage.step}</Badge>
              <p className="mt-2 text-lg font-semibold text-white">{activeStage.title}</p>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{activeStage.summary}</p>
        </div>
      </Card>

      <section>{renderStage(activeStage.id)}</section>
    </div>
  );
}
