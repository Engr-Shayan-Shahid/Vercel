import type { AggregatedImportRow, EmissionsReport, ReportQuarter } from "@/types/emissions-report";
import type { Database } from "@/types/database";

type ReportRow = Database["public"]["Tables"]["emissions_reports"]["Row"];

export function mapRowToReport(row: ReportRow): EmissionsReport {
  return {
    id: row.id,
    reportId: row.report_id,
    period: row.period,
    year: row.year,
    quarter: row.quarter as ReportQuarter,
    totalGoods: Number(row.total_goods),
    embeddedEmissions: Number(row.embedded_emissions),
    emissionsSubjectToCbam: Number(row.emissions_subject_to_cbam),
    liability: Number(row.liability),
    etsPrice: Number(row.ets_price),
    status: row.status as EmissionsReport["status"],
    importIds: row.import_ids ?? [],
    aggregatedRows: (row.aggregated_rows as unknown as AggregatedImportRow[]) ?? [],
    createdAt: row.created_at,
  };
}

export function mapReportToInsert(
  report: EmissionsReport,
  organizationId: string
): Database["public"]["Tables"]["emissions_reports"]["Insert"] {
  return {
    id: report.id,
    organization_id: organizationId,
    report_id: report.reportId,
    period: report.period,
    year: report.year,
    quarter: report.quarter,
    total_goods: report.totalGoods,
    embedded_emissions: report.embeddedEmissions,
    emissions_subject_to_cbam: report.emissionsSubjectToCbam,
    liability: report.liability,
    ets_price: report.etsPrice,
    status: report.status,
    import_ids: report.importIds,
    aggregated_rows:
      report.aggregatedRows as unknown as Database["public"]["Tables"]["emissions_reports"]["Insert"]["aggregated_rows"],
    created_at: report.createdAt,
  };
}

export { generateReportId } from "@/lib/imports-store";
