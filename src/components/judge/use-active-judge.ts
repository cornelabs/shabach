import { useEffect, useState } from "react";

import { useDemoState } from "@/hooks/use-demo";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/db/supabase";
import { setActiveJudge } from "@/lib/demo/store";
import { JUDGES, type JudgeId } from "@/lib/demo/types";

export interface StaffSessionInfo {
  userId: string;
  email: string;
  fullName: string;
  displayName?: string | undefined;
  roleType: string;
  assignedSeat: JudgeId | null;
}

export function staffRoleToJudgeId(roleType?: string | null): JudgeId | null {
  if (!roleType) return null;
  const normalized = roleType.toLowerCase().replace(/[-_]/g, "");
  if (normalized === "judge1") return "judge1";
  if (normalized === "judge2") return "judge2";
  if (normalized === "judge3") return "judge3";
  if (normalized === "judge4") return "judge4";
  return null;
}

export function useActiveJudgeSession() {
  const state = useDemoState();
  const [staffSession, setStaffSession] = useState<StaffSessionInfo | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStaffSession() {
      if (!isSupabaseConfigured()) return;
      const client = getSupabaseClient();
      if (!client) return;

      try {
        setLoadingSession(true);
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!user || cancelled) return;

        // Query staff_roles for user
        const { data: roleData } = await client
          .from("staff_roles")
          .select("id, role_type, full_name, display_name, email, active")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();

        if (roleData && !cancelled) {
          const assignedSeat = staffRoleToJudgeId(roleData.role_type);
          setStaffSession({
            userId: user.id,
            email: roleData.email || user.email || "",
            fullName: roleData.full_name || "Staff Member",
            displayName: roleData.display_name || undefined,
            roleType: roleData.role_type,
            assignedSeat,
          });

          // Connect activeJudge if user has assigned seat and not yet set
          if (!state.activeJudge && assignedSeat) {
            setActiveJudge(assignedSeat);
          }
        }
      } catch (err) {
        console.warn("Could not load staff session:", err);
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    }

    void loadStaffSession();
    return () => {
      cancelled = true;
    };
  }, [state.activeJudge]);

  const activeJudge = state.activeJudge
    ? (JUDGES.find((j) => j.id === state.activeJudge) ?? null)
    : null;

  return {
    activeJudgeId: state.activeJudge,
    activeJudge,
    staffSession,
    loadingSession,
    setActiveSeat: (judgeId: JudgeId | null) => setActiveJudge(judgeId),
  };
}
