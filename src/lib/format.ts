/**
 * Formatting helpers for market data.
 */

/** Format a number as a currency string (defaults to Vietnamese đồng). */
export function formatCurrency(
  value: number,
  currency = "VND",
  locale = "vi-VN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a percentage change with an explicit sign, e.g. "+2.50%". */
export function formatPercent(value: number, fractionDigits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits)}%`;
}
