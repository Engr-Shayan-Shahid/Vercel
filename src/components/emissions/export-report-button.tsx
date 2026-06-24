"use client";

import { useState } from "react";
import { Download, FileText, FileType2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  downloadFile,
  generateReportPdfContent,
  generateReportXml,
} from "@/lib/report-export";
import type { EmissionsReport } from "@/types/emissions-report";

interface ExportReportButtonProps {
  report: EmissionsReport | null;
}

export function ExportReportButton({ report }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!report) return null;

  const handleExport = async (format: "xml" | "pdf") => {
    setIsExporting(true);

    try {
      const filename = `${report.reportId}.${format}`;

      if (format === "xml") {
        const xml = generateReportXml(report);
        downloadFile(xml, filename, "application/xml");
        toast.success("XML report exported", {
          description: `${filename} downloaded successfully.`,
        });
      } else {
        const pdfContent = generateReportPdfContent(report);
        downloadFile(pdfContent, filename, "application/pdf");
        toast.success("PDF report exported", {
          description: `${filename} downloaded (mock PDF structure).`,
        });
      }
    } catch {
      toast.error("Export failed", {
        description: "Could not generate the report file.",
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
        onClick={() => void handleExport("xml")}
      >
        <FileType2 className="h-4 w-4" />
        Export XML
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={() => void handleExport("pdf")}
      >
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
      <Button
        size="sm"
        disabled={isExporting}
        onClick={() => {
          void handleExport("xml");
          void handleExport("pdf");
        }}
      >
        <Download className="h-4 w-4" />
        Export Both
      </Button>
    </div>
  );
}
