import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { cn } from "./cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("flex items-center justify-between gap-3 p-4", className)}>
      <div>
        <p className="text-xs font-medium text-[var(--color-steel-dark)]">{label}</p>
        <p className={cn("mt-1 font-[family-name:var(--font-mono)] text-2xl font-semibold tabular-nums", accent ? "text-[var(--color-chrome-gold)]" : "text-[var(--color-navy)]")}>
          {value}
        </p>
      </div>
      {Icon ? (
        <div className="rounded-full bg-[var(--color-porcelain-dim)] p-2.5 text-[var(--color-navy)]">
          <Icon size={20} strokeWidth={1.75} />
        </div>
      ) : null}
    </Card>
  );
}
