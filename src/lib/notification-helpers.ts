import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export type NotificationType =
  | "deadline"
  | "supplier_data"
  | "missing_supplier_data"
  | "report_ready";

export interface AppNotification {
  id: string;
  organizationId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function mapRowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    organizationId: row.organization_id,
    type: row.type as NotificationType,
    message: row.message,
    read: row.read,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

/**
 * Creates a notification. Non-fatal — errors are logged but never re-thrown.
 */
export async function createNotification(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  type: NotificationType,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      organization_id: organizationId,
      type,
      message,
      metadata: metadata as Json,
    });

    if (error) {
      console.error("[notifications] Failed to create notification:", error.message);
    }
  } catch (err) {
    console.error(
      "[notifications] Exception creating notification:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Checks if a notification of the given type + dedup_key was created within
 * the last `withinHours` hours. Used to prevent duplicate deadline nudges.
 */
/** Short display ref for import IDs in notification messages. */
export function formatImportRef(importId: string): string {
  return importId.slice(0, 8).toUpperCase();
}

/**
 * Resolves a supplier display name from org profile or email fallback.
 */
export async function resolveSupplierName(
  supabase: SupabaseClient<Database>,
  exporterOrgId: string | null,
  exporterEmail: string
): Promise<string> {
  if (exporterOrgId) {
    try {
      const { data } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", exporterOrgId)
        .maybeSingle();

      if (data?.name) return data.name;
    } catch {
      // fall through to email
    }
  }

  return exporterEmail.split("@")[0] || exporterEmail;
}

/**
 * Creates notifications for import logs without verified supplier data.
 * Called on login (notifications fetch) and when a manual import is created.
 */
export async function syncMissingSupplierDataNotifications(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<void> {
  try {
    const [{ data: imports }, { data: verifiedRows }] = await Promise.all([
      supabase
        .from("import_logs")
        .select("id")
        .eq("organization_id", organizationId),
      supabase
        .from("shipment_requests")
        .select("import_log_id")
        .eq("importer_org_id", organizationId)
        .eq("status", "accepted")
        .not("import_log_id", "is", null),
    ]);

    const verifiedIds = new Set(
      (verifiedRows ?? [])
        .map((row) => row.import_log_id)
        .filter((id): id is string => Boolean(id))
    );

    for (const row of imports ?? []) {
      if (verifiedIds.has(row.id)) continue;

      const dedupKey = `missing-supplier-${row.id}`;
      const alreadyExists = await notificationExistsRecently(
        supabase,
        organizationId,
        "missing_supplier_data",
        dedupKey,
        24 * 7
      );

      if (alreadyExists) continue;

      const importRef = formatImportRef(row.id);
      await createNotification(
        supabase,
        organizationId,
        "missing_supplier_data",
        `Import ${importRef} is missing supplier data`,
        { dedup_key: dedupKey, import_id: row.id, import_ref: importRef }
      );
    }
  } catch (err) {
    console.error(
      "[notifications] Failed to sync missing supplier data:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function notificationExistsRecently(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  type: NotificationType,
  dedupKey: string,
  withinHours = 24
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("type", type)
      .gte("created_at", since)
      .limit(1);

    if (error) return false;

    // Check metadata.dedup_key in JS (Supabase JS doesn't easily filter jsonb in select)
    if (!data || data.length === 0) return false;

    const { data: full } = await supabase
      .from("notifications")
      .select("metadata")
      .eq("organization_id", organizationId)
      .eq("type", type)
      .gte("created_at", since)
      .limit(10);

    return (full ?? []).some(
      (row) =>
        (row.metadata as Record<string, unknown> | null)?.dedup_key === dedupKey
    );
  } catch {
    return false;
  }
}
