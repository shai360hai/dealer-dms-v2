import { readSheet } from "read-excel-file/browser";
import { parseVehicleRows, transformHeader, UNMAPPED_PREFIX, type CsvParseResult } from "./csv-import";

/**
 * Reads the first sheet of an .xlsx/.xlsm file and feeds it through the
 * same validation pipeline the CSV importer uses.
 *
 * Excel is worth supporting rather than telling people to "just save as
 * CSV": Excel's CSV export mangles Hebrew unless you specifically pick
 * the UTF-8 variant, and offers no protection against commas inside
 * cells. Reading the workbook directly sidesteps both problems.
 *
 * Note this uses `readSheet`, not the default `readXlsxFile` export —
 * the latter returns every sheet wrapped in metadata objects, while we
 * only ever want the first sheet's raw rows.
 */
export async function parseVehiclesExcel(file: File): Promise<CsvParseResult> {
  const grid = await readSheet(file);

  const empty: CsvParseResult = {
    valid: [],
    invalid: [],
    totalRows: 0,
    unmappedHeaders: [],
    imageWarnings: [],
  };

  if (!grid || grid.length === 0) return empty;

  const headerRow = grid[0];
  if (!headerRow) return empty;

  const columnKeys = headerRow.map((cell) => transformHeader(cellToString(cell)));

  const unmappedHeaders = columnKeys
    .filter((k) => k.startsWith(UNMAPPED_PREFIX))
    .map((k) => k.slice(UNMAPPED_PREFIX.length))
    .filter(Boolean);

  const rows: Record<string, string>[] = [];
  for (const row of grid.slice(1)) {
    // Excel commonly leaves trailing blank rows behind; skip anything
    // with no content at all rather than reporting it as an error row.
    if (row.every((cell) => cellToString(cell) === "")) continue;

    const record: Record<string, string> = {};
    columnKeys.forEach((key, i) => {
      record[key] = cellToString(row[i]);
    });
    rows.push(record);
  }

  return parseVehicleRows(rows, unmappedHeaders);
}

/**
 * Excel cells come back typed (number, Date, boolean, null), while the
 * validation layer expects the same strings a CSV row would produce —
 * so everything is normalized to string here.
 */
// Typed as `unknown` deliberately: the package's own declarations say a
// cell can be `typeof Date` (the constructor) where they mean `Date` (an
// instance), so trusting their type here would either fail to compile or
// force a wrong cast. Checking at runtime is correct either way.
function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  if (typeof cell === "boolean") return cell ? "true" : "false";
  return String(cell).trim();
}

export function isExcelFile(file: File): boolean {
  return /\.(xlsx|xlsm)$/i.test(file.name);
}
