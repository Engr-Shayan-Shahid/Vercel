export type AccountType = "importer" | "exporter";
export type OrgType = "importer" | "exporter";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type ShipmentRequestStatus =
  | "pending_exporter"
  | "submitted"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface Invitation {
  id: string;
  importerOrgId: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface ShipmentRequest {
  id: string;
  importerOrgId: string;
  exporterOrgId: string | null;
  invitationId: string | null;
  exporterEmail: string;
  materialType: string;
  mass: number;
  originCountry: string;
  cnCode: string | null;
  referenceNumber: string | null;
  notes: string | null;
  emissionFactor: number | null;
  directEmissions: number | null;
  indirectEmissions: number | null;
  submissionNotes: string | null;
  status: ShipmentRequestStatus;
  submittedAt: string | null;
  acceptedAt: string | null;
  importLogId: string | null;
  createdAt: string;
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentRequestStatus, string> = {
  pending_exporter: "Pending",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function isAccountType(value: string): value is AccountType {
  return value === "importer" || value === "exporter";
}

export function isOrgType(value: string): value is OrgType {
  return value === "importer" || value === "exporter";
}
