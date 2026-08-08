import { supabase } from "./supabase";
import { VEHICLE_ANGLES, type AngleUrls } from "./angles";
import { checkImageUrl } from "./image-url";

export interface SaveAnglesResult {
  saved: number;
  rejected: { label: string; reason: string }[];
}

/**
 * Writes the five angle photos for a vehicle.
 *
 * Existing angle-tagged rows are replaced wholesale — the simplest way
 * to handle "the user cleared the rear photo" — while ad-hoc uploads
 * (angle = null, added via the drag-and-drop uploader) are deliberately
 * left untouched, so saving the form never destroys uploaded pictures.
 *
 * Kept as a plain function rather than only a hook because the create
 * flow needs it immediately after insert, when the new vehicle's id is
 * first known and no hook has been bound to it yet.
 */
export async function saveAngleImages(vehicleId: string, urls: AngleUrls): Promise<SaveAnglesResult> {
  const rejected: SaveAnglesResult["rejected"] = [];
  const rows: {
    vehicle_id: string;
    url: string;
    storage_path: null;
    angle: string;
    order_index: number;
    is_cover: boolean;
  }[] = [];

  VEHICLE_ANGLES.forEach((angle, index) => {
    const raw = (urls[angle.key] ?? "").trim();
    if (!raw) return;

    const verdict = checkImageUrl(raw);
    if (!verdict.ok) {
      rejected.push({ label: angle.label, reason: verdict.reason });
      return;
    }

    rows.push({
      vehicle_id: vehicleId,
      url: verdict.url,
      storage_path: null,
      angle: angle.key,
      order_index: index,
      is_cover: false,
    });
  });

  // The front shot is the natural cover; if there's no front photo the
  // first angle that was provided takes the role instead.
  const first = rows[0];
  if (first) first.is_cover = true;

  const { error: delError } = await supabase
    .from("vehicle_images")
    .delete()
    .eq("vehicle_id", vehicleId)
    .not("angle", "is", null);
  if (delError) throw delError;

  if (rows.length > 0) {
    const { error } = await supabase.from("vehicle_images").insert(rows);
    if (error) throw error;
  }

  return { saved: rows.length, rejected };
}
