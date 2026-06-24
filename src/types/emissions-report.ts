import type { ImportRecord } from "@/types/import-record";

export const REPORT_STATUSES = ["draft", "submitted", "accepted"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
export type ReportQuarter = (typeof REPORT_QUARTERS)[number];

export interface AggregatedImportRow {
  cnCode: string;
  materialType: string;
  originCountry: string;
  totalMass: number;
  embeddedEmissions: number;
  benchmark: number;
  emissionsSubjectToCbam: number;
  usesDefaultValues: boolean;
  importCount: number;
}

export interface EmissionsReport {
  id: string;
  reportId: string;
  period: string;
  year: number;
  quarter: ReportQuarter;
  totalGoods: number;
  embeddedEmissions: number;
  emissionsSubjectToCbam: number;
  liability: number;
  etsPrice: number;
  status: ReportStatus;
  importIds: string[];
  aggregatedRows: AggregatedImportRow[];
  createdAt: string;
}

export interface CreateReportInput {
  year: number;
  quarter: ReportQuarter;
  etsPrice: number;
  importIds: string[];
  imports: ImportRecord[];
}

export interface ReportFormErrors {
  period?: string;
  etsPrice?: string;
  imports?: string;
}

export function validateReportInput(
  year: number,
  quarter: ReportQuarter | "",
  etsPrice: string,
  selectedImportIds: string[]
): ReportFormErrors {
  const errors: ReportFormErrors = {};

  if (!year || year < 2020 || year > 2100) {
    errors.period = "Select a valid reporting year.";
  }

  if (!quarter) {
    errors.period = "Select a reporting quarter.";
  }

  if (!etsPrice.trim()) {
    errors.etsPrice = "Quarterly ETS price is required.";
  } else {
    const price = Number(etsPrice);
    if (Number.isNaN(price) || price <= 0) {
      errors.etsPrice = "ETS price must be a positive number.";
    }
  }

  if (selectedImportIds.length === 0) {
    errors.imports = "Select at least one import log for this report.";
  }

  return errors;
}

export function hasReportValidationErrors(errors: ReportFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatReportPeriod(year: number, quarter: ReportQuarter): string {
  return `${year} ${quarter}`;
}

export function getQuarterDateRange(
  year: number,
  quarter: ReportQuarter
): { start: Date; end: Date } {
  const ranges: Record<ReportQuarter, [number, number]> = {
    Q1: [0, 2],
    Q2: [3, 5],
    Q3: [6, 8],
    Q4: [9, 11],
  };

  const [startMonth, endMonth] = ranges[quarter];
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999));

  return { start, end };
}

export function importMatchesPeriod(
  importRecord: ImportRecord,
  year: number,
  quarter: ReportQuarter
): boolean {
  const { start, end } = getQuarterDateRange(year, quarter);
  const createdAt = new Date(importRecord.createdAt);
  return createdAt >= start && createdAt <= end;
}
