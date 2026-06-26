import { calculateCBAMLiability } from "@/lib/cbam-calculator";
import { getDefaultCnCodeForMaterial } from "@/lib/cn-codes";
import type { ShipmentRequest } from "@/types/shipment-request";
import type { ImportRecord, MaterialType } from "@/types/import-record";

/**
 * Builds an ImportRecord from an accepted ShipmentRequest.
 * All CBAM calculations are performed server-side; foreign price is 0 (no proof on bridge accept).
 */
export function buildImportFromShipment(
  request: ShipmentRequest,
  importLogId: string
): ImportRecord {
  if (request.emissionFactor == null || request.emissionFactor <= 0) {
    throw new Error("Cannot build import record: emission factor is missing or zero.");
  }

  const emissionFactor = request.emissionFactor;
  const materialType = request.materialType as MaterialType;

  const result = calculateCBAMLiability({
    materialType,
    mass: request.mass,
    emissionFactor,
    foreignPrice: 0,
  });

  return {
    id: importLogId,
    materialType,
    cnCode: request.cnCode?.trim() || getDefaultCnCodeForMaterial(materialType),
    mass: request.mass,
    originCountry: request.originCountry,
    importDate: request.acceptedAt
      ? request.acceptedAt.split("T")[0]
      : new Date().toISOString().split("T")[0],
    emissionFactor,
    embeddedEmissions: result.embeddedEmissions,
    benchmark: result.benchmark,
    freeAllocation: result.freeAllocation,
    foreignPrice: 0,
    foreignCarbonPriceDeduction: result.foreignCarbonPriceDeduction,
    etsPrice: result.etsPrice,
    taxLiability: result.liability,
    createdAt: new Date().toISOString(),
  };
}
