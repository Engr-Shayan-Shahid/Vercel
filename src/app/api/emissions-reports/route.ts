import { NextResponse } from "next/server";

import { getApiContext } from "@/lib/auth/api-context";
import { generateReportId } from "@/lib/imports-store";
import {
  mapReportToInsert,
  mapRowToReport,
} from "@/lib/reports-store";
import { summarizeReportFromImports } from "@/lib/report-compliance";
import type { CreateReportInput, ReportStatus } from "@/types/emissions-report";
import { formatReportPeriod } from "@/types/emissions-report";

export async function GET() {
  const result = await getApiContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  const { data, error } = await supabase
    .from("emissions_reports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    reports: (data ?? []).map(mapRowToReport),
    source: "supabase",
  });
}

export async function POST(request: Request) {
  const result = await getApiContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  let body: CreateReportInput;

  try {
    body = (await request.json()) as CreateReportInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { year, quarter, etsPrice, importIds, imports } = body;

  if (!year || !quarter || !etsPrice || !importIds?.length || !imports?.length) {
    return NextResponse.json({ error: "Missing required report fields." }, { status: 400 });
  }

  const selectedImports = imports.filter((record) => importIds.includes(record.id));

  if (selectedImports.length === 0) {
    return NextResponse.json(
      { error: "No matching import logs found for the selected IDs." },
      { status: 400 }
    );
  }

  const summary = summarizeReportFromImports(selectedImports, etsPrice);

  const { count } = await supabase
    .from("emissions_reports")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("year", year)
    .eq("quarter", quarter);

  const sequence = (count ?? 0) + 1;

  const report = {
    id: crypto.randomUUID(),
    reportId: generateReportId(year, quarter, sequence),
    period: formatReportPeriod(year, quarter),
    year,
    quarter,
    totalGoods: summary.totalGoods,
    embeddedEmissions: summary.embeddedEmissions,
    emissionsSubjectToCbam: summary.emissionsSubjectToCbam,
    liability: summary.liability,
    etsPrice,
    status: "draft" as const,
    importIds,
    aggregatedRows: summary.aggregatedRows,
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("emissions_reports")
    .insert(mapReportToInsert(report, organizationId) as never)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: mapRowToReport(data), source: "supabase" });
}

export async function PATCH(request: Request) {
  const result = await getApiContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId } = result.context;

  let body: { id: string; status: ReportStatus };

  try {
    body = (await request.json()) as { id: string; status: ReportStatus };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.id || !body.status) {
    return NextResponse.json({ error: "Missing report id or status." }, { status: 400 });
  }

  const allowed: ReportStatus[] = ["draft", "submitted", "accepted"];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("emissions_reports")
    .update({ status: body.status } as never)
    .eq("id", body.id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ report: mapRowToReport(data), source: "supabase" });
}
