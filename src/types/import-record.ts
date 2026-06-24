export const MATERIAL_TYPES = ["Steel", "Aluminum", "Cement", "Fertilizer"] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const ORIGIN_COUNTRIES = [
  "China",
  "Turkey",
  "India",
  "Russia",
  "Ukraine",
  "Brazil",
  "South Africa",
  "Egypt",
  "Vietnam",
  "Indonesia",
  "Other",
] as const;

export type OriginCountry = (typeof ORIGIN_COUNTRIES)[number];

export interface ImportRecord {
  id: string;
  materialType: MaterialType;
  mass: number;
  originCountry: string;
  emissionFactor: number;
  embeddedEmissions: number;
  benchmark: number;
  freeAllocation: number;
  foreignPrice: number;
  foreignCarbonPriceDeduction: number;
  etsPrice: number;
  taxLiability: number;
  proofOfPaymentFileName?: string;
  proofOfPaymentStoragePath?: string;
  proofOfPaymentUrl?: string;
  proofOfPaymentMimeType?: string;
  createdAt: string;
}

export interface ImportRecordEditInput {
  mass: string;
  originCountry: string;
  emissionFactor: string;
}

export function importRecordToEditInput(record: ImportRecord): ImportRecordEditInput {
  return {
    mass: String(record.mass),
    originCountry: record.originCountry,
    emissionFactor: String(record.emissionFactor),
  };
}

export function validateImportEditInput(input: ImportRecordEditInput): ImportFormErrors {
  const errors: ImportFormErrors = {};

  if (!input.mass.trim()) {
    errors.mass = "Mass is required.";
  } else {
    const mass = Number(input.mass);
    if (Number.isNaN(mass) || mass <= 0) {
      errors.mass = "Mass must be a positive number.";
    }
  }

  if (!input.originCountry.trim()) {
    errors.originCountry = "Origin country is required.";
  }

  if (!input.emissionFactor.trim()) {
    errors.emissionFactor = "Emission factor is required.";
  } else {
    const factor = Number(input.emissionFactor);
    if (Number.isNaN(factor) || factor < 0) {
      errors.emissionFactor = "Emission factor must be zero or greater.";
    }
  }

  return errors;
}

export interface ImportRecordInput {
  materialType: MaterialType | "";
  mass: string;
  originCountry: string;
  emissionFactor: string;
  foreignPrice: string;
  proofOfPayment: File | null;
}

export const EMPTY_IMPORT_INPUT: ImportRecordInput = {
  materialType: "",
  mass: "",
  originCountry: "",
  emissionFactor: "",
  foreignPrice: "0",
  proofOfPayment: null,
};

export interface ImportFormErrors {
  materialType?: string;
  mass?: string;
  originCountry?: string;
  emissionFactor?: string;
  foreignPrice?: string;
  proofOfPayment?: string;
}

export function validateImportInput(input: ImportRecordInput): ImportFormErrors {
  const errors: ImportFormErrors = {};

  if (!input.materialType) {
    errors.materialType = "Material type is required.";
  }

  if (!input.mass.trim()) {
    errors.mass = "Mass is required.";
  } else {
    const mass = Number(input.mass);
    if (Number.isNaN(mass) || mass <= 0) {
      errors.mass = "Mass must be a positive number.";
    }
  }

  if (!input.originCountry.trim()) {
    errors.originCountry = "Origin country is required.";
  }

  if (!input.emissionFactor.trim()) {
    errors.emissionFactor = "Emission factor is required.";
  } else {
    const factor = Number(input.emissionFactor);
    if (Number.isNaN(factor) || factor < 0) {
      errors.emissionFactor = "Emission factor must be zero or greater.";
    }
  }

  if (!input.foreignPrice.trim()) {
    errors.foreignPrice = "Foreign carbon price is required (use 0 if none).";
  } else {
    const foreignPrice = Number(input.foreignPrice);
    if (Number.isNaN(foreignPrice) || foreignPrice < 0) {
      errors.foreignPrice = "Foreign price must be zero or greater.";
    } else if (foreignPrice > 0 && !input.proofOfPayment) {
      errors.proofOfPayment =
        "Proof of payment is required when claiming a foreign carbon price deduction.";
    }
  }

  return errors;
}

export function hasValidationErrors(errors: ImportFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export interface CBAMApiResult {
  embeddedEmissions: number;
  benchmark: number;
  freeAllocation: number;
  taxableEmissions: number;
  cbamLiability: number;
  foreignCarbonPriceDeduction: number;
  etsPrice: number;
  foreignPrice: number;
  priceDifference: number;
  liability: number;
}
