import { NextResponse } from "next/server";

import {
  deleteMemoryImport,
  getMemoryImport,
  mapImportToUpdate,
  mapRowToImport,
  updateMemoryImport,
} from "@/lib/imports-store";
import { createServerClient } from "@/lib/supabase/server";
import type { ImportRecord } from "@/types/import-record";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = rawId?.trim();

  if (!id) {
    console.error("No ID found for operation");
    return NextResponse.json({ error: "No ID found for operation." }, { status: 400 });
  }

  let record: ImportRecord;

  try {
    record = (await request.json()) as ImportRecord;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const recordId = record.id?.trim();
  if (!recordId) {
    console.error("No ID found for operation");
    return NextResponse.json({ error: "No ID found for operation." }, { status: 400 });
  }

  if (recordId !== id) {
    return NextResponse.json({ error: "Record ID mismatch." }, { status: 400 });
  }

  const supabase = createServerClient();

  if (supabase) {
    console.log("Attempting to edit ID:", id);

    const { data, error } = await supabase
      .from("import_logs")
      .update(mapImportToUpdate(record) as never)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Supabase edit failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.error("Import record not found in Supabase for ID:", id);
      return NextResponse.json({ error: "Import record not found." }, { status: 404 });
    }

    return NextResponse.json({ import: mapRowToImport(data), source: "supabase" });
  }

  console.log("Attempting to edit ID:", id);

  const existing = getMemoryImport(id);
  if (!existing) {
    console.error("Import record not found in memory for ID:", id);
    return NextResponse.json({ error: "Import record not found." }, { status: 404 });
  }

  const updated = updateMemoryImport({
    ...record,
    proofOfPaymentUrl: record.proofOfPaymentUrl ?? existing.proofOfPaymentUrl,
    proofOfPaymentMimeType: record.proofOfPaymentMimeType ?? existing.proofOfPaymentMimeType,
  });

  if (!updated) {
    return NextResponse.json({ error: "Import record not found." }, { status: 404 });
  }

  return NextResponse.json({ import: updated, source: "memory" });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = rawId?.trim();

  if (!id) {
    console.error("No ID found for operation");
    return NextResponse.json({ error: "No ID found for operation." }, { status: 400 });
  }

  const supabase = createServerClient();

  if (supabase) {
    console.log("Attempting to delete ID:", id);

    const { data, error } = await supabase
      .from("import_logs")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("Supabase delete failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error("Import record not found in Supabase for ID:", id);
      return NextResponse.json({ error: "Import record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, source: "supabase" });
  }

  console.log("Attempting to delete ID:", id);

  const deleted = deleteMemoryImport(id);
  if (!deleted) {
    console.error("Import record not found in memory for ID:", id);
    return NextResponse.json({ error: "Import record not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, source: "memory" });
}
