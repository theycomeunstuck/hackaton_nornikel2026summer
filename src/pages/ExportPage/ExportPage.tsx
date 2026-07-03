import { Link } from "react-router-dom";
import { mockSearchResults } from "../../shared/mock/searchResults.mock";
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

export function ExportPage() {
  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="rounded border border-white/75 bg-white/76 p-7 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_390px] gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
              Export report
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Экспорт доказательных отчётов
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Markdown и JSON отчёты формируются на SearchPage из текущего
              SearchResult: исходный запрос, parsed query, answer summary, evidence
              table, sources, contradictions, gaps и graph summary.
            </p>
          </div>
          <div className="rounded border border-ice-100 bg-graphite-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-300">
              Report principle
            </p>
            <p className="mt-3 text-lg font-semibold">
              Каждый factual claim в отчёте должен сохранять source reference.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-5 gap-4">
        <MetricCard
          label="Demo scenarios"
          value={String(exportSummary.scenarios)}
          description="Сценарии, доступные для export report."
          tone="cyan"
        />
        <MetricCard
          label="Claims"
          value={String(exportSummary.claims)}
          description="Claims, попадающие в evidence table."
          tone="green"
        />
        <MetricCard
          label="Sources"
          value={String(exportSummary.sources)}
          description="Уникальные источники для citations."
          tone="violet"
        />
        <MetricCard
          label="Gaps"
          value={String(exportSummary.gaps)}
          description="Knowledge gaps, отмечаемые в отчёте."
          tone="amber"
        />
        <MetricCard
          label="Contradictions"
          value={String(exportSummary.contradictions)}
          description="Conflicts, требующие expert review."
          tone={exportSummary.contradictions > 0 ? "red" : "green"}
        />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <SectionCard title="Как получить отчёт" eyebrow="Frontend export">
          <div className="grid grid-cols-3 gap-4">
            <article className="rounded border border-ice-100 bg-ice-50 p-4">
              <StatusBadge label="available" tone="success" />
              <h3 className="mt-3 text-base font-semibold text-slate-950">Markdown</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Подходит для быстрого evidence review, вставки в заметки и проверки
                структуры отчёта.
              </p>
            </article>
            <article className="rounded border border-emerald-100 bg-emerald-50 p-4">
              <StatusBadge label="available" tone="success" />
              <h3 className="mt-3 text-base font-semibold text-slate-950">JSON</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Сохраняет metadata, текущий SearchResult и структуру для будущей
                backend-интеграции.
              </p>
            </article>
            <article className="rounded border border-slate-200 bg-slate-50 p-4">
              <StatusBadge label="backend option" tone="neutral" />
              <h3 className="mt-3 text-base font-semibold text-slate-950">PDF</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Оставлен как будущая backend-опция для оформления официального
                отчёта.
              </p>
            </article>
          </div>
        </SectionCard>

        <section className="rounded border border-graphite-800 bg-graphite-900 p-5 text-white shadow-glass">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-300">
            Demo action
          </p>
          <h2 className="mt-2 text-xl font-semibold">Экспорт выполняется из SearchPage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Выберите demo scenario, проверьте evidence table и скачайте Markdown
            или JSON из панели “Экспорт отчёта”.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <Link
              to="/search"
              className="rounded border border-ice-300/30 bg-ice-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-ice-600"
            >
              Перейти к поиску доказательств
            </Link>
            <Link
              to="/claims"
              className="rounded border border-white/15 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Открыть базу утверждений
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
