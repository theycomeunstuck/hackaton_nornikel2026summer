import { useEffect, useMemo, useState } from "react";
import { searchEvidenceByScenario } from "../../shared/api/searchApi";
import { demoScenarios } from "../../shared/mock/demoScenarios";
import type { DemoScenarioId, SearchResult } from "../../shared/types/search";
import { DemoScenarioButtons } from "../../widgets/search/DemoScenarioButtons";

const defaultScenarioId: DemoScenarioId = "desalination";

export function SearchPage() {
  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>(defaultScenarioId);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario = useMemo(
    () => demoScenarios.find((scenario) => scenario.id === activeScenarioId),
    [activeScenarioId],
  );

  useEffect(() => {
    let isCurrentRequest = true;

    setIsLoading(true);
    setError(null);

    searchEvidenceByScenario(activeScenarioId)
      .then((nextResult) => {
        if (isCurrentRequest) {
          setResult(nextResult);
        }
      })
      .catch((caughtError: unknown) => {
        if (isCurrentRequest) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : "Не удалось загрузить сценарий анализа.";
          setResult(null);
          setError(message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [activeScenarioId]);

  const handleScenarioSelect = (scenarioId: DemoScenarioId) => {
    setActiveScenarioId(scenarioId);
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="rounded-xl border border-white/75 bg-white/72 p-6 shadow-glass backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-600">
          Поиск доказательств
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Выберите демонстрационный сценарий анализа
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Сейчас страница подключает сценарий к состоянию результата. Подробные блоки
          доказательств будут добавлены отдельным шагом.
        </p>
      </section>

      <DemoScenarioButtons
        scenarios={demoScenarios}
        activeScenarioId={activeScenarioId}
        onSelect={handleScenarioSelect}
        disabled={isLoading}
      />

      <section className="rounded-xl border border-ice-100 bg-ice-50/70 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
              Состояние загрузки
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              {activeScenario?.title ?? "Сценарий не выбран"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activeScenario?.description ?? "Выберите один из доступных сценариев анализа."}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
              isLoading
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : result
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {isLoading ? "загрузка" : result ? "результат загружен" : "нет результата"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-white/80 bg-white/82 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Активный сценарий
            </p>
            <p className="mt-2 font-semibold text-slate-900">{activeScenarioId}</p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/82 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Загрузка
            </p>
            <p className="mt-2 font-semibold text-slate-900">{isLoading ? "идёт" : "нет"}</p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/82 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Результат
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {result ? "загружен в состояние" : "не загружен"}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  );
}
