import type { SourceRef, SourceType } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type SourcesPanelProps = {
  sources: SourceRef[];
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Научная статья",
  internal_report: "Внутренний отчёт",
  patent: "Патент",
  experiment_protocol: "Протокол эксперимента",
  technical_standard: "Технический стандарт",
  reference_book: "Справочник",
};

function getSourceKey(source: SourceRef): string {
  return [
    source.sourceId,
    source.documentId ?? "",
    source.documentTitle,
    source.chunkId,
    source.page,
  ].join(":");
}

function deduplicateSources(sources: SourceRef[]): SourceRef[] {
  const uniqueSources = new Map<string, SourceRef>();

  sources.forEach((source) => {
    const key = getSourceKey(source);

    if (!uniqueSources.has(key)) {
      uniqueSources.set(key, source);
    }
  });

  return Array.from(uniqueSources.values());
}

function getSourceName(source: SourceRef): string {
  return source.sourceName ?? source.documentTitle;
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
  const uniqueSources = deduplicateSources(sources);

  return (
    <SectionCard title="Источники" eyebrow="Ссылки на фрагменты">
      {uniqueSources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700">Источники не найдены</p>
          <p className="mt-2 text-sm text-slate-500">
            Для выбранного результата пока нет ссылок на документы и фрагменты.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {uniqueSources.map((source) => (
            <article
              key={getSourceKey(source)}
              className="rounded-xl border border-slate-200 bg-white/88 p-4 shadow-sm transition hover:border-ice-200 hover:bg-ice-50/35"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">
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
                <DetailItem label="Document ID" value={source.documentId} />
                <DetailItem label="Chunk ID" value={source.chunkId} />
                <DetailItem label="География" value={source.geography} />
                <DetailItem label="Раздел" value={source.sectionTitle ?? source.section} />
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
