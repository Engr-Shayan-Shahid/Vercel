import type { Database } from "@/types/database";
import type { Invitation, ShipmentRequest } from "@/types/shipment-request";

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
type ShipmentRequestRow = Database["public"]["Tables"]["shipment_requests"]["Row"];

export function mapRowToInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    importerOrgId: row.importer_org_id,
    email: row.email,
    token: row.token,
    status: row.status as Invitation["status"],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function mapRowToShipmentRequest(row: ShipmentRequestRow): ShipmentRequest {
  return {
    id: row.id,
    importerOrgId: row.importer_org_id,
    exporterOrgId: row.exporter_org_id,
    invitationId: row.invitation_id,
    exporterEmail: row.exporter_email,
    materialType: row.material_type,
    mass: Number(row.mass),
    originCountry: row.origin_country,
    cnCode: row.cn_code,
    referenceNumber: row.reference_number,
    notes: row.notes,
    emissionFactor: row.emission_factor != null ? Number(row.emission_factor) : null,
    directEmissions: row.direct_emissions != null ? Number(row.direct_emissions) : null,
    indirectEmissions: row.indirect_emissions != null ? Number(row.indirect_emissions) : null,
    submissionNotes: row.submission_notes,
    status: row.status as ShipmentRequest["status"],
    submittedAt: row.submitted_at,
    acceptedAt: row.accepted_at,
    importLogId: row.import_log_id,
    createdAt: row.created_at,
  };
}
