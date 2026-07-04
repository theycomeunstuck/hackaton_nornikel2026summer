import { useMemo, useState } from "react";
import { searchEvidenceByScenario } from "../../shared/api/searchApi";
import { demoScenarios } from "../../shared/mock/demoScenarios";
import type { DemoScenarioId, SearchResult } from "../../shared/types/search";
import { KnowledgeGraph } from "../../widgets/graph/KnowledgeGraph";
import { AnswerSummaryCard } from "../../widgets/result/AnswerSummaryCard";
import { ContradictionsPanel } from "../../widgets/result/ContradictionsPanel";
import { EvidenceTable } from "../../widgets/result/EvidenceTable";
import { ExportPanel } from "../../widgets/result/ExportPanel";
import { GapsPanel } from "../../widgets/result/GapsPanel";
import { ParsedQueryCard } from "../../widgets/result/ParsedQueryCard";
import { SourcesPanel } from "../../widgets/result/SourcesPanel";
import { DemoScenarioButtons } from "../../widgets/search/DemoScenarioButtons";
import { SearchPanel } from "../../widgets/search/SearchPanel";

const defaultScenarioId: DemoScenarioId = "desalination";
const defaultScenario = demoScenarios.find((scenario) => scenario.id === defaultScenarioId);
const defaultQuestion = defaultScenario?.query ?? defaultScenario?.defaultQuery ?? "";

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
        Evidence workspace
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function SearchPage() {
  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>(defaultScenarioId);
  const [question, setQuestion] = useState(defaultQuestion);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario = useMemo(
    () => demoScenarios.find((scenario) => scenario.id === activeScenarioId),
    [activeScenarioId],
  );

  const handleScenarioSelect = (scenarioId: DemoScenarioId) => {
    const nextScenario = demoScenarios.find((scenario) => scenario.id === scenarioId);

    setActiveScenarioId(scenarioId);
    setQuestion(nextScenario?.query ?? nextScenario?.defaultQuery ?? "");
    setResult(null);
    setError(null);
  };

  const handleSearch = () => {
    setIsLoading(true);
    setError(null);

    searchEvidenceByScenario(activeScenarioId)
      .then((nextResult) => {
        setResult(nextResult);
      })
      .catch((caughtError: unknown) => {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Не удалось загрузить сценарий анализа.";
        setResult(null);
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-8">
      <section className="rounded-2xl border border-white/75 bg-white/76 p-7 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
              Evidence search
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Проверка научно-технических доказательств
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Введите вопрос, выберите пример при необходимости и запустите поиск доказательств.
              Результат показывает разбор запроса, краткий вывод, таблицу фрагментов,
              источники, граф связей, противоречия и пробелы.
            </p>
          </div>

          <div className="rounded-xl border border-ice-100 bg-ice-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
              Активный пример
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {activeScenario?.title ?? "Сценарий не выбран"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activeScenario?.description ?? "Выберите один из доступных примеров анализа."}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                isLoading
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : result
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {isLoading ? "Загрузка" : result ? "Результат загружен" : "Готов к поиску"}
            </span>
          </div>
        </div>
      </section>

      <SearchPanel
        query={question}
        onQueryChange={setQuestion}
        onSearch={handleSearch}
        disabled={isLoading || question.trim().length === 0}
      />

      <DemoScenarioButtons
        scenarios={demoScenarios}
        activeScenarioId={activeScenarioId}
        onSelect={handleScenarioSelect}
        disabled={isLoading}
      />

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {!result && !error ? (
        <section className="rounded-xl border border-dashed border-ice-200 bg-ice-50/50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Введите вопрос и нажмите «Найти доказательства»
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Примеры ниже заполняют поле вопроса и выбирают подготовленный набор доказательств.
          </p>
        </section>
      ) : null}

      {result ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <SectionHeading
              title="Query understanding"
              description="Как выбранный запрос разложен на намерение, материалы, процессы, условия и временной контекст."
            />
            <div className="grid grid-cols-[minmax(420px,0.9fr)_minmax(0,1fr)] gap-6">
              <ParsedQueryCard parsedQuery={result.parsedQuery} />
              <div className="space-y-4">
                <SectionHeading
                  title="Evidence summary"
                  description="Короткий вывод по найденным фрагментам и уровень уверенности результата."
                />
                <AnswerSummaryCard answer={result.answer} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading
              title="Evidence table"
              description="Главная рабочая таблица: фрагменты доказательств, условия, источники и оценка уверенности."
            />
            <EvidenceTable evidence={result.evidence} />
          </section>

          <section className="space-y-4">
            <SectionHeading
              title="Knowledge graph"
              description="Схема связей между узлами результата: материалами, процессами, параметрами, источниками и другими объектами."
            />
            <KnowledgeGraph graph={result.graph} mode="compact" title="Knowledge graph" />
          </section>

          <section className="space-y-4">
            <SectionHeading
              title="Sources"
              description="Компактный список документов и фрагментов, на которые опирается текущий результат."
            />
            <SourcesPanel sources={result.evidence.map((item) => item.sourceRef)} />
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] gap-6">
            <div className="space-y-4">
              <SectionHeading
                title="Contradictions"
                description="Конфликтующие выводы или расхождения, которые требуют экспертной проверки."
              />
              <ContradictionsPanel contradictions={result.contradictions} />
            </div>
            <div className="space-y-4">
              <SectionHeading
                title="Knowledge gaps"
                description="Недостающие данные и слабые места доказательной базы."
              />
              <GapsPanel gaps={result.gaps} />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading
              title="Export"
              description="Сохранение текущего результата анализа в отчёт для дальнейшей проверки и обсуждения."
            />
            <ExportPanel result={result} scenarioId={activeScenarioId} />
          </section>
        </div>
      ) : null}
    </div>
  );
}
