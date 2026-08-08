import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { useAuth } from "./useAuth";
import type { ParsedVehicle } from "../lib/csv-import";

export interface ImportResult {
  inserted: number;
  imagesAdded: number;
  skipped: { stockNumber: string; reason: string }[];
}

type ImportRow = ParsedVehicle;

/** Blank optional text fields arrive as "" from the CSV; the database
 *  wants NULL so they don't render as empty strings on the site. */
function clean(row: ImportRow) {
  return {
    ...row,
    trim: row.trim || null,
    vin: row.vin || null,
    engine: row.engine || null,
    battery_capacity: row.battery_capacity || null,
    description: row.description || null,
    warranty: row.warranty || null,
    service_history: row.service_history || null,
    dealer_notes: row.dealer_notes || null,
    location: row.location || null,
    horsepower: row.horsepower ?? null,
    driving_range: row.driving_range ?? null,
  };
}

export function useImportVehicles() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: ImportRow[]): Promise<ImportResult> => {
      const skipped: ImportResult["skipped"] = [];

      // stock_number and slug are both UNIQUE in the schema. Rather than
      // let one clash abort a 50-row insert, check what already exists
      // up front and report those rows back instead of failing the batch.
      const stockNumbers = rows.map((r) => r.stock_number);
      const { data: existing } = await supabase
        .from("vehicles")
        .select("stock_number")
        .in("stock_number", stockNumbers);

      const taken = new Set((existing ?? []).map((v) => v.stock_number));

      const seenInFile = new Set<string>();
      const toInsert: ReturnType<typeof clean>[] = [];

      for (const row of rows) {
        if (taken.has(row.stock_number)) {
          skipped.push({ stockNumber: row.stock_number, reason: "מספר מלאי כבר קיים במערכת" });
          continue;
        }
        if (seenInFile.has(row.stock_number)) {
          skipped.push({ stockNumber: row.stock_number, reason: "מספר מלאי כפול בקובץ" });
          continue;
        }
        seenInFile.add(row.stock_number);
        toInsert.push(clean(row));
      }

      // Ensure slugs are unique too — two trims of the same model+year
      // would otherwise collide on the slug's UNIQUE constraint.
      const slugCounts = new Map<string, number>();
      for (const row of toInsert) {
        const base = row.slug;
        const seen = slugCounts.get(base) ?? 0;
        slugCounts.set(base, seen + 1);
        if (seen > 0) row.slug = `${base}-${seen + 1}`;
      }

      const { data: existingSlugs } = await supabase
        .from("vehicles")
        .select("slug")
        .in("slug", toInsert.map((r) => r.slug));
      const takenSlugs = new Set((existingSlugs ?? []).map((v) => v.slug));
      for (const row of toInsert) {
        let candidate = row.slug;
        let n = 1;
        while (takenSlugs.has(candidate)) {
          candidate = `${row.slug}-${++n}`;
        }
        row.slug = candidate;
        takenSlugs.add(candidate);
      }

      let inserted = 0;
      const insertedIds: { id: string; imageUrls: string[] }[] = [];
      const BATCH = 25;
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const batch = toInsert.slice(i, i + BATCH);
        const { data, error } = await supabase
          .from("vehicles")
          .insert(batch.map(({ imageUrls: _imageUrls, ...v }) => v))
          .select("id");
        if (error) throw error;
        inserted += data?.length ?? 0;
        (data ?? []).forEach((row, j) => {
          const urls = batch[j]?.imageUrls ?? [];
          if (urls.length > 0) insertedIds.push({ id: row.id, imageUrls: urls });
        });
      }

      // Attach image links (no upload — storage_path stays null, which
      // the delete path already handles).
      const imageRows = insertedIds.flatMap(({ id, imageUrls }) =>
        imageUrls.map((url, i) => ({
          vehicle_id: id,
          url,
          storage_path: null,
          order_index: i,
          is_cover: i === 0,
        })),
      );
      let imagesAdded = 0;
      if (imageRows.length > 0) {
        for (let i = 0; i < imageRows.length; i += 100) {
          const { data, error } = await supabase
            .from("vehicle_images")
            .insert(imageRows.slice(i, i + 100))
            .select("id");
          // A failed image insert shouldn't undo a successful vehicle
          // import — report it rather than throwing the whole batch away.
          if (!error) imagesAdded += data?.length ?? 0;
        }
      }

      await logActivity(user?.id, "VEHICLES_IMPORTED", "vehicle", undefined, {
        inserted,
        skipped: skipped.length,
        imagesAdded,
      });

      return { inserted, skipped, imagesAdded };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
