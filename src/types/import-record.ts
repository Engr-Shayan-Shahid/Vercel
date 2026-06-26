import { getCnCodesForMaterial } from "@/lib/cn-codes";

export const MATERIAL_TYPES = ["Steel", "Aluminum", "Cement", "Fertilizer", "Hydrogen"] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const ORIGIN_COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Côte d'Ivoire",
  "Cuba",
  "Democratic Republic of the Congo",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Gabon",
  "Gambia",
  "Georgia",
  "Ghana",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Israel",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Qatar",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
] as const;

export type OriginCountry = (typeof ORIGIN_COUNTRIES)[number];

export interface ImportRecord {
  id: string;
  materialType: MaterialType;
  cnCode: string;
  mass: number;
  originCountry: string;
  importDate: string;
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
  cnCode: string;
  mass: string;
  originCountry: string;
  importDate: string;
  emissionFactor: string;
  foreignPrice: string;
  proofOfPayment: File | null;
}

export const EMPTY_IMPORT_INPUT: ImportRecordInput = {
  materialType: "",
  cnCode: "",
  mass: "",
  originCountry: "",
  importDate: "",
  emissionFactor: "",
  foreignPrice: "0",
  proofOfPayment: null,
};

export interface ImportFormErrors {
  materialType?: string;
  cnCode?: string;
  mass?: string;
  originCountry?: string;
  importDate?: string;
  emissionFactor?: string;
  foreignPrice?: string;
  proofOfPayment?: string;
}

function isValidImportDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isFutureImportDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const importDate = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  return importDate > todayUtc;
}

export function validateImportInput(input: ImportRecordInput): ImportFormErrors {
  const errors: ImportFormErrors = {};

  if (!input.materialType) {
    errors.materialType = "Material type is required.";
  }

  if (!input.cnCode.trim()) {
    errors.cnCode = "CN code is required.";
  } else if (
    input.materialType &&
    !getCnCodesForMaterial(input.materialType).some((entry) => entry.code === input.cnCode.trim())
  ) {
    errors.cnCode = "CN code must match the selected material type.";
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

  if (!input.importDate.trim()) {
    errors.importDate = "Import date is required.";
  } else if (!isValidImportDate(input.importDate.trim())) {
    errors.importDate = "Import date must be a valid date.";
  } else if (isFutureImportDate(input.importDate.trim())) {
    errors.importDate = "Import date cannot be in the future.";
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
