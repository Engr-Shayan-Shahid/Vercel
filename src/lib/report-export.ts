import { CBAM_BENCHMARK_FACTOR } from "@/lib/report-compliance";
import type { EmissionsReport } from "@/types/emissions-report";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateReportXml(report: EmissionsReport): string {
  const rows = report.aggregatedRows
    .map(
      (row) => `    <Good cnCode="${escapeXml(row.cnCode)}" origin="${escapeXml(row.originCountry)}" usesDefaultValues="${row.usesDefaultValues}">
      <Material>${escapeXml(row.materialType)}</Material>
      <Mass unit="t">${row.totalMass.toFixed(3)}</Mass>
      <EmbeddedEmissions unit="tCO2e">${row.embeddedEmissions.toFixed(3)}</EmbeddedEmissions>
      <Benchmark unit="tCO2e/t">${row.benchmark.toFixed(3)}</Benchmark>
      <BenchmarkFactor>${CBAM_BENCHMARK_FACTOR}</BenchmarkFactor>
      <EmissionsSubjectToCBAM unit="tCO2e">${row.emissionsSubjectToCbam.toFixed(3)}</EmissionsSubjectToCBAM>
    </Good>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<CBAMQuarterlyReport xmlns="urn:eu:cbam:report:v1">
  <ReportId>${escapeXml(report.reportId)}</ReportId>
  <Period>${escapeXml(report.period)}</Period>
  <Status>${escapeXml(report.status)}</Status>
  <Summary>
    <TotalGoods unit="t">${report.totalGoods.toFixed(3)}</TotalGoods>
    <EmbeddedEmissions unit="tCO2e">${report.embeddedEmissions.toFixed(3)}</EmbeddedEmissions>
    <BenchmarkFactor applied="${CBAM_BENCHMARK_FACTOR}"/>
    <EmissionsSubjectToCBAM unit="tCO2e">${report.emissionsSubjectToCbam.toFixed(3)}</EmissionsSubjectToCBAM>
    <QuarterlyETSPrice currency="EUR">${report.etsPrice.toFixed(2)}</QuarterlyETSPrice>
    <Liability currency="EUR">${report.liability.toFixed(2)}</Liability>
  </Summary>
  <Goods>
${rows}
  </Goods>
</CBAMQuarterlyReport>`;
}

export function generateReportPdfContent(report: EmissionsReport): string {
  const lines = [
    "CBAMVAULT — EMISSIONS REPORT (MOCK PDF)",
    "========================================",
    "",
    `Report ID:     ${report.reportId}`,
    `Period:        ${report.period}`,
    `Status:        ${report.status}`,
    `Generated:     ${new Date(report.createdAt).toLocaleString()}`,
    "",
    "SUMMARY",
    "-------",
    `Total Goods:              ${report.totalGoods.toFixed(1)} t`,
    `Embedded Emissions:       ${report.embeddedEmissions.toFixed(1)} tCO2e`,
    `Benchmark Factor:         ${CBAM_BENCHMARK_FACTOR} (applied)`,
    `Emissions Subject to CBAM: ${report.emissionsSubjectToCbam.toFixed(1)} tCO2e`,
    `Quarterly ETS Price:      EUR ${report.etsPrice.toFixed(2)}/tCO2e`,
    `CBAM Liability:           EUR ${report.liability.toFixed(2)}`,
    "",
    "AGGREGATED GOODS (CN CODE × ORIGIN)",
    "-----------------------------------",
  ];

  for (const row of report.aggregatedRows) {
    lines.push(
      "",
      `CN ${row.cnCode} | ${row.materialType} | ${row.originCountry}`,
      `  Mass: ${row.totalMass.toFixed(1)} t | Embedded: ${row.embeddedEmissions.toFixed(1)} tCO2e`,
      `  Subject to CBAM: ${row.emissionsSubjectToCbam.toFixed(1)} tCO2e`,
      row.usesDefaultValues ? "  [!] Default Values applied — verify supplier data" : ""
    );
  }

  lines.push("", "--- End of Report ---");
  return lines.filter(Boolean).join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
