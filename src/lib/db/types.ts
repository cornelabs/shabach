/**
 * SHABACH 2026 Database & Typed Supabase Schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VotingStatus = "not_open" | "open" | "closed";
export type LifecycleStatus = "draft" | "live" | "locked" | "published" | "archived";
export type PerformanceType = "music" | "dance" | "spoken_word" | "drama" | "visual_art";
export type StaffRoleType = "organiser" | "judge_1" | "judge_2" | "judge_3" | "score_desk";
export type ScorecardStatus = "draft" | "submitted";

export interface Database {
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
        Relationships: [];
      };
      contestants: {
        Row: {
          id: string;
          event_id: string;
          code: string;
          full_name: string;
          district: string;
          performance_type: PerformanceType;
          performance_order: number;
          performance_title: string;
          biography: string;
          photo_url: string | null;
          rubric_discipline: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          code: string;
          full_name: string;
          district: string;
          performance_type: PerformanceType;
          performance_order: number;
          performance_title: string;
          biography?: string;
          photo_url?: string | null;
          rubric_discipline: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          code?: string;
          full_name?: string;
          district?: string;
          performance_type?: PerformanceType;
          performance_order?: number;
          performance_title?: string;
          biography?: string;
          photo_url?: string | null;
          rubric_discipline?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_roles: {
        Row: {
          id: string;
          event_id: string;
          user_id: string | null;
          role_type: StaffRoleType;
          full_name: string;
          email: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id?: string | null;
          role_type: StaffRoleType;
          full_name: string;
          email: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string | null;
          role_type?: StaffRoleType;
          full_name?: string;
          email?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rubric_versions: {
        Row: {
          id: string;
          event_id: string;
          discipline: string;
          version: number;
          title: string;
          criteria: Json;
          spiritual_criterion_id: string;
          technical_criterion_id: string;
          creativity_criterion_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          discipline: string;
          version?: number;
          title: string;
          criteria: Json;
          spiritual_criterion_id: string;
          technical_criterion_id: string;
          creativity_criterion_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          discipline?: string;
          version?: number;
          title?: string;
          criteria?: Json;
          spiritual_criterion_id?: string;
          technical_criterion_id?: string;
          creativity_criterion_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      scorecards: {
        Row: {
          id: string;
          event_id: string;
          contestant_id: string;
          judge_id: string;
          assigned_user_id: string | null;
          status: ScorecardStatus;
          criteria_scores: Record<string, number>;
          subtotal: number;
          notes: string;
          conflict_declared: boolean;
          conflict_reason: string | null;
          conflict_resolved: boolean;
          conflict_resolution_notes: string | null;
          reopened: boolean;
          reopened_reason: string | null;
          reopened_at: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          contestant_id: string;
          judge_id: string;
          assigned_user_id?: string | null;
          status?: ScorecardStatus;
          criteria_scores?: Record<string, number>;
          subtotal?: number;
          notes?: string;
          conflict_declared?: boolean;
          conflict_reason?: string | null;
          conflict_resolved?: boolean;
          conflict_resolution_notes?: string | null;
          reopened?: boolean;
          reopened_reason?: string | null;
          reopened_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contestant_id?: string;
          judge_id?: string;
          assigned_user_id?: string | null;
          status?: ScorecardStatus;
          criteria_scores?: Record<string, number>;
          subtotal?: number;
          notes?: string;
          conflict_declared?: boolean;
          conflict_reason?: string | null;
          conflict_resolved?: boolean;
          conflict_resolution_notes?: string | null;
          reopened?: boolean;
          reopened_reason?: string | null;
          reopened_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      durations: {
        Row: {
          id: string;
          event_id: string;
          contestant_id: string;
          duration_seconds: number;
          is_verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          contestant_id: string;
          duration_seconds: number;
          is_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contestant_id?: string;
          duration_seconds?: number;
          is_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      verified_voters: {
        Row: {
          id: string;
          event_id: string;
          email: string;
          phone: string | null;
          otp_hash: string | null;
          otp_expires_at: string | null;
          verified_at: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          email: string;
          phone?: string | null;
          otp_hash?: string | null;
          otp_expires_at?: string | null;
          verified_at?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          email?: string;
          phone?: string | null;
          otp_hash?: string | null;
          otp_expires_at?: string | null;
          verified_at?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          event_id: string;
          voter_id: string;
          contestant_id: string;
          cast_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          voter_id: string;
          contestant_id: string;
          cast_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          voter_id?: string;
          contestant_id?: string;
          cast_at?: string;
        };
        Relationships: [];
      };
      results_snapshots: {
        Row: {
          id: string;
          event_id: string;
          locked_at: string;
          locked_by: string | null;
          snapshot_data: Json;
          is_published: boolean;
          published_at: string | null;
          published_by: string | null;
          tie_resolutions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          locked_at?: string;
          locked_by?: string | null;
          snapshot_data: Json;
          is_published?: boolean;
          published_at?: string | null;
          published_by?: string | null;
          tie_resolutions?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          locked_at?: string;
          locked_by?: string | null;
          snapshot_data?: Json;
          is_published?: boolean;
          published_at?: string | null;
          published_by?: string | null;
          tie_resolutions?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          event_id: string;
          actor_id: string | null;
          actor_role: string;
          action: string;
          target_type: string;
          target_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          actor_id?: string | null;
          actor_role?: string;
          action: string;
          target_type: string;
          target_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          actor_id?: string | null;
          actor_role?: string;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      cast_audience_vote: {
        Args: {
          p_event_id: string;
          p_voter_id: string;
          p_contestant_id: string;
        };
        Returns: Json;
      };
      auth_is_organiser: {
        Args: {
          p_event_id: string;
        };
        Returns: boolean;
      };
      auth_is_assigned_judge: {
        Args: {
          p_event_id: string;
          p_judge_id: string;
        };
        Returns: boolean;
      };
    };
  };
}
