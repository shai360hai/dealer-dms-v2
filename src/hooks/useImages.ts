import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { VehicleImage } from "../types/database";

/** Uploads straight to Supabase Storage's "vehicle-images" bucket, then
 *  attaches the resulting public URL to the vehicle. */
export function useUploadVehicleImage(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const path = `${vehicleId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("vehicle-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("vehicle-images").getPublicUrl(path);

      const { count } = await supabase
        .from("vehicle_images")
        .select("id", { count: "exact", head: true })
        .eq("vehicle_id", vehicleId);
      const orderIndex = count ?? 0;

      const { data, error } = await supabase
        .from("vehicle_images")
        .insert({ vehicle_id: vehicleId, url: urlData.publicUrl, storage_path: path, order_index: orderIndex, is_cover: orderIndex === 0 })
        .select()
        .single();
      if (error) throw error;
      return data as VehicleImage;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles", "detail", vehicleId] }),
  });
}

/** Attaches one or more images by URL only — nothing is uploaded and
 *  no storage file is created, so `storage_path` stays null. The delete
 *  path already skips storage cleanup for these (see useDeleteImage). */
export function useAddImagesByUrl(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (urls: string[]) => {
      const { count } = await supabase
        .from("vehicle_images")
        .select("id", { count: "exact", head: true })
        .eq("vehicle_id", vehicleId);
      const start = count ?? 0;

      const rows = urls.map((url, i) => ({
        vehicle_id: vehicleId,
        url: url.trim(),
        storage_path: null,
        order_index: start + i,
        is_cover: start + i === 0,
      }));

      const { data, error } = await supabase.from("vehicle_images").insert(rows).select();
      if (error) throw error;
      return data as VehicleImage[];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles", "detail", vehicleId] }),
  });
}

export function useReorderImages(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(orderedIds.map((id, index) => supabase.from("vehicle_images").update({ order_index: index }).eq("id", id)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles", "detail", vehicleId] }),
  });
}

export function useSetCoverImage(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      await supabase.from("vehicle_images").update({ is_cover: false }).eq("vehicle_id", vehicleId);
      const { error } = await supabase.from("vehicle_images").update({ is_cover: true }).eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles", "detail", vehicleId] }),
  });
}

export function useDeleteImage(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (image: VehicleImage) => {
      if (image.storage_path) {
        await supabase.storage.from("vehicle-images").remove([image.storage_path]);
      }
      const { error } = await supabase.from("vehicle_images").delete().eq("id", image.id);
      if (error) throw error;

      if (image.is_cover) {
        const { data: next } = await supabase
          .from("vehicle_images")
          .select("id")
          .eq("vehicle_id", vehicleId)
          .order("order_index", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (next) await supabase.from("vehicle_images").update({ is_cover: true }).eq("id", next.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles", "detail", vehicleId] }),
  });
}
