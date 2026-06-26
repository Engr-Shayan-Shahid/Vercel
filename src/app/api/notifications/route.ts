import { NextResponse } from "next/server";

import { requireImporterContext } from "@/lib/auth/api-context";
import {
  createNotification,
  mapRowToNotification,
  notificationExistsRecently,
  syncMissingSupplierDataNotifications,
} from "@/lib/notification-helpers";
import { getNextDeadline, getDaysUntilDeadline } from "@/lib/cbam-deadlines";

/** Fetch notifications + auto-create deadline nudge if approaching. */
export async function GET() {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  // Auto-create deadline notification if within 60 days and not created recently
  try {
    const days = getDaysUntilDeadline();
    if (days <= 60) {
      const next = getNextDeadline();
      const dedupKey = `deadline-${next.period}`;
      const alreadyExists = await notificationExistsRecently(
        supabase,
        organizationId,
        "deadline",
        dedupKey,
        // Check once per 12h so it reappears if dismissed
        12
      );

      if (!alreadyExists) {
        await createNotification(
          supabase,
          organizationId,
          "deadline",
          `${days} day${days !== 1 ? "s" : ""} until next CBAM declaration (${next.period})`,
          { dedup_key: dedupKey, period: next.period, days_remaining: days }
        );
      }
    }
  } catch {
    // Non-fatal
  }

  // Flag imports without verified supplier submissions
  try {
    await syncMissingSupplierDataNotifications(supabase, organizationId);
  } catch {
    // Non-fatal
  }

  // Fetch latest 30 notifications (read + unread) for dropdown
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = (data ?? []).map(mapRowToNotification);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

/** Mark notifications as read. Body: { ids?: string[] } — omit ids to mark all. */
export async function PATCH(request: Request) {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  let body: { ids?: string[] } = {};
  try {
    body = (await request.json()) as { ids?: string[] };
  } catch {
    // empty body → mark all
  }

  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("organization_id", organizationId)
    .eq("read", false);

  if (body.ids && body.ids.length > 0) {
    query = query.in("id", body.ids);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
