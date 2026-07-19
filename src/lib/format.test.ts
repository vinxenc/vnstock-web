import { formatCurrency, formatPercent } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats VND with dot grouping and no decimals", () => {
    expect(formatCurrency(1_500_000)).toContain("1.500.000");
  });

  it("respects a custom currency and locale", () => {
    expect(formatCurrency(1234.5, "USD", "en-US")).toBe("$1,235");
  });
});

describe("formatPercent", () => {
  it("prefixes a plus sign for gains", () => {
    expect(formatPercent(2.5)).toBe("+2.50%");
  });

  it("keeps the minus sign for losses", () => {
    expect(formatPercent(-1.2)).toBe("-1.20%");
  });

  it("does not sign zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });
});
