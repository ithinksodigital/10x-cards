export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      cards: {
        Row: {
          ai_confidence_score: number | null
          back: string
          created_at: string
          due_at: string | null
          ease_factor: number
          front: string
          front_normalized: string | null
          generation_id: string | null
          id: string
          interval_days: number
          language: string | null
          original_back: string | null
          original_front: string | null
          repetitions: number
          set_id: string
          source_text_excerpt: string | null
          status: Database["public"]["Enums"]["card_status"]
          updated_at: string
          user_id: string
          was_edited_after_generation: boolean
        }
        Insert: {
          ai_confidence_score?: number | null
          back: string
          created_at?: string
          due_at?: string | null
          ease_factor?: number
          front: string
          front_normalized?: string | null
          generation_id?: string | null
          id?: string
          interval_days?: number
          language?: string | null
          original_back?: string | null
          original_front?: string | null
          repetitions?: number
          set_id: string
          source_text_excerpt?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
          user_id: string
          was_edited_after_generation?: boolean
        }
        Update: {
          ai_confidence_score?: number | null
          back?: string
          created_at?: string
          due_at?: string | null
          ease_factor?: number
          front?: string
          front_normalized?: string | null
          generation_id?: string | null
          id?: string
          interval_days?: number
          language?: string | null
          original_back?: string | null
          original_front?: string | null
          repetitions?: number
          set_id?: string
          source_text_excerpt?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
          user_id?: string
          was_edited_after_generation?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cards_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_set_id_user_id_fkey"
            columns: ["set_id", "user_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      generation_error_logs: {
        Row: {
          created_at: string
          error_code: string
          error_details: Json | null
          error_message: string
          id: string
          model: string
          retry_count: number
          source_text_hash: string | null
          source_text_length: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code: string
          error_details?: Json | null
          error_message: string
          id?: string
          model: string
          retry_count?: number
          source_text_hash?: string | null
          source_text_length?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string
          error_details?: Json | null
          error_message?: string
          id?: string
          model?: string
          retry_count?: number
          source_text_hash?: string | null
          source_text_length?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          accepted_count: number
          accepted_edited_count: number
          accepted_unedited_count: number
          completion_tokens: number | null
          created_at: string
          generated_count: number
          generation_duration_ms: number | null
          id: string
          model: string
          prompt_tokens: number | null
          rejected_count: number
          set_id: string | null
          source_text: string
          source_text_hash: string
          source_text_length: number
          total_cost_usd: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_count?: number
          accepted_edited_count?: number
          accepted_unedited_count?: number
          completion_tokens?: number | null
          created_at?: string
          generated_count?: number
          generation_duration_ms?: number | null
          id?: string
          model: string
          prompt_tokens?: number | null
          rejected_count?: number
          set_id?: string | null
          source_text: string
          source_text_hash: string
          source_text_length: number
          total_cost_usd?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_count?: number
          accepted_edited_count?: number
          accepted_unedited_count?: number
          completion_tokens?: number | null
          created_at?: string
          generated_count?: number
          generation_duration_ms?: number | null
          id?: string
          model?: string
          prompt_tokens?: number | null
          rejected_count?: number
          set_id?: string | null
          source_text?: string
          source_text_hash?: string
          source_text_length?: number
          total_cost_usd?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cards_count: number
          created_at: string
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          cards_count?: number
          created_at?: string
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          cards_count?: number
          created_at?: string
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          cards_count: number
          created_at: string
          id: string
          language: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cards_count?: number
          created_at?: string
          id?: string
          language: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cards_count?: number
          created_at?: string
          id?: string
          language?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      card_status: "new" | "learning" | "review" | "relearning"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      card_status: ["new", "learning", "review", "relearning"],
    },
  },
} as const

