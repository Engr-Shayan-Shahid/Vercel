import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DEFAULT_USER_KEY,
  DEFAULT_USER_SETTINGS,
  type UserSettings,
} from "@/lib/settings-schema";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const LOCAL_STORAGE_KEY = "cbamvault-user-settings";

export function getSupabaseClient() {
  return createBrowserClient();
}

export { isSupabaseConfigured };

export function mapRowToSettings(row: ProfileRow): UserSettings {
  return {
    id: row.id,
    userKey: row.user_key,
    complianceOfficerName: row.compliance_officer_name,
    email: row.email,
    companyLegalName: row.company_legal_name,
    eoriNumber: row.eori_number,
    vatTaxId: row.vat_tax_id,
    newEuRegulationAlerts: row.new_eu_regulation_alerts,
    quarterlyReportReminders: row.quarterly_report_reminders,
    securityAlerts: row.security_alerts,
    updatedAt: row.updated_at,
  };
}

export function mapSettingsToUpsert(
  settings: UserSettings
): Database["public"]["Tables"]["profiles"]["Insert"] {
  return {
    id: settings.id,
    user_key: settings.userKey ?? DEFAULT_USER_KEY,
    compliance_officer_name: settings.complianceOfficerName,
    email: settings.email,
    company_legal_name: settings.companyLegalName,
    eori_number: settings.eoriNumber.toUpperCase(),
    vat_tax_id: settings.vatTaxId,
    new_eu_regulation_alerts: settings.newEuRegulationAlerts,
    quarterly_report_reminders: settings.quarterlyReportReminders,
    security_alerts: settings.securityAlerts,
    updated_at: new Date().toISOString(),
  };
}

function readLocalSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) } as UserSettings;
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

function writeLocalSettings(settings: UserSettings): UserSettings {
  const payload = { ...settings, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export async function fetchUserSettings(): Promise<UserSettings> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_key", DEFAULT_USER_KEY)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return mapRowToSettings(data);
    }

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert(mapSettingsToUpsert(DEFAULT_USER_SETTINGS) as never)
      .select("*")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return mapRowToSettings(created);
  }

  return readLocalSettings();
}

export async function saveUserSettings(settings: UserSettings): Promise<UserSettings> {
  const supabase = getSupabaseClient();
  const payload = mapSettingsToUpsert(settings);

  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload as never, { onConflict: "user_key" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToSettings(data);
  }

  return writeLocalSettings(settings);
}
