# Projeto de Business Intelligence — Comercial Insight Ltda.

Este repositório contém o desenvolvimento de um projeto acadêmico de **Business Intelligence e Análise de Dados**, utilizando uma base de vendas da empresa fictícia **Comercial Insight Ltda.**

O objetivo do projeto é transformar dados brutos em informações úteis para tomada de decisão, passando por etapas de entendimento do negócio, diagnóstico dos dados, pré-processamento, análise estatística, modelagem dimensional, geração de insights e visualizações.

---

## Objetivo do Projeto

O projeto busca responder perguntas de negócio relacionadas a:

- desempenho de vendas por região;
- desempenho por produto e categoria;
- comparação entre canais de venda;
- análise da equipe comercial;
- comportamento de clientes novos e recorrentes;
- impacto dos descontos na margem de lucro;
- relação entre atrasos de entrega e desempenho comercial;
- contribuição de marcas e linhas de produto para o lucro.

---

## Estrutura de Arquivos

```text
projeto-bi/
|
├── outputs_etapa7/
|   ├── analise_canal.csv
|   ├── analise_categoria.csv
|   ├── analise_desconto.csv
|   ├── analise_entrega.csv
|   ├── analise_linha_produto.csv
|   ├── analise_marca.csv
|   ├── analise_produto.csv
|   ├── analise_regiao.csv
|   ├── analise_tipo_cliente.csv
|   ├── analise_vendedor.csv
│   ├── insights_executivos.csv
│   ├── kpis_finais.csv
│   ├── matriz_decisao.csv
│   ├── plano_acao.csv
│   ├── respostas_perguntas_negocio.csv
│   └── resumo_pareto.csv
|
├── tabelas-dimensao/
|   ├── dim_canal.csv
|   ├── dim_cliente.csv
|   ├── dim_entrega.csv
|   ├── dim_geografia.csv
|   ├── dim_produto.csv
|   ├── dim_tempo.csv
|   ├── dim_vendedor.csv
│
├── dados-empresa.csv
├── dados_empresa_tratado.csv
│
├── etapa_1.ipynb (entendimento do negocio)
├── etapa_2.ipynb (diagnostico dos dados)
├── etapa_3.ipynb (pre-processamento)
├── etapa_4.ipynb (análise de dados)
├── etapa_5.ipynb (modelagem BI)
├── etapa_7.ipynb (insights e decisões)
│
├── fato_vendas.csv
├── tabela-fato-diagrama.png
└── README.md