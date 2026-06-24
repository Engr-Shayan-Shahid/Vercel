import { NextResponse } from "next/server";

import {
  addMemoryReport,
  generateReportId,
  listMemoryReports,
  mapReportToInsert,
  mapRowToReport,
} from "@/lib/reports-store";
import { summarizeReportFromImports } from "@/lib/report-compliance";
import { createServerClient } from "@/lib/supabase/server";
import type { CreateReportInput } from "@/types/emissions-report";
import { formatReportPeriod } from "@/types/emissions-report";

export async function GET() {
  const supabase = createServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("emissions_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      reports: (data ?? []).map(mapRowToReport),
      source: "supabase",
    });
  }

  return NextResponse.json({
    reports: listMemoryReports(),
    source: "memory",
  });
}

export async function POST(request: Request) {
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
  const existingReports = listMemoryReports().filter(
    (r) => r.year === year && r.quarter === quarter
  );
  const supabase = createServerClient();

  let sequence = existingReports.length + 1;

  if (supabase) {
    const { count } = await supabase
      .from("emissions_reports")
      .select("*", { count: "exact", head: true })
      .eq("year", year)
      .eq("quarter", quarter);

    sequence = (count ?? 0) + 1;
  }

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

  if (supabase) {
    const { data, error } = await supabase
      .from("emissions_reports")
      .insert(mapReportToInsert(report) as never)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report: mapRowToReport(data), source: "supabase" });
  }

  addMemoryReport(report);
  return NextResponse.json({ report, source: "memory" });
}
