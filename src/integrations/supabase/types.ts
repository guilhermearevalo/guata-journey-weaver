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
      experiences: {
        Row: {
          cover_image: string | null
          created_at: string
          created_by: string | null
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
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
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
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
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
          target_audience?: string | null
          title?: string
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
      partner_agencies: {
        Row: {
          address: string | null
          cnpj: string | null
          commission_rate: number | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          commission_rate?: number | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          commission_rate?: number | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string
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
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          agency_id: string | null
          client_feedback: string | null
          created_at: string
          created_by: string | null
          description: string | null
          documents: string[] | null
          id: string
          inclusions: string[] | null
          is_approved: boolean | null
          itinerary: Json | null
          request_id: string
          title: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          client_feedback?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          inclusions?: string[] | null
          is_approved?: boolean | null
          itinerary?: Json | null
          request_id: string
          title: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          client_feedback?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          inclusions?: string[] | null
          is_approved?: boolean | null
          itinerary?: Json | null
          request_id?: string
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
      travel_requests: {
        Row: {
          assigned_agency_id: string | null
          assigned_consultant_id: string | null
          budget_range: string | null
          client_email: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          destination: string | null
          id: string
          internal_notes: string | null
          preferences: Json | null
          special_requests: string | null
          status: Database["public"]["Enums"]["request_status"]
          travel_dates: Json | null
          travelers_count: number | null
          updated_at: string
        }
        Insert: {
          assigned_agency_id?: string | null
          assigned_consultant_id?: string | null
          budget_range?: string | null
          client_email: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          internal_notes?: string | null
          preferences?: Json | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          travel_dates?: Json | null
          travelers_count?: number | null
          updated_at?: string
        }
        Update: {
          assigned_agency_id?: string | null
          assigned_consultant_id?: string | null
          budget_range?: string | null
          client_email?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          internal_notes?: string | null
          preferences?: Json | null
          special_requests?: string | null
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
      get_user_agency: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
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
    },
  },
} as const
