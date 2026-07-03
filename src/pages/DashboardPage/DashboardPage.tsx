import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function DashboardPage() {
  return (
    <PagePlaceholder
      eyebrow="Dashboard"
      title="Состояние доказательной базы"
      description="Стартовая сводка для оценки того, что уже известно: индексированные источники, извлеченные утверждения, подтвержденные выводы, пробелы и противоречия."
      metrics={[
        { label: "Claims", value: "128", tone: "cyan" },
        { label: "Sources", value: "46", tone: "green" },
        { label: "Gaps", value: "9", tone: "amber" },
        { label: "Conflicts", value: "3", tone: "red" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Обзор для эксперта</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Здесь появятся карточки по темам исследований, уровню уверенности, свежести
        источников и накопленным обновлениям доказательной базы.
      </p>
    </PagePlaceholder>
  );
}
