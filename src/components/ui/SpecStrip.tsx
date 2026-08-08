import * as React from "react";
import { cn } from "./cn";

export interface Spec {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export function SpecStrip({ specs, className }: { specs: Spec[]; className?: string }) {
  return (
    <dl className={cn("grid auto-cols-fr grid-flow-col divide-x divide-x-reverse divide-[var(--color-steel)]", className)}>
      {specs.map((spec, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 px-2 first:ps-0 last:pe-0">
          <dt className="flex items-center gap-1 text-[10px] tracking-wide text-[var(--color-steel-dark)]">
            {spec.icon}
            {spec.label}
          </dt>
          <dd className="font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
