import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import React from "react";

import { requireImporterContext } from "@/lib/auth/api-context";
import { mapRowToImport } from "@/lib/imports-store";
import { mapRowToReport } from "@/lib/reports-store";
import { CbamReportPdf, type PdfImportRow } from "@/components/emissions/report-pdf-document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, organization } = result.context;
  const { id } = await params;

  const { data: reportRow, error: reportError } = await supabase
    .from("emissions_reports")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  if (!reportRow) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const report = mapRowToReport(reportRow);

  const importRows: PdfImportRow[] = [];

  if (report.importIds.length > 0) {
    const { data: importData } = await supabase
      .from("import_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .in("id", report.importIds)
      .order("import_date", { ascending: true });

    if (importData) {
      for (const row of importData) {
        const rec = mapRowToImport(row);
        importRows.push({
          id: rec.id,
          materialType: rec.materialType,
          cnCode: rec.cnCode,
          originCountry: rec.originCountry,
          importDate: rec.importDate,
          mass: rec.mass,
          embeddedEmissions: rec.embeddedEmissions,
          taxLiability: rec.taxLiability,
        });
      }
    }
  }

  const orgMeta = {
    companyLegalName: organization.name ?? "",
    eoriNumber: organization.eori_number ?? "",
    vatTaxId: organization.vat_tax_id ?? "",
    complianceOfficerName: "",
  };

  const doc = React.createElement(
    CbamReportPdf,
    { report, imports: importRows, organization: orgMeta }
  ) as unknown as React.ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.reportId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
