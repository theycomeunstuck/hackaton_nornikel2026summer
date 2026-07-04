import type { SourceRef, SourceType } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type SourcesPanelProps = {
  sources: SourceRef[];
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "публикация",
  internal_report: "внутренний отчёт",
  patent: "патент",
  experiment_protocol: "эксперимент",
  technical_standard: "стандарт",
  reference_book: "справочник",
};

function getSourceKey(source: SourceRef): string {
  return [
    source.sourceId,
    source.documentId ?? "",
    source.sourceName ?? source.documentTitle,
    source.chunkId,
    source.page,
  ].join(":");
}

function getSourceName(source: SourceRef): string {
  return source.sourceName ?? source.documentTitle;
}

function deduplicateAndSortSources(sources: SourceRef[]): SourceRef[] {
  const uniqueSources = new Map<string, SourceRef>();

  sources.forEach((source) => {
    const key = getSourceKey(source);

    if (!uniqueSources.has(key)) {
      uniqueSources.set(key, source);
    }
  });

  return Array.from(uniqueSources.values()).sort((sourceA, sourceB) => {
    const nameCompare = getSourceName(sourceA).localeCompare(getSourceName(sourceB), "ru");

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return sourceB.year - sourceA.year;
  });
}

function DetailItem({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value ?? "—"}
      </p>
    </div>
  );
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  const sortedSources = deduplicateAndSortSources(sources);

  return (
    <SectionCard title="Источники" eyebrow="Ссылки на документы и фрагменты">
      {sortedSources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700">Источники пока не найдены</p>
          <p className="mt-2 text-sm text-slate-500">
            Для текущего результата нет ссылок на документы и фрагменты.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {sortedSources.map((source) => (
            <article
              key={getSourceKey(source)}
              className="rounded-xl border border-slate-200 bg-white/88 p-4 shadow-sm transition hover:border-ice-200 hover:bg-ice-50/35"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950"
                    title={getSourceName(source)}
                  >
                    {getSourceName(source)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-ice-700">
                    {sourceTypeLabel[source.sourceType]} · {source.year}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  стр. {source.page}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <DetailItem label="Source name" value={getSourceName(source)} />
                <DetailItem label="Document ID" value={source.documentId} />
                <DetailItem label="Chunk ID" value={source.chunkId} />
                <DetailItem label="Страница" value={source.page} />
                <DetailItem label="Раздел" value={source.sectionTitle ?? source.section} />
                <DetailItem label="Тип источника" value={sourceTypeLabel[source.sourceType]} />
                <DetailItem label="Год" value={source.year} />
                <DetailItem label="География" value={source.geography} />
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
