import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function SourcesPage() {
  return (
    <PagePlaceholder
      eyebrow="Sources"
      title="Индексированные документы и ссылки"
      description="Реестр публикаций, внутренних отчетов, патентов, экспериментов и технической документации, на которые опираются claims."
      metrics={[
        { label: "Reports", value: "17", tone: "cyan" },
        { label: "Papers", value: "21", tone: "green" },
        { label: "Patents", value: "8", tone: "amber" },
        { label: "Chunks", value: "612", tone: "cyan" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Карточки источников</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        В следующих задачах здесь можно добавить список документов, фильтры по типу
        источника и ссылки на страницы или фрагменты.
      </p>
    </PagePlaceholder>
  );
}
