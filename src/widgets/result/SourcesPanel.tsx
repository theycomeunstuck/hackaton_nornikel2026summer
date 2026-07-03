import type { EvidenceClaim } from "../../entities/claim/types";
import type { SourceMetadata, SourceType } from "../../entities/source/types";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type SourcesPanelProps = {
  sources: SourceMetadata[];
  claims: EvidenceClaim[];
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Научная статья",
  internal_report: "Внутренний отчет",
  patent: "Патент",
  experiment_protocol: "Протокол эксперимента",
  technical_standard: "Технический стандарт",
  reference_book: "Справочник",
};

export function SourcesPanel({ sources, claims }: SourcesPanelProps) {
  return (
    <SectionCard title="Источники" eyebrow="Ссылки на доказательства">
      <div className="space-y-3">
        {sources.map((source) => {
          const refs = claims
            .filter((claim) => claim.sourceRef.sourceId === source.id)
            .map((claim) => claim.sourceRef);

          return (
            <details key={source.id} className="rounded border border-slate-200 bg-white px-4 py-3">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold leading-6 text-slate-950">{source.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {sourceTypeLabel[source.sourceType]} / {source.year} / География: не указана
                    </p>
                  </div>
                  <ConfidenceBadge confidence={source.reliability} />
                </div>
              </summary>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Страницы и фрагменты
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {refs.length > 0 ? (
                    refs.map((ref) => (
                      <span key={`${ref.page}-${ref.chunkId}`} className="rounded border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs text-ice-600">
                        стр. {ref.page} / {ref.chunkId}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">После фильтрации активных ссылок нет.</span>
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </SectionCard>
  );
}
