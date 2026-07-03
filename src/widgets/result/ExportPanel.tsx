import { useState } from "react";
import type { SearchResult } from "../../shared/types/search";
import { downloadFile } from "../../shared/lib/downloadFile";
import {
  buildJsonReport,
  buildMarkdownReport,
  createReportFilename,
} from "../../shared/lib/exportMarkdown";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

type ExportPanelProps = {
  query: string;
  result: SearchResult | null;
  scenarioTitle?: string;
};

type ExportStatus = {
  tone: "success" | "warning";
  message: string;
};

export function ExportPanel({ query, result, scenarioTitle }: ExportPanelProps) {
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const isDisabled = !result;

  const handleMarkdownDownload = () => {
    if (!result) {
      setStatus({ tone: "warning", message: "Нет выбранного результата для экспорта." });
      return;
    }

    const generatedAt = new Date().toISOString();
    const markdown = buildMarkdownReport({ query, result, scenarioTitle, generatedAt });

    downloadFile({
      filename: createReportFilename(result.title, "md"),
      content: markdown,
      contentType: "text/markdown;charset=utf-8",
    });
    setStatus({ tone: "success", message: "Markdown report скачан." });
  };

  const handleJsonDownload = () => {
    if (!result) {
      setStatus({ tone: "warning", message: "Нет выбранного результата для экспорта." });
      return;
    }

    const generatedAt = new Date().toISOString();
    const json = buildJsonReport({ query, result, scenarioTitle, generatedAt });

    downloadFile({
      filename: createReportFilename(result.title, "json"),
      content: json,
      contentType: "application/json;charset=utf-8",
    });
    setStatus({ tone: "success", message: "JSON report скачан." });
  };

  return (
    <SectionCard title="Экспорт отчёта" eyebrow="Export report">
      <div className="rounded border border-ice-100 bg-ice-50/70 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Evidence report по текущему результату
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Экспорт включает исходный запрос, parsed query, краткий вывод,
              confidence, evidence table, источники, противоречия, gaps и summary
              графа.
            </p>
          </div>
          <StatusBadge label={result ? "ready" : "empty"} tone={result ? "success" : "warning"} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleMarkdownDownload}
          disabled={isDisabled}
          className="rounded border border-ice-100 bg-ice-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-ice-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Скачать Markdown
        </button>
        <button
          type="button"
          onClick={handleJsonDownload}
          disabled={isDisabled}
          className="rounded border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Скачать JSON
        </button>
        <button
          type="button"
          disabled
          className="rounded border border-slate-200 bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-400"
          title="PDF export will be connected through backend"
        >
          PDF через backend
        </button>
      </div>

      <div className="mt-4 rounded border border-slate-200 bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Current export context
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {result
            ? `${scenarioTitle ?? result.title}: ${result.evidence.length} claims, ${result.sources.length} sources, ${result.contradictions.length} contradictions, ${result.gaps.length} gaps.`
            : "Выберите SearchResult для экспорта."}
        </p>
      </div>

      {status ? (
        <div className="mt-3">
          <StatusBadge label={status.message} tone={status.tone} />
        </div>
      ) : null}
    </SectionCard>
  );
}
