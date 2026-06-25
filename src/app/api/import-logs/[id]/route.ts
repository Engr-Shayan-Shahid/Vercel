import { NextResponse } from "next/server";

import { requireImporterContext } from "@/lib/auth/api-context";
import {
  mapImportToUpdate,
  mapRowToImport,
} from "@/lib/imports-store";
import type { ImportRecord } from "@/types/import-record";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;
  const { id: rawId } = await context.params;
  const id = rawId?.trim();

  if (!id) {
    return NextResponse.json({ error: "No ID found for operation." }, { status: 400 });
  }

  let record: ImportRecord;

  try {
    record = (await request.json()) as ImportRecord;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const recordId = record.id?.trim();
  if (!recordId || recordId !== id) {
    return NextResponse.json({ error: "Record ID mismatch." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("import_logs")
    .update(mapImportToUpdate(record) as never)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Import record not found." }, { status: 404 });
  }

  return NextResponse.json({ import: mapRowToImport(data), source: "supabase" });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;
  const { id: rawId } = await context.params;
  const id = rawId?.trim();

  if (!id) {
    return NextResponse.json({ error: "No ID found for operation." }, { status: 400 });
  }

  const { data: existingRow } = await supabase
    .from("import_logs")
    .select("proof_of_payment_storage_path")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const existing = existingRow as { proof_of_payment_storage_path: string | null } | null;

  const { data, error } = await supabase
    .from("import_logs")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Import record not found." }, { status: 404 });
  }

  if (existing?.proof_of_payment_storage_path) {
    await supabase.storage
      .from("proof-documents")
      .remove([existing.proof_of_payment_storage_path]);
  }

  return NextResponse.json({ success: true, source: "supabase" });
}
