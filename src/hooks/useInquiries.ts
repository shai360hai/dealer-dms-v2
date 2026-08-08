import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { useAuth } from "./useAuth";
import type { InquiryFormInput } from "../lib/schemas";
import type { Inquiry, Vehicle, InquiryStatus } from "../types/database";

export type InquiryWithVehicle = Inquiry & { vehicles: Pick<Vehicle, "id" | "brand" | "model" | "slug" | "stock_number"> | null };

export function useInquiries(params: { status?: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["inquiries", params],
    queryFn: async () => {
      const from = (params.page - 1) * params.pageSize;
      let query = supabase
        .from("inquiries")
        .select("*, vehicles(id, brand, model, slug, stock_number)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, from + params.pageSize - 1);
      if (params.status) query = query.eq("status", params.status as InquiryStatus);
      const { data, error, count } = await query;
      if (error) throw error;
      return { items: (data ?? []) as InquiryWithVehicle[], total: count ?? 0 };
    },
  });
}

export function useSubmitInquiry() {
  return useMutation({
    mutationFn: async (input: InquiryFormInput) => {
      const { error } = await supabase.from("inquiries").insert({ ...input, message: input.message || null, vehicle_id: input.vehicle_id || null });
      if (error) throw error;
    },
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("inquiries").update({ status: status as InquiryStatus }).eq("id", id);
      if (error) throw error;
      await logActivity(user?.id, "INQUIRY_STATUS_CHANGED", "inquiry", id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
