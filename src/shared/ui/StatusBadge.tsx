export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneClassName: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-ice-100 bg-ice-50 text-ice-600",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${toneClassName[tone]}`}
    >
      {label}
    </span>
  );
}
