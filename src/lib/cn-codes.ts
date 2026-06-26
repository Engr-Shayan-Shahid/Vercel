import type { MaterialType } from "@/types/import-record";

export interface CnCodeEntry {
  code: string;
  description: string;
  materialType: MaterialType;
}

const STEEL_CN_CODES: CnCodeEntry[] = [
  { code: "7206", description: "Iron and non-alloy steel in ingots or other primary forms", materialType: "Steel" },
  { code: "7207", description: "Semi-finished products of iron or non-alloy steel", materialType: "Steel" },
  {
    code: "7208",
    description: "Flat-rolled iron/non-alloy steel, width ≥600 mm, hot-rolled, not clad/plated/coated",
    materialType: "Steel",
  },
  {
    code: "7209",
    description: "Flat-rolled iron/non-alloy steel, width ≥600 mm, cold-rolled, not clad/plated/coated",
    materialType: "Steel",
  },
  {
    code: "7210",
    description: "Flat-rolled iron/non-alloy steel, width ≥600 mm, clad/plated/coated",
    materialType: "Steel",
  },
  {
    code: "7211",
    description: "Flat-rolled iron/non-alloy steel, width <600 mm, not clad/plated/coated",
    materialType: "Steel",
  },
  {
    code: "7212",
    description: "Flat-rolled iron/non-alloy steel, width <600 mm, clad/plated/coated",
    materialType: "Steel",
  },
  {
    code: "7213",
    description: "Bars and rods, hot-rolled in coils, of iron or non-alloy steel",
    materialType: "Steel",
  },
  {
    code: "7214",
    description: "Other bars and rods of iron or non-alloy steel, hot-rolled/hot-drawn/hot-extruded",
    materialType: "Steel",
  },
  { code: "7215", description: "Other bars and rods of iron or non-alloy steel", materialType: "Steel" },
  { code: "7216", description: "Angles, shapes and sections of iron or non-alloy steel", materialType: "Steel" },
  { code: "7217", description: "Wire of iron or non-alloy steel", materialType: "Steel" },
  {
    code: "7218",
    description: "Stainless steel in ingots or other primary forms; semi-finished products",
    materialType: "Steel",
  },
  { code: "7219", description: "Flat-rolled products of stainless steel, width ≥600 mm", materialType: "Steel" },
  { code: "7220", description: "Flat-rolled products of stainless steel, width <600 mm", materialType: "Steel" },
  {
    code: "7221",
    description: "Bars and rods, hot-rolled in coils, of stainless steel",
    materialType: "Steel",
  },
  {
    code: "7222",
    description: "Other bars and rods, angles, shapes and sections of stainless steel",
    materialType: "Steel",
  },
  { code: "7223", description: "Wire of stainless steel", materialType: "Steel" },
  {
    code: "7224",
    description: "Other alloy steel in ingots or primary forms; semi-finished products",
    materialType: "Steel",
  },
  { code: "7225", description: "Flat-rolled products of other alloy steel, width ≥600 mm", materialType: "Steel" },
  { code: "7226", description: "Flat-rolled products of other alloy steel, width <600 mm", materialType: "Steel" },
  {
    code: "7227",
    description: "Bars and rods, hot-rolled in coils, of other alloy steel",
    materialType: "Steel",
  },
  {
    code: "7228",
    description: "Other bars and rods, angles, shapes and sections of other alloy steel",
    materialType: "Steel",
  },
  { code: "7229", description: "Wire of other alloy steel", materialType: "Steel" },
];

const ALUMINUM_CN_CODES: CnCodeEntry[] = [
  { code: "7601", description: "Unwrought aluminium", materialType: "Aluminum" },
  { code: "7603", description: "Aluminium powders and flakes", materialType: "Aluminum" },
  { code: "7604", description: "Aluminium bars, rods and profiles", materialType: "Aluminum" },
  { code: "7605", description: "Aluminium wire", materialType: "Aluminum" },
  {
    code: "7606",
    description: "Aluminium plates, sheets and strip, thickness >0.2 mm",
    materialType: "Aluminum",
  },
  { code: "7607", description: "Aluminium foil (thickness ≤0.2 mm)", materialType: "Aluminum" },
  { code: "7608", description: "Aluminium tubes and pipes", materialType: "Aluminum" },
  { code: "7609", description: "Aluminium tube or pipe fittings", materialType: "Aluminum" },
];

const CEMENT_CN_CODES: CnCodeEntry[] = [
  {
    code: "2523",
    description: "Portland cement, aluminous cement, slag cement and similar hydraulic cements",
    materialType: "Cement",
  },
  { code: "2524", description: "Asbestos", materialType: "Cement" },
  { code: "6810", description: "Articles of cement, concrete or artificial stone", materialType: "Cement" },
  {
    code: "6811",
    description: "Articles of asbestos-cement, cellulose fibre-cement or similar",
    materialType: "Cement",
  },
];

const FERTILIZER_CN_CODES: CnCodeEntry[] = [
  { code: "2808", description: "Nitric acid; sulphonitric acids", materialType: "Fertilizer" },
  { code: "2814", description: "Ammonia, anhydrous or in aqueous solution", materialType: "Fertilizer" },
  { code: "2834", description: "Nitrites; nitrates", materialType: "Fertilizer" },
  { code: "3102", description: "Mineral or chemical fertilizers, nitrogenous", materialType: "Fertilizer" },
  { code: "3103", description: "Mineral or chemical fertilizers, phosphatic", materialType: "Fertilizer" },
  { code: "3104", description: "Mineral or chemical fertilizers, potassic", materialType: "Fertilizer" },
  {
    code: "3105",
    description: "Fertilizers containing N, P or K; other fertilizers; goods of chapter 31",
    materialType: "Fertilizer",
  },
];

const HYDROGEN_CN_CODES: CnCodeEntry[] = [
  { code: "2804", description: "Hydrogen, rare gases and other non-metals", materialType: "Hydrogen" },
];

/** Full flat list of common CBAM-covered CN codes by material category. */
export const CN_CODES: CnCodeEntry[] = [
  ...STEEL_CN_CODES,
  ...ALUMINUM_CN_CODES,
  ...CEMENT_CN_CODES,
  ...FERTILIZER_CN_CODES,
  ...HYDROGEN_CN_CODES,
];

const CN_CODE_BY_CODE = new Map(CN_CODES.map((entry) => [entry.code, entry]));

const CN_CODES_BY_MATERIAL = new Map<MaterialType, CnCodeEntry[]>(
  (["Steel", "Aluminum", "Cement", "Fertilizer", "Hydrogen"] as MaterialType[]).map((materialType) => [
    materialType,
    CN_CODES.filter((entry) => entry.materialType === materialType),
  ])
);

export function getCnCodesForMaterial(materialType: MaterialType): CnCodeEntry[] {
  return CN_CODES_BY_MATERIAL.get(materialType) ?? [];
}

export function getCnCodeDescription(code: string): string {
  return CN_CODE_BY_CODE.get(code)?.description ?? "";
}

export function getMaterialForCnCode(code: string): MaterialType | null {
  return CN_CODE_BY_CODE.get(code)?.materialType ?? null;
}

/** Default CN code for a material (first entry in the category list). */
export function getDefaultCnCodeForMaterial(materialType: MaterialType): string {
  return getCnCodesForMaterial(materialType)[0]?.code ?? "";
}
