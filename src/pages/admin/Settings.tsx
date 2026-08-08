import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui";
import { useFeatureFlags, useSetFeatureFlag } from "../../hooks/useFeatureFlags";
import { useAuth } from "../../hooks/useAuth";

export default function Settings() {
  const { data: flags, isLoading } = useFeatureFlags();
  const setFlag = useSetFeatureFlag();
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl">הגדרות</h1>
      <Card>
        <CardHeader>
          <CardTitle>פיצ׳רים בפיתוח</CardTitle>
          <p className="text-sm text-[var(--color-steel-dark)]">הפעלה/כיבוי של יכולות שנמצאות עדיין בפיתוח — זמין למנהל מערכת בלבד</p>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-[var(--color-steel-dark)]">…</p>}
          <ul className="flex flex-col divide-y divide-[var(--color-steel)]">
            {flags?.map((flag) => (
              <li key={flag.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{flag.key}</p>
                  {flag.description && <p className="text-xs text-[var(--color-steel-dark)]">{flag.description}</p>}
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={flag.enabled}
                    disabled={!isSuperAdmin || setFlag.isPending}
                    onChange={(e) => setFlag.mutate({ key: flag.key, enabled: e.target.checked })}
                  />
                  <div className="h-6 w-11 rounded-full bg-[var(--color-steel)] transition-colors peer-checked:bg-[var(--color-navy)] peer-disabled:opacity-50" />
                  <div className="absolute start-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-[-1.25rem] rtl:peer-checked:translate-x-[1.25rem]" />
                </label>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
