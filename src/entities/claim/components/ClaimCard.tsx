import { useId, useState } from "react";
import type { Condition, Effect } from "../types";
import type { SourceType } from "../../source/types";
import type { ClaimMemoryItem } from "../../../shared/lib/claimStats";
import { ConfidenceBadge } from "../../../shared/ui/ConfidenceBadge";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { ClaimStatusBadge } from "./ClaimStatusBadge";

type ClaimCardProps = {
  item: ClaimMemoryItem;
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Научная статья",
  internal_report: "Внутренний отчёт",
  patent: "Патент",
  experiment_protocol: "Протокол эксперимента",
  technical_standard: "Технический стандарт",
  reference_book: "Справочник",
};

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "не указано";
}

function formatCondition(condition: Condition): string {
  if (condition.operator === "range") {
    return `${condition.parameter}: ${condition.minValue}-${condition.maxValue} ${condition.unit}`;
  }

  if (condition.value !== undefined) {
    const operatorLabel: Record<Condition["operator"], string> = {
      equals: "=",
      less_than: "<",
      less_than_or_equal: "<=",
      greater_than: ">",
      greater_than_or_equal: ">=",
      range: "",
      approximately: "~",
    };

    return `${condition.parameter}: ${operatorLabel[condition.operator]} ${condition.value} ${condition.unit}`;
  }

  return condition.note ? `${condition.parameter}: ${condition.note}` : `${condition.parameter}: ${condition.unit}`;
}

function formatEffect(effect: Effect): string {
  return `${effect.target}: ${effect.description}`;
}

export function ClaimCard({ item }: ClaimCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();

  return (
    <article className="rounded-xl border border-slate-200 bg-white/86 shadow-sm motion-ui-transition hover:border-ice-100 hover:shadow-glass">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-controls={detailsId}
        className="block w-full rounded-xl p-5 text-left outline-none motion-ui-transition hover:bg-ice-50/30 focus-visible:ring-4 focus-visible:ring-ice-100"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ClaimStatusBadge status={item.status} />
              <ConfidenceBadge confidence={item.claim.confidence} />
              {item.relatedContradictions.length > 0 ? (
                <StatusBadge label="противоречие" tone="danger" />
              ) : null}
              {item.relatedGaps.length > 0 ? <StatusBadge label="пробел" tone="warning" /> : null}
            </div>
            <h3 className="mt-3 text-base font-semibold leading-7 text-slate-950">
              {item.claim.statement}
            </h3>
            <p className="mt-2 text-sm text-slate-500">{item.scenarioTitle}</p>
          </div>
          <div className="min-w-44 rounded-xl border border-ice-100 bg-ice-50 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ice-600">
              Источник
            </p>
            <p className="mt-2 font-semibold leading-5 text-slate-900">
              стр. {item.claim.sourceRef.page} / {item.claim.year}
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.claim.sourceRef.chunkId}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Материалы
            </p>
            <p className="mt-1 text-slate-700">{formatList(item.claim.materials)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Процесс
            </p>
            <p className="mt-1 text-slate-700">{formatList(item.claim.processes)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Оборудование
            </p>
            <p className="mt-1 text-slate-700">{formatList(item.claim.equipment)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Поддержка
            </p>
            <p className="mt-1 text-slate-700">{item.supportingSourcesCount} ист.</p>
          </div>
          <div className="flex items-end justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-ice-100 bg-ice-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ice-700">
              {isOpen ? "Свернуть" : "Подробнее"}
              <span
                className="motion-chevron block h-2 w-2 border-b-2 border-r-2 border-current"
                style={{ transform: isOpen ? "rotate(-135deg)" : "rotate(45deg)" }}
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </button>

      <div
        id={detailsId}
        className={`motion-collapsible-grid ${isOpen ? "motion-collapsible-grid-open" : ""}`}
      >
        <div className="motion-collapsible-inner">
          <div
            className={`border-t border-slate-200 px-5 py-5 motion-ui-transition ${
              isOpen
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-1 opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isOpen}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Полное утверждение
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.claim.statement}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Условия
                    </p>
                    <div className="mt-3 space-y-2">
                      {item.relatedConditions.length > 0 ? (
                        item.relatedConditions.map((condition) => (
                          <div
                            key={condition.id}
                            className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                          >
                            {formatCondition(condition)}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Не указаны</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Эффекты
                    </p>
                    <div className="mt-3 space-y-2">
                      {item.relatedEffects.length > 0 ? (
                        item.relatedEffects.map((effect) => (
                          <div
                            key={effect.id}
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                          >
                            {formatEffect(effect)}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Не указаны</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Связанные отношения графа
                  </p>
                  <div className="mt-3 space-y-2">
                    {item.relatedGraphRelations.length > 0 ? (
                      item.relatedGraphRelations.map((relation) => (
                        <div
                          key={relation.id}
                          className="grid grid-cols-[1fr_130px_1fr] items-center gap-3 text-xs text-slate-600"
                        >
                          <span className="truncate">{relation.source}</span>
                          <span className="rounded-full border border-ice-100 bg-ice-50 px-2 py-1 text-center font-semibold text-ice-600">
                            {relation.label}
                          </span>
                          <span className="truncate text-right">{relation.target}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        Связи графа для утверждения не найдены.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-ice-100 bg-ice-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ice-600">
                    Ссылка на источник
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                    {item.claim.sourceRef.documentTitle}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {sourceTypeLabel[item.claim.sourceRef.sourceType]} / стр.{" "}
                    {item.claim.sourceRef.page} / {item.claim.sourceRef.chunkId}
                  </p>
                  {item.relatedSource ? (
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Авторы: {item.relatedSource.authors.join(", ")}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
                    Контекст проверки
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {item.relatedContradictions.length > 0
                      ? item.relatedContradictions
                          .map((contradiction) => contradiction.title)
                          .join("; ")
                      : item.relatedGaps.length > 0
                        ? item.relatedGaps.map((gap) => gap.title).join("; ")
                        : "Дополнительная экспертная проверка не требуется по текущим связям."}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    <span className="font-semibold">Следующий шаг: </span>
                    {item.status === "confirmed"
                      ? "Можно использовать в доказательном отчёте с сохранением ссылки на источник."
                      : "Проверить условия эксперимента, источники и связанные пробелы перед использованием в отчёте."}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
