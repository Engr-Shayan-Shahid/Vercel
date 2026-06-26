"use client";

import { useState } from "react";
import { Download, FileType2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/context/user-settings-context";
import {
  downloadFile,
  generateReportXml,
  type ReportOrganizationMetadata,
} from "@/lib/report-export";
import type { EmissionsReport } from "@/types/emissions-report";

interface ExportReportButtonProps {
  report: EmissionsReport | null;
}

export function ExportReportButton({ report }: ExportReportButtonProps) {
  const { settings } = useUserSettings();
  const [isExportingXml, setIsExportingXml] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!report) return null;

  const organization: ReportOrganizationMetadata = {
    companyLegalName: settings.companyLegalName,
    eoriNumber: settings.eoriNumber,
    vatTaxId: settings.vatTaxId,
    complianceOfficerName: settings.complianceOfficerName,
    email: settings.email,
  };

  const handleExportXml = async () => {
    setIsExportingXml(true);
    try {
      const filename = `${report.reportId}.xml`;
      const xml = generateReportXml(report, organization);
      downloadFile(xml, filename, "application/xml");
      toast.success("XML report exported", { description: `${filename} downloaded.` });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Could not generate the report file.",
      });
    } finally {
      setIsExportingXml(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await fetch(`/api/emissions-reports/${report.id}/pdf`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported", { description: `${report.reportId}.pdf downloaded.` });
    } catch (error) {
      toast.error("PDF export failed", {
        description: error instanceof Error ? error.message : "Could not generate the PDF.",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isExportingXml}
        onClick={() => void handleExportXml()}
      >
        {isExportingXml ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileType2 className="h-4 w-4" />
        )}
        Export XML
      </Button>
      <Button size="sm" disabled={isExportingPdf} onClick={() => void handleExportPdf()}>
        {isExportingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download PDF
      </Button>
    </div>
  );
}
