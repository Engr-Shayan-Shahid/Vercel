import { NextResponse } from "next/server";

import { requireImporterContext } from "@/lib/auth/api-context";
import { mapRowToReport } from "@/lib/reports-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;
  const { id } = await params;

  const { data, error } = await supabase
    .from("emissions_reports")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ report: mapRowToReport(data) });
}
