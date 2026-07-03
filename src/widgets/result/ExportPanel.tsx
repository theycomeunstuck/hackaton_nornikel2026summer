import { SectionCard } from "../../shared/ui/SectionCard";

export function ExportPanel() {
  return (
    <SectionCard title="Экспорт отчёта" eyebrow="Export report">
      <p className="text-sm leading-6 text-slate-600">
        В этой итерации экспорт является UI-заглушкой. Структура отчёта уже видна:
        conclusion, evidence table, contradictions, gaps и source references.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {["Markdown", "JSON", "PDF future"].map((format) => (
          <button
            key={format}
            type="button"
            className="rounded border border-ice-100 bg-ice-50 px-3 py-3 text-sm font-semibold text-ice-600 transition hover:border-ice-300 hover:bg-white"
          >
            {format}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
