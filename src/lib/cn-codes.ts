import type { MaterialType } from "@/types/import-record";

/** Representative CN codes for CBAM-covered goods (EU customs nomenclature). */
export const MATERIAL_CN_CODES: Record<MaterialType, string> = {
  Steel: "7208",
  Aluminum: "7601",
  Cement: "2523",
  Fertilizer: "3102",
};

export function getCnCodeForMaterial(materialType: MaterialType): string {
  return MATERIAL_CN_CODES[materialType];
}
