import { NextResponse } from "next/server";

import { requireImporterContext } from "@/lib/auth/api-context";
import {
  mapImportToInsert,
  mapRowToImport,
} from "@/lib/imports-store";
import type { ImportRecord } from "@/types/import-record";

export async function GET() {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  const { data, error } = await supabase
    .from("import_logs")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imports: (data ?? []).map(mapRowToImport),
    source: "supabase",
  });
}

export async function POST(request: Request) {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  let record: ImportRecord;

  try {
    record = (await request.json()) as ImportRecord;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!record.id || !record.materialType) {
    return NextResponse.json({ error: "Missing required import fields." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("import_logs")
    .insert(mapImportToInsert(record, organizationId))
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ import: mapRowToImport(data), source: "supabase" });
}
