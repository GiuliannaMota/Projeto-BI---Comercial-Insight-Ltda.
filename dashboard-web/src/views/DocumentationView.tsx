import { BookOpen, CheckCircle2, Database, FileBarChart, GitBranch, ListChecks } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { outputTables } from "../data/catalog";
import {
  businessQuestions,
  dimensionalRows,
  documentationSections,
  inconsistencyRows,
  kpiFormulaRows,
  treatmentRows,
} from "../data/content";
import type { CsvObject } from "../data/types";

function MatrixTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
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
          {rows.map((row) => (
            <TableRow key={row.join("-")}>
              {row.map((cell, index) => (
                <TableCell key={`${cell}-${index}`} className={index === 0 ? "font-medium text-white" : undefined}>
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

function GenericCsvTable({ rows, limit = rows.length }: { rows: CsvObject[]; limit?: number }) {
  const headers = Object.keys(rows[0] ?? {});
  if (!headers.length) return <p className="text-sm text-muted-foreground">Sem dados disponiveis.</p>;

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
          {rows.slice(0, limit).map((row, index) => (
            <TableRow key={index}>
              {headers.map((header, cellIndex) => (
                <TableCell key={header} className={cellIndex === 0 ? "font-medium text-white" : undefined}>
                  {row[header]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DocumentationView() {
  return (
    <div className="space-y-6">
      <header className="grid gap-4 lg:grid-cols-[1fr_24rem] lg:items-end">
        <div>
          <Badge variant="violet">Documentacao analitica</Badge>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Como a base virou uma leitura confiavel de negocio.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            Sintese das etapas, formulas, decisoes de tratamento, modelo dimensional e evidencias finais usadas na dashboard.
          </p>
        </div>
        <Card className="glass-panel p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Escopo documentado</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              ["Etapas", "1-5 + 7"],
              ["Vendas", "1.000"],
              ["KPIs", "9"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-white/10 bg-white/[0.045] p-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {documentationSections.map((section, index) => {
          const icons = [BookOpen, FileBarChart, ListChecks, Database, GitBranch, CheckCircle2];
          const Icon = icons[index] ?? BookOpen;
          return (
            <Card key={section.step} className="glass-panel">
              <CardHeader>
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-md border border-violet-signal/25 bg-violet-signal/12 p-2 text-violet-100">
                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                  </div>
                  <Badge>{section.step}</Badge>
                </div>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>KPIs, formulas e objetivo</CardTitle>
          <CardDescription>Indicadores priorizados para evitar uma leitura baseada apenas em faturamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <MatrixTable headers={["KPI", "Logica / formula", "Objetivo"]} rows={kpiFormulaRows} />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Inconsistencias diagnosticadas</CardTitle>
            <CardDescription>Problemas da base bruta e risco analitico associado.</CardDescription>
          </CardHeader>
          <CardContent>
            <MatrixTable headers={["Problema", "Evidencia", "Risco"]} rows={inconsistencyRows} />
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Tratamentos aplicados</CardTitle>
            <CardDescription>Decisoes tecnicas que deram origem a base tratada.</CardDescription>
          </CardHeader>
          <CardContent>
            <MatrixTable headers={["Item", "Antes / depois", "Tratamento"]} rows={treatmentRows} />
          </CardContent>
        </Card>
      </section>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Modelo dimensional</CardTitle>
          <CardDescription>Estrutura estrela usada para sustentar filtros e analises recorrentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <MatrixTable headers={["Tipo", "Tabela", "Campos principais"]} rows={dimensionalRows} />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Perguntas de negocio</CardTitle>
            <CardDescription>As cinco perguntas que estruturam a hierarquia visual.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {businessQuestions.map((question, index) => (
                <li key={question} className="flex gap-3 rounded-md border border-white/10 bg-white/[0.045] p-3 text-sm text-slate-200">
                  <span className="metric-number text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>KPIs finais validados</CardTitle>
            <CardDescription>Valores de `outputs_etapa7/kpis_finais.csv` usados como referencia executiva.</CardDescription>
          </CardHeader>
          <CardContent>
            <GenericCsvTable rows={outputTables.finalKpis} />
          </CardContent>
        </Card>
      </section>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Respostas das perguntas de negocio</CardTitle>
          <CardDescription>Resumo dos achados finais documentados na etapa 7.</CardDescription>
        </CardHeader>
        <CardContent>
          <GenericCsvTable rows={outputTables.businessAnswers} />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Matriz de decisao</CardTitle>
            <CardDescription>Prioriza achados por impacto e urgencia gerencial.</CardDescription>
          </CardHeader>
          <CardContent>
            <GenericCsvTable rows={outputTables.decisionMatrix} />
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Pareto e concentracao</CardTitle>
            <CardDescription>Dimensoes que concentram receita, lucro e prioridade de acao.</CardDescription>
          </CardHeader>
          <CardContent>
            <GenericCsvTable rows={outputTables.pareto} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
