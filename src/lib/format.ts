export function formatPrice(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMileage(km: number): string {
  return `${new Intl.NumberFormat("he-IL").format(km)} ק״מ`;
}

/** Builds SEO-friendly slugs like /vehicles/changan-deepal-s07-2026.
 *  Brand/model/trim are expected to be Latin car nomenclature; anything
 *  outside [a-z0-9] collapses to a single hyphen. */
export function slugify(...parts: (string | number | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "שניות"],
    [60, "דקות"],
    [24, "שעות"],
    [30, "ימים"],
    [12, "חודשים"],
  ];
  let value = seconds;
  let label = "שניות";
  for (const [div, name] of units) {
    if (value < div) {
      label = name;
      break;
    }
    value = Math.floor(value / div);
    label = name;
  }
  if (seconds < 60) return "עכשיו";
  return `לפני ${value} ${label}`;
}
