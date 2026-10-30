export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VotingStatus = "not_open" | "open" | "closed";
export type LifecycleStatus = "draft" | "live" | "locked" | "published" | "archived";
export type PerformanceType =
  "music" | "dance" | "spoken_word" | "mono_drama" | "visual_arts" | "drama" | "visual_art";
export type StaffRoleType =
  "judge_1" | "judge_2" | "judge_3" | "judge_4" | "organiser" | "score_desk" | "admin";
export type ScorecardStatus = "not_started" | "draft" | "submitted";

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          code: string;
          name: string;
          theme: string;
          edition: string;
          organizer_name: string;
          finale_date: string;
          timezone: string;
          voting_status: VotingStatus;
          lifecycle_status: LifecycleStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string;
          name?: string;
          theme?: string;
          edition?: string;
          organizer_name?: string;
          finale_date?: string;
          timezone?: string;
          voting_status?: VotingStatus;
          lifecycle_status?: LifecycleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          theme?: string;
          edition?: string;
          organizer_name?: string;
          finale_date?: string;
          timezone?: string;
          voting_status?: VotingStatus;
          lifecycle_status?: LifecycleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_settings: {
        Row: {
          id: string;
          event_id: string;
          audience_weight_max_points: number;
          judge_slots_required: number;
          max_judge_raw_score: number;
          allow_reopen_with_reason: boolean;
          require_conflict_resolution: boolean;
          require_verified_duration: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          audience_weight_max_points?: number;
          judge_slots_required?: number;
          max_judge_raw_score?: number;
          allow_reopen_with_reason?: boolean;
          require_conflict_resolution?: boolean;
          require_verified_duration?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          audience_weight_max_points?: number;
          judge_slots_required?: number;
          max_judge_raw_score?: number;
          allow_reopen_with_reason?: boolean;
          require_conflict_resolution?: boolean;
          require_verified_duration?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_settings_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      contestants: {
        Row: {
          id: string;
          event_id: string;
          code: string;
          full_name: string;
          name?: string;
          district: string;
          performance_type: PerformanceType;
          performance_title: string;
          title?: string;
          biography: string;
          bio?: string;
          performance_order: number;
          hue?: number;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          code: string;
          full_name?: string;
          name?: string;
          district: string;
          performance_type: PerformanceType;
          performance_title?: string;
          title?: string;
          biography?: string;
          bio?: string;
          performance_order: number;
          hue?: number;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          code?: string;
          full_name?: string;
          name?: string;
          district?: string;
          performance_type?: PerformanceType;
          performance_title?: string;
          title?: string;
          biography?: string;
          bio?: string;
          performance_order?: number;
          hue?: number;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contestants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      rubric_versions: {
        Row: {
          id: string;
          event_id: string;
          discipline: PerformanceType;
          performance_type?: PerformanceType;
          time_limit_sec: number;
          penalty_interval_sec: number;
          penalty_deduction_points: number;
          penalty_points_per_interval?: number;
          criteria: Json;
          tiebreak_ladder: Json;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          discipline?: PerformanceType;
          performance_type?: PerformanceType;
          time_limit_sec: number;
          penalty_interval_sec: number;
          penalty_deduction_points?: number;
          penalty_points_per_interval?: number;
          criteria: Json;
          tiebreak_ladder: Json;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          discipline?: PerformanceType;
          performance_type?: PerformanceType;
          time_limit_sec?: number;
          penalty_interval_sec?: number;
          penalty_deduction_points?: number;
          penalty_points_per_interval?: number;
          criteria?: Json;
          tiebreak_ladder?: Json;
          version?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      staff_roles: {
        Row: {
          id: string;
          event_id: string;
          role_type: StaffRoleType;
          role?: StaffRoleType;
          full_name: string;
          display_name?: string;
          email: string;
          user_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          role_type?: StaffRoleType;
          role?: StaffRoleType;
          full_name?: string;
          display_name?: string;
          email?: string;
          user_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          role_type?: StaffRoleType;
          role?: StaffRoleType;
          full_name?: string;
          display_name?: string;
          email?: string;
          user_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scorecards: {
        Row: {
          id: string;
          event_id: string;
          contestant_id: string;
          judge_id: string;
          criteria_scores: Json;
          scores?: Json;
          subtotal: number;
          notes: string;
          status: ScorecardStatus;
          conflict_declared: boolean;
          conflict_resolved: boolean;
          conflict_reason: string | null;
          reopened: boolean;
          reopened_reason: string | null;
          reopen_reason?: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          contestant_id: string;
          judge_id: string;
          criteria_scores?: Json;
          scores?: Json;
          subtotal?: number;
          notes?: string;
          status?: ScorecardStatus;
          conflict_declared?: boolean;
          conflict_resolved?: boolean;
          conflict_reason?: string | null;
          reopened?: boolean;
          reopened_reason?: string | null;
          reopen_reason?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contestant_id?: string;
          judge_id?: string;
          criteria_scores?: Json;
          scores?: Json;
          subtotal?: number;
          notes?: string;
          status?: ScorecardStatus;
          conflict_declared?: boolean;
          conflict_resolved?: boolean;
          conflict_reason?: string | null;
          reopened?: boolean;
          reopened_reason?: string | null;
          reopen_reason?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scorecards_contestant_id_fkey";
            columns: ["contestant_id"];
            isOneToOne: false;
            referencedRelation: "contestants";
            referencedColumns: ["id"];
          },
        ];
      };
      durations: {
        Row: {
          id: string;
          event_id: string;
          contestant_id: string;
          actual_seconds: number | null;
          duration_seconds?: number | null;
          verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          contestant_id: string;
          actual_seconds?: number | null;
          duration_seconds?: number | null;
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contestant_id?: string;
          actual_seconds?: number | null;
          duration_seconds?: number | null;
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "durations_contestant_id_fkey";
            columns: ["contestant_id"];
            isOneToOne: false;
            referencedRelation: "contestants";
            referencedColumns: ["id"];
          },
        ];
      };
      voter_verification_requests: {
        Row: {
          id: string;
          event_id: string;
          email_or_phone_hash: string;
          otp_hash: string;
          expires_at: string;
          attempts: number;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          email_or_phone_hash: string;
          otp_hash: string;
          expires_at: string;
          attempts?: number;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          email_or_phone_hash?: string;
          otp_hash?: string;
          expires_at?: string;
          attempts?: number;
          verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      verified_voters: {
        Row: {
          id: string;
          event_id: string;
          voter_token_hash: string;
          identifier_hash?: string;
          verification_method: string;
          verified_at: string;
          ip_hash?: string | null;
          has_voted?: boolean;
        };
        Insert: {
          id?: string;
          event_id?: string;
          voter_token_hash: string;
          identifier_hash?: string;
          verification_method: string;
          verified_at?: string;
          ip_hash?: string | null;
          has_voted?: boolean;
        };
        Update: {
          id?: string;
          event_id?: string;
          voter_token_hash?: string;
          identifier_hash?: string;
          verification_method?: string;
          verified_at?: string;
          ip_hash?: string | null;
          has_voted?: boolean;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          event_id: string;
          contestant_id: string;
          voter_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          contestant_id: string;
          voter_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contestant_id?: string;
          voter_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_contestant_id_fkey";
            columns: ["contestant_id"];
            isOneToOne: false;
            referencedRelation: "contestants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "verified_voters";
            referencedColumns: ["id"];
          },
        ];
      };
      results_snapshots: {
        Row: {
          id: string;
          event_id: string;
          rows_data: Json;
          snapshot_data?: Json;
          locked_at: string;
          locked_by: string | null;
          published: boolean;
          published_at: string | null;
          published_by: string | null;
          is_official: boolean;
          metadata?: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          rows_data: Json;
          snapshot_data?: Json;
          locked_at?: string;
          locked_by?: string | null;
          published?: boolean;
          published_at?: string | null;
          published_by?: string | null;
          is_official?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          rows_data?: Json;
          snapshot_data?: Json;
          locked_at?: string;
          locked_by?: string | null;
          published?: boolean;
          published_at?: string | null;
          published_by?: string | null;
          is_official?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          event_id: string;
          action: string;
          kind?: string;
          details: string;
          detail?: string;
          actor_id: string | null;
          actor_role: string | null;
          actor?: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string;
          action: string;
          kind?: string;
          details: string;
          detail?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          actor?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          action?: string;
          kind?: string;
          details?: string;
          detail?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          actor?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cast_audience_vote: {
        Args: {
          p_event_id: string;
          p_contestant_id: string;
          p_voter_hash: string;
          p_method: string;
        };
        Returns: Json;
      };
      request_voter_otp: {
        Args: {
          p_event_id: string;
          p_email_or_phone_hash: string;
          p_otp_hash: string;
          p_ttl_sec?: number;
        };
        Returns: Json;
      };
      verify_and_cast_vote: {
        Args: {
          p_event_id: string;
          p_contestant_id: string;
          p_voter_hash: string;
          p_otp_candidate_hash: string;
        };
        Returns: Json;
      };
      get_public_top_three: {
        Args: {
          p_event_id: string;
        };
        Returns: {
          rank: number;
          contestant_id: string;
          full_name: string;
          district: string;
          performance_title: string;
          performance_type: string;
          avatar_url: string | null;
        }[];
      };
      get_event_vote_counts: {
        Args: {
          p_event_id: string;
        };
        Returns: {
          contestant_id: string;
          vote_count: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Database;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
