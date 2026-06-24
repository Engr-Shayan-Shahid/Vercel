import { NextResponse } from "next/server";

import {
  addMemoryImport,
  listMemoryImports,
  mapImportToInsert,
  mapRowToImport,
} from "@/lib/imports-store";
import { createServerClient } from "@/lib/supabase/server";
import type { ImportRecord } from "@/types/import-record";

export async function GET() {
  const supabase = createServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("import_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      imports: (data ?? []).map(mapRowToImport),
      source: "supabase",
    });
  }

  return NextResponse.json({
    imports: listMemoryImports(),
    source: "memory",
  });
}

export async function POST(request: Request) {
  let record: ImportRecord;

  try {
    record = (await request.json()) as ImportRecord;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!record.id || !record.materialType) {
    return NextResponse.json({ error: "Missing required import fields." }, { status: 400 });
  }

  const supabase = createServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("import_logs")
      .insert(mapImportToInsert(record) as never)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ import: mapRowToImport(data), source: "supabase" });
  }

  addMemoryImport(record);
  return NextResponse.json({ import: record, source: "memory" });
}
