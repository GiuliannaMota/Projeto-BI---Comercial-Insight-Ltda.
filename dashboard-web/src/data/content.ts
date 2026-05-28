import type { PresentationStage } from "./types";

export const kpiFormulaRows = [
  ["Receita Total", "Soma de receita", "Mede o volume financeiro anual vendido."],
  ["Lucro Total", "Soma de lucro", "Mostra o resultado financeiro liquido."],
  ["Margem de Lucro", "lucro total / receita total", "Avalia a eficiencia financeira."],
  ["Cumprimento da Meta", "receita total / meta total", "Compara resultado realizado contra objetivo."],
  ["Atrasos", "vendas atrasadas / total de vendas", "Conecta desempenho comercial com logistica."],
  ["Desconto Medio", "media de desconto", "Monitora risco de erosao de margem."],
  ["Ticket Medio", "receita total / numero de vendas", "Indica valor medio por transacao."],
  ["Lucro Negativo", "vendas com lucro < 0", "Alerta de destruicao de valor."],
];

export const inconsistencyRows = [
  ["Valores ausentes", "51 registros com nulos em faixa_renda, preco_unitario, desconto e custo_unitario", "Distorcao de margem, preco, desconto e perfil."],
  ["Duplicidades", "20 linhas completamente duplicadas", "Superestimacao de receita, lucro e quantidade."],
  ["IDs duplicados", "20 duplicidades em id_venda", "Violacao da unicidade da transacao."],
  ["Quantidade igual a zero", "10 vendas com quantidade zero e valores financeiros positivos", "Erro grave para volume, ticket e formulas."],
  ["Regiao Exterior", "30 registros com cidades brasileiras", "Distorcao geografica nas analises regionais."],
  ["Lucro negativo", "126 registros na base bruta", "Alerta de negocio, nao erro automatico."],
];

export const treatmentRows = [
  ["Duplicidades", "1020 registros para 1000", "Remocao de linhas totalmente duplicadas."],
  ["Faixa de renda ausente", "51 nulos para 0", "Preenchimento pela moda de grupos semelhantes."],
  ["Preco unitario ausente", "51 nulos para 0", "Recalculo por receita / quantidade / (1 - desconto)."],
  ["Desconto ausente", "51 nulos para 0", "Preenchimento pela mediana de produto, categoria e linha."],
  ["Custo unitario ausente", "51 nulos para 0", "Recalculo por (receita - lucro) / quantidade."],
  ["Quantidade invalida", "10 casos para 0", "Recalculo por receita / preco unitario / (1 - desconto)."],
  ["Regiao inconsistente", "30 casos para 0", "Correcao por mapeamento cidade-regiao."],
  ["Outliers e lucro negativo", "Mantidos", "Tratados como eventos reais para monitoramento."],
];

export const dimensionalRows = [
  ["Fato", "fato_vendas", "id_venda, ids dimensionais, receita, lucro, quantidade, desconto, meta"],
  ["Tempo", "dim_tempo", "data, mes, trimestre, periodo de 2024"],
  ["Produto", "dim_produto", "produto, categoria, marca, linha_produto"],
  ["Geografia", "dim_geografia", "regiao e cidade"],
  ["Canal", "dim_canal", "Online e Loja"],
  ["Cliente", "dim_cliente", "cliente, tipo_cliente, segmento, faixa_renda"],
  ["Vendedor", "dim_vendedor", "vendedor"],
  ["Entrega", "dim_entrega", "prazo_entrega_dias e status_entrega"],
];

export const businessQuestions = [
  "A empresa esta crescendo com rentabilidade?",
  "Quais regioes, canais e produtos sustentam ou prejudicam o resultado?",
  "Os descontos estao protegendo ou destruindo margem?",
  "A execucao comercial esta alinhada as metas?",
  "A operacao logistica esta afetando o desempenho comercial?",
];

export const decisionRows = [
  ["Curto prazo", "Criar alerta para vendas com lucro negativo", "Evitar vendas que geram prejuizo.", "Alta"],
  ["Curto prazo", "Bloquear ou exigir aprovacao para descontos acima de 20%", "Reduzir perda de margem.", "Alta"],
  ["Curto prazo", "Monitorar atraso por canal e regiao", "Identificar gargalos operacionais.", "Alta"],
  ["Medio prazo", "Recalibrar metas por produto, regiao, canal e vendedor", "Tornar metas aderentes ao historico.", "Alta"],
  ["Medio prazo", "Revisar mix de produtos do Centro-Oeste", "Melhorar rentabilidade regional.", "Media"],
  ["Longo prazo", "Implantar dashboard recorrente de BI", "Acompanhar KPIs como rotina de gestao.", "Alta"],
];

export const documentationSections = [
  {
    step: "Etapa 1",
    title: "Entendimento do negocio",
    body:
      "A Comercial Insight Ltda. vende produtos de tecnologia em todo o Brasil por canais online e loja. O problema de BI foi definido como uma investigacao sobre quais regioes, produtos, canais, clientes e vendedores contribuem ou prejudicam receita, lucro, margem, metas, descontos e entregas.",
  },
  {
    step: "Etapa 2",
    title: "Diagnostico dos dados",
    body:
      "A base bruta possuia 1.020 registros e 27 atributos. O diagnostico separou inconsistencias tecnicas, como duplicidades e quantidade zero, de sinais de negocio, como lucro negativo e possiveis outliers financeiros.",
  },
  {
    step: "Etapa 3",
    title: "Pre-processamento",
    body:
      "O tratamento removeu duplicidades, corrigiu regioes, recalculou campos financeiros quando havia suporte matematico e preservou outliers relevantes para analise. A base final possui 1.000 vendas tratadas.",
  },
  {
    step: "Etapa 4",
    title: "Analise descritiva e analitica",
    body:
      "As analises cruzaram receita, lucro, margem, quantidade, meta, desconto e atraso por produto, categoria, canal, vendedor, tipo de cliente, regiao, marca e linha de produto. A interpretacao priorizou margem e lucro, nao apenas faturamento.",
  },
  {
    step: "Etapa 5",
    title: "Modelagem dimensional",
    body:
      "A modelagem organizou uma tabela fato de vendas conectada a dimensoes de tempo, produto, geografia, canal, cliente, vendedor e entrega. Essa estrutura sustenta perguntas de negocio recorrentes e filtros executivos.",
  },
  {
    step: "Etapa 7",
    title: "Insights e recomendacoes",
    body:
      "Os outputs finais consolidaram KPIs, Pareto, matriz de decisao, respostas de negocio e plano de acao. A leitura executiva aponta baixa aderencia a metas, atraso logistico alto, descontos com impacto negativo e 123 vendas com lucro negativo.",
  },
];

export const presentationStages: PresentationStage[] = [
  {
    id: "entendimento",
    step: "Etapa 1",
    title: "Entendimento",
    narrative:
      "Abrir a apresentacao conectando o projeto ao problema central: transformar vendas em decisoes sobre rentabilidade, metas e operacao.",
    talkingPoints: [
      "Empresa ficticia de tecnologia com atuacao nacional.",
      "Canais Online e Loja atendem clientes novos e recorrentes.",
      "Pergunta central: como melhorar desempenho financeiro e operacional usando dados.",
    ],
    evidence: [
      { label: "Periodo", value: "2024", tone: "violet" },
      { label: "Vendas tratadas", value: "1.000", tone: "lime" },
      { label: "Dimensoes", value: "7", tone: "violet" },
    ],
    visual: "Mapa de cobertura nacional e lista de perguntas de negocio.",
    conclusion: "A analise foi orientada por decisoes, nao apenas por descricao de vendas.",
  },
  {
    id: "diagnostico",
    step: "Etapa 2",
    title: "Diagnostico",
    narrative:
      "Mostrar que a base precisava de confiabilidade antes de gerar indicadores executivos.",
    talkingPoints: [
      "Foram encontrados nulos, duplicidades, regioes inconsistentes e quantidade zero.",
      "Lucro negativo foi tratado como alerta de negocio, nao como erro automatico.",
      "Outliers financeiros foram preservados para evitar apagar vendas reais.",
    ],
    evidence: [
      { label: "Base bruta", value: "1.020", tone: "violet" },
      { label: "Duplicadas", value: "20", tone: "red" },
      { label: "Nulos por campo critico", value: "51", tone: "red" },
    ],
    visual: "Tabela de inconsistencias com risco para BI.",
    conclusion: "A qualidade dos dados foi tratada antes da narrativa executiva.",
  },
  {
    id: "preprocessamento",
    step: "Etapa 3",
    title: "Pre-processamento",
    narrative:
      "Explicar as correcoes e por que elas preservam o sentido do negocio.",
    talkingPoints: [
      "Duplicidades foram removidas para evitar inflar KPIs.",
      "Campos financeiros foram recalculados com formulas auditaveis.",
      "Regioes foram corrigidas a partir das cidades brasileiras.",
    ],
    evidence: [
      { label: "Base final", value: "1.000 vendas", tone: "lime" },
      { label: "Regioes corrigidas", value: "30", tone: "lime" },
      { label: "Outliers", value: "Mantidos", tone: "violet" },
    ],
    visual: "Fluxo antes-depois do tratamento.",
    conclusion: "A base final ficou consistente sem remover sinais comerciais importantes.",
  },
  {
    id: "analise",
    step: "Etapa 4",
    title: "Analise",
    narrative:
      "Conduzir a historia pelos achados: resultado positivo no agregado, mas com riscos claros em metas, descontos e entrega.",
    talkingPoints: [
      "Receita e lucro totais sao saudaveis no agregado.",
      "Apenas 7% das vendas atingiram meta individual.",
      "Mais da metade das entregas atrasou.",
    ],
    evidence: [
      { label: "Receita", value: "R$ 15,20 mi", tone: "lime" },
      { label: "Margem", value: "20,28%", tone: "lime" },
      { label: "Atrasos", value: "51,90%", tone: "red" },
    ],
    visual: "KPIs, serie temporal, mapa regional e dispersao desconto x margem.",
    conclusion: "O desempenho existe, mas a execucao comercial e operacional precisa de controle.",
  },
  {
    id: "modelagem",
    step: "Etapa 5",
    title: "Modelagem",
    narrative:
      "Mostrar que o projeto nao termina em graficos; ele cria uma estrutura reutilizavel de BI.",
    talkingPoints: [
      "Tabela fato concentra medidas financeiras e comerciais.",
      "Dimensoes permitem filtros consistentes por tempo, produto, geografia, canal, cliente, vendedor e entrega.",
      "A modelagem facilita manutencao e novas perguntas.",
    ],
    evidence: [
      { label: "Fato", value: "Vendas", tone: "violet" },
      { label: "Dimensoes", value: "7 tabelas", tone: "lime" },
      { label: "Grao", value: "id_venda", tone: "violet" },
    ],
    visual: "Esquema estrela com fato_vendas ao centro.",
    conclusion: "A modelagem transforma uma planilha em uma base analitica escalavel.",
  },
  {
    id: "insights",
    step: "Etapa 7",
    title: "Insights",
    narrative:
      "Fechar com decisoes recomendadas e prioridades de gestao.",
    talkingPoints: [
      "Descontos elevados reduzem margem e precisam de politica de aprovacao.",
      "Vendas com lucro negativo devem gerar alerta antes de serem fechadas.",
      "Sul e categorias de maior lucro podem orientar boas praticas.",
    ],
    evidence: [
      { label: "Lucro negativo", value: "123 vendas", tone: "red" },
      { label: "Cumprimento meta", value: "82,80%", tone: "red" },
      { label: "Plano de acao", value: "9 acoes", tone: "lime" },
    ],
    visual: "Matriz de prioridade e plano de acao executivo.",
    conclusion: "A recomendacao e criar governanca de margem, metas e atrasos como rotina.",
  },
];
