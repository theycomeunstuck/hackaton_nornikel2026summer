type LegendItem = {
  type: string;
  label: string;
  className: string;
};

const legendItems: LegendItem[] = [
  { type: "claim", label: "Утверждение", className: "border-ice-300 bg-ice-50 text-ice-600" },
  { type: "material", label: "Материал", className: "border-slate-300 bg-white text-slate-700" },
  { type: "process", label: "Процесс", className: "border-cyan-300 bg-cyan-50 text-cyan-700" },
  { type: "technology", label: "Технология", className: "border-blue-300 bg-blue-50 text-blue-700" },
  { type: "equipment", label: "Оборудование", className: "border-indigo-300 bg-indigo-50 text-indigo-700" },
  { type: "condition", label: "Условие", className: "border-amber-300 bg-amber-50 text-amber-700" },
  { type: "effect", label: "Эффект", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { type: "source", label: "Источник", className: "border-violet-300 bg-violet-50 text-violet-700" },
  { type: "contradiction", label: "Противоречие", className: "border-red-300 bg-red-50 text-red-700" },
  { type: "gap", label: "Пробел", className: "border-orange-300 bg-orange-50 text-orange-700" },
];

export function GraphLegend() {
  return (
    <div className="rounded border border-slate-200 bg-white/85 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Легенда
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {legendItems.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full border ${item.className}`} />
            <span className="text-xs font-medium text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
