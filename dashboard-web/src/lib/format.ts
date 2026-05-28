const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBRL(value: number) {
  return currency.format(value);
}

export function formatCompactBRL(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${decimal.format(value / 1_000_000)} mi`;
  if (abs >= 1_000) return `R$ ${decimal.format(value / 1_000)} mil`;
  return currency.format(value);
}

export function formatPercent(value: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatNumber(value: number) {
  return number.format(value);
}

export function formatDecimal(value: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
