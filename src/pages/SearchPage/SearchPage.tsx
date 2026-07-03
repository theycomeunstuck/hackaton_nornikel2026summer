import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function SearchPage() {
  return (
    <PagePlaceholder
      eyebrow="Evidence search"
      title="Рабочая область поиска доказательств"
      description="Главный экран для научно-технического вопроса: разбор запроса, структурированный ответ, таблица evidence, источники, уверенность и предупреждения."
      metrics={[
        { label: "Parsed", value: "Query", tone: "cyan" },
        { label: "Evidence", value: "Table", tone: "green" },
        { label: "Warnings", value: "Weak", tone: "amber" },
        { label: "Sources", value: "Linked", tone: "cyan" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Evidence-first workflow</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Позже здесь будет запрос по обессоливанию воды, электроэкстракции никеля или
        распределению Au / Ag / МПГ с выводом источников и confidence по каждому claim.
      </p>
    </PagePlaceholder>
  );
}
