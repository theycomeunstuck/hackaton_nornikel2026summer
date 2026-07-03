import type { ReactNode } from "react";

type FilterFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function FilterField({ label, children, className = "" }: FilterFieldProps) {
  return (
    <label className={`block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 ${className}`}>
      <span>{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
