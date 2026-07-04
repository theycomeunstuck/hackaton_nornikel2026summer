import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { SourceType } from "../../entities/source/types";
import {
  buildDashboardStats,
  type DashboardMetric,
  type SourceDistributionItem,
} from "../../shared/lib/dashboardStats";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { ContentContainer } from "../../shared/ui/ContentContainer";
import { DisclosureSection } from "../../shared/ui/DisclosureSection";
import { EvidencePageHeader } from "../../shared/ui/EvidencePageHeader";
import { MetricCard } from "../../shared/ui/MetricCard";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge, type StatusTone } from "../../shared/ui/StatusBadge";

const dashboardStats = buildDashboardStats();

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Научная статья",
  internal_report: "Внутренний отчёт",
  patent: "Патент",
  experiment_protocol: "Протокол эксперимента",
  technical_standard: "Технический стандарт",
  reference_book: "Справочник",
};

const totalSources = dashboardStats.sourceTypeDistribution.reduce(
  (sum, item) => sum + item.count,
  0,
);

const questionsForReview =
  dashboardStats.highPriorityGaps.length + dashboardStats.possibleContradictions.length;

const primaryMetrics: DashboardMetric[] = [
  {
    ...dashboardStats.metrics[0],
    label: "Индексированные документы",
    description: "Документы, уже попавшие в доказательный индекс.",
  },
  {
    ...dashboardStats.metrics[1],
    label: "Проверяемые утверждения",
    description: "Утверждения, связанные с источниками, условиями и достоверностью.",
  },
  {
    label: "Источники",
    value: String(totalSources),
    description: "Документы и публикации, на которые ссылаются проверяемые утверждения.",
    tone: "cyan",
  },
  {
    label: "Вопросы для проверки",
    value: String(questionsForReview),
    description: "Противоречия и пробелы, которые требуют внимания специалиста.",
    tone: questionsForReview > 0 ? "amber" : "green",
  },
];

function formatList(items: string[], limit = 2): string {
  if (items.length === 0) {
    return "не указано";
  }

  const visibleItems = items.slice(0, limit);
  const suffix = items.length > limit ? ` +${items.length - limit}` : "";
  return `${visibleItems.join(", ")}${suffix}`;
}

function getGapTone(severity: KnowledgeGap["severity"]): StatusTone {
  if (severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "neutral";
}

function getContradictionTone(severity: Contradiction["severity"]): StatusTone {
  if (severity === "critical") {
    return "danger";
  }

  if (severity === "moderate") {
    return "warning";
  }

  return "neutral";
}

function DistributionList({ items }: { items: SourceDistributionItem[] }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.count}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-ice-500"
              style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentClaimItem({ claim }: { claim: EvidenceClaim }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white/86 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm leading-6 text-slate-900">{claim.statement}</p>
        <ConfidenceBadge confidence={claim.confidence} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span>{formatList(claim.materials)}</span>
        <span>{formatList(claim.processes)}</span>
        <span>
          {claim.sourceRef.documentTitle}, стр. {claim.sourceRef.page}
        </span>
      </div>
    </article>
  );
}

function AttentionItem({
  title,
  description,
  badge,
  toneClassName,
}: {
  title: string;
  description: string;
  badge: ReactNode;
  toneClassName: string;
}) {
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${toneClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
        </div>
        {badge}
      </div>
    </article>
  );
}

function HeaderAside() {
  return (
    <div className="rounded-xl border border-ice-100 bg-ice-50/75 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
        Принцип работы
      </p>
      <p className="mt-3 text-xl font-semibold leading-7 text-slate-950">
        Каждый вывод должен иметь проверяемый источник.
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Панель помогает быстро понять, что уже подтверждено, какие данные требуют проверки и куда
        перейти для следующего действия.
      </p>
    </div>
  );
}

export function DashboardPage() {
  const firstGap = dashboardStats.highPriorityGaps[0];
  const firstContradiction = dashboardStats.possibleContradictions[0];
  const attentionItems = [
    firstGap
      ? {
          id: firstGap.id,
          title: firstGap.title,
          description: firstGap.description,
          badge: <StatusBadge label={firstGap.severity} tone={getGapTone(firstGap.severity)} />,
          toneClassName: "border-amber-200 bg-amber-50/65",
        }
      : null,
    firstContradiction
      ? {
          id: firstContradiction.id,
          title: firstContradiction.title,
          description: firstContradiction.description,
          badge: (
            <StatusBadge
              label={firstContradiction.severity}
              tone={getContradictionTone(firstContradiction.severity)}
            />
          ),
          toneClassName: "border-orange-200 bg-orange-50/65",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="R&D Evidence Hub"
        title="Панель проверки научно-технических утверждений"
        description="Выберите действие: найти доказательства, загрузить документ или открыть базу утверждений. Ниже показаны ключевые метрики, последняя активность и вопросы для экспертной проверки."
        aside={<HeaderAside />}
      />

      <section className="grid grid-cols-4 gap-4">
        {primaryMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            tone={metric.tone}
          />
        ))}
      </section>

      <section className="rounded-2xl border border-white/75 bg-white/72 p-5 shadow-glass backdrop-blur-2xl">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/search"
            className="rounded-xl border border-ice-400 bg-ice-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ice-600"
          >
            Найти доказательства
          </Link>
          <Link
            to="/upload"
            className="rounded-xl border border-ice-100 bg-ice-50 px-5 py-3 text-sm font-semibold text-ice-700 transition hover:border-ice-200 hover:bg-white"
          >
            Загрузить документ
          </Link>
          <Link
            to="/claims"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-ice-100 hover:text-ice-700"
          >
            Открыть базу утверждений
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] gap-6">
        <SectionCard title="Последняя активность" eyebrow="Короткий обзор">
          <div className="space-y-3">
            {dashboardStats.recentClaims.slice(0, 3).map((claim) => (
              <RecentClaimItem key={claim.id} claim={claim} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Требует внимания" eyebrow="Для экспертной проверки">
          {attentionItems.length > 0 ? (
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <AttentionItem
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  badge={item.badge}
                  toneClassName={item.toneClassName}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Критичных вопросов для проверки сейчас нет.
            </div>
          )}
        </SectionCard>
      </div>

      <DisclosureSection
        title="Подробная сводка"
        eyebrow="Расширенная аналитика"
        summary="Метрики, покрытие источников и рабочие направления скрыты ниже, чтобы не перегружать первый экран."
      >
        <div className="space-y-6">
          <section className="grid grid-cols-4 gap-4">
            {dashboardStats.metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                description={metric.description}
                tone={metric.tone}
              />
            ))}
          </section>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)] gap-6">
            <SectionCard title="Покрытие источников" eyebrow="Корпус документов">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">По типу источника</h3>
                  <div className="mt-4">
                    <DistributionList items={dashboardStats.sourceTypeDistribution} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">По надёжности</h3>
                  <div className="mt-4">
                    <DistributionList items={dashboardStats.sourceReliabilityDistribution} />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-950">Важные источники</h3>
                <div className="mt-3 space-y-3">
                  {dashboardStats.importantSources.map((source) => (
                    <article key={source.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold leading-5 text-slate-900">
                            {source.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {sourceTypeLabel[source.sourceType]} / {source.year}
                          </p>
                        </div>
                        <ConfidenceBadge confidence={source.reliability} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Остальные последние утверждения" eyebrow="Расширенный список">
              <div className="space-y-3">
                {dashboardStats.recentClaims.slice(3).map((claim) => (
                  <RecentClaimItem key={claim.id} claim={claim} />
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Сценарии анализа" eyebrow="Рабочие направления">
            <div className="grid grid-cols-3 gap-4">
              {dashboardStats.scenarioOverviews.map((scenario) => (
                <article key={scenario.id} className="rounded-xl border border-slate-200 bg-white/84 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{scenario.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.description}</p>
                    </div>
                    {scenario.contradictionsCount > 0 ? (
                      <StatusBadge label="конфликт" tone="warning" />
                    ) : scenario.gapsCount > 0 ? (
                      <StatusBadge label="пробел" tone="warning" />
                    ) : (
                      <StatusBadge label="стабильно" tone="success" />
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-semibold text-slate-950">{scenario.claimsCount}</p>
                      <p className="text-xs text-slate-500">утверждений</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-semibold text-slate-950">{scenario.sourcesCount}</p>
                      <p className="text-xs text-slate-500">источников</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-semibold text-slate-950">
                        {scenario.graphNodesCount}/{scenario.graphEdgesCount}
                      </p>
                      <p className="text-xs text-slate-500">узлы/связи</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-semibold text-slate-950">
                        {scenario.gapsCount}/{scenario.contradictionsCount}
                      </p>
                      <p className="text-xs text-slate-500">пробелы/конфликты</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </DisclosureSection>
    </ContentContainer>
  );
}
