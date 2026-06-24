import type { ImportRecord } from "@/types/import-record";
import type { Database } from "@/types/database";

type ImportRow = Database["public"]["Tables"]["import_logs"]["Row"];

const memoryStore: ImportRecord[] = [];

export function mapRowToImport(row: ImportRow): ImportRecord {
  const id = row.id != null ? String(row.id).trim() : "";

  if (!id) {
    console.error("Supabase row missing id field:", row);
  }

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
    createdAt: row.created_at,
  };
}

export function mapImportToInsert(
  record: ImportRecord
): Database["public"]["Tables"]["import_logs"]["Insert"] {
  return {
    id: record.id,
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
  };
}

export function listMemoryImports(): ImportRecord[] {
  return [...memoryStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addMemoryImport(record: ImportRecord): ImportRecord {
  memoryStore.unshift(record);
  return record;
}

export function updateMemoryImport(record: ImportRecord): ImportRecord | null {
  const index = memoryStore.findIndex((item) => item.id === record.id);
  if (index === -1) return null;
  memoryStore[index] = record;
  return record;
}

export function deleteMemoryImport(id: string): boolean {
  const index = memoryStore.findIndex((item) => item.id === id);
  if (index === -1) return false;
  memoryStore.splice(index, 1);
  return true;
}

export function getMemoryImport(id: string): ImportRecord | undefined {
  return memoryStore.find((item) => item.id === id);
}
