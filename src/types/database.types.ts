export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_types: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_categories: {
        Row: {
          athlete_id: string
          category_id: string
          measured_value: number | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          athlete_id: string
          category_id: string
          measured_value?: number | null
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          athlete_id?: string
          category_id?: string
          measured_value?: number | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_categories_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_facilities: {
        Row: {
          athlete_id: string
          ends_on: string | null
          facility_id: string
          starts_on: string
        }
        Insert: {
          athlete_id: string
          ends_on?: string | null
          facility_id: string
          starts_on?: string
        }
        Update: {
          athlete_id?: string
          ends_on?: string | null
          facility_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_facilities_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_groups: {
        Row: {
          athlete_id: string
          ends_on: string | null
          group_id: string
          starts_on: string
        }
        Insert: {
          athlete_id: string
          ends_on?: string | null
          group_id: string
          starts_on?: string
        }
        Update: {
          athlete_id?: string
          ends_on?: string | null
          group_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_groups_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_guardians: {
        Row: {
          athlete_id: string
          created_at: string
          guardian_id: string
          is_primary: boolean
          relationship: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          guardian_id: string
          is_primary?: boolean
          relationship: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          guardian_id?: string
          is_primary?: boolean
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_guardians_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          birth_date: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          joined_on: string
          last_name: string
          left_on: string | null
          organization_id: string
          phone: string | null
          profile_id: string | null
          status: string
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          joined_on?: string
          last_name: string
          left_on?: string | null
          organization_id: string
          phone?: string | null
          profile_id?: string | null
          status?: string
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          joined_on?: string
          last_name?: string
          left_on?: string | null
          organization_id?: string
          phone?: string | null
          profile_id?: string | null
          status?: string
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athletes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          athlete_id: string
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          training_session_id: string
        }
        Insert: {
          athlete_id: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          training_session_id: string
        }
        Update: {
          athlete_id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          discipline_id: string | null
          id: string
          kind: string
          max_value: number | null
          min_value: number | null
          name: string
          organization_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discipline_id?: string | null
          id?: string
          kind: string
          max_value?: number | null
          min_value?: number | null
          name: string
          organization_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discipline_id?: string | null
          id?: string
          kind?: string
          max_value?: number | null
          min_value?: number | null
          name?: string
          organization_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_facilities: {
        Row: {
          coach_id: string
          ends_on: string | null
          facility_id: string
          starts_on: string
        }
        Insert: {
          coach_id: string
          ends_on?: string | null
          facility_id: string
          starts_on?: string
        }
        Update: {
          coach_id?: string
          ends_on?: string | null
          facility_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_facilities_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_groups: {
        Row: {
          coach_id: string
          ends_on: string | null
          group_id: string
          is_lead: boolean
          starts_on: string
        }
        Insert: {
          coach_id: string
          ends_on?: string | null
          group_id: string
          is_lead?: boolean
          starts_on?: string
        }
        Update: {
          coach_id?: string
          ends_on?: string | null
          group_id?: string
          is_lead?: boolean
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_groups_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          organization_id: string
          organization_member_id: string | null
          phone: string | null
          qualifications: Json
          status: string
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          organization_id: string
          organization_member_id?: string | null
          phone?: string | null
          qualifications?: Json
          status?: string
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string
          organization_member_id?: string | null
          phone?: string | null
          qualifications?: Json
          status?: string
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_attachments: {
        Row: {
          communication_id: string
          document_id: string
        }
        Insert: {
          communication_id: string
          document_id: string
        }
        Update: {
          communication_id?: string
          document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_attachments_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "private_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_recipients: {
        Row: {
          athlete_id: string | null
          communication_id: string
          delivered_at: string | null
          delivery_status: string
          guardian_id: string | null
          id: string
          profile_id: string | null
          read_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          communication_id: string
          delivered_at?: string | null
          delivery_status?: string
          guardian_id?: string | null
          id?: string
          profile_id?: string | null
          read_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          communication_id?: string
          delivered_at?: string | null
          delivery_status?: string
          guardian_id?: string | null
          id?: string
          profile_id?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_recipients_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_recipients_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_recipients_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_recipients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_calls: {
        Row: {
          athlete_id: string
          competition_id: string
          id: string
          invited_at: string
          notes: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          athlete_id: string
          competition_id: string
          id?: string
          invited_at?: string
          notes?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          athlete_id?: string
          competition_id?: string
          id?: string
          invited_at?: string
          notes?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "competition_calls_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_calls_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_results: {
        Row: {
          athlete_id: string
          category_id: string | null
          competition_id: string
          created_at: string
          discipline: string | null
          id: string
          notes: string | null
          placement: number | null
          score: number | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          category_id?: string | null
          competition_id: string
          created_at?: string
          discipline?: string | null
          id?: string
          notes?: string | null
          placement?: number | null
          score?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          category_id?: string | null
          competition_id?: string
          created_at?: string
          discipline?: string | null
          id?: string
          notes?: string | null
          placement?: number | null
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          location: string | null
          name: string
          organization_id: string
          organizer: string | null
          registration_deadline: string | null
          season_id: string | null
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          location?: string | null
          name: string
          organization_id: string
          organizer?: string | null
          registration_deadline?: string | null
          season_id?: string | null
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          location?: string | null
          name?: string
          organization_id?: string
          organizer?: string | null
          registration_deadline?: string | null
          season_id?: string | null
          starts_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          athlete_id: string | null
          created_at: string
          fixed_amount: number | null
          group_id: string | null
          id: string
          name: string
          organization_id: string
          percentage: number | null
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          fixed_amount?: number | null
          group_id?: string | null
          id?: string
          name: string
          organization_id: string
          percentage?: number | null
          updated_at?: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          fixed_amount?: number | null
          group_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          percentage?: number | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          athlete_id: string | null
          created_at: string
          event_id: string
          id: string
          organization_member_id: string | null
          responded_at: string | null
          response: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          organization_member_id?: string | null
          responded_at?: string | null
          response?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          organization_member_id?: string | null
          responded_at?: string | null
          response?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          facility_id: string | null
          id: string
          organization_id: string
          space_id: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          facility_id?: string | null
          id?: string
          organization_id: string
          space_id?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          facility_id?: string | null
          id?: string
          organization_id?: string
          space_id?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exemptions: {
        Row: {
          athlete_id: string
          created_at: string
          fee_plan_id: string | null
          id: string
          organization_id: string
          reason: string
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          fee_plan_id?: string | null
          id?: string
          organization_id: string
          reason: string
          updated_at?: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          fee_plan_id?: string | null
          id?: string
          organization_id?: string
          reason?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exemptions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exemptions_fee_plan_id_fkey"
            columns: ["fee_plan_id"]
            isOneToOne: false
            referencedRelation: "fee_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exemptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          active: boolean
          address_line1: string | null
          city: string | null
          country_code: string
          created_at: string
          id: string
          name: string
          organization_id: string
          postal_code: string | null
          province: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address_line1?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          postal_code?: string | null
          province?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address_line1?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          postal_code?: string | null
          province?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_members: {
        Row: {
          facility_id: string
          organization_member_id: string
        }
        Insert: {
          facility_id: string
          organization_member_id: string
        }
        Update: {
          facility_id?: string
          organization_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_members_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_members_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_plans: {
        Row: {
          active_from: string
          active_to: string | null
          created_at: string
          due_day: number
          facility_id: string | null
          group_id: string | null
          id: string
          monthly_amount: number
          name: string
          organization_id: string
          prorate_on_mid_month_join: boolean
          season_id: string
          updated_at: string
        }
        Insert: {
          active_from: string
          active_to?: string | null
          created_at?: string
          due_day: number
          facility_id?: string | null
          group_id?: string | null
          id?: string
          monthly_amount: number
          name: string
          organization_id: string
          prorate_on_mid_month_join?: boolean
          season_id: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          due_day?: number
          facility_id?: string | null
          group_id?: string | null
          id?: string
          monthly_amount?: number
          name?: string
          organization_id?: string
          prorate_on_mid_month_join?: boolean
          season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_plans_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_plans_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_plans_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      fita_memberships: {
        Row: {
          athlete_id: string
          created_at: string
          document_id: string | null
          ends_on: string | null
          federation: string
          id: string
          membership_number: string
          organization_id: string
          starts_on: string
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          document_id?: string | null
          ends_on?: string | null
          federation?: string
          id?: string
          membership_number: string
          organization_id: string
          starts_on: string
          status: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          document_id?: string | null
          ends_on?: string | null
          federation?: string
          id?: string
          membership_number?: string
          organization_id?: string
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fita_memberships_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fita_memberships_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "private_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fita_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_schedule_slots: {
        Row: {
          created_at: string
          ends_at: string
          group_id: string
          id: string
          organization_id: string
          space_id: string
          starts_at: string
          updated_at: string
          valid_from: string
          valid_to: string | null
          weekday: number
        }
        Insert: {
          created_at?: string
          ends_at: string
          group_id: string
          id?: string
          organization_id: string
          space_id: string
          starts_at: string
          updated_at?: string
          valid_from: string
          valid_to?: string | null
          weekday: number
        }
        Update: {
          created_at?: string
          ends_at?: string
          group_id?: string
          id?: string
          organization_id?: string
          space_id?: string
          starts_at?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_schedule_slots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_schedule_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_schedule_slots_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          active: boolean
          activity_type_id: string | null
          capacity: number | null
          created_at: string
          discipline_id: string | null
          facility_id: string
          id: string
          name: string
          organization_id: string
          season_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          activity_type_id?: string | null
          capacity?: number | null
          created_at?: string
          discipline_id?: string | null
          facility_id: string
          id?: string
          name: string
          organization_id: string
          season_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          activity_type_id?: string | null
          capacity?: number | null
          created_at?: string
          discipline_id?: string | null
          facility_id?: string
          id?: string
          name?: string
          organization_id?: string
          season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          organization_id: string
          phone: string | null
          profile_id: string | null
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          organization_id: string
          phone?: string | null
          profile_id?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string
          phone?: string | null
          profile_id?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_certificates: {
        Row: {
          athlete_id: string
          certificate_type: string
          created_at: string
          document_id: string | null
          expires_on: string
          id: string
          issued_on: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          certificate_type: string
          created_at?: string
          document_id?: string | null
          expires_on: string
          id?: string
          issued_on: string
          organization_id: string
          status: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          certificate_type?: string
          created_at?: string
          document_id?: string | null
          expires_on?: string
          id?: string
          issued_on?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_certificates_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "private_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_roles: {
        Row: {
          organization_member_id: string
          role_id: string
        }
        Insert: {
          organization_member_id: string
          role_id: string
        }
        Update: {
          organization_member_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_roles_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_fees: {
        Row: {
          athlete_id: string
          base_amount: number
          billing_period: string
          created_at: string
          discount_amount: number
          due_on: string
          enrolled_on: string
          exemption_id: string | null
          fee_plan_id: string
          id: string
          organization_id: string
          paid_at: string | null
          prorated_amount: number
          status: Database["public"]["Enums"]["fee_status"]
          updated_at: string
        }
        Insert: {
          athlete_id: string
          base_amount: number
          billing_period: string
          created_at?: string
          discount_amount?: number
          due_on: string
          enrolled_on: string
          exemption_id?: string | null
          fee_plan_id: string
          id?: string
          organization_id: string
          paid_at?: string | null
          prorated_amount: number
          status?: Database["public"]["Enums"]["fee_status"]
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          base_amount?: number
          billing_period?: string
          created_at?: string
          discount_amount?: number
          due_on?: string
          enrolled_on?: string
          exemption_id?: string | null
          fee_plan_id?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          prorated_amount?: number
          status?: Database["public"]["Enums"]["fee_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_fees_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_fees_exemption_id_fkey"
            columns: ["exemption_id"]
            isOneToOne: false
            referencedRelation: "exemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_fees_fee_plan_id_fkey"
            columns: ["fee_plan_id"]
            isOneToOne: false
            referencedRelation: "fee_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          joined_at: string | null
          organization_id: string
          profile_id: string
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id: string
          profile_id: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          fee_grace_days: number
          organization_id: string
          private_documents_bucket: string
          updated_at: string
        }
        Insert: {
          fee_grace_days?: number
          organization_id: string
          private_documents_bucket?: string
          updated_at?: string
        }
        Update: {
          fee_grace_days?: number
          organization_id?: string
          private_documents_bucket?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email: string | null
          id: string
          legal_name: string | null
          name: string
          phone: string | null
          tax_code: string | null
          timezone: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          name: string
          phone?: string | null
          tax_code?: string | null
          timezone?: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          phone?: string | null
          tax_code?: string | null
          timezone?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          athlete_id: string
          created_at: string
          external_reference: string | null
          id: string
          method: string
          monthly_fee_id: string | null
          organization_id: string
          paid_on: string
          recorded_by: string | null
          status: string
          void_reason: string | null
        }
        Insert: {
          amount: number
          athlete_id: string
          created_at?: string
          external_reference?: string | null
          id?: string
          method: string
          monthly_fee_id?: string | null
          organization_id: string
          paid_on: string
          recorded_by?: string | null
          status?: string
          void_reason?: string | null
        }
        Update: {
          amount?: number
          athlete_id?: string
          created_at?: string
          external_reference?: string | null
          id?: string
          method?: string
          monthly_fee_id?: string | null
          organization_id?: string
          paid_on?: string
          recorded_by?: string | null
          status?: string
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_monthly_fee_id_fkey"
            columns: ["monthly_fee_id"]
            isOneToOne: false
            referencedRelation: "monthly_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          id: string
          key: string
        }
        Insert: {
          description: string
          id?: string
          key: string
        }
        Update: {
          description?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      private_documents: {
        Row: {
          athlete_id: string | null
          byte_size: number
          coach_id: string | null
          content_type: string
          created_at: string
          expires_on: string | null
          guardian_id: string | null
          id: string
          kind: string
          object_path: string
          organization_id: string
          original_filename: string
          storage_bucket: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          athlete_id?: string | null
          byte_size: number
          coach_id?: string | null
          content_type: string
          created_at?: string
          expires_on?: string | null
          guardian_id?: string | null
          id?: string
          kind: string
          object_path: string
          organization_id: string
          original_filename: string
          storage_bucket?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          athlete_id?: string | null
          byte_size?: number
          coach_id?: string | null
          content_type?: string
          created_at?: string
          expires_on?: string | null
          guardian_id?: string | null
          id?: string
          kind?: string
          object_path?: string
          organization_id?: string
          original_filename?: string
          storage_bucket?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_documents_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_documents_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_documents_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          issued_on: string
          organization_id: string
          payment_id: string
          receipt_number: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          issued_on: string
          organization_id: string
          payment_id: string
          receipt_number: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          issued_on?: string
          organization_id?: string
          payment_id?: string
          receipt_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "private_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          organization_id: string
          payment_id: string
          reason: string
          recorded_by: string | null
          refunded_on: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          organization_id: string
          payment_id: string
          reason: string
          recorded_by?: string | null
          refunded_on: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          organization_id?: string
          payment_id?: string
          reason?: string
          recorded_by?: string | null
          refunded_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_current: boolean
          name: string
          organization_id: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_current?: boolean
          name: string
          organization_id: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_current?: boolean
          name?: string
          organization_id?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          active: boolean
          capacity: number | null
          created_at: string
          facility_id: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number | null
          created_at?: string
          facility_id: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number | null
          created_at?: string
          facility_id?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean
          created_at: string
          discipline_id: string | null
          duration_months: number
          id: string
          name: string
          organization_id: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discipline_id?: string | null
          duration_months: number
          id?: string
          name: string
          organization_id: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discipline_id?: string | null
          duration_months?: number
          id?: string
          name?: string
          organization_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          athlete_id: string
          created_at: string
          ends_on: string
          id: string
          organization_id: string
          plan_id: string
          price: number
          starts_on: string
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          ends_on: string
          id?: string
          organization_id: string
          plan_id: string
          price: number
          starts_on: string
          status?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          organization_id?: string
          plan_id?: string
          price?: number
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          group_id: string
          id: string
          notes: string | null
          organization_id: string
          space_id: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          group_id: string
          id?: string
          notes?: string | null
          organization_id: string
          space_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          group_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          space_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_lessons: {
        Row: {
          athlete_id: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          facility_id: string
          group_id: string | null
          id: string
          notes: string | null
          organization_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          facility_id: string
          group_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          facility_id?: string
          group_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_lessons_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_lessons_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_lessons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_lessons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_trial_lesson: {
        Args: {
          p_contact_email: string
          p_contact_name: string
          p_contact_phone: string
          p_facility: string
          p_group: string
          p_local_datetime: string
          p_notes: string
        }
        Returns: string
      }
      calculate_prorated_fee: {
        Args: { p_amount: number; p_joined_on: string; p_period: string }
        Returns: number
      }
      create_subscription: {
        Args: { p_athlete: string; p_plan: string; p_starts_on: string }
        Returns: string
      }
      generate_monthly_fees: {
        Args: { p_fee_plan: string; p_period: string }
        Returns: number
      }
      generate_sessions_for_group: {
        Args: { p_from: string; p_group: string; p_to: string }
        Returns: number
      }
      has_organization_permission: {
        Args: { p_key: string; p_org: string }
        Returns: boolean
      }
      is_athlete_self: { Args: { p_athlete: string }; Returns: boolean }
      is_coach_of_athlete: { Args: { p_athlete: string }; Returns: boolean }
      is_coach_of_group: { Args: { p_group: string }; Returns: boolean }
      is_guardian_of: { Args: { p_athlete: string }; Returns: boolean }
      is_organization_member: { Args: { p_org: string }; Returns: boolean }
      my_permissions: { Args: { p_org: string }; Returns: string[] }
      provision_organization: {
        Args: {
          p_admin_first_name: string
          p_admin_last_name: string
          p_name: string
        }
        Returns: string
      }
      refresh_monthly_fee_statuses: {
        Args: { p_organization_id?: string }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "justified"
      fee_status: "due" | "overdue" | "unpaid" | "paid" | "exempt"
      invitation_status: "pending" | "accepted" | "declined" | "withdrawn"
      member_status: "invited" | "active" | "suspended" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "justified"],
      fee_status: ["due", "overdue", "unpaid", "paid", "exempt"],
      invitation_status: ["pending", "accepted", "declined", "withdrawn"],
      member_status: ["invited", "active", "suspended", "archived"],
    },
  },
} as const
