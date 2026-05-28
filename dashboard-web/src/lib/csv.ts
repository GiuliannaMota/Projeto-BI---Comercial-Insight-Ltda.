import type { CsvObject, SaleRow } from "../data/types";

export function parseCsv(raw: string): string[][] {
  const text = raw.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }

  return rows;
}

export function parseCsvObjects(raw: string): CsvObject[] {
  const rows = parseCsv(raw);
  const headers = rows[0]?.map((header) => header.trim()) ?? [];
  return rows.slice(1).map((row) =>
    headers.reduce<CsvObject>((acc, header, index) => {
      acc[header] = row[index]?.trim() ?? "";
      return acc;
    }, {}),
  );
}

export function parseLocaleNumber(value: string): number {
  const trimmed = value.replace(/\s/g, "").replace(/R\$/g, "").replace(/%/g, "");
  if (!trimmed) return 0;

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed)) {
    return Number(trimmed.replace(/\./g, "").replace(",", "."));
  }

  if (trimmed.includes(",")) {
    return Number(trimmed.replace(/\./g, "").replace(",", "."));
  }

  return Number(trimmed);
}

function parseDate(dateIso: string): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function readNumber(row: CsvObject, key: string): number {
  return Number(row[key] ?? 0);
}

export function parseSalesRows(raw: string): SaleRow[] {
  return parseCsvObjects(raw).map((row) => {
    const dateIso = row.data;
    const date = parseDate(dateIso);

    return {
      id: readNumber(row, "id_venda"),
      dateIso,
      date,
      month: readNumber(row, "mes"),
      quarter: readNumber(row, "trimestre"),
      client: row.cliente,
      clientType: row.tipo_cliente,
      relationshipMonths: readNumber(row, "tempo_relacionamento_meses"),
      incomeRange: row.faixa_renda,
      segment: row.segmento,
      product: row.produto,
      category: row.categoria,
      brand: row.marca,
      productLine: row.linha_produto,
      quantity: readNumber(row, "quantidade"),
      unitPrice: readNumber(row, "preco_unitario"),
      discount: readNumber(row, "desconto"),
      revenue: readNumber(row, "receita"),
      unitCost: readNumber(row, "custo_unitario"),
      profit: readNumber(row, "lucro"),
      region: row.regiao,
      city: row.cidade,
      channel: row.canal_venda,
      seller: row.vendedor,
      target: readNumber(row, "meta_venda"),
      hitTarget: row.atingiu_meta.toLowerCase() === "sim",
      deliveryDays: readNumber(row, "prazo_entrega_dias"),
      deliveryStatus: row.status_entrega,
    };
  });
}
