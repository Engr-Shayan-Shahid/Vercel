export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          eori_number: string;
          vat_tax_id: string;
          org_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          eori_number?: string;
          vat_tax_id?: string;
          org_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          eori_number?: string;
          vat_tax_id?: string;
          org_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey",
            columns: ["organization_id"],
            isOneToOne: false,
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "organization_members_user_id_profiles_fkey",
            columns: ["user_id"],
            isOneToOne: true,
            referencedRelation: "profiles",
            referencedColumns: ["user_id"],
          },
        ];
      };
      invitations: {
        Row: {
          id: string;
          importer_org_id: string;
          email: string;
          token: string;
          status: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          importer_org_id: string;
          email: string;
          token: string;
          status?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          importer_org_id?: string;
          email?: string;
          token?: string;
          status?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      shipment_requests: {
        Row: {
          id: string;
          importer_org_id: string;
          exporter_org_id: string | null;
          invitation_id: string | null;
          exporter_email: string;
          material_type: string;
          mass: number;
          origin_country: string;
          cn_code: string | null;
          reference_number: string | null;
          notes: string | null;
          emission_factor: number | null;
          direct_emissions: number | null;
          indirect_emissions: number | null;
          submission_notes: string | null;
          status: string;
          submitted_at: string | null;
          accepted_at: string | null;
          import_log_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          importer_org_id: string;
          exporter_org_id?: string | null;
          invitation_id?: string | null;
          exporter_email: string;
          material_type: string;
          mass: number;
          origin_country: string;
          cn_code?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          emission_factor?: number | null;
          direct_emissions?: number | null;
          indirect_emissions?: number | null;
          submission_notes?: string | null;
          status?: string;
          submitted_at?: string | null;
          accepted_at?: string | null;
          import_log_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          importer_org_id?: string;
          exporter_org_id?: string | null;
          invitation_id?: string | null;
          exporter_email?: string;
          material_type?: string;
          mass?: number;
          origin_country?: string;
          cn_code?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          emission_factor?: number | null;
          direct_emissions?: number | null;
          indirect_emissions?: number | null;
          submission_notes?: string | null;
          status?: string;
          submitted_at?: string | null;
          accepted_at?: string | null;
          import_log_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      emissions_reports: {
        Row: {
          id: string;
          organization_id: string;
          report_id: string;
          period: string;
          year: number;
          quarter: string;
          total_goods: number;
          embedded_emissions: number;
          emissions_subject_to_cbam: number;
          liability: number;
          ets_price: number;
          status: string;
          import_ids: string[];
          aggregated_rows: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          report_id: string;
          period: string;
          year: number;
          quarter: string;
          total_goods: number;
          embedded_emissions: number;
          emissions_subject_to_cbam: number;
          liability: number;
          ets_price: number;
          status?: string;
          import_ids: string[];
          aggregated_rows: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          report_id?: string;
          period?: string;
          year?: number;
          quarter?: string;
          total_goods?: number;
          embedded_emissions?: number;
          emissions_subject_to_cbam?: number;
          liability?: number;
          ets_price?: number;
          status?: string;
          import_ids?: string[];
          aggregated_rows?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      import_logs: {
        Row: {
          id: string;
          organization_id: string;
          material_type: string;
          mass: number;
          origin_country: string;
          import_date: string;
          emission_factor: number;
          embedded_emissions: number;
          benchmark: number;
          free_allocation: number;
          foreign_price: number;
          foreign_carbon_price_deduction: number;
          ets_price: number;
          tax_liability: number;
          proof_of_payment_file_name: string | null;
          proof_of_payment_storage_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          material_type: string;
          mass: number;
          origin_country: string;
          import_date: string;
          emission_factor: number;
          embedded_emissions: number;
          benchmark: number;
          free_allocation: number;
          foreign_price: number;
          foreign_carbon_price_deduction?: number;
          ets_price: number;
          tax_liability: number;
          proof_of_payment_file_name?: string | null;
          proof_of_payment_storage_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          material_type?: string;
          mass?: number;
          origin_country?: string;
          import_date?: string;
          emission_factor?: number;
          embedded_emissions?: number;
          benchmark?: number;
          free_allocation?: number;
          foreign_price?: number;
          foreign_carbon_price_deduction?: number;
          ets_price?: number;
          tax_liability?: number;
          proof_of_payment_file_name?: string | null;
          proof_of_payment_storage_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          compliance_officer_name: string;
          email: string;
          account_type: string;
          new_eu_regulation_alerts: boolean;
          quarterly_report_reminders: boolean;
          security_alerts: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          compliance_officer_name?: string;
          email?: string;
          account_type?: string;
          new_eu_regulation_alerts?: boolean;
          quarterly_report_reminders?: boolean;
          security_alerts?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          compliance_officer_name?: string;
          email?: string;
          account_type?: string;
          new_eu_regulation_alerts?: boolean;
          quarterly_report_reminders?: boolean;
          security_alerts?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_exporter_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      user_importer_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      auth_user_email: {
        Args: Record<string, never>;
        Returns: string;
      };
      user_organization_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
