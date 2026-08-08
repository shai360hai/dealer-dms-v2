import { useState } from "react";
import { Link } from "react-router";
import { cn } from "../../components/ui/cn";
import { useInquiries, useUpdateInquiryStatus } from "../../hooks/useInquiries";
import { timeAgo } from "../../lib/format";

const TABS = ["all", "new", "contacted", "closed"] as const;
const TAB_LABEL: Record<(typeof TABS)[number], string> = { all: "הכל", new: "חדש", contacted: "נוצר קשר", closed: "סגור" };

export default function Inquiries() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInquiries({ status: tab === "all" ? undefined : tab, page, pageSize: 20 });
  const updateStatus = useUpdateInquiryStatus();
  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;

  return (
    <div>
      <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl">פניות לקוחות</h1>

      <div className="mb-4 flex gap-2">
        {TABS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setTab(s);
              setPage(1);
            }}
            className={cn("rounded-full px-3 py-1.5 text-sm", tab === s ? "bg-[var(--color-navy)] text-white" : "bg-[var(--color-porcelain-dim)]")}
          >
            {TAB_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-steel)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-porcelain-dim)]">
            <tr>
              {["שם מלא", "טלפון", 'דוא"ל', "רכב", "הודעה", "סטטוס", "תאריך"].map((h) => (
                <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-steel)]">
            {data?.items.map((inquiry) => (
              <tr key={inquiry.id}>
                <td className="px-3 py-2">{inquiry.full_name}</td>
                <td className="px-3 py-2" dir="ltr"><a href={`tel:${inquiry.phone}`} className="underline">{inquiry.phone}</a></td>
                <td className="px-3 py-2" dir="ltr"><a href={`mailto:${inquiry.email}`} className="underline">{inquiry.email}</a></td>
                <td className="px-3 py-2">
                  {inquiry.vehicles ? (
                    <Link to={`/admin/vehicles/${inquiry.vehicles.id}/edit`} className="underline">{inquiry.vehicles.brand} {inquiry.vehicles.model}</Link>
                  ) : (
                    <span className="text-[var(--color-steel-dark)]">ללא רכב משויך</span>
                  )}
                </td>
                <td className="max-w-xs truncate px-3 py-2">{inquiry.message ?? "—"}</td>
                <td className="px-3 py-2">
                  <select
                    value={inquiry.status}
                    onChange={(e) => updateStatus.mutate({ id: inquiry.id, status: e.target.value })}
                    className="rounded border border-[var(--color-steel)] bg-transparent px-1.5 py-1 text-xs"
                  >
                    <option value="new">חדש</option>
                    <option value="contacted">נוצר קשר</option>
                    <option value="closed">סגור</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--color-steel-dark)]">{timeAgo(inquiry.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && data?.items.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-steel-dark)]">אין פניות להצגה</p>}
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
