import type { ReactNode } from "react";

export type MetricTone = "cyan" | "green" | "amber" | "red" | "violet" | "slate";

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  tone?: MetricTone;
  icon?: ReactNode;
};

const toneClassName: Record<MetricTone, string> = {
  cyan: "border-ice-100 bg-ice-50 text-ice-600",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  red: "border-red-100 bg-red-50 text-red-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export function MetricCard({
  label,
  value,
  description,
  tone = "cyan",
  icon,
}: MetricCardProps) {
  return (
    <article className={`rounded border p-4 shadow-sm ${toneClassName[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        {icon ? <div className="text-slate-500">{icon}</div> : null}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{description}</p>
    </article>
  );
}
