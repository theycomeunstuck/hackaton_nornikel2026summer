type LegendItem = {
  type: string;
  label: string;
  dotClassName: string;
};

const nodeLegendItems: LegendItem[] = [
  { type: "material", label: "Материал", dotClassName: "border-slate-300 bg-slate-200" },
  { type: "process", label: "Процесс", dotClassName: "border-cyan-300 bg-cyan-100" },
  { type: "parameter", label: "Параметр", dotClassName: "border-amber-300 bg-amber-100" },
  { type: "condition", label: "Условие", dotClassName: "border-orange-300 bg-orange-100" },
  { type: "equipment", label: "Оборудование", dotClassName: "border-indigo-300 bg-indigo-100" },
  { type: "source", label: "Источник", dotClassName: "border-violet-300 bg-violet-100" },
  { type: "other", label: "Другое", dotClassName: "border-sky-300 bg-sky-100" },
];

const edgeLegendItems: LegendItem[] = [
  { type: "supports", label: "Подтверждает", dotClassName: "border-green-400 bg-green-400" },
  { type: "contains", label: "Содержит / параметр", dotClassName: "border-sky-400 bg-sky-400" },
  { type: "influences", label: "Влияет", dotClassName: "border-orange-400 bg-orange-400" },
  { type: "contradicts", label: "Конфликт", dotClassName: "border-rose-400 bg-rose-400" },
  { type: "uses", label: "Использует / требует", dotClassName: "border-teal-400 bg-teal-400" },
];

function LegendGroup({ title, items }: { title: string; items: LegendItem[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
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

export function GraphLegend() {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white/82 px-4 py-3 lg:grid-cols-[1fr_1.15fr]">
      <LegendGroup title="Узлы" items={nodeLegendItems} />
      <LegendGroup title="Связи" items={edgeLegendItems} />
    </div>
  );
}
