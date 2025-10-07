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
      tv_command_log: {
        Row: {
          command_type: string
          error_message: string | null
          executed_at: string | null
          id: string
          latency_ms: number | null
          payload: Json | null
          success: boolean
          tv_id: string
        }
        Insert: {
          command_type: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          success: boolean
          tv_id: string
        }
        Update: {
          command_type?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          success?: boolean
          tv_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tv_command_log_tv_id_fkey"
            columns: ["tv_id"]
            isOneToOne: false
            referencedRelation: "tv_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_commands: {
        Row: {
          command_type: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          payload: Json | null
          sent_at: string | null
          status: string | null
          tv_id: string
          updated_at: string | null
        }
        Insert: {
          command_type: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string | null
          tv_id: string
          updated_at?: string | null
        }
        Update: {
          command_type?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string | null
          tv_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tv_commands_tv_id_fkey"
            columns: ["tv_id"]
            isOneToOne: false
            referencedRelation: "tv_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_devices: {
        Row: {
          created_at: string | null
          current_config_id: number | null
          device_name: string
          id: string
          ip_address: string | null
          last_seen: string | null
          location_id: number
          metadata: Json | null
          status: string | null
          tv_number: number
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          current_config_id?: number | null
          device_name: string
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          location_id: number
          metadata?: Json | null
          status?: string | null
          tv_number: number
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          current_config_id?: number | null
          device_name?: string
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          location_id?: number
          metadata?: Json | null
          status?: string | null
          tv_number?: number
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_commands: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

