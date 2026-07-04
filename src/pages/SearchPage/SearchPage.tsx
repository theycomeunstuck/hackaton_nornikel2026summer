import { useMemo, useState } from "react";
import { searchEvidenceByScenario } from "../../shared/api/searchApi";
import { demoScenarios } from "../../shared/mock/demoScenarios";
import type { DemoScenarioId, SearchResult } from "../../shared/types/search";
import { CollapsibleSection } from "../../shared/ui/CollapsibleSection";
import { ContentContainer } from "../../shared/ui/ContentContainer";
import { EvidencePageHeader } from "../../shared/ui/EvidencePageHeader";
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
            : "Не удалось загрузить выбранный сценарий анализа.";
        setResult(null);
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="Поиск доказательств"
        title="Проверка научно-технических доказательств"
        description="Введите вопрос, выберите пример при необходимости и запустите поиск доказательств. Результат показывает разбор запроса, краткий вывод, таблицу фрагментов, источники, граф связей, противоречия и пробелы."
        aside={
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
        }
      />

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
            Примеры заполняют поле вопроса и выбирают подготовленный набор доказательств.
          </p>
        </section>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <CollapsibleSection
            title="Как разобран запрос"
            eyebrow="Разбор запроса"
            description="Как выбранный запрос разложен на намерение, материалы, процессы, условия и временной контекст."
            defaultOpen={false}
          >
            <ParsedQueryCard parsedQuery={result.parsedQuery} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Краткий вывод"
            eyebrow="Резюме доказательств"
            description="Короткий вывод по найденным фрагментам и уровень уверенности результата."
            defaultOpen={false}
          >
            <AnswerSummaryCard answer={result.answer} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Таблица доказательств"
            eyebrow="Фрагменты доказательств"
            description="Главная рабочая таблица: фрагменты доказательств, условия, источники и оценка уверенности."
            defaultOpen={false}
          >
            <EvidenceTable evidence={result.evidence} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Граф связей"
            eyebrow="Граф знаний"
            description="Схема связей между материалами, процессами, параметрами, источниками и другими объектами результата."
            defaultOpen={false}
          >
            <KnowledgeGraph graph={result.graph} mode="compact" title="Граф связей" />
          </CollapsibleSection>

          <CollapsibleSection
            title="Источники"
            eyebrow="Документы и фрагменты"
            description="Компактный список документов и фрагментов, на которые опирается текущий результат."
            defaultOpen={false}
          >
            <SourcesPanel sources={result.evidence.map((item) => item.sourceRef)} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Противоречия"
            eyebrow="Экспертная проверка"
            description="Конфликтующие выводы или расхождения, которые требуют экспертной проверки."
            defaultOpen={false}
          >
            <ContradictionsPanel contradictions={result.contradictions} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Пробелы"
            eyebrow="Слабые зоны"
            description="Недостающие данные и слабые места доказательной базы."
            defaultOpen={false}
          >
            <GapsPanel gaps={result.gaps} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Экспорт отчёта"
            eyebrow="Отчёт"
            description="Сохранение текущего результата анализа в отчёт для дальнейшей проверки и обсуждения."
            defaultOpen={false}
          >
            <ExportPanel result={result} scenarioId={activeScenarioId} />
          </CollapsibleSection>
        </div>
      ) : null}
    </ContentContainer>
  );
}
