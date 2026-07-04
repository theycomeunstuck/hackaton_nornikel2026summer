import { Link } from "react-router-dom";
import { mockSearchResults } from "../../shared/mock/searchResults.mock";
import { ContentContainer } from "../../shared/ui/ContentContainer";
import { EvidencePageHeader } from "../../shared/ui/EvidencePageHeader";
import { MetricCard } from "../../shared/ui/MetricCard";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const exportSummary = {
  scenarios: mockSearchResults.length,
  claims: mockSearchResults.reduce((sum, result) => sum + result.evidence.length, 0),
  sources: new Set(
    mockSearchResults.flatMap((result) => result.sources.map((source) => source.id)),
  ).size,
  gaps: mockSearchResults.reduce((sum, result) => sum + result.gaps.length, 0),
  contradictions: mockSearchResults.reduce(
    (sum, result) => sum + result.contradictions.length,
    0,
  ),
};

function ExportHeaderAside() {
  return (
    <div className="rounded-xl border border-ice-100 bg-ice-50/75 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
        Принцип отчёта
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-950">
        Каждое фактическое утверждение в отчёте должно сохранять ссылку на источник.
      </p>
    </div>
  );
}

export function ExportPage() {
  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="Отчёты"
        title="Экспорт доказательных отчётов"
        description="Markdown и JSON отчёты формируются на странице поиска из текущего результата: исходный запрос, структура запроса, краткий вывод, таблица доказательств, источники, противоречия, пробелы и сводка графа."
        aside={<ExportHeaderAside />}
      />

      <section className="grid grid-cols-5 gap-4">
        <MetricCard
          label="Сценарии"
          value={String(exportSummary.scenarios)}
          description="Рабочие направления, доступные для отчёта."
          tone="cyan"
        />
        <MetricCard
          label="Утверждения"
          value={String(exportSummary.claims)}
          description="Утверждения, попадающие в таблицу доказательств."
          tone="green"
        />
        <MetricCard
          label="Источники"
          value={String(exportSummary.sources)}
          description="Уникальные источники для ссылок в отчёте."
          tone="violet"
        />
        <MetricCard
          label="Пробелы"
          value={String(exportSummary.gaps)}
          description="Недостающие данные, отмечаемые в отчёте."
          tone="amber"
        />
        <MetricCard
          label="Противоречия"
          value={String(exportSummary.contradictions)}
          description="Конфликты, требующие экспертной проверки."
          tone={exportSummary.contradictions > 0 ? "red" : "green"}
        />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <SectionCard title="Как получить отчёт" eyebrow="Форматы экспорта">
          <div className="grid grid-cols-3 gap-4">
            <article className="rounded-xl border border-ice-100 bg-ice-50 p-4">
              <StatusBadge label="доступно" tone="success" />
              <h3 className="mt-3 text-base font-semibold text-slate-950">Markdown</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Подходит для быстрой экспертной проверки, заметок и ревью структуры отчёта.
              </p>
            </article>
            <article className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <StatusBadge label="доступно" tone="success" />
              <h3 className="mt-3 text-base font-semibold text-slate-950">JSON</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Сохраняет метаданные, текущий результат и структурированные поля для интеграций.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <StatusBadge label="серверный экспорт" tone="neutral" />
              <h3 className="mt-3 text-base font-semibold text-slate-950">PDF</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Предусмотрен для оформленных корпоративных отчётов после подключения серверной генерации.
              </p>
            </article>
          </div>
        </SectionCard>

        <section className="rounded-xl border border-graphite-800 bg-graphite-900 p-5 text-white shadow-glass">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-300">
            Действие
          </p>
          <h2 className="mt-2 text-xl font-semibold">Экспорт выполняется из страницы поиска</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Выберите направление анализа, проверьте таблицу доказательств и скачайте Markdown или
            JSON из панели экспорта отчёта.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <Link
              to="/search"
              className="rounded-xl border border-ice-300/30 bg-ice-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-ice-600"
            >
              Перейти к поиску доказательств
            </Link>
            <Link
              to="/claims"
              className="rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Открыть базу утверждений
            </Link>
          </div>
        </section>
      </div>
    </ContentContainer>
  );
}
