import type { Database } from "@/types/database";
import type { CompanyProfileValues, ComplianceSettingsValues } from "@/lib/settings-schema";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

export interface OrganizationSettings {
  id: string;
  companyLegalName: string;
  eoriNumber: string;
  vatTaxId: string;
  registeredCountry: string;
  contactEmail: string;
  etsPriceOverride: number | null;
  defaultCalculationMethod: "actual" | "default_fallback";
  reportingPeriodMode: "auto" | "manual";
  reportingYear: number | null;
  reportingQuarter: "Q1" | "Q2" | "Q3" | "Q4" | null;
  orgType: string;
  primaryCommodity: string | null;
}

export function mapRowToOrganizationSettings(row: OrganizationRow): OrganizationSettings {
  return {
    id: row.id,
    companyLegalName: row.name,
    eoriNumber: row.eori_number,
    vatTaxId: row.vat_tax_id,
    registeredCountry: row.registered_country ?? "",
    contactEmail: row.contact_email ?? "",
    etsPriceOverride: row.ets_price_override ?? null,
    defaultCalculationMethod:
      row.default_calculation_method === "default_fallback" ? "default_fallback" : "actual",
    reportingPeriodMode: row.reporting_period_mode === "manual" ? "manual" : "auto",
    reportingYear: row.reporting_year ?? null,
    reportingQuarter: (row.reporting_quarter as OrganizationSettings["reportingQuarter"]) ?? null,
    orgType: row.org_type,
    primaryCommodity: row.primary_commodity ?? null,
  };
}

export function mapCompanyProfileToUpdate(values: CompanyProfileValues) {
  return {
    name: values.companyLegalName,
    eori_number: values.eoriNumber.toUpperCase(),
    vat_tax_id: values.vatTaxId,
    registered_country: values.registeredCountry,
    contact_email: values.contactEmail,
  };
}

export function mapComplianceSettingsToUpdate(values: ComplianceSettingsValues) {
  const override =
    values.etsPriceOverride === "" ? null : Number(values.etsPriceOverride);

  return {
    ets_price_override: override,
    default_calculation_method: values.defaultCalculationMethod,
    reporting_period_mode: values.reportingPeriodMode,
    reporting_year: values.reportingPeriodMode === "manual" ? values.reportingYear ?? null : null,
    reporting_quarter:
      values.reportingPeriodMode === "manual" ? values.reportingQuarter ?? null : null,
  };
}
