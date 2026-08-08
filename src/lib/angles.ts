/**
 * The five standard vehicle photo viewpoints, in the order they should
 * always appear — front first (it makes the best cover image), then
 * around the car, then inside.
 *
 * `order_index` is derived from this array's order, so changing the
 * order here changes it everywhere: the add/edit form, the admin
 * thumbnails and the public gallery.
 */
export const VEHICLE_ANGLES = [
  { key: "front", label: "חזית" },
  { key: "rear", label: "אחורי" },
  { key: "right", label: "צד ימין" },
  { key: "left", label: "צד שמאל" },
  { key: "interior", label: "פנים הרכב" },
] as const;

export type VehicleAngle = (typeof VEHICLE_ANGLES)[number]["key"];

export const ANGLE_LABEL: Record<string, string> = Object.fromEntries(
  VEHICLE_ANGLES.map((a) => [a.key, a.label]),
);

export const ANGLE_ORDER: Record<string, number> = Object.fromEntries(
  VEHICLE_ANGLES.map((a, i) => [a.key, i]),
);

/** Photos without an angle (ad-hoc uploads) sort after the labelled
 *  ones rather than jumbling in among them. */
export function sortByAngle<T extends { angle: string | null; order_index: number }>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    const ao = a.angle ? ANGLE_ORDER[a.angle] ?? 99 : 99;
    const bo = b.angle ? ANGLE_ORDER[b.angle] ?? 99 : 99;
    if (ao !== bo) return ao - bo;
    return a.order_index - b.order_index;
  });
}

export type AngleUrls = Partial<Record<VehicleAngle, string>>;

/** Picks the image to show on a vehicle card: an explicitly-flagged
 *  cover if there is one, otherwise the first photo in angle order
 *  (i.e. the front shot) rather than whatever the database returned
 *  first. */
export function pickCoverImage<T extends { angle: string | null; order_index: number; is_cover: boolean }>(
  images: T[],
): T | undefined {
  return images.find((i) => i.is_cover) ?? sortByAngle(images)[0];
}
