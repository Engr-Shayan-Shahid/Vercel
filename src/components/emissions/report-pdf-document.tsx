import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

import type { AggregatedImportRow, EmissionsReport } from "@/types/emissions-report";

export interface PdfImportRow {
  id: string;
  materialType: string;
  cnCode: string;
  originCountry: string;
  importDate: string;
  mass: number;
  embeddedEmissions: number;
  taxLiability: number;
}

export interface CbamReportPdfProps {
  report: EmissionsReport;
  imports: PdfImportRow[];
  organization: {
    companyLegalName: string;
    eoriNumber: string;
    vatTaxId: string;
    complianceOfficerName: string;
  };
}

const NAVY = "#0f172a";
const ACCENT = "#2563eb";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const LIGHT_BG = "#f8fafc";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: WHITE,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    color: NAVY,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
  },
  logoGroup: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: ACCENT,
  },
  logoTagline: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  reportIdGroup: {
    alignItems: "flex-end",
  },
  reportIdLabel: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reportIdValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 3,
  },
  metaSection: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 18,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
  },
  summaryCardAccent: {
    backgroundColor: "#eff6ff",
    borderColor: ACCENT,
  },
  summaryCardLabel: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  summaryCardValueAccent: {
    color: ACCENT,
    fontSize: 14,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_BG,
  },
  tableCell: {
    fontSize: 8,
    color: NAVY,
  },
  tableCellMuted: {
    fontSize: 8,
    color: MUTED,
  },
  liabilityBox: {
    alignSelf: "flex-end",
    backgroundColor: NAVY,
    borderRadius: 6,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    minWidth: 200,
  },
  liabilityLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  liabilityValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  liabilitySubtext: {
    fontSize: 7.5,
    color: "#94a3b8",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    color: MUTED,
  },
  pageNumber: {
    fontSize: 7.5,
    color: MUTED,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

function fmt(n: number, decimals = 1): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtEur(n: number): string {
  return `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function statusColor(status: string): string {
  if (status === "accepted") return "#dcfce7";
  if (status === "submitted") return "#fef9c3";
  return "#f1f5f9";
}

function statusTextColor(status: string): string {
  if (status === "accepted") return "#166534";
  if (status === "submitted") return "#854d0e";
  return "#475569";
}

function statusLabel(status: string): string {
  if (status === "accepted") return "Submitted";
  if (status === "submitted") return "Ready";
  return "Draft";
}

export function CbamReportPdf({ report, imports, organization }: CbamReportPdfProps) {
  const hasImports = imports.length > 0;

  return (
    <Document
      title={`CBAM Report ${report.reportId}`}
      author="CBAMVault"
      subject={`Quarterly CBAM Emissions Report — ${report.period}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoGroup}>
            <Text style={styles.logoText}>
              {"CBAM"}
              <Text style={styles.logoAccent}>{"Vault"}</Text>
            </Text>
            <Text style={styles.logoTagline}>EU Carbon Border Adjustment Mechanism Platform</Text>
          </View>
          <View style={styles.reportIdGroup}>
            <Text style={styles.reportIdLabel}>Report ID</Text>
            <Text style={styles.reportIdValue}>{report.reportId}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor(report.status), marginTop: 6 },
              ]}
            >
              <Text style={[styles.statusText, { color: statusTextColor(report.status) }]}>
                {statusLabel(report.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Organization + period meta */}
        <View style={styles.metaSection}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Company</Text>
            <Text style={styles.metaValue}>{organization.companyLegalName || "—"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>EORI Number</Text>
            <Text style={styles.metaValue}>{organization.eoriNumber || "—"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>VAT / Tax ID</Text>
            <Text style={styles.metaValue}>{organization.vatTaxId || "—"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Reporting Period</Text>
            <Text style={styles.metaValue}>{report.period}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>{fmtDate(report.createdAt)}</Text>
          </View>
        </View>

        {/* Summary stats */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Total Goods</Text>
            <Text style={styles.summaryCardValue}>{fmt(report.totalGoods)} t</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Embedded Emissions</Text>
            <Text style={styles.summaryCardValue}>{fmt(report.embeddedEmissions)} tCO₂e</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Subject to CBAM</Text>
            <Text style={styles.summaryCardValue}>{fmt(report.emissionsSubjectToCbam)} tCO₂e</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAccent]}>
            <Text style={styles.summaryCardLabel}>ETS Price</Text>
            <Text style={styles.summaryCardValue}>{fmtEur(report.etsPrice)}/tCO₂e</Text>
          </View>
        </View>

        {/* Breakdown by material */}
        <Text style={styles.sectionTitle}>Breakdown by Material Type</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>CN Code</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Material</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Origin</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Mass (t)</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Embedded (tCO₂e)</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>CBAM (tCO₂e)</Text>
          </View>
          {report.aggregatedRows.map((row: AggregatedImportRow, i: number) => (
            <View
              key={`${row.cnCode}-${row.originCountry}`}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCell, { flex: 1.2, fontFamily: "Courier" }]}>
                {row.cnCode}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.materialType}</Text>
              <Text style={[styles.tableCellMuted, { flex: 1.2 }]}>{row.originCountry}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{fmt(row.totalMass)}</Text>
              <Text style={[styles.tableCellMuted, { flex: 1.3 }]}>
                {fmt(row.embeddedEmissions)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.3, color: ACCENT }]}>
                {fmt(row.emissionsSubjectToCbam)}
              </Text>
            </View>
          ))}
        </View>

        {/* Import records table (only on first page if space, else wrap) */}
        {hasImports && (
          <>
            <Text style={styles.sectionTitle}>Import Records ({imports.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Material</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>CN Code</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Origin</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Mass (t)</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Emissions</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Liability</Text>
              </View>
              {imports.map((imp, i) => (
                <View
                  key={imp.id}
                  style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{imp.materialType}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, fontFamily: "Courier" }]}>
                    {imp.cnCode}
                  </Text>
                  <Text style={[styles.tableCellMuted, { flex: 1.3 }]}>{imp.originCountry}</Text>
                  <Text style={[styles.tableCellMuted, { flex: 1 }]}>
                    {fmtDate(imp.importDate)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>{fmt(imp.mass)}</Text>
                  <Text style={[styles.tableCellMuted, { flex: 1.2 }]}>
                    {fmt(imp.embeddedEmissions)} tCO₂e
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{fmtEur(imp.taxLiability)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Total liability box */}
        <View style={styles.liabilityBox}>
          <Text style={styles.liabilityLabel}>Total CBAM Liability</Text>
          <Text style={styles.liabilityValue}>{fmtEur(report.liability)}</Text>
          <Text style={styles.liabilitySubtext}>
            {fmt(report.emissionsSubjectToCbam)} tCO₂e × {fmtEur(report.etsPrice)}/tCO₂e
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by CBAMVault — cbamvault.io</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
