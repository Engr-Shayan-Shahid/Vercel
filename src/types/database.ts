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
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          eori_number?: string;
          vat_tax_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          eori_number?: string;
          vat_tax_id?: string;
          created_at?: string;
        };
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
      };
      import_logs: {
        Row: {
          id: string;
          organization_id: string;
          material_type: string;
          mass: number;
          origin_country: string;
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
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          compliance_officer_name: string;
          email: string;
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
          new_eu_regulation_alerts?: boolean;
          quarterly_report_reminders?: boolean;
          security_alerts?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
