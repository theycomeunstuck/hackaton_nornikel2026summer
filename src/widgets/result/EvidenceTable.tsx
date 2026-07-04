import { useState } from "react";
import type { Condition, EvidenceItem, SourceType } from "../../shared/types/search";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type EvidenceTableProps = {
  evidence: EvidenceItem[];
};

type EvidenceItemWithRagFields = EvidenceItem & {
  score?: number;
  numericStatus?: string;
  matchedTerms?: string[];
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "публикация",
  internal_report: "внутренний отчёт",
  patent: "патент",
  experiment_protocol: "эксперимент",
  technical_standard: "стандарт",
  reference_book: "справочник",
};

function formatCondition(condition: Condition): string {
  if (condition.rawValue && condition.rawValue.trim().length > 0) {
    return condition.rawValue;
  }

  if (condition.operator === "range") {
    const min = condition.min ?? condition.minValue;
    const max = condition.max ?? condition.maxValue;

    if (min !== undefined && max !== undefined) {
      return `${condition.name ?? condition.parameter}: ${min}-${max} ${condition.unit}`;
    }
  }

  if (condition.value !== undefined) {
    return `${condition.name ?? condition.parameter}: ${condition.value} ${condition.unit}`;
  }

  return condition.note ?? condition.name ?? condition.parameter;
}

function formatSourceName(item: EvidenceItem): string {
  return item.sourceRef.sourceName ?? item.sourceRef.documentTitle;
}

function formatScore(item: EvidenceItem): string {
  const score = (item as EvidenceItemWithRagFields).score;

  return typeof score === "number" ? score.toFixed(4) : "—";
}

function getNumericStatus(item: EvidenceItem): string | undefined {
  const numericStatus = (item as EvidenceItemWithRagFields).numericStatus;

  return typeof numericStatus === "string" && numericStatus.length > 0
    ? numericStatus
    : undefined;
}

function getMatchedTerms(item: EvidenceItem): string[] {
  return (item as EvidenceItemWithRagFields).matchedTerms ?? [];
}

function getGeography(item: EvidenceItem): string {
  return item.geography ?? item.sourceRef.geography ?? "—";
}

function ChipList({
  items,
  emptyLabel = "—",
  tone = "ice",
}: {
  items: string[];
  emptyLabel?: string;
  tone?: "ice" | "slate";
}) {
  if (items.length === 0) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  const className =
    tone === "ice"
      ? "border-ice-100 bg-ice-50 text-ice-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="flex max-w-[300px] flex-wrap gap-1.5">
      {items.slice(0, 6).map((item) => (
        <span
          key={item}
          className={`max-w-full rounded-full border px-2.5 py-1 text-xs leading-5 ${className}`}
          title={item}
        >
          <span className="line-clamp-1">{item}</span>
        </span>
      ))}
      {items.length > 6 ? (
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
          +{items.length - 6}
        </span>
      ) : null}
    </div>
  );
}

function EvidenceDetailsModal({
  item,
  onClose,
}: {
  item: EvidenceItem;
  onClose: () => void;
}) {
  const conditions = item.conditions.map(formatCondition);
  const matchedTerms = getMatchedTerms(item);
  const numericStatus = getNumericStatus(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-950/55 px-8 py-8 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-5 border-b border-slate-200 bg-ice-50/70 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
              Полный фрагмент доказательства
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              {formatSourceName(item)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-ice-200 hover:bg-ice-50 focus:outline-none focus:ring-4 focus:ring-ice-100"
          >
            Закрыть
          </button>
        </div>

        <div className="max-h-[calc(88vh-96px)] overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceBadge confidence={item.confidence} />
            {numericStatus ? (
              <span className="rounded border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ice-700">
                {numericStatus}
              </span>
            ) : null}
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              стр. {item.sourceRef.page}
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {item.year}
            </span>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {item.statement}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Условия
              </p>
              <div className="mt-3">
                <ChipList items={conditions} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Найденные термины
              </p>
              <div className="mt-3">
                <ChipList items={matchedTerms} tone="slate" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-ice-100 bg-ice-50/70 p-4 md:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ice-600">
                Источник
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatSourceName(item)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ice-600">
                Страница
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{item.sourceRef.page}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ice-600">
                Год
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{item.year}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ice-600">
                Тип
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {sourceTypeLabel[item.sourceRef.sourceType]}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ice-600">
                География
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{getGeography(item)}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function EvidenceTable({ evidence }: EvidenceTableProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  return (
    <SectionCard
      title="Таблица доказательств"
      eyebrow="Фрагменты и источники"
      className="border-ice-100 bg-white/82"
    >
      {evidence.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Фрагменты доказательств не найдены
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Выберите другой сценарий анализа или уточните запрос.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full table-fixed border-collapse text-left text-sm">
              <thead className="bg-graphite-900 text-xs uppercase tracking-[0.12em] text-slate-200">
                <tr>
                  <th className="w-[28%] px-4 py-3">Фрагмент</th>
                  <th className="w-[14%] px-4 py-3">Условия</th>
                  <th className="w-[14%] px-4 py-3">Термины</th>
                  <th className="w-[16%] px-4 py-3">Источник</th>
                  <th className="w-[5%] px-4 py-3">Стр.</th>
                  <th className="w-[10%] px-4 py-3">Достоверность</th>
                  <th className="w-[5%] px-4 py-3">Год</th>
                  <th className="w-[8%] px-4 py-3">Тип</th>
                  <th className="w-[8%] px-4 py-3">География</th>
                  <th className="w-[7%] px-4 py-3">Оценка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evidence.map((item) => {
                  const conditions = item.conditions.map(formatCondition);
                  const matchedTerms = getMatchedTerms(item);
                  const numericStatus = getNumericStatus(item);

                  return (
                    <tr key={item.id} className="align-top transition hover:bg-ice-50/45">
                      <td className="px-4 py-4">
                        <p
                          className="line-clamp-4 max-w-[460px] text-sm leading-6 text-slate-900"
                          title={item.statement}
                        >
                          {item.statement}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedEvidence(item)}
                          className="mt-2 text-xs font-semibold text-ice-700 transition hover:text-ice-900 focus:outline-none focus:ring-4 focus:ring-ice-100"
                        >
                          Показать полностью
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <ChipList items={conditions} />
                      </td>
                      <td className="px-4 py-4">
                        <ChipList items={matchedTerms} tone="slate" />
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="line-clamp-2 font-medium leading-5 text-slate-800"
                          title={formatSourceName(item)}
                        >
                          {formatSourceName(item)}
                        </span>
                        {item.sourceRef.chunkId ? (
                          <span className="mt-1 block text-xs text-slate-500">
                            {item.sourceRef.chunkId}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{item.sourceRef.page}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <ConfidenceBadge confidence={item.confidence} />
                          {numericStatus ? (
                            <span className="inline-flex rounded-full border border-ice-100 bg-ice-50 px-2 py-0.5 text-[11px] font-semibold text-ice-700">
                              {numericStatus}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{item.year}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {sourceTypeLabel[item.sourceRef.sourceType]}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{getGeography(item)}</td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600">
                        {formatScore(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEvidence ? (
        <EvidenceDetailsModal
          item={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      ) : null}
    </SectionCard>
  );
}
