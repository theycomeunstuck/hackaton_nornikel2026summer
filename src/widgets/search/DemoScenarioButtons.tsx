import type { DemoScenario, DemoScenarioId } from "../../shared/types/search";

type DemoScenarioWithQuery = DemoScenario & {
  query?: string;
};

type DemoScenarioButtonsProps = {
  scenarios: DemoScenario[];
  activeScenarioId?: DemoScenarioId;
  selectedScenarioId?: DemoScenarioId;
  onSelect: ((scenarioId: DemoScenarioId) => void) | ((scenario: DemoScenario) => void);
  disabled?: boolean;
};

function getShortQuery(scenario: DemoScenario): string {
  const scenarioWithQuery: DemoScenarioWithQuery = scenario;
  const query = scenarioWithQuery.query ?? scenario.defaultQuery;

  if (query.length <= 96) {
    return query;
  }

  return `${query.slice(0, 93)}...`;
}

export function DemoScenarioButtons({
  scenarios,
  activeScenarioId,
  selectedScenarioId,
  onSelect,
  disabled = false,
}: DemoScenarioButtonsProps) {
  const currentScenarioId = activeScenarioId ?? selectedScenarioId;

  const handleSelect = (scenario: DemoScenario) => {
    if (disabled) {
      return;
    }

    if (activeScenarioId !== undefined) {
      (onSelect as (scenarioId: DemoScenarioId) => void)(scenario.id);
      return;
    }

    (onSelect as (scenario: DemoScenario) => void)(scenario);
  };

  return (
    <section className="rounded-xl border border-white/75 bg-white/66 p-4 shadow-glass backdrop-blur-2xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
            Сценарии анализа
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            Выберите предметную область
          </h3>
        </div>
        <span className="rounded-full border border-ice-100 bg-ice-50 px-3 py-1 text-xs font-semibold text-ice-700">
          {scenarios.length} сценария
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {scenarios.map((scenario) => {
          const isActive = scenario.id === currentScenarioId;

          return (
            <button
              key={scenario.id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(scenario)}
              className={`group rounded-xl border p-4 text-left transition duration-200 ${
                isActive
                  ? "border-ice-300 bg-ice-50 text-slate-950 shadow-[0_14px_34px_rgba(14,165,233,0.16)]"
                  : "border-slate-200 bg-white/78 text-slate-700 hover:border-ice-200 hover:bg-white hover:shadow-sm"
              } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold">{scenario.title}</span>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${
                    isActive ? "bg-ice-500 shadow-[0_0_18px_rgba(14,165,233,0.75)]" : "bg-slate-300"
                  }`}
                />
              </div>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                {scenario.description}
              </span>
              <span className="mt-3 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 group-hover:border-ice-100 group-hover:bg-ice-50/70">
                {getShortQuery(scenario)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
