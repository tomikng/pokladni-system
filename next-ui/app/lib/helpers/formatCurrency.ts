export function formatCurrency(
  amount: number,
  currency: string = "CZK"
): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
