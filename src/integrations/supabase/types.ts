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
      alarms: {
        Row: {
          captcha_difficulty: number | null
          captcha_enabled: boolean | null
          captcha_type: string | null
          created_at: string
          days_of_week: number[] | null
          enabled: boolean | null
          gradual_volume: boolean | null
          id: string
          label: string | null
          sound_id: string | null
          time: string
          updated_at: string
          user_id: string
          vibration: boolean | null
          wake_window_minutes: number | null
        }
        Insert: {
          captcha_difficulty?: number | null
          captcha_enabled?: boolean | null
          captcha_type?: string | null
          created_at?: string
          days_of_week?: number[] | null
          enabled?: boolean | null
          gradual_volume?: boolean | null
          id?: string
          label?: string | null
          sound_id?: string | null
          time: string
          updated_at?: string
          user_id: string
          vibration?: boolean | null
          wake_window_minutes?: number | null
        }
        Update: {
          captcha_difficulty?: number | null
          captcha_enabled?: boolean | null
          captcha_type?: string | null
          created_at?: string
          days_of_week?: number[] | null
          enabled?: boolean | null
          gradual_volume?: boolean | null
          id?: string
          label?: string | null
          sound_id?: string | null
          time?: string
          updated_at?: string
          user_id?: string
          vibration?: boolean | null
          wake_window_minutes?: number | null
        }
        Relationships: []
      }
      dreams: {
        Row: {
          clarity: number | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_lucid: boolean | null
          mood: string
          sleep_record_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clarity?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_lucid?: boolean | null
          mood: string
          sleep_record_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clarity?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_lucid?: boolean | null
          mood?: string
          sleep_record_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dreams_sleep_record_id_fkey"
            columns: ["sleep_record_id"]
            isOneToOne: false
            referencedRelation: "sleep_records"
            referencedColumns: ["id"]
          },
        ]
      }
      noise_events: {
        Row: {
          created_at: string
          duration_seconds: number | null
          event_type: string
          id: string
          intensity: number | null
          sleep_record_id: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          event_type: string
          id?: string
          intensity?: number | null
          sleep_record_id: string
          timestamp: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          event_type?: string
          id?: string
          intensity?: number | null
          sleep_record_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "noise_events_sleep_record_id_fkey"
            columns: ["sleep_record_id"]
            isOneToOne: false
            referencedRelation: "sleep_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_bedtime: string | null
          preferred_wake_time: string | null
          sleep_goal_hours: number | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_bedtime?: string | null
          preferred_wake_time?: string | null
          sleep_goal_hours?: number | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_bedtime?: string | null
          preferred_wake_time?: string | null
          sleep_goal_hours?: number | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_records: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          is_tracking: boolean | null
          notes: string | null
          sleep_score: number | null
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_tracking?: boolean | null
          notes?: string | null
          sleep_score?: number | null
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_tracking?: boolean | null
          notes?: string | null
          sleep_score?: number | null
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_stages: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          sleep_record_id: string
          stage_type: string
          start_time: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          sleep_record_id: string
          stage_type: string
          start_time: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          sleep_record_id?: string
          stage_type?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_stages_sleep_record_id_fkey"
            columns: ["sleep_record_id"]
            isOneToOne: false
            referencedRelation: "sleep_records"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          sounds: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sounds?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sounds?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          anti_snore_enabled: boolean | null
          created_at: string
          dark_mode: boolean | null
          data_sync_enabled: boolean | null
          id: string
          noise_recording_enabled: boolean | null
          notifications_enabled: boolean | null
          smart_wake_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anti_snore_enabled?: boolean | null
          created_at?: string
          dark_mode?: boolean | null
          data_sync_enabled?: boolean | null
          id?: string
          noise_recording_enabled?: boolean | null
          notifications_enabled?: boolean | null
          smart_wake_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anti_snore_enabled?: boolean | null
          created_at?: string
          dark_mode?: boolean | null
          data_sync_enabled?: boolean | null
          id?: string
          noise_recording_enabled?: boolean | null
          notifications_enabled?: boolean | null
          smart_wake_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
