import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function ExportPage() {
  return (
    <PagePlaceholder
      eyebrow="Export report"
      title="Экспорт доказательного отчета"
      description="Будущий экран подготовки отчета с claims, источниками, confidence, числовыми условиями, пробелами и противоречиями."
      metrics={[
        { label: "Format", value: "PDF", tone: "cyan" },
        { label: "Claims", value: "Linked", tone: "green" },
        { label: "Sources", value: "Cited", tone: "green" },
        { label: "Gaps", value: "Marked", tone: "amber" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Report-like layout</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Экспорт пока не реализован. Этот раздел резервирует маршрут и UX-контекст под
        будущую сборку evidence report.
      </p>
    </PagePlaceholder>
  );
}
