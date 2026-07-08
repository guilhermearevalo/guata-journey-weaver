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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklist_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_template_items: {
        Row: {
          id: string
          template_id: string
          title: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          title: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          title?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      planning_tasks: {
        Row: {
          id: string
          proposal_id: string
          title: string
          note: string | null
          due_date: string | null
          assignee_id: string | null
          is_done: boolean
          done_at: string | null
          position: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          title: string
          note?: string | null
          due_date?: string | null
          assignee_id?: string | null
          is_done?: boolean
          done_at?: string | null
          position?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          title?: string
          note?: string | null
          due_date?: string | null
          assignee_id?: string | null
          is_done?: boolean
          done_at?: string | null
          position?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          client_id: string | null
          created_at: string
          experience_id: string | null
          id: string
          payment_status: string | null
          proposal_id: string | null
          request_id: string | null
          status: string | null
          total_amount: number
          travel_date: string | null
          travelers_count: number | null
          updated_at: string
          vouchers: string[] | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          experience_id?: string | null
          id?: string
          payment_status?: string | null
          proposal_id?: string | null
          request_id?: string | null
          status?: string | null
          total_amount: number
          travel_date?: string | null
          travelers_count?: number | null
          updated_at?: string
          vouchers?: string[] | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          experience_id?: string | null
          id?: string
          payment_status?: string | null
          proposal_id?: string | null
          request_id?: string | null
          status?: string | null
          total_amount?: number
          travel_date?: string | null
          travelers_count?: number | null
          updated_at?: string
          vouchers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          author_id: string | null
          content: Json
          created_at: string
          id: string
          meta_description: string | null
          slug: string
          status: Database["public"]["Enums"]["page_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          meta_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["page_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          meta_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["page_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_payments: {
        Row: {
          agency_id: string
          client_name: string | null
          created_at: string
          created_by: string | null
          destination: string | null
          gross_amount: number
          guata_commission: number
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          partner_amount: number
          proposal_id: string | null
          sale_date: string | null
          settlement_id: string | null
          source: string
          status: string
          stripe_fee: number | null
        }
        Insert: {
          agency_id: string
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          gross_amount: number
          guata_commission: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          partner_amount: number
          proposal_id?: string | null
          sale_date?: string | null
          settlement_id?: string | null
          source?: string
          status?: string
          stripe_fee?: number | null
        }
        Update: {
          agency_id?: string
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          gross_amount?: number
          guata_commission?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          partner_amount?: number
          proposal_id?: string | null
          sale_date?: string | null
          settlement_id?: string | null
          source?: string
          status?: string
          stripe_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "partner_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_trips: {
        Row: {
          agency_id: string | null
          client_name: string | null
          client_photo: string | null
          client_quote: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          destination: string
          display_order: number
          gallery: string[] | null
          id: string
          is_published: boolean
          title: string
          trip_month: number | null
          trip_year: number | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          agency_id?: string | null
          client_name?: string | null
          client_photo?: string | null
          client_quote?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination: string
          display_order?: number
          gallery?: string[] | null
          id?: string
          is_published?: boolean
          title: string
          trip_month?: number | null
          trip_year?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          agency_id?: string | null
          client_name?: string | null
          client_photo?: string | null
          client_quote?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination?: string
          display_order?: number
          gallery?: string[] | null
          id?: string
          is_published?: boolean
          title?: string
          trip_month?: number | null
          trip_year?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_trips_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "partner_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          cover_image: string | null
          created_at: string
          created_by: string | null
          departure_city: string | null
          departure_dates: Json | null
          description: string | null
          destination: string
          duration_days: number | null
          exclusions: string[] | null
          experience_type: Database["public"]["Enums"]["experience_type"]
          id: string
          images: string[] | null
          inclusions: string[] | null
          is_featured: boolean | null
          is_published: boolean | null
          itinerary: Json | null
          max_participants: number | null
          operator_agency_id: string | null
          price: number | null
          short_description: string | null
          slug: string | null
          stops: Json | null
          target_audience: string | null
          title: string
          transport_type: string | null
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          departure_city?: string | null
          departure_dates?: Json | null
          description?: string | null
          destination: string
          duration_days?: number | null
          exclusions?: string[] | null
          experience_type?: Database["public"]["Enums"]["experience_type"]
          id?: string
          images?: string[] | null
          inclusions?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          itinerary?: Json | null
          max_participants?: number | null
          operator_agency_id?: string | null
          price?: number | null
          short_description?: string | null
          slug?: string | null
          stops?: Json | null
          target_audience?: string | null
          title: string
          transport_type?: string | null
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          departure_city?: string | null
          departure_dates?: Json | null
          description?: string | null
          destination?: string
          duration_days?: number | null
          exclusions?: string[] | null
          experience_type?: Database["public"]["Enums"]["experience_type"]
          id?: string
          images?: string[] | null
          inclusions?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          itinerary?: Json | null
          max_participants?: number | null
          operator_agency_id?: string | null
          price?: number | null
          short_description?: string | null
          slug?: string | null
          stops?: Json | null
          target_audience?: string | null
          title?: string
          transport_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_operator_agency_id_fkey"
            columns: ["operator_agency_id"]
            isOneToOne: false
            referencedRelation: "partner_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_templates: {
        Row: {
          agency_id: string | null
          created_at: string
          created_by: string | null
          destination: string | null
          duration_days: number | null
          id: string
          itinerary: Json
          name: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          duration_days?: number | null
          id?: string
          itinerary?: Json
          name: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          duration_days?: number | null
          id?: string
          itinerary?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_templates_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "partner_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string | null
          request_id: string | null
          sender_id: string | null
        }
        Insert: {
          channel?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          request_id?: string | null
          sender_id?: string | null
        }
        Update: {
          channel?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          request_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_settlements: {
        Row: {
          agency_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          period_month: number
          period_year: number
          status: string
          total_commission: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month: number
          period_year: number
          status?: string
          total_commission?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          status?: string
          total_commission?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          read_at: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          read_at?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          read_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      partner_agencies: {
        Row: {
          address: string | null
          admin_reviewed_at: string | null
          cnpj: string | null
          commission_rate: number | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_external: boolean | null
          logo_url: string | null
          name: string
          regions: string[] | null
          responsible_name: string | null
          specialties: string[] | null
          stripe_fee_bearer: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          admin_reviewed_at?: string | null
          cnpj?: string | null
          commission_rate?: number | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          logo_url?: string | null
          name: string
          regions?: string[] | null
          responsible_name?: string | null
          specialties?: string[] | null
          stripe_fee_bearer?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          admin_reviewed_at?: string | null
          cnpj?: string | null
          commission_rate?: number | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          logo_url?: string | null
          name?: string
          regions?: string[] | null
          responsible_name?: string | null
          specialties?: string[] | null
          stripe_fee_bearer?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      partner_users: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "partner_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          must_change_password: boolean
          phone: string | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          must_change_password?: boolean
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          must_change_password?: boolean
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          access_code: string | null
          agency_id: string | null
          client_feedback: string | null
          created_at: string
          created_by: string | null
          description: string | null
          documents: string[] | null
          documents_checklist: Json | null
          dossier: Json
          id: string
          inclusions: string[] | null
          is_approved: boolean | null
          itinerary: Json | null
          payment_enabled: boolean | null
          payment_links: Json | null
          payment_status: string | null
          request_id: string
          share_enabled: boolean
          share_token: string | null
          title: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          access_code?: string | null
          agency_id?: string | null
          client_feedback?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: string[] | null
          documents_checklist?: Json | null
          dossier?: Json
          id?: string
          inclusions?: string[] | null
          is_approved?: boolean | null
          itinerary?: Json | null
          payment_enabled?: boolean | null
          payment_links?: Json | null
          payment_status?: string | null
          request_id: string
          share_enabled?: boolean
          share_token?: string | null
          title: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          access_code?: string | null
          agency_id?: string | null
          client_feedback?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: string[] | null
          documents_checklist?: Json | null
          dossier?: Json
          id?: string
          inclusions?: string[] | null
          is_approved?: boolean | null
          itinerary?: Json | null
          payment_enabled?: boolean | null
          payment_links?: Json | null
          payment_status?: string | null
          request_id?: string
          share_enabled?: boolean
          share_token?: string | null
          title?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "partner_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_id: string | null
          client_location: string | null
          client_name: string
          client_photo_url: string | null
          created_at: string | null
          id: string
          rating: number | null
          status: string | null
          text: string
          trip_name: string | null
        }
        Insert: {
          client_id?: string | null
          client_location?: string | null
          client_name: string
          client_photo_url?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          status?: string | null
          text: string
          trip_name?: string | null
        }
        Update: {
          client_id?: string | null
          client_location?: string | null
          client_name?: string
          client_photo_url?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          status?: string | null
          text?: string
          trip_name?: string | null
        }
        Relationships: []
      }
      travel_documents: {
        Row: {
          category: string
          created_at: string
          document_type: string
          file_path: string | null
          file_url: string | null
          id: string
          notes: string | null
          proposal_id: string
          request_id: string
          status: string
          title: string
          updated_at: string
          uploaded_by: string | null
          visible_in_public: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          document_type?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          proposal_id: string
          request_id: string
          status?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          visible_in_public?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          document_type?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          proposal_id?: string
          request_id?: string
          status?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          visible_in_public?: boolean
        }
        Relationships: []
      }
      travel_requests: {
        Row: {
          admin_reviewed_at: string | null
          assigned_agency_id: string | null
          assigned_consultant_id: string | null
          budget_range: string | null
          client_email: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          destination: string | null
          external_notes: string | null
          id: string
          internal_notes: string | null
          preferences: Json | null
          special_requests: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          service_type_note: string | null
          status: Database["public"]["Enums"]["request_status"]
          travel_dates: Json | null
          travelers_count: number | null
          updated_at: string
        }
        Insert: {
          admin_reviewed_at?: string | null
          assigned_agency_id?: string | null
          assigned_consultant_id?: string | null
          budget_range?: string | null
          client_email: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          destination?: string | null
          external_notes?: string | null
          id?: string
          internal_notes?: string | null
          preferences?: Json | null
          special_requests?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          service_type_note?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          travel_dates?: Json | null
          travelers_count?: number | null
          updated_at?: string
        }
        Update: {
          admin_reviewed_at?: string | null
          assigned_agency_id?: string | null
          assigned_consultant_id?: string | null
          budget_range?: string | null
          client_email?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          destination?: string | null
          external_notes?: string | null
          id?: string
          internal_notes?: string | null
          preferences?: Json | null
          special_requests?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          service_type_note?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          travel_dates?: Json | null
          travelers_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_requests_assigned_agency_id_fkey"
            columns: ["assigned_agency_id"]
            isOneToOne: false
            referencedRelation: "partner_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_itinerary: { Args: { _code?: string; _token: string }; Returns: Json }
      get_public_proposal: { Args: { _token: string }; Returns: Json }
      get_public_travel_documents: {
        Args: { _code?: string; _token: string }
        Returns: {
          category: string
          created_at: string
          file_path: string
          file_url: string
          id: string
          notes: string
          proposal_id: string
          title: string
          visible_in_public: boolean
        }[]
      }
      get_user_agency: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_shared_proposal_for_request: {
        Args: { _request_id: string }
        Returns: boolean
      }
      is_request_client: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      client_approve_proposal: { Args: { p_proposal_id: string }; Returns: undefined }
      create_partner_access: {
        Args: { p_agency_id: string; p_email: string; p_full_name: string }
        Returns: Json
      }
      create_staff_access: {
        Args: { p_email: string; p_full_name: string; p_role: Database["public"]["Enums"]["app_role"] }
        Returns: Json
      }
      reset_staff_password: { Args: { p_user_id: string }; Returns: Json }
      reset_partner_password: { Args: { p_agency_id: string }; Returns: Json }
      partner_insert_external_sale: {
        Args: {
          _client_name?: string
          _destination?: string
          _gross_amount: number
          _notes?: string
          _sale_date?: string
        }
        Returns: string
      }
      proposal_is_shared: { Args: { _proposal_id: string }; Returns: boolean }
      update_commission_note: {
        Args: { _notes: string; _payment_id: string }
        Returns: undefined
      }
      update_demo_roles: { Args: never; Returns: undefined }
      verify_proposal_access_code: {
        Args: { _code: string; _token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "consultant" | "manager" | "admin" | "partner"
      experience_type: "package" | "excursion" | "custom" | "thematic"
      page_status: "draft" | "published" | "hidden"
      request_status:
        | "pending"
        | "in_analysis"
        | "proposal_sent"
        | "approved"
        | "in_operation"
        | "completed"
        | "cancelled"
      service_type: "consultancy" | "full_package" | "other"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "consultant", "manager", "admin", "partner"],
      experience_type: ["package", "excursion", "custom", "thematic"],
      page_status: ["draft", "published", "hidden"],
      request_status: [
        "pending",
        "in_analysis",
        "proposal_sent",
        "approved",
        "in_operation",
        "completed",
        "cancelled",
      ],
      service_type: ["consultancy", "full_package", "other"],
    },
  },
} as const
