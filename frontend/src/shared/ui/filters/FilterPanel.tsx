import type { ReactNode } from "react";

type FilterPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  columnsClassName?: string;
  className?: string;
};

export function FilterPanel({
  title,
  description,
  children,
  action,
  columnsClassName = "grid-cols-4",
  className = "",
}: FilterPanelProps) {
  return (
    <section
      className={`rounded-xl border border-ice-100/80 bg-gradient-to-br from-white/88 via-ice-50/58 to-white/72 p-4 shadow-glass backdrop-blur-2xl ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
            Фильтры
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={`mt-4 grid gap-3 ${columnsClassName}`}>{children}</div>
    </section>
  );
}
