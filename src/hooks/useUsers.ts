import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { useAuth } from "./useAuth";
import type { Profile, UserRole } from "../types/database";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

/** RLS blocks non-super_admins from changing roles, and a blocked write
 *  comes back as success with zero rows — so ask for the row back and
 *  treat an empty result as a permissions error rather than silence. */
export function useSetUserRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("אין לך הרשאה לשנות תפקידים. נדרשת הרשאת super_admin.");
      }
      await logActivity(user?.id, "USER_ROLE_CHANGED", "profile", id, { role });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ active })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("אין לך הרשאה לשנות סטטוס משתמשים. נדרשת הרשאת super_admin.");
      }
      await logActivity(user?.id, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", "profile", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

/** Deletes every vehicle. Images cascade automatically (the
 *  vehicle_images FK is ON DELETE CASCADE), and inquiries are preserved
 *  with their vehicle_id set to NULL (ON DELETE SET NULL) so you don't
 *  lose customer leads along with the stock. */
export function useDeleteAllVehicles() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { count: total } = await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true });

      if (!total) return { deleted: 0 };

      // .neq on a never-null column matches every row; PostgREST requires
      // some filter on a bulk delete as a safety measure.
      const { data, error } = await supabase
        .from("vehicles")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")
        .select("id");

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("אין לך הרשאה למחוק רכבים. נדרשת הרשאת מנהל (admin או super_admin).");
      }

      await logActivity(user?.id, "VEHICLES_ALL_DELETED", "vehicle", undefined, {
        deleted: data.length,
      });
      return { deleted: data.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
