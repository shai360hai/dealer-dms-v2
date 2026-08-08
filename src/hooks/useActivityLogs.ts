import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ActivityLog, Profile } from "../types/database";

export type ActivityLogWithUser = ActivityLog & { profiles: Pick<Profile, "full_name" | "email"> | null };

export function useActivityLogs(page: number, pageSize = 20) {
  return useQuery({
    queryKey: ["activity-logs", page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const { data, error, count } = await supabase
        .from("activity_logs")
        .select("*, profiles(full_name, email)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      return { items: (data ?? []) as ActivityLogWithUser[], total: count ?? 0 };
    },
  });
}
