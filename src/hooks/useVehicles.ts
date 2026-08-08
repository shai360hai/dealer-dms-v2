import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { slugify } from "../lib/format";
import { useAuth } from "./useAuth";
import { logActivity } from "../lib/activity";
import type { Vehicle, VehicleWithImages, VehicleStatus, FuelType, TransmissionType } from "../types/database";
import type { VehicleFormInput } from "../lib/schemas";

export interface VehicleFilters {
  q?: string;
  brand?: string;
  status?: string;
  fuelType?: string;
  transmission?: string;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  publishedOnly?: boolean;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "mileage_asc";
  page?: number;
  pageSize?: number;
}

const SORT_MAP: Record<NonNullable<VehicleFilters["sort"]>, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  price_asc: { column: "price", ascending: true },
  price_desc: { column: "price", ascending: false },
  mileage_asc: { column: "mileage", ascending: true },
};

async function fetchVehicles(filters: VehicleFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;

  let query = supabase.from("vehicles").select("*, vehicle_images(*)", { count: "exact" });

  // Cast at this boundary rather than typing VehicleFilters with the enum
  // unions — these values only ever come from our own <select> options
  // (native onChange events are always plain strings), so the cast is
  // safe and keeps the filter type simple for every calling page.
  if (filters.publishedOnly) query = query.eq("published", true).eq("status", "available");
  if (filters.q) query = query.or(`brand.ilike.%${filters.q}%,model.ilike.%${filters.q}%,stock_number.ilike.%${filters.q}%`);
  if (filters.brand) query = query.eq("brand", filters.brand);
  if (filters.status) query = query.eq("status", filters.status as VehicleStatus);
  if (filters.fuelType) query = query.eq("fuel_type", filters.fuelType as FuelType);
  if (filters.transmission) query = query.eq("transmission", filters.transmission as TransmissionType);
  if (filters.priceMin != null) query = query.gte("price", filters.priceMin);
  if (filters.priceMax != null) query = query.lte("price", filters.priceMax);
  if (filters.mileageMax != null) query = query.lte("mileage", filters.mileageMax);

  const sort = SORT_MAP[filters.sort ?? "newest"];
  query = query.order(sort.column, { ascending: sort.ascending }).range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []) as VehicleWithImages[], total: count ?? 0, page, pageSize };
}

export function useVehicles(filters: VehicleFilters) {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => fetchVehicles(filters),
    placeholderData: keepPreviousData,
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ["vehicles", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*, vehicle_images(*)").eq("id", id!).single();
      if (error) throw error;
      return data as VehicleWithImages;
    },
    enabled: Boolean(id),
  });
}

export function useVehicleBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["vehicles", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_images(*)")
        .eq("slug", slug!)
        .eq("published", true)
        .eq("status", "available")
        .maybeSingle();
      if (error) throw error;
      return data as VehicleWithImages | null;
    },
    enabled: Boolean(slug),
  });
}

export function useSimilarVehicles(vehicle: Vehicle | null | undefined) {
  return useQuery({
    queryKey: ["vehicles", "similar", vehicle?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_images(*)")
        .eq("brand", vehicle!.brand)
        .eq("published", true)
        .eq("status", "available")
        .neq("id", vehicle!.id)
        .limit(4);
      if (error) throw error;
      return (data ?? []) as VehicleWithImages[];
    },
    enabled: Boolean(vehicle),
  });
}

async function uniqueSlugFor(brand: string, model: string, year: number, trim?: string) {
  const base = slugify(brand, model, trim, year);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const { data } = await supabase.from("vehicles").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${++suffix}`;
  }
}

function cleanInput(input: VehicleFormInput) {
  return {
    ...input,
    trim: input.trim || null,
    vin: input.vin || null,
    engine: input.engine || null,
    battery_capacity: input.battery_capacity || null,
    description: input.description || null,
    warranty: input.warranty || null,
    service_history: input.service_history || null,
    dealer_notes: input.dealer_notes || null,
    location: input.location || null,
    horsepower: input.horsepower ?? null,
    driving_range: input.driving_range ?? null,
  };
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateVehicle() {
  const invalidate = useInvalidateVehicles();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: VehicleFormInput) => {
      const slug = await uniqueSlugFor(input.brand, input.model, input.year, input.trim);
      const { data, error } = await supabase.from("vehicles").insert({ ...cleanInput(input), slug }).select().single();
      if (error) throw error;
      await logActivity(user?.id, "VEHICLE_CREATED", "vehicle", data.id);
      return data as Vehicle;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateVehicle(id: string) {
  const invalidate = useInvalidateVehicles();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: VehicleFormInput) => {
      const { data, error } = await supabase.from("vehicles").update(cleanInput(input)).eq("id", id).select().single();
      if (error) throw error;
      await logActivity(user?.id, "VEHICLE_UPDATED", "vehicle", id);
      return data as Vehicle;
    },
    onSuccess: invalidate,
  });
}

export function useSetVehicleStatus() {
  const invalidate = useInvalidateVehicles();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("vehicles").update({ status: status as VehicleStatus }).eq("id", id);
      if (error) throw error;
      await logActivity(user?.id, "VEHICLE_STATUS_CHANGED", "vehicle", id, { status });
    },
    onSuccess: invalidate,
  });
}

export function useSetPublished() {
  const invalidate = useInvalidateVehicles();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("vehicles").update({ published }).eq("id", id);
      if (error) throw error;
      await logActivity(user?.id, published ? "VEHICLE_PUBLISHED" : "VEHICLE_UNPUBLISHED", "vehicle", id);
    },
    onSuccess: invalidate,
  });
}

export function useDuplicateVehicle() {
  const invalidate = useInvalidateVehicles();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchError } = await supabase.from("vehicles").select("*").eq("id", id).single();
      if (fetchError) throw fetchError;

      const slug = await uniqueSlugFor(original.brand, original.model, original.year, original.trim ?? undefined);
      const {
        id: _id,
        created_at: _createdAt,
        updated_at: _updatedAt,
        slug: _slug,
        stock_number,
        ...rest
      } = original;

      const { data, error } = await supabase
        .from("vehicles")
        .insert({ ...rest, slug, stock_number: `${stock_number}-COPY`, published: false, status: "available" })
        .select()
        .single();
      if (error) throw error;
      await logActivity(user?.id, "VEHICLE_DUPLICATED", "vehicle", data.id, { from: id });
      return data as Vehicle;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteVehicle() {
  const invalidate = useInvalidateVehicles();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      await logActivity(user?.id, "VEHICLE_DELETED", "vehicle", id);
    },
    onSuccess: invalidate,
  });
}

export function useBulkDeleteVehicles() {
  const invalidate = useInvalidateVehicles();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("vehicles").delete().in("id", ids);
      if (error) throw error;
      await logActivity(user?.id, "VEHICLES_BULK_DELETED", "vehicle", undefined, { ids });
    },
    onSuccess: invalidate,
  });
}

export async function fetchPublishedBrands(): Promise<string[]> {
  const { data, error } = await supabase.from("vehicles").select("brand").eq("published", true).eq("status", "available");
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((v) => v.brand))).sort();
}
