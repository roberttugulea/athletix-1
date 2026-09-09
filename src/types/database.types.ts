/**
 * Tipi del database ATHLETIX.
 *
 * ⚠️  PARZIALE E TEMPORANEO — coperte solo le tabelle usate dalla Fase 1
 * (accesso, tenant, RBAC). Sostituire l'intero file con l'output di:
 *
 *     pnpm supabase gen types typescript --linked > src/types/database.types.ts
 *
 * non appena il progetto Supabase è collegato (`pnpm supabase link`).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberStatus = "invited" | "active" | "suspended" | "archived";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          tax_code: string | null;
          vat_number: string | null;
          email: string | null;
          phone: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string | null;
          tax_code?: string | null;
          vat_number?: string | null;
          email?: string | null;
          phone?: string | null;
          timezone?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      organization_settings: {
        Row: {
          organization_id: string;
          private_documents_bucket: string;
          fee_grace_days: number;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          private_documents_bucket?: string;
          fee_grace_days?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["organization_settings"]["Insert"]
        >;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          status: MemberStatus;
          joined_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          status?: MemberStatus;
          joined_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["organization_members"]["Insert"]
        >;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name: string;
          description?: string | null;
          is_system?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      permissions: {
        Row: { id: string; key: string; description: string };
        Insert: { id?: string; key: string; description: string };
        Update: Partial<Database["public"]["Tables"]["permissions"]["Insert"]>;
        Relationships: [];
      };
      member_roles: {
        Row: { organization_member_id: string; role_id: string };
        Insert: { organization_member_id: string; role_id: string };
        Update: Partial<Database["public"]["Tables"]["member_roles"]["Insert"]>;
        Relationships: [];
      };
      role_permissions: {
        Row: { role_id: string; permission_id: string };
        Insert: { role_id: string; permission_id: string };
        Update: Partial<
          Database["public"]["Tables"]["role_permissions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_organization_member: {
        Args: { p_org: string };
        Returns: boolean;
      };
      has_organization_permission: {
        Args: { p_org: string; p_key: string };
        Returns: boolean;
      };
      my_permissions: {
        Args: { p_org: string };
        Returns: string[];
      };
      provision_organization: {
        Args: {
          p_name: string;
          p_admin_first_name: string;
          p_admin_last_name: string;
        };
        Returns: string;
      };
    };
    Enums: {
      member_status: MemberStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
