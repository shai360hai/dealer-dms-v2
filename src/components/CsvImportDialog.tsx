import { useRef, useState } from "react";
import { X, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "./ui";
import { parseVehiclesCsv, type CsvParseResult } from "../lib/csv-import";
import { useImportVehicles, type ImportResult } from "../hooks/useImportVehicles";

export function CsvImportDialog({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const importVehicles = useImportVehicles();

  async function handleFile(file: File) {
    setResult(null);
    setFileName(file.name);
    // utf-8 handles the Hebrew headers; Papa strips the BOM Excel adds.
    const text = await file.text();
    setParsed(parseVehiclesCsv(text));
  }

  function handleImport() {
    if (!parsed?.valid.length) return;
    importVehicles.mutate(parsed.valid, { onSuccess: setResult });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-card)] bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl">ייבוא רכבים מקובץ CSV</h2>
            <p className="mt-1 text-sm text-[var(--color-steel-dark)]">
              הכותרות בקובץ צריכות להיות בעברית, כפי שמופיעות בטופס הרכב (יצרן, דגם, שנה, מחיר…)
            </p>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="text-[var(--color-steel-dark)] hover:text-[var(--color-ink)]">
            <X size={20} />
          </button>
        </div>

        {!result && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed p-8 text-center text-sm transition-colors ${
              isDragging ? "border-[var(--color-chrome-gold)] bg-[var(--color-chrome-gold-soft)]/20" : "border-[var(--color-steel)]"
            }`}
          >
            <UploadCloud size={24} className="text-[var(--color-steel-dark)]" />
            <span className="text-[var(--color-steel-dark)]">
              {fileName ?? "גררו קובץ CSV לכאן או לחצו לבחירה"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {parsed && !result && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-status-available)_15%,white)] px-3 py-1 text-[var(--color-status-available)]">
                <CheckCircle2 size={14} /> {parsed.valid.length} רכבים תקינים
              </span>
              {parsed.invalid.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-status-sold)_15%,white)] px-3 py-1 text-[var(--color-status-sold)]">
                  <AlertTriangle size={14} /> {parsed.invalid.length} שורות עם שגיאות
                </span>
              )}
            </div>

            {parsed.unmappedHeaders.length > 0 && (
              <p className="mt-3 rounded-[var(--radius-card)] bg-[var(--color-porcelain-dim)] px-3 py-2 text-xs text-[var(--color-steel-dark)]">
                עמודות שלא זוהו ולא ייובאו: {parsed.unmappedHeaders.join(", ")}
              </p>
            )}

            {parsed.invalid.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-steel)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--color-porcelain-dim)]">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">שורה</th>
                      <th className="px-3 py-2 text-start font-medium">שגיאות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-steel)]">
                    {parsed.invalid.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="px-3 py-2 align-top font-[family-name:var(--font-mono)]">{row.rowNumber}</td>
                        <td className="px-3 py-2 text-[var(--color-status-sold)]">{row.errors.join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {parsed.valid.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-steel)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--color-porcelain-dim)]">
                    <tr>
                      {["יצרן", "דגם", "שנה", "מחיר", "מס׳ מלאי"].map((h) => (
                        <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-steel)]">
                    {parsed.valid.slice(0, 100).map((v) => (
                      <tr key={v.stock_number}>
                        <td className="px-3 py-2">{v.brand}</td>
                        <td className="px-3 py-2">{v.model} {v.trim ?? ""}</td>
                        <td className="px-3 py-2">{v.year}</td>
                        <td className="px-3 py-2 font-[family-name:var(--font-mono)]">{v.price.toLocaleString("he-IL")}</td>
                        <td className="px-3 py-2 font-[family-name:var(--font-mono)]">{v.stock_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {importVehicles.isError && (
              <p className="mt-3 rounded-[var(--radius-card)] bg-[color-mix(in_srgb,var(--color-status-sold)_10%,white)] px-3 py-2 text-sm text-[var(--color-status-sold)]">
                {importVehicles.error instanceof Error ? importVehicles.error.message : "הייבוא נכשל"}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>ביטול</Button>
              <Button variant="gold" onClick={handleImport} disabled={parsed.valid.length === 0 || importVehicles.isPending}>
                {importVehicles.isPending ? "מייבא..." : `ייבוא ${parsed.valid.length} רכבים`}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <p className="rounded-[var(--radius-card)] bg-[color-mix(in_srgb,var(--color-status-available)_12%,white)] px-4 py-3 text-sm text-[var(--color-status-available)]">
              יובאו {result.inserted} רכבים בהצלחה
            </p>

            {result.skipped.length > 0 && (
              <>
                <p className="mt-3 text-sm font-medium">{result.skipped.length} רכבים דולגו:</p>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-steel)]">
                  <ul className="divide-y divide-[var(--color-steel)] text-xs">
                    {result.skipped.map((s, i) => (
                      <li key={i} className="flex justify-between gap-3 px-3 py-2">
                        <span className="font-[family-name:var(--font-mono)]">{s.stockNumber}</span>
                        <span className="text-[var(--color-steel-dark)]">{s.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={onClose}>סגירה</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
