export type CbamQuarter = "Q1" | "Q2" | "Q3" | "Q4";

export type CbamCertificatePrice = {
  year: number;
  quarter: CbamQuarter;
  price: number;
  publishedAt: string;
  sourceUrl: string;
};

/** Known official CBAM certificate prices published by the European Commission. */
export const CBAM_CERTIFICATE_PRICES: readonly CbamCertificatePrice[] = [
  {
    year: 2026,
    quarter: "Q1",
    price: 75.36,
    publishedAt: "2026-04-07",
    sourceUrl:
      "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en",
  },
  {
    year: 2026,
    quarter: "Q2",
    price: 70.07,
    publishedAt: "2026-07-06",
    sourceUrl:
      "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en",
  },
];

/** Returns the calendar year and quarter for today's date (UTC). */
export function getCurrentCbamQuarter(): { year: number; quarter: CbamQuarter } {
  const now = new Date();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const quarter = (["Q1", "Q2", "Q3", "Q4"] as const)[Math.floor(month / 3)];
  return { year, quarter };
}

/** Returns the official price for a quarter, or null if not yet published. */
export function getOfficialCbamPrice(year: number, quarter: CbamQuarter): number | null {
  const entry = CBAM_CERTIFICATE_PRICES.find((p) => p.year === year && p.quarter === quarter);
  return entry?.price ?? null;
}
