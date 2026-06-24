import type { ImportRecord } from "@/types/import-record";
import type { Database } from "@/types/database";

type ImportRow = Database["public"]["Tables"]["import_logs"]["Row"];

export function mapRowToImport(row: ImportRow): ImportRecord {
  const id = row.id != null ? String(row.id).trim() : "";

  return {
    id,
    materialType: row.material_type as ImportRecord["materialType"],
    mass: Number(row.mass),
    originCountry: row.origin_country,
    emissionFactor: Number(row.emission_factor),
    embeddedEmissions: Number(row.embedded_emissions),
    benchmark: Number(row.benchmark),
    freeAllocation: Number(row.free_allocation),
    foreignPrice: Number(row.foreign_price),
    foreignCarbonPriceDeduction: Number(row.foreign_carbon_price_deduction ?? 0),
    etsPrice: Number(row.ets_price),
    taxLiability: Number(row.tax_liability),
    proofOfPaymentFileName: row.proof_of_payment_file_name ?? undefined,
    proofOfPaymentStoragePath: row.proof_of_payment_storage_path ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapImportToInsert(
  record: ImportRecord,
  organizationId: string
): Database["public"]["Tables"]["import_logs"]["Insert"] {
  return {
    id: record.id,
    organization_id: organizationId,
    material_type: record.materialType,
    mass: record.mass,
    origin_country: record.originCountry,
    emission_factor: record.emissionFactor,
    embedded_emissions: record.embeddedEmissions,
    benchmark: record.benchmark,
    free_allocation: record.freeAllocation,
    foreign_price: record.foreignPrice,
    foreign_carbon_price_deduction: record.foreignCarbonPriceDeduction,
    ets_price: record.etsPrice,
    tax_liability: record.taxLiability,
    proof_of_payment_file_name: record.proofOfPaymentFileName ?? null,
    proof_of_payment_storage_path: record.proofOfPaymentStoragePath ?? null,
    created_at: record.createdAt,
  };
}

export function mapImportToUpdate(
  record: ImportRecord
): Database["public"]["Tables"]["import_logs"]["Update"] {
  return {
    material_type: record.materialType,
    mass: record.mass,
    origin_country: record.originCountry,
    emission_factor: record.emissionFactor,
    embedded_emissions: record.embeddedEmissions,
    benchmark: record.benchmark,
    free_allocation: record.freeAllocation,
    foreign_price: record.foreignPrice,
    foreign_carbon_price_deduction: record.foreignCarbonPriceDeduction,
    ets_price: record.etsPrice,
    tax_liability: record.taxLiability,
    proof_of_payment_file_name: record.proofOfPaymentFileName ?? null,
    proof_of_payment_storage_path: record.proofOfPaymentStoragePath ?? null,
  };
}

export function generateReportId(year: number, quarter: string, sequence: number): string {
  return `RPT-${year}-${quarter}-${String(sequence).padStart(3, "0")}`;
}
