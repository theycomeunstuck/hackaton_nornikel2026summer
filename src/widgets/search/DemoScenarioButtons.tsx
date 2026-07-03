import type { DemoScenario } from "../../shared/types/search";

type DemoScenarioButtonsProps = {
  scenarios: DemoScenario[];
  selectedScenarioId: string;
  onSelect: (scenario: DemoScenario) => void;
};

export function DemoScenarioButtons({
  scenarios,
  selectedScenarioId,
  onSelect,
}: DemoScenarioButtonsProps) {
  return (
    <section className="rounded border border-white/75 bg-white/66 p-4 shadow-glass backdrop-blur-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Demo scenarios
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onSelect(scenario)}
              className={`rounded border p-4 text-left transition ${
                isSelected
                  ? "border-ice-300 bg-ice-50 text-slate-950 shadow-sm"
                  : "border-slate-200 bg-white/72 text-slate-700 hover:border-ice-200 hover:bg-white"
              }`}
            >
              <span className="text-sm font-semibold">{scenario.title}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                {scenario.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
