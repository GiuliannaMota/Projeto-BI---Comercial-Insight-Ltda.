import { parseCsvObjects, parseSalesRows } from "../lib/csv";
import { rawSources } from "./raw";

export const salesRows = parseSalesRows(rawSources.salesCsv);

export const outputTables = {
  actionPlan: parseCsvObjects(rawSources.actionPlanCsv),
  insights: parseCsvObjects(rawSources.insightsCsv),
  decisionMatrix: parseCsvObjects(rawSources.decisionMatrixCsv),
  pareto: parseCsvObjects(rawSources.paretoCsv),
  finalKpis: parseCsvObjects(rawSources.finalKpisCsv),
  businessAnswers: parseCsvObjects(rawSources.businessAnswersCsv),
};
