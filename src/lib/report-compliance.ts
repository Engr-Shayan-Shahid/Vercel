import { MATERIAL_BENCHMARKS } from "@/lib/cbam-constants";
import { getCnCodeForMaterial } from "@/lib/cn-codes";
import type { ImportRecord, MaterialType } from "@/types/import-record";
import type { AggregatedImportRow } from "@/types/emissions-report";

/**
 * Definitive CBAM report formula factor (97.5% benchmark intensity threshold).
 * Emissions Subject to CBAM = Embedded Emissions − (Benchmark × Mass × 0.975)
 */
export const CBAM_BENCHMARK_FACTOR = 0.975;

export function calculateEmissionsSubjectToCbam(
  embeddedEmissions: number,
  benchmark: number,
  mass: number
): number {
  if (mass <= 0) return 0;
  const deduction = benchmark * mass * CBAM_BENCHMARK_FACTOR;
  return Math.max(0, embeddedEmissions - deduction);
}

export function calculateReportLiability(
  emissionsSubjectToCbam: number,
  etsPrice: number
): number {
  return Math.max(0, emissionsSubjectToCbam * etsPrice);
}

/**
 * Default values are punitive EU fallback emission factors.
 * Flag when the declared factor meets or exceeds the material benchmark.
 */
export function usesDefaultValues(
  materialType: MaterialType,
  emissionFactor: number
): boolean {
  const benchmark = MATERIAL_BENCHMARKS[materialType];
  return emissionFactor >= benchmark;
}

export function aggregateImportsByCnAndOrigin(
  imports: ImportRecord[]
): AggregatedImportRow[] {
  const groups = new Map<string, AggregatedImportRow>();

  for (const record of imports) {
    const cnCode = getCnCodeForMaterial(record.materialType);
    const key = `${cnCode}|${record.originCountry}`;

    const existing = groups.get(key);
    const subjectEmissions = calculateEmissionsSubjectToCbam(
      record.embeddedEmissions,
      record.benchmark,
      record.mass
    );
    const isDefault = usesDefaultValues(record.materialType, record.emissionFactor);

    if (existing) {
      existing.totalMass += record.mass;
      existing.embeddedEmissions += record.embeddedEmissions;
      existing.emissionsSubjectToCbam += subjectEmissions;
      existing.importCount += 1;
      existing.usesDefaultValues = existing.usesDefaultValues || isDefault;
    } else {
      groups.set(key, {
        cnCode,
        materialType: record.materialType,
        originCountry: record.originCountry,
        totalMass: record.mass,
        embeddedEmissions: record.embeddedEmissions,
        benchmark: record.benchmark,
        emissionsSubjectToCbam: subjectEmissions,
        usesDefaultValues: isDefault,
        importCount: 1,
      });
    }
  }

  return Array.from(groups.values());
}

export function summarizeReportFromImports(
  imports: ImportRecord[],
  etsPrice: number
): {
  totalGoods: number;
  embeddedEmissions: number;
  emissionsSubjectToCbam: number;
  liability: number;
  aggregatedRows: AggregatedImportRow[];
} {
  const aggregatedRows = aggregateImportsByCnAndOrigin(imports);

  const totalGoods = imports.reduce((sum, r) => sum + r.mass, 0);
  const embeddedEmissions = imports.reduce((sum, r) => sum + r.embeddedEmissions, 0);
  const emissionsSubjectToCbam = aggregatedRows.reduce(
    (sum, row) => sum + row.emissionsSubjectToCbam,
    0
  );
  const liability = calculateReportLiability(emissionsSubjectToCbam, etsPrice);

  return {
    totalGoods,
    embeddedEmissions,
    emissionsSubjectToCbam,
    liability,
    aggregatedRows,
  };
}
