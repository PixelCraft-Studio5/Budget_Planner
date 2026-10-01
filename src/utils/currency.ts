export const currencySymbols: Record<string, string> = {
  ZAR: "R",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export function getCurrencySymbol(
  currency: string
): string {
  return currencySymbols[currency] ?? "R";
}

export function formatCurrency(
  amount: number,
  currency: string = "ZAR"
): string {
  const symbol = getCurrencySymbol(currency);

  return `${symbol}${Math.abs(amount).toLocaleString(
    "en-ZA"
  )}`;
}