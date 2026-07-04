import { buildEvidenceReportMarkdown } from "../../shared/lib/exportEvidenceReport";
import type { DemoScenarioId, SearchResult } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type ExportPanelProps = {
  result: SearchResult | null;
  scenarioId?: DemoScenarioId;
};

function createMarkdownFilename(scenarioId?: DemoScenarioId): string {
  const date = new Date().toISOString().slice(0, 10);
  const scenarioPart = scenarioId ? String(scenarioId).replace(/[^a-zA-Z0-9_-]/g, "-") : "search-result";

  return `evidence-report-${scenarioPart}-${date}.md`;
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ result, scenarioId }: ExportPanelProps) {
  const isDisabled = result === null;

  const handleExportMarkdown = () => {
    if (!result) {
      return;
    }

    downloadMarkdown(createMarkdownFilename(scenarioId), buildEvidenceReportMarkdown(result));
  };

  return (
    <SectionCard title="Экспорт отчёта" eyebrow="Markdown">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-ice-100 bg-ice-50/70 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">Скачать текущий результат анализа</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Отчёт включает разбор запроса, краткий вывод, доказательства, источники,
            противоречия и пробелы.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportMarkdown}
          disabled={isDisabled}
          className="shrink-0 rounded-lg border border-ice-300 bg-ice-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ice-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Скачать Markdown
        </button>
      </div>
    </SectionCard>
  );
}
