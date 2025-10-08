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
      ai_artifacts: {
        Row: {
          id: string
          title: string
          description: string | null
          code: string
          language: string
          artifact_type: string
          created_by: string
          is_global: boolean
          tags: string[] | null
          thumbnail_url: string | null
          view_count: number
          fork_count: number
          version: number
          parent_artifact_id: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          code: string
          language: string
          artifact_type?: string
          created_by: string
          is_global?: boolean
          tags?: string[] | null
          thumbnail_url?: string | null
          view_count?: number
          fork_count?: number
          version?: number
          parent_artifact_id?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          code?: string
          language?: string
          artifact_type?: string
          created_by?: string
          is_global?: boolean
          tags?: string[] | null
          thumbnail_url?: string | null
          view_count?: number
          fork_count?: number
          version?: number
          parent_artifact_id?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_artifacts_parent_artifact_id_fkey"
            columns: ["parent_artifact_id"]
            isOneToOne: false
            referencedRelation: "ai_artifacts"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_artifact_favorites: {
        Row: {
          id: string
          artifact_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          artifact_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          artifact_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_artifact_favorites_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "ai_artifacts"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_agents: {
        Row: {
          id: string
          name: string
          provider: string
          model: string
          api_key: string
          system_prompt: string | null
          temperature: number
          max_tokens: number
          status: string
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          provider?: string
          model: string
          api_key: string
          system_prompt?: string | null
          temperature?: number
          max_tokens?: number
          status?: string
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          provider?: string
          model?: string
          api_key?: string
          system_prompt?: string | null
          temperature?: number
          max_tokens?: number
          status?: string
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          title: string | null
          context: Json | null
          status: string
          message_count: number
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          title?: string | null
          context?: Json | null
          status?: string
          message_count?: number
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          title?: string | null
          context?: Json | null
          status?: string
          message_count?: number
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          tokens_used: number | null
          model_version: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          tokens_used?: number | null
          model_version?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          tokens_used?: number | null
          model_version?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          }
        ]
      }
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
      increment_artifact_view_count: {
        Args: { artifact_uuid: string }
        Returns: void
      }
      publish_artifact: {
        Args: { artifact_uuid: string }
        Returns: Json
      }
      unpublish_artifact: {
        Args: { artifact_uuid: string }
        Returns: Json
      }
      fork_artifact: {
        Args: { 
          artifact_uuid: string
          user_id_param: string
          new_title: string
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

