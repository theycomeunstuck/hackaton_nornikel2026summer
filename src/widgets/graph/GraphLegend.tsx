type LegendItem = {
  type: string;
  label: string;
  dotClassName: string;
};

const legendItems: LegendItem[] = [
  { type: "material", label: "Материал", dotClassName: "border-slate-300 bg-slate-100" },
  { type: "process", label: "Процесс", dotClassName: "border-cyan-300 bg-cyan-100" },
  { type: "parameter", label: "Параметр", dotClassName: "border-amber-300 bg-amber-100" },
  { type: "condition", label: "Условие", dotClassName: "border-orange-300 bg-orange-100" },
  { type: "equipment", label: "Оборудование", dotClassName: "border-indigo-300 bg-indigo-100" },
  { type: "source", label: "Источник", dotClassName: "border-violet-300 bg-violet-100" },
  { type: "other", label: "Другое", dotClassName: "border-ice-300 bg-ice-100" },
];

export function GraphLegend() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/82 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Легенда
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {legendItems.map((item) => (
          <div
            key={item.type}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
          >
            <span className={`h-2.5 w-2.5 rounded-full border ${item.dotClassName}`} />
            <span className="text-xs font-medium text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
