import type { ReactNode } from "react";

export type PageMetric = {
  label: string;
  value: string;
  tone?: "cyan" | "green" | "amber" | "red";
};

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics: PageMetric[];
  children?: ReactNode;
};

const metricToneClass: Record<NonNullable<PageMetric["tone"]>, string> = {
  cyan: "border-ice-100 bg-ice-50 text-ice-600",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  red: "border-red-100 bg-red-50 text-red-700",
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  metrics,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="rounded border border-white/70 bg-white/68 p-7 shadow-glass backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
          {eyebrow}
        </p>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_420px] gap-8">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={`rounded border px-4 py-3 ${
                  metricToneClass[metric.tone ?? "cyan"]
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-75">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] gap-6">
        <div className="rounded border border-white/70 bg-white/62 p-6 shadow-glass backdrop-blur-2xl">
          {children}
        </div>
        <div className="rounded border border-ice-100 bg-graphite-900 p-6 text-white shadow-glass">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-300">
            Следующий слой
          </p>
          <h3 className="mt-3 text-xl font-semibold">Готово для интеграции моков</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Этот экран пока фиксирует назначение раздела и визуальный ритм продукта.
            Данные, таблицы и графы будут добавляться отдельными короткими итерациями.
          </p>
        </div>
      </div>
    </section>
  );
}
