import Papa from "papaparse";
import { slugify } from "./format";
import { checkImageUrl, splitImageUrls } from "./image-url";
import { vehicleFormSchema, type VehicleFormInput } from "./schemas";
import type { DriveType, FuelType, TransmissionType } from "../types/database";

/**
 * Maps the Hebrew column headers used in the admin UI (and therefore in
 * any CSV exported from / prepared for it) onto database column names.
 * Both the standard apostrophe (') and the Hebrew geresh (׳) appear in
 * the wild for קילומטראז׳, so headers are normalized before lookup.
 */
const HEADER_MAP: Record<string, string> = {
  "יצרן": "brand",
  "דגם": "model",
  "רמת גימור": "trim",
  "שנה": "year",
  "מחיר": "price",
  "מספר מלאי": "stock_number",
  "מספר שילדה (VIN)": "vin",
  "קילומטראז": "mileage",
  "מנוע": "engine",
  "כוח סוס": "horsepower",
  "קיבולת סוללה": "battery_capacity",
  "טווח נסיעה (קמ)": "driving_range",
  "סוג דלק": "fuel_type",
  "תיבת הילוכים": "transmission",
  "הנעה": "drive_type",
  "מספר בעלים": "owners",
  "צבע חיצוני": "exterior_color",
  "צבע פנים": "interior_color",
  "תיאור": "description",
  "תוספות ואבזור": "features",
  "מערכות בטיחות": "safety_features",
  "אחריות": "warranty",
  "מיקום הרכב": "location",
  "היסטוריית טיפולים": "service_history",
  "הערות פנימיות": "dealer_notes",
  "מפורסם באתר": "published",
  "סטטוס": "status",
  "תמונה": "images",
  "תמונות": "images",
};

/** Strips BOM, apostrophe/quote variants (including the Hebrew geresh ׳
 *  and gershayim ״) and extra whitespace, so header lookup isn't
 *  defeated by typography. */
function normalizeHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, "") // BOM, which Excel loves to prepend
    .replace(/["']/g, "")
    .replace(/[׳״’‘“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const UNMAPPED_PREFIX = "__unmapped__";
const MAPPED_NAMES = new Set(Object.values(HEADER_MAP));

/** Papa Parse can invoke transformHeader more than once for the same
 *  column, so this has to be idempotent — without the early return an
 *  already-transformed name gets prefixed again ("__unmapped____unmapped__x")
 *  and every row then reads back as empty. */
export function transformHeader(h: string): string {
  if (MAPPED_NAMES.has(h) || h.startsWith(UNMAPPED_PREFIX)) return h;
  const key = normalizeHeader(h);
  return HEADER_MAP[key] ?? `${UNMAPPED_PREFIX}${key}`;
}

const FUEL_MAP: Record<string, FuelType> = {
  "בנזין": "petrol",
  "דיזל": "diesel",
  "היברידי": "hybrid",
  "היבריד": "hybrid",
  "בנזין/חשמל": "plugin_hybrid",
  "נטען": "plugin_hybrid",
  "נטען (plug-in)": "plugin_hybrid",
  "פלאג-אין": "plugin_hybrid",
  "חשמלי": "electric",
};

const TRANSMISSION_MAP: Record<string, TransmissionType> = {
  "ידני": "manual",
  "אוטומטי": "automatic",
  "אוטומט": "automatic",
  "cvt": "cvt",
  "dct": "dct",
};

const DRIVE_MAP: Record<string, DriveType> = {
  "הנעה קדמית": "fwd",
  "קדמית": "fwd",
  "fwd": "fwd",
  "הנעה אחורית": "rwd",
  "אחורית": "rwd",
  "rwd": "rwd",
  "הנעה כפולה": "awd",
  "כפולה": "awd",
  "awd": "awd",
  "4x4": "four_wd",
  "four_wd": "four_wd",
};

const STATUS_MAP: Record<string, "available" | "reserved" | "sold"> = {
  "זמין": "available",
  "שמור": "reserved",
  "נמכר": "sold",
};

function lookup<T>(map: Record<string, T>, raw: string): T | undefined {
  return map[raw.trim().toLowerCase()] ?? map[raw.trim()];
}

/** Multi-value cells (features, safety systems) are comma-separated
 *  inside a single quoted CSV field. */
function splitList(raw: string): string[] {
  return raw
    .split(/[,،|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "כן" || v === "1" || v === "yes";
}

export interface CsvRowResult {
  rowNumber: number;
  data?: VehicleFormInput & { slug: string };
  errors: string[];
}

export interface ParsedVehicle extends VehicleFormInput {
  slug: string;
  imageUrls: string[];
}

export interface CsvParseResult {
  valid: ParsedVehicle[];
  invalid: CsvRowResult[];
  totalRows: number;
  unmappedHeaders: string[];
  /** Rows whose image cell held a search-page link rather than a direct
   *  image URL. The vehicle still imports — just without that picture. */
  imageWarnings: { rowNumber: number; reason: string }[];
}

export function parseVehiclesCsv(text: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader,
  });

  const unmappedHeaders = (parsed.meta.fields ?? [])
    .filter((f) => f.startsWith(UNMAPPED_PREFIX))
    .map((f) => f.slice(UNMAPPED_PREFIX.length));

  return parseVehicleRows(parsed.data, unmappedHeaders);
}

/**
 * Validates rows that have already been read out of a file and keyed by
 * database column name. Shared by the CSV and Excel paths so both apply
 * exactly the same validation, enum translation and error reporting —
 * only the file-reading differs between them.
 */
export function parseVehicleRows(
  rows: Record<string, string>[],
  unmappedHeaders: string[] = [],
): CsvParseResult {
  const parsed = { data: rows, meta: { fields: [] as string[] } };

  const valid: ParsedVehicle[] = [];
  const invalid: CsvRowResult[] = [];
  const imageWarnings: { rowNumber: number; reason: string }[] = [];

  parsed.data.forEach((row, i) => {
    // +2: one for the header line, one because humans count from 1 —
    // so this matches the line number you'd see in Excel.
    const rowNumber = i + 2;
    const errors: string[] = [];

    const get = (key: string) => (row[key] ?? "").trim();

    const fuelRaw = get("fuel_type");
    const fuel = fuelRaw ? lookup(FUEL_MAP, fuelRaw) : undefined;
    if (fuelRaw && !fuel) errors.push(`סוג דלק לא מוכר: "${fuelRaw}"`);

    const transRaw = get("transmission");
    const transmission = transRaw ? lookup(TRANSMISSION_MAP, transRaw) : undefined;
    if (transRaw && !transmission) errors.push(`תיבת הילוכים לא מוכרת: "${transRaw}"`);

    const driveRaw = get("drive_type");
    const drive = driveRaw ? lookup(DRIVE_MAP, driveRaw) : undefined;
    if (driveRaw && !drive) errors.push(`סוג הנעה לא מוכר: "${driveRaw}"`);

    const statusRaw = get("status");
    const status = statusRaw ? lookup(STATUS_MAP, statusRaw) : "available";

    const candidate = {
      brand: get("brand"),
      model: get("model"),
      trim: get("trim"),
      year: get("year"),
      price: get("price"),
      stock_number: get("stock_number"),
      vin: get("vin"),
      mileage: get("mileage") || "0",
      engine: get("engine"),
      horsepower: get("horsepower") || undefined,
      battery_capacity: get("battery_capacity"),
      driving_range: get("driving_range") || undefined,
      fuel_type: fuel ?? "petrol",
      transmission: transmission ?? "automatic",
      drive_type: drive ?? "fwd",
      owners: get("owners") || "1",
      exterior_color: get("exterior_color"),
      interior_color: get("interior_color"),
      description: get("description"),
      features: splitList(get("features")),
      safety_features: splitList(get("safety_features")),
      warranty: get("warranty"),
      service_history: get("service_history"),
      dealer_notes: get("dealer_notes"),
      location: get("location"),
      status: status ?? "available",
      published: parseBool(get("published")),
    };

    const result = vehicleFormSchema.safeParse(candidate);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    if (errors.length > 0 || !result.success) {
      invalid.push({ rowNumber, errors });
      return;
    }

    const imageUrls: string[] = [];
    const rawImages = get("images");
    if (rawImages) {
      for (const candidate of splitImageUrls(rawImages)) {
        const verdict = checkImageUrl(candidate);
        if (verdict.ok) imageUrls.push(verdict.url);
        else imageWarnings.push({ rowNumber, reason: verdict.reason });
      }
    }

    valid.push({
      ...result.data,
      slug: slugify(result.data.brand, result.data.model, result.data.trim, result.data.year),
      imageUrls,
    });
  });

  return { valid, invalid, totalRows: parsed.data.length, unmappedHeaders, imageWarnings };
}
