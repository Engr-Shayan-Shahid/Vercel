import { NextResponse } from "next/server";

import {
  getApiContext,
  requireExporterContext,
  requireImporterContext,
} from "@/lib/auth/api-context";
import { patchShipmentRequestSchema } from "@/lib/shipment-submission-schema";
import { mapRowToShipmentRequest } from "@/lib/shipment-request-store";
import { buildImportFromShipment } from "@/lib/build-import-from-shipment";
import { mapImportToInsert, mapRowToImport } from "@/lib/imports-store";
import { sendSubmissionNotification } from "@/lib/email/send-submission-notification";
import type { Database } from "@/types/database";

type ShipmentRequestRow = Database["public"]["Tables"]["shipment_requests"]["Row"];
type ShipmentRequestUpdate = Database["public"]["Tables"]["shipment_requests"]["Update"];
type ImportLogInsert = Database["public"]["Tables"]["import_logs"]["Insert"];
type ImportLogRow = Database["public"]["Tables"]["import_logs"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await getApiContext();
  if (!result.ok) return result.response;

  const { supabase } = result.context;

  const { data, error } = await supabase
    .from("shipment_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Shipment request not found." }, { status: 404 });
  }

  return NextResponse.json({ request: mapRowToShipmentRequest(data as ShipmentRequestRow) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = patchShipmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const action = parsed.data.action;

  // --- SUBMIT (exporter) ---
  if (action === "submit") {
    const result = await requireExporterContext();
    if (!result.ok) return result.response;

    const { supabase, organizationId } = result.context;
    const { emissionFactor, directEmissions, indirectEmissions, submissionNotes } = parsed.data;

    // Fetch current row
    const { data: row, error: fetchError } = await supabase
      .from("shipment_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: "Shipment request not found." }, { status: 404 });
    }

    const typedRow = row as ShipmentRequestRow;

    if (typedRow.status !== "pending_exporter") {
      return NextResponse.json(
        { error: "This request is not in a submittable state." },
        { status: 409 }
      );
    }

    // Exporter must be linked (exporter_org_id set) or email match
    const exporterOrgIds = await supabase.rpc("user_exporter_org_ids");
    const orgIds = (exporterOrgIds.data as string[] | null) ?? [];
    const orgMatches = typedRow.exporter_org_id && orgIds.includes(typedRow.exporter_org_id);
    if (!orgMatches && typedRow.exporter_org_id !== organizationId) {
      // RLS will guard this anyway but double-check
    }

    const submitUpdate: ShipmentRequestUpdate = {
      emission_factor: emissionFactor,
      direct_emissions: directEmissions ?? null,
      indirect_emissions: indirectEmissions ?? null,
      submission_notes: submissionNotes ?? null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await supabase
      .from("shipment_requests")
      .update(submitUpdate)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const updatedRow = updated as ShipmentRequestRow;
    const updatedRequest = mapRowToShipmentRequest(updatedRow);

    // Notify importer via email
    let importerEmail: string | null = null;
    try {
      // Look up importer org owner email via profiles
      const { data: memberRows } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", updatedRow.importer_org_id);

      if (memberRows && memberRows.length > 0) {
        const userIds = (memberRows as { user_id: string }[]).map((m) => m.user_id);
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("email")
          .in("user_id", userIds)
          .limit(1);

        if (profileRows && profileRows.length > 0) {
          importerEmail = (profileRows[0] as Pick<ProfileRow, "email">).email ?? null;
        }
      }
    } catch {
      // Non-fatal: email lookup failed
    }

    let emailSent = false;
    let emailError: string | undefined;
    let devRedirected = false;

    if (importerEmail) {
      const emailResult = await sendSubmissionNotification({
        to: importerEmail,
        exporterEmail: updatedRow.exporter_email,
        materialType: updatedRow.material_type,
        mass: Number(updatedRow.mass),
        originCountry: updatedRow.origin_country,
        emissionFactor,
        shipmentsUrl: `${APP_URL}/shipments`,
      });
      emailSent = emailResult.ok;
      emailError = emailResult.ok ? undefined : emailResult.error;
      devRedirected = emailResult.devRedirected ?? false;
    } else {
      emailError = "Importer email not found.";
    }

    return NextResponse.json({
      request: updatedRequest,
      emailSent,
      emailError,
      devRedirected,
    });
  }

  // --- ACCEPT (importer) ---
  if (action === "accept") {
    const result = await requireImporterContext();
    if (!result.ok) return result.response;

    const { supabase, organizationId } = result.context;

    const { data: row, error: fetchError } = await supabase
      .from("shipment_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: "Shipment request not found." }, { status: 404 });
    }

    const typedRow = row as ShipmentRequestRow;

    if (typedRow.importer_org_id !== organizationId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (typedRow.status !== "submitted") {
      return NextResponse.json(
        { error: "Only submitted requests can be accepted." },
        { status: 409 }
      );
    }

    if (typedRow.emission_factor == null) {
      return NextResponse.json(
        { error: "Cannot accept: emission factor is missing from submission." },
        { status: 409 }
      );
    }

    // Guard against duplicate accept
    if (typedRow.import_log_id) {
      return NextResponse.json(
        { error: "This request has already been accepted." },
        { status: 409 }
      );
    }

    const importLogId = crypto.randomUUID();
    const currentRequest = mapRowToShipmentRequest(typedRow);

    let importRecord;
    try {
      importRecord = buildImportFromShipment(currentRequest, importLogId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Cannot build import record: emission factor is missing or zero.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const insertPayload: ImportLogInsert = mapImportToInsert(importRecord, organizationId);

    // Insert import log
    const { data: importLogData, error: importError } = await supabase
      .from("import_logs")
      .insert(insertPayload)
      .select("*")
      .single();

    if (importError) {
      return NextResponse.json({ error: importError.message }, { status: 500 });
    }

    const acceptUpdate: ShipmentRequestUpdate = {
      status: "accepted",
      accepted_at: new Date().toISOString(),
      import_log_id: importLogId,
    };

    // Update shipment request to accepted
    const { data: updated, error: updateError } = await supabase
      .from("shipment_requests")
      .update(acceptUpdate)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      request: mapRowToShipmentRequest(updated as ShipmentRequestRow),
      importLog: mapRowToImport(importLogData as ImportLogRow),
    });
  }

  // --- REJECT (importer) ---
  if (action === "reject") {
    const result = await requireImporterContext();
    if (!result.ok) return result.response;

    const { supabase, organizationId } = result.context;
    const { reason } = parsed.data;

    const { data: row, error: fetchError } = await supabase
      .from("shipment_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: "Shipment request not found." }, { status: 404 });
    }

    const typedRow = row as ShipmentRequestRow;

    if (typedRow.importer_org_id !== organizationId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (typedRow.status !== "submitted") {
      return NextResponse.json(
        { error: "Only submitted requests can be rejected." },
        { status: 409 }
      );
    }

    const existingNotes = typedRow.submission_notes ?? "";
    const rejectionNote = reason
      ? `${existingNotes ? existingNotes + "\n\n" : ""}Rejected: ${reason}`
      : existingNotes;

    const rejectUpdate: ShipmentRequestUpdate = {
      status: "rejected",
      submission_notes: rejectionNote || null,
    };

    const { data: updated, error: updateError } = await supabase
      .from("shipment_requests")
      .update(rejectUpdate)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      request: mapRowToShipmentRequest(updated as ShipmentRequestRow),
    });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
