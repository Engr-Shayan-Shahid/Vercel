"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
} from "@/lib/settings-schema";
import type { Database } from "@/types/database";
import type { AccountType, OrgType } from "@/types/shipment-request";
import { isAccountType, isOrgType } from "@/types/shipment-request";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

export function getSupabaseClient() {
  return createBrowserClient();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function mapRowsToSettings(profile: ProfileRow, organization: OrganizationRow): UserSettings {
  const accountType: AccountType =
    profile.account_type && isAccountType(profile.account_type)
      ? profile.account_type
      : "importer";
  const orgType: OrgType =
    organization.org_type && isOrgType(organization.org_type)
      ? organization.org_type
      : "importer";

  return {
    id: profile.id,
    userId: profile.user_id,
    organizationId: organization.id,
    accountType,
    orgType,
    complianceOfficerName: profile.compliance_officer_name,
    email: profile.email,
    companyLegalName: organization.name,
    eoriNumber: organization.eori_number,
    vatTaxId: organization.vat_tax_id,
    newEuRegulationAlerts: profile.new_eu_regulation_alerts,
    quarterlyReportReminders: profile.quarterly_report_reminders,
    securityAlerts: profile.security_alerts,
    onboardingCompleted: profile.onboarding_completed ?? false,
    primaryCommodity: organization.primary_commodity ?? null,
    updatedAt: profile.updated_at,
  };
}

export async function fetchUserSettings(): Promise<UserSettings> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to load settings.");
  }

  const { data: membershipRow, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const membership = membershipRow as { organization_id: string } | null;

  if (!membership?.organization_id) {
    throw new Error("Organization not found for this account.");
  }

  const { data: organizationRow, error: organizationError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (organizationError) {
    throw new Error(organizationError.message);
  }

  const organization = organizationRow as OrganizationRow | null;

  if (!organization) {
    throw new Error("Organization not found for this account.");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profile = profileRow as ProfileRow | null;

  if (!profile) {
    return {
      ...DEFAULT_USER_SETTINGS,
      userId: user.id,
      organizationId: organization.id,
      email: user.email ?? "",
    };
  }

  return mapRowsToSettings(profile, organization);
}

export async function saveProfileSettings(
  settings: Pick<UserSettings, "complianceOfficerName" | "email" | "userId">
): Promise<UserSettings> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to save settings.");
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        compliance_officer_name: settings.complianceOfficerName,
        email: settings.email,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(error.message);
  }

  return fetchUserSettings();
}

export async function saveOrganizationSettings(
  organizationId: string,
  values: Pick<UserSettings, "companyLegalName" | "eoriNumber" | "vatTaxId">
): Promise<UserSettings> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("organizations")
    .update({
      name: values.companyLegalName,
      eori_number: values.eoriNumber.toUpperCase(),
      vat_tax_id: values.vatTaxId,
    } as never)
    .eq("id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return fetchUserSettings();
}

export async function saveNotificationSettings(
  userId: string,
  values: Pick<
    UserSettings,
    "newEuRegulationAlerts" | "quarterlyReportReminders" | "securityAlerts"
  >
): Promise<UserSettings> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      new_eu_regulation_alerts: values.newEuRegulationAlerts,
      quarterly_report_reminders: values.quarterlyReportReminders,
      security_alerts: values.securityAlerts,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return fetchUserSettings();
}

export async function completeOnboarding(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true } as never)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function saveOnboardingOrgSetup(
  organizationId: string,
  values: { companyLegalName: string; eoriNumber: string; primaryCommodity: string }
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: values.companyLegalName,
      eori_number: values.eoriNumber.trim().toUpperCase(),
      primary_commodity: values.primaryCommodity,
    } as never)
    .eq("id", organizationId);
  if (error) throw new Error(error.message);
}

/** @deprecated Use saveProfileSettings / saveOrganizationSettings / saveNotificationSettings */
export async function saveUserSettings(settings: UserSettings): Promise<UserSettings> {
  await saveProfileSettings(settings);
  if (settings.organizationId) {
    await saveOrganizationSettings(settings.organizationId, settings);
  }
  if (settings.userId) {
    await saveNotificationSettings(settings.userId, settings);
  }
  return fetchUserSettings();
}
