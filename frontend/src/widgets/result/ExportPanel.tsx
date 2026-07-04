import { useState } from "react";
import {
  exportReport,
  openReport,
  type ExportReportFormat,
} from "../../shared/api/appApi";
import { downloadFile } from "../../shared/lib/downloadFile";
import { buildEvidenceReportMarkdown } from "../../shared/lib/exportEvidenceReport";
import type { DemoScenarioId, SearchResult } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type ExportPanelProps = {
  result: SearchResult | null;
  scenarioId?: DemoScenarioId;
  lastQueryText?: string;
};

function createReportFilename(
  scenarioId: DemoScenarioId | undefined,
  format: Exclude<ExportReportFormat, "pdf">,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const scenarioPart = scenarioId ? String(scenarioId).replace(/[^a-zA-Z0-9_-]/g, "-") : "search-result";
  const extension = format === "markdown" ? "md" : "json";

  return `evidence-report-${scenarioPart}-${date}.${extension}`;
}

function buildLocalJsonExport(
  result: SearchResult,
  scenarioId: DemoScenarioId | undefined,
  lastQueryText: string,
): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      query: lastQueryText,
      scenarioId,
      result,
    },
    null,
    2,
  );
}

function downloadLocalReport(
  result: SearchResult,
  scenarioId: DemoScenarioId | undefined,
  lastQueryText: string,
  format: Exclude<ExportReportFormat, "pdf">,
): void {
  if (format === "markdown") {
    downloadFile({
      filename: createReportFilename(scenarioId, format),
      content: buildEvidenceReportMarkdown(result),
      contentType: "text/markdown;charset=utf-8",
    });
    return;
  }

  downloadFile({
    filename: createReportFilename(scenarioId, format),
    content: buildLocalJsonExport(result, scenarioId, lastQueryText),
    contentType: "application/json;charset=utf-8",
  });
}

export function ExportPanel({ result, scenarioId, lastQueryText = "" }: ExportPanelProps) {
  const [pendingFormat, setPendingFormat] = useState<ExportReportFormat | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDisabled = result === null || pendingFormat !== null;

  const handleExport = (format: Exclude<ExportReportFormat, "pdf">) => {
    if (!result) {
      return;
    }

    setPendingFormat(format);
    setStatusMessage(null);
    setErrorMessage(null);

    exportReport({
      title: result.title,
      format,
      queryId: lastQueryText || result.parsedQuery.originalText || result.id,
      includeGraph: true,
      includeSources: true,
      includeContradictions: true,
      includeGaps: true,
    })
      .then((response) => {
        if (response.downloadUrl) {
          openReport(response.downloadUrl);
          setStatusMessage("Отчёт сформирован backend и открыт для скачивания.");
          return;
        }

        downloadLocalReport(result, scenarioId, lastQueryText, format);
        setStatusMessage("Backend не вернул ссылку на скачивание, выполнен локальный экспорт.");
      })
      .catch(() => {
        downloadLocalReport(result, scenarioId, lastQueryText, format);
        setErrorMessage("Backend export недоступен, выполнен локальный экспорт.");
      })
      .finally(() => {
        setPendingFormat(null);
      });
  };

  return (
    <SectionCard title="Экспорт отчёта" eyebrow="Report export">
      <div className="rounded-xl border border-ice-100 bg-ice-50/70 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Сформировать отчёт по текущему результату анализа
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Backend получает текущий текст запроса как queryId, заново формирует отчёт и
              возвращает ссылку на скачивание. Если backend недоступен, Markdown и JSON
              сохраняются локально.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => handleExport("markdown")}
              disabled={isDisabled}
              className="rounded-lg border border-ice-300 bg-ice-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ice-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {pendingFormat === "markdown" ? "Экспорт..." : "Markdown"}
            </button>
            <button
              type="button"
              onClick={() => handleExport("json")}
              disabled={isDisabled}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-ice-200 hover:text-ice-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {pendingFormat === "json" ? "Экспорт..." : "JSON"}
            </button>
            <button
              type="button"
              disabled
              title="PDF сейчас работает как backend beta-заглушка"
              className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
            >
              PDF beta
            </button>
          </div>
        </div>

        {!result ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-500">
            Сначала выполните поиск доказательств.
          </p>
        ) : null}

        {statusMessage ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {statusMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}
