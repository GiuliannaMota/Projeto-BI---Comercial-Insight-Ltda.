# Projeto de Business Intelligence - Comercial Insight Ltda.

Este repositório contém o desenvolvimento de um projeto acadêmico de **Business Intelligence e Análise de Dados** usando uma base de vendas da empresa fictícia **Comercial Insight Ltda.**

O objetivo do projeto é transformar dados comerciais em informações úteis para tomada de decisão, passando por entendimento do negócio, diagnóstico dos dados, pré-processamento, análise estatística, modelagem dimensional, geração de insights e visualizações.

## Objetivo do Projeto

O projeto busca responder perguntas de negócio relacionadas a:

- desempenho de vendas por região;
- desempenho por produto, marca, linha e categoria;
- comparação entre canais de venda;
- análise da equipe comercial;
- comportamento de clientes novos e recorrentes;
- impacto dos descontos na margem de lucro;
- relação entre atrasos de entrega e desempenho comercial;
- contribuição de marcas e linhas de produto para o lucro.

## Estrutura do Projeto

```text
Projeto-BI---Comercial-Insight-Ltda/
|-- README.md
|-- .gitignore
|-- dados_empresa_tratado.csv
|
|-- etapas-de-analise/
|   |-- etapa-1.ipynb        # entendimento do negócio
|   |-- etapa-2.ipynb        # diagnóstico dos dados
|   |-- etapa-3.ipynb        # pré-processamento
|   |-- etapa-4.ipynb        # análise de dados
|   |-- etapa-5.ipynb        # modelagem BI
|   |-- etapa-7.ipynb        # insights e decisões
|
|-- tabelas-dimensao/
|   |-- dim_canal.csv
|   |-- dim_cliente.csv
|   |-- dim_entrega.csv
|   |-- dim_geografia.csv
|   |-- dim_produto.csv
|   |-- dim_tempo.csv
|   |-- dim_vendedor.csv
|
|-- outputs_etapa7/
|   |-- analise_canal.csv
|   |-- analise_categoria.csv
|   |-- analise_desconto.csv
|   |-- analise_entrega.csv
|   |-- analise_linha_produto.csv
|   |-- analise_marca.csv
|   |-- analise_produto.csv
|   |-- analise_regiao.csv
|   |-- analise_tipo_cliente.csv
|   |-- analise_vendedor.csv
|   |-- insights_executivos.csv
|   |-- kpis_finais.csv
|   |-- matriz_decisao.csv
|   |-- plano_acao.csv
|   |-- respostas_perguntas_negocio.csv
|   |-- resumo_pareto.csv
|
|-- dashboard-web/           # aplicação web do dashboard em React/Vite
```

## Organização das Pastas

- `etapas-de-analise/`: notebooks organizados por etapa do projeto.
- `tabelas-dimensao/`: tabelas dimensionais geradas na etapa de modelagem BI.
- `outputs_etapa7/`: arquivos CSV finais com KPIs, análises, respostas de negócio, matriz de decisão e plano de ação.
- `dashboard-web/`: aplicação web usada para apresentar o dashboard e a documentação visual do projeto.

## Observação

Os CSVs de `tabelas-dimensao/` e `outputs_etapa7/` fazem parte dos artefatos finais do projeto e devem permanecer versionados no repositório.
