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
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_code: string
          coach_id: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          badge_code: string
          coach_id: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          badge_code?: string
          coach_id?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_feedback: {
        Row: {
          audit_id: string
          author_id: string
          content: string
          created_at: string
          feedback_type: string
          id: string
          updated_at: string
        }
        Insert: {
          audit_id: string
          author_id: string
          content: string
          created_at?: string
          feedback_type?: string
          id?: string
          updated_at?: string
        }
        Update: {
          audit_id?: string
          author_id?: string
          content?: string
          created_at?: string
          feedback_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_feedback_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_frameworks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          process_id: string | null
          total_max_score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          process_id?: string | null
          total_max_score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          process_id?: string | null
          total_max_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_frameworks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_scores: {
        Row: {
          audit_id: string
          comments: string | null
          created_at: string
          criterion: string
          id: string
          max_score: number
          score: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          audit_id: string
          comments?: string | null
          created_at?: string
          criterion: string
          id?: string
          max_score?: number
          score?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          audit_id?: string
          comments?: string | null
          created_at?: string
          criterion?: string
          id?: string
          max_score?: number
          score?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_scores_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_status_history: {
        Row: {
          audit_id: string
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["audit_status"] | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["audit_status"]
        }
        Insert: {
          audit_id: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["audit_status"] | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["audit_status"]
        }
        Update: {
          audit_id?: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["audit_status"] | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["audit_status"]
        }
        Relationships: [
          {
            foreignKeyName: "audit_status_history_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          accepted_by_coach: boolean | null
          coach_id: string
          conducted_at: string | null
          created_at: string
          created_by: string | null
          expert_id: string | null
          framework_id: string | null
          id: string
          max_score: number | null
          process_id: string | null
          published_at: string | null
          rag: Database["public"]["Enums"]["rag_status"] | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["audit_status"]
          title: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          accepted_by_coach?: boolean | null
          coach_id: string
          conducted_at?: string | null
          created_at?: string
          created_by?: string | null
          expert_id?: string | null
          framework_id?: string | null
          id?: string
          max_score?: number | null
          process_id?: string | null
          published_at?: string | null
          rag?: Database["public"]["Enums"]["rag_status"] | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          title: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          accepted_by_coach?: boolean | null
          coach_id?: string
          conducted_at?: string | null
          created_at?: string
          created_by?: string | null
          expert_id?: string | null
          framework_id?: string | null
          id?: string
          max_score?: number | null
          process_id?: string | null
          published_at?: string | null
          rag?: Database["public"]["Enums"]["rag_status"] | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          title?: string
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "audit_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          audit_id: string
          created_at: string
          id: string
          raised_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["challenge_status"]
          updated_at: string
        }
        Insert: {
          audit_id: string
          created_at?: string
          id?: string
          raised_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          updated_at?: string
        }
        Update: {
          audit_id?: string
          created_at?: string
          id?: string
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_objections: {
        Row: {
          audit_id: string
          coach_id: string
          content: string
          created_at: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          response: string | null
          status: Database["public"]["Enums"]["objection_status"]
          updated_at: string
        }
        Insert: {
          audit_id: string
          coach_id: string
          content: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          response?: string | null
          status?: Database["public"]["Enums"]["objection_status"]
          updated_at?: string
        }
        Update: {
          audit_id?: string
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          response?: string | null
          status?: Database["public"]["Enums"]["objection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_objections_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_objections_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          cpi: number | null
          created_at: string
          current_quality_score: number | null
          current_rag: Database["public"]["Enums"]["rag_status"] | null
          current_rank: number | null
          current_rating: number | null
          hire_date: string | null
          id: string
          profile_id: string
          specialization: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          cpi?: number | null
          created_at?: string
          current_quality_score?: number | null
          current_rag?: Database["public"]["Enums"]["rag_status"] | null
          current_rank?: number | null
          current_rating?: number | null
          hire_date?: string | null
          id?: string
          profile_id: string
          specialization?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          cpi?: number | null
          created_at?: string
          current_quality_score?: number | null
          current_rag?: Database["public"]["Enums"]["rag_status"] | null
          current_rank?: number | null
          current_rating?: number | null
          hire_date?: string | null
          id?: string
          profile_id?: string
          specialization?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      experts: {
        Row: {
          created_at: string
          hire_date: string | null
          id: string
          profile_id: string
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hire_date?: string | null
          id?: string
          profile_id: string
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hire_date?: string | null
          id?: string
          profile_id?: string
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deactivated_at: string | null
          email: string
          employee_code: string | null
          full_name: string
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          email: string
          employee_code?: string | null
          full_name?: string
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          email?: string
          employee_code?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_reports: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          month: string
          notes: string | null
          rag: Database["public"]["Enums"]["rag_status"]
          score: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          rag: Database["public"]["Enums"]["rag_status"]
          score?: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          rag?: Database["public"]["Enums"]["rag_status"]
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "rag_reports_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          month: string
          notes: string | null
          rating: number
          source: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          rating: number
          source?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          rating?: number
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      success_stories: {
        Row: {
          achieved_at: string
          coach_id: string
          created_at: string
          description: string
          id: string
          member_name: string
          outcomes: string | null
          title: string
        }
        Insert: {
          achieved_at?: string
          coach_id: string
          created_at?: string
          description: string
          id?: string
          member_name: string
          outcomes?: string | null
          title: string
        }
        Update: {
          achieved_at?: string
          coach_id?: string
          created_at?: string
          description?: string
          id?: string
          member_name?: string
          outcomes?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_stories_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          coach_id: string
          content: string
          created_at: string
          given_at: string
          id: string
          member_name: string
          rating: number | null
        }
        Insert: {
          coach_id: string
          content: string
          created_at?: string
          given_at?: string
          id?: string
          member_name: string
          rating?: number | null
        }
        Update: {
          coach_id?: string
          content?: string
          created_at?: string
          given_at?: string
          id?: string
          member_name?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
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
          role: Database["public"]["Enums"]["app_role"]
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
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "expert" | "coach"
      audit_status:
        | "scheduled"
        | "in_progress"
        | "pending_review"
        | "published"
        | "challenged"
        | "closed"
      challenge_status: "open" | "under_review" | "resolved" | "rejected"
      objection_status: "open" | "under_review" | "accepted" | "rejected"
      rag_status: "red" | "amber" | "green"
      user_status: "active" | "inactive" | "suspended"
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
      app_role: ["super_admin", "admin", "expert", "coach"],
      audit_status: [
        "scheduled",
        "in_progress",
        "pending_review",
        "published",
        "challenged",
        "closed",
      ],
      challenge_status: ["open", "under_review", "resolved", "rejected"],
      objection_status: ["open", "under_review", "accepted", "rejected"],
      rag_status: ["red", "amber", "green"],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
