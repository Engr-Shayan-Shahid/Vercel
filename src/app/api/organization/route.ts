import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getMembershipRole,
  requireImporterContext,
  requireOwnerContext,
} from "@/lib/auth/api-context";
import { mapRowToOrganizationSettings } from "@/lib/organization-store";
import { EORI_REGEX } from "@/lib/settings-schema";
import type { Database } from "@/types/database";

const organizationPatchSchema = z
  .object({
    companyLegalName: z.string().trim().min(1).max(200).optional(),
    eoriNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(EORI_REGEX)
      .optional(),
    vatTaxId: z.string().trim().min(1).max(50).optional(),
    registeredCountry: z.string().trim().min(1).optional(),
    contactEmail: z.string().trim().email().optional(),
    etsPriceOverride: z
      .union([z.literal(""), z.null(), z.coerce.number().positive()])
      .optional(),
    defaultCalculationMethod: z.enum(["actual", "default_fallback"]).optional(),
    reportingPeriodMode: z.enum(["auto", "manual"]).optional(),
    reportingYear: z.coerce.number().int().min(2020).max(2040).optional(),
    reportingQuarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field is required.",
  });

export async function GET() {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, user } = result.context;

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const role = await getMembershipRole(supabase, user.id, organizationId);
  const orgSettings = mapRowToOrganizationSettings(data);

  if (!orgSettings.contactEmail && user.email) {
    orgSettings.contactEmail = user.email;
  }

  return NextResponse.json({
    organization: orgSettings,
    role,
  });
}

export async function PATCH(request: Request) {
  const result = await requireOwnerContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = organizationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const values = parsed.data;
  const updatePayload: Record<string, unknown> = {};

  if (values.companyLegalName !== undefined) updatePayload.name = values.companyLegalName;
  if (values.eoriNumber !== undefined) updatePayload.eori_number = values.eoriNumber.toUpperCase();
  if (values.vatTaxId !== undefined) updatePayload.vat_tax_id = values.vatTaxId;
  if (values.registeredCountry !== undefined) {
    updatePayload.registered_country = values.registeredCountry;
  }
  if (values.contactEmail !== undefined) updatePayload.contact_email = values.contactEmail;

  if (values.etsPriceOverride !== undefined) {
    updatePayload.ets_price_override =
      values.etsPriceOverride === "" || values.etsPriceOverride === null
        ? null
        : Number(values.etsPriceOverride);
  }
  if (values.defaultCalculationMethod !== undefined) {
    updatePayload.default_calculation_method = values.defaultCalculationMethod;
  }
  if (values.reportingPeriodMode !== undefined) {
    updatePayload.reporting_period_mode = values.reportingPeriodMode;
    if (values.reportingPeriodMode === "auto") {
      updatePayload.reporting_year = null;
      updatePayload.reporting_quarter = null;
    }
  }
  if (values.reportingYear !== undefined) updatePayload.reporting_year = values.reportingYear;
  if (values.reportingQuarter !== undefined) {
    updatePayload.reporting_quarter = values.reportingQuarter;
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updatePayload as Database["public"]["Tables"]["organizations"]["Update"])
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: mapRowToOrganizationSettings(data) });
}
