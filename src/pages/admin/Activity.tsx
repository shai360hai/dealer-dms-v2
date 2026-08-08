import { useState } from "react";
import { useActivityLogs } from "../../hooks/useActivityLogs";
import { timeAgo } from "../../lib/format";

const ACTION_LABEL: Record<string, string> = {
  VEHICLE_CREATED: "נוצר רכב חדש",
  VEHICLE_UPDATED: "עודכן רכב",
  VEHICLE_DELETED: "נמחק רכב",
  VEHICLE_DUPLICATED: "שוכפל רכב",
  VEHICLE_STATUS_CHANGED: "עודכן סטטוס רכב",
  VEHICLE_PUBLISHED: "רכב פורסם באתר",
  VEHICLE_UNPUBLISHED: "הוסר פרסום רכב",
  INQUIRY_STATUS_CHANGED: "עודכן סטטוס פנייה",
  VEHICLES_BULK_DELETED: "מחיקה מרוכזת של רכבים",
};

export default function Activity() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActivityLogs(page);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;

  return (
    <div>
      <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl">יומן פעילות</h1>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white">
        <ul className="divide-y divide-[var(--color-steel)]">
          {data?.items.map((log) => (
            <li key={log.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p>{ACTION_LABEL[log.action] ?? log.action}</p>
                <p className="text-xs text-[var(--color-steel-dark)]">{log.profiles?.full_name ?? "—"} · {log.entity_type}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-[var(--color-steel-dark)]">{timeAgo(log.created_at)}</span>
            </li>
          ))}
        </ul>
        {!isLoading && data?.items.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-steel-dark)]">אין פעילות מתועדת עדיין</p>}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">←</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">→</button>
        </div>
      )}
    </div>
  );
}
