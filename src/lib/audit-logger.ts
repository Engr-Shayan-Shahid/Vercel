import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const AuditAction = {
  IMPORT_CREATED: "IMPORT_CREATED",
  IMPORT_UPDATED: "IMPORT_UPDATED",
  IMPORT_DELETED: "IMPORT_DELETED",
  REPORT_GENERATED: "REPORT_GENERATED",
  SUPPLIER_INVITED: "SUPPLIER_INVITED",
  SUPPLIER_DATA_RECEIVED: "SUPPLIER_DATA_RECEIVED",
  DECLARATION_SUBMITTED: "DECLARATION_SUBMITTED",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export async function logAuditEvent(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      organization_id: organizationId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues ?? null,
      new_values: newValues ?? null,
    });

    if (error) {
      console.error("[audit] Failed to log audit event:", error.message);
    }
  } catch (err) {
    // Non-fatal: audit logging must never break the main request
    console.error("[audit] Exception logging audit event:", err instanceof Error ? err.message : err);
  }
}
