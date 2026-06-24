import { CBAM_BENCHMARK_FACTOR } from "@/lib/report-compliance";
import type { EmissionsReport } from "@/types/emissions-report";

export interface ReportOrganizationMetadata {
  companyLegalName: string;
  eoriNumber: string;
  vatTaxId: string;
  complianceOfficerName: string;
  email: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDecimal(value: number, decimals: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid numeric value in report.");
  }
  return value.toFixed(decimals);
}

export function validateReportForExport(
  report: EmissionsReport,
  organization: ReportOrganizationMetadata
): string[] {
  const errors: string[] = [];

  if (!organization.eoriNumber.trim()) {
    errors.push("EORI number is required in Organization settings before export.");
  }

  if (!organization.companyLegalName.trim()) {
    errors.push("Company legal name is required in Organization settings before export.");
  }

  if (report.aggregatedRows.length === 0) {
    errors.push("Report has no aggregated goods rows.");
  }

  return errors;
}

export function generateReportXml(
  report: EmissionsReport,
  organization: ReportOrganizationMetadata
): string {
  const validationErrors = validateReportForExport(report, organization);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(" "));
  }

  const rows = report.aggregatedRows
    .map(
      (row) => `    <Good cnCode="${escapeXml(row.cnCode)}" origin="${escapeXml(row.originCountry)}" usesDefaultValues="${row.usesDefaultValues}">
      <Material>${escapeXml(row.materialType)}</Material>
      <Mass unit="t">${formatDecimal(row.totalMass, 3)}</Mass>
      <EmbeddedEmissions unit="tCO2e">${formatDecimal(row.embeddedEmissions, 3)}</EmbeddedEmissions>
      <Benchmark unit="tCO2e/t">${formatDecimal(row.benchmark, 3)}</Benchmark>
      <BenchmarkFactor>${CBAM_BENCHMARK_FACTOR}</BenchmarkFactor>
      <EmissionsSubjectToCBAM unit="tCO2e">${formatDecimal(row.emissionsSubjectToCbam, 3)}</EmissionsSubjectToCBAM>
    </Good>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<CBAMQuarterlyReport xmlns="urn:eu:cbam:report:v1">
  <ReportId>${escapeXml(report.reportId)}</ReportId>
  <Period>${escapeXml(report.period)}</Period>
  <Status>${escapeXml(report.status)}</Status>
  <Declarant>
    <CompanyLegalName>${escapeXml(organization.companyLegalName)}</CompanyLegalName>
    <EORINumber>${escapeXml(organization.eoriNumber.toUpperCase())}</EORINumber>
    <VATTaxId>${escapeXml(organization.vatTaxId)}</VATTaxId>
    <ComplianceOfficer>${escapeXml(organization.complianceOfficerName)}</ComplianceOfficer>
    <ContactEmail>${escapeXml(organization.email)}</ContactEmail>
  </Declarant>
  <Summary>
    <TotalGoods unit="t">${formatDecimal(report.totalGoods, 3)}</TotalGoods>
    <EmbeddedEmissions unit="tCO2e">${formatDecimal(report.embeddedEmissions, 3)}</EmbeddedEmissions>
    <BenchmarkFactor applied="${CBAM_BENCHMARK_FACTOR}"/>
    <EmissionsSubjectToCBAM unit="tCO2e">${formatDecimal(report.emissionsSubjectToCbam, 3)}</EmissionsSubjectToCBAM>
    <QuarterlyETSPrice currency="EUR">${formatDecimal(report.etsPrice, 2)}</QuarterlyETSPrice>
    <Liability currency="EUR">${formatDecimal(report.liability, 2)}</Liability>
  </Summary>
  <Goods>
${rows}
  </Goods>
</CBAMQuarterlyReport>`;
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
