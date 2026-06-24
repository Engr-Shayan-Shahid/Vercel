"use client";

import { useState } from "react";
import { Download, FileType2 } from "lucide-react";
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
  const [isExporting, setIsExporting] = useState(false);

  if (!report) return null;

  const organization: ReportOrganizationMetadata = {
    companyLegalName: settings.companyLegalName,
    eoriNumber: settings.eoriNumber,
    vatTaxId: settings.vatTaxId,
    complianceOfficerName: settings.complianceOfficerName,
    email: settings.email,
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filename = `${report.reportId}.xml`;
      const xml = generateReportXml(report, organization);
      downloadFile(xml, filename, "application/xml");
      toast.success("XML report exported", {
        description: `${filename} downloaded successfully.`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Could not generate the report file.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={() => void handleExport()}
      >
        <FileType2 className="h-4 w-4" />
        Export XML
      </Button>
      <Button size="sm" disabled={isExporting} onClick={() => void handleExport()}>
        <Download className="h-4 w-4" />
        Download Report
      </Button>
    </div>
  );
}
