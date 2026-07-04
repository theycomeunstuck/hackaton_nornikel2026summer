import { useEffect, useMemo, useState } from "react";
import { getScenarios, searchEvidence } from "../../shared/api/ragApi";
import { adaptRagSearchResult, adaptRagSourceRefs } from "../../shared/api/ragResultAdapter";
import { demoScenarios } from "../../shared/mock/demoScenarios";
import type { SearchResult as RagSearchResult } from "../../shared/types/rag";
import type { DemoScenario, DemoScenarioId } from "../../shared/types/search";
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

type DemoScenarioWithQuery = DemoScenario & {
  query?: string;
};

const defaultScenarioId: DemoScenarioId = "desalination";
const defaultScenario = demoScenarios.find((scenario) => scenario.id === defaultScenarioId);
const defaultQuestion = defaultScenario?.query ?? defaultScenario?.defaultQuery ?? "";

function getScenarioQuery(scenario: DemoScenarioWithQuery | undefined): string {
  return scenario?.query ?? scenario?.defaultQuery ?? "";
}

function getErrorMessage(caughtError: unknown, fallback: string): string {
  return caughtError instanceof Error ? caughtError.message : fallback;
}

export function SearchPage() {
  const [scenarios, setScenarios] = useState<DemoScenarioWithQuery[]>(demoScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>(defaultScenarioId);
  const [question, setQuestion] = useState(defaultQuestion);
  const [result, setResult] = useState<RagSearchResult | null>(null);
  const [lastQueryText, setLastQueryText] = useState(defaultQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === activeScenarioId),
    [activeScenarioId, scenarios],
  );
  const uiResult = useMemo(() => (result ? adaptRagSearchResult(result) : null), [result]);
  const sourceRefs = useMemo(() => (result ? adaptRagSourceRefs(result.sources) : []), [result]);

  useEffect(() => {
    let isMounted = true;

    getScenarios()
      .then((nextScenarios) => {
        if (!isMounted || nextScenarios.length === 0) {
          return;
        }

        setScenarios(nextScenarios);

        if (!nextScenarios.some((scenario) => scenario.id === defaultScenarioId)) {
          const firstScenario = nextScenarios[0];
          setActiveScenarioId(firstScenario.id);
          setQuestion(getScenarioQuery(firstScenario));
        }
      })
      .catch(() => {
        // getScenarios() already falls back to local metadata.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const runSearch = (query: string, scenarioId?: DemoScenarioId) => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    searchEvidence(trimmedQuery, scenarioId ? { scenarioId: String(scenarioId) } : undefined)
      .then((nextResult) => {
        setResult(nextResult);
        setLastQueryText(trimmedQuery);
      })
      .catch((caughtError: unknown) => {
        setResult(null);
        setError(getErrorMessage(caughtError, "Не удалось выполнить поиск доказательств."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleScenarioSelect = (scenarioId: DemoScenarioId) => {
    const nextScenario = scenarios.find((scenario) => scenario.id === scenarioId);
    const nextQuery = getScenarioQuery(nextScenario);

    setActiveScenarioId(scenarioId);
    setQuestion(nextQuery);
    runSearch(nextQuery, scenarioId);
  };

  const handleSearch = () => {
    runSearch(question, activeScenarioId);
  };

  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="Поиск доказательств"
        title="Проверка научно-технических доказательств"
        description="Введите вопрос или выберите подготовленный пример. Результат показывает разбор запроса, краткий вывод, фрагменты доказательств, источники, граф связей, противоречия и пробелы."
        aside={
          <div className="rounded-xl border border-ice-100 bg-ice-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
              Активный пример
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {activeScenario?.title ?? "Сценарий не выбран"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activeScenario?.description ??
                "Выберите один из доступных примеров анализа или задайте собственный вопрос."}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                isLoading
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : uiResult
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {isLoading ? "Загрузка" : uiResult ? "Результат загружен" : "Готов к поиску"}
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
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelect={handleScenarioSelect}
        disabled={isLoading}
      />

      {isLoading ? (
        <section className="rounded-xl border border-ice-200 bg-white/76 px-5 py-6 shadow-glass backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <span className="h-3 w-3 animate-pulse rounded-full bg-ice-500 shadow-[0_0_20px_rgba(14,165,233,0.7)]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Идёт поиск доказательств</p>
              <p className="mt-1 text-sm text-slate-600">
                Система подбирает фрагменты, источники, условия и связи для текущего запроса.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {!uiResult && !error && !isLoading ? (
        <section className="rounded-xl border border-dashed border-ice-200 bg-ice-50/50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Начните с вопроса или выберите подготовленный пример
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Введите научно-технический запрос и нажмите «Найти доказательства» либо выберите один из demo-сценариев. Если backend недоступен, будет использован локальный fallback.
          </p>
        </section>
      ) : null}

      {uiResult ? (
        <div className="space-y-4">
          <CollapsibleSection
            title="Краткий вывод"
            eyebrow="Резюме доказательств"
            description="Короткий вывод по найденным фрагментам, уровень уверенности и ограничения результата."
            defaultOpen
          >
            <AnswerSummaryCard answer={uiResult.answer} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Понимание запроса"
            eyebrow="Разбор запроса"
            description="Как запрос разложен на намерение, материалы, процессы, свойства, условия и временной контекст."
            defaultOpen={false}
          >
            <ParsedQueryCard parsedQuery={uiResult.parsedQuery} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Таблица доказательств"
            eyebrow="Фрагменты и источники"
            description="Основная рабочая таблица: фрагменты доказательств, источники, страницы, условия и confidence."
            defaultOpen
          >
            <EvidenceTable evidence={uiResult.evidence} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Граф связей"
            eyebrow="Граф знаний"
            description="Схема связей между материалами, процессами, параметрами, источниками и другими объектами результата."
            defaultOpen={false}
          >
            <KnowledgeGraph graph={uiResult.graph} mode="compact" title="Граф связей" />
          </CollapsibleSection>

          <CollapsibleSection
            title="Источники"
            eyebrow="Документы и фрагменты"
            description="Список документов и chunk references, на которые опирается текущий результат."
            defaultOpen
          >
            <SourcesPanel sources={sourceRefs} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Пробелы"
            eyebrow="Слабые зоны"
            description="Недостающие данные и слабые места доказательной базы."
            defaultOpen={false}
          >
            <GapsPanel gaps={uiResult.gaps} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Противоречия"
            eyebrow="Экспертная проверка"
            description="Конфликтующие выводы или расхождения, которые требуют экспертной проверки."
            defaultOpen={false}
          >
            <ContradictionsPanel contradictions={uiResult.contradictions} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Экспорт отчёта"
            eyebrow="Отчёт"
            description="Сохранение текущего результата анализа в отчёт для дальнейшей проверки и обсуждения."
            defaultOpen={false}
          >
            <ExportPanel
              result={uiResult}
              scenarioId={activeScenarioId}
              lastQueryText={lastQueryText}
            />
          </CollapsibleSection>
        </div>
      ) : null}
    </ContentContainer>
  );
}
