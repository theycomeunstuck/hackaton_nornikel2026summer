import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function UploadPage() {
  return (
    <PagePlaceholder
      eyebrow="Document intake"
      title="Загрузка документов"
      description="Вторичный экран для будущего добавления научных статей, отчетов, патентов и технических документов в корпус."
      metrics={[
        { label: "Status", value: "Later", tone: "amber" },
        { label: "Files", value: "Mock", tone: "cyan" },
        { label: "Parsing", value: "Planned", tone: "cyan" },
        { label: "Queue", value: "Empty", tone: "green" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Без реализации загрузки</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        По условиям текущей задачи загрузка не углубляется: здесь только placeholder и
        маршрут для будущей интеграции.
      </p>
    </PagePlaceholder>
  );
}
