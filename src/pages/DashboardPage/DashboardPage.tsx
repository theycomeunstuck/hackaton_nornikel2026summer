import { Link } from "react-router-dom";
import type { EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import { buildDashboardStats, type SourceDistributionItem } from "../../shared/lib/dashboardStats";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { MetricCard } from "../../shared/ui/MetricCard";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge, type StatusTone } from "../../shared/ui/StatusBadge";

const dashboardStats = buildDashboardStats();

function formatList(items: string[], limit = 3): string {
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
          <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
            <div
              className="h-full rounded bg-ice-500"
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
    <article className="rounded border border-slate-200 bg-white/86 p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm leading-6 text-slate-900">{claim.statement}</p>
        <ConfidenceBadge confidence={claim.confidence} />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1fr_180px] gap-3 text-xs text-slate-500">
        <div>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">
            Material
          </span>
          <p className="mt-1 text-slate-700">{formatList(claim.materials)}</p>
        </div>
        <div>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">
            Process
          </span>
          <p className="mt-1 text-slate-700">{formatList(claim.processes)}</p>
        </div>
        <div>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">
            Source
          </span>
          <p className="mt-1 text-slate-700">
            {claim.sourceRef.year}, p. {claim.sourceRef.page}
          </p>
        </div>
      </div>
    </article>
  );
}

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="overflow-hidden rounded border border-white/75 bg-white/76 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-8 p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ice-600">
              Научный клубок
            </p>
            <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-slate-950">
              Evidence-first dashboard для промышленного R&D корпуса
            </h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
              Система связывает научно-технические утверждения с источниками,
              условиями, графом связей, противоречиями и пробелами.
            </p>
            <div className="mt-6 inline-flex items-center rounded border border-ice-100 bg-graphite-900 px-5 py-4 text-sm font-semibold text-white shadow-sm">
              Нет источника — нет фактического утверждения.
            </div>
          </div>

          <div className="rounded border border-ice-100 bg-ice-50/75 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
              What expert sees first
            </p>
            <div className="mt-4 space-y-3">
              {[
                "что уже известно и подтверждено источниками",
                "какие условия и параметры влияют на вывод",
                "где есть противоречия и пробелы",
                "куда перейти для evidence search или graph review",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-2 w-2 rounded-full bg-ice-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-7 gap-4">
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

      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)] gap-6">
        <SectionCard title="Recent indexed claims" eyebrow="Evidence stream">
          <div className="space-y-3">
            {dashboardStats.recentClaims.map((claim) => (
              <RecentClaimItem key={claim.id} claim={claim} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Source coverage" eyebrow="Corpus coverage">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">By source type</h3>
              <div className="mt-4">
                <DistributionList items={dashboardStats.sourceTypeDistribution} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">By reliability</h3>
              <div className="mt-4">
                <DistributionList items={dashboardStats.sourceReliabilityDistribution} />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-950">Latest important sources</h3>
            <div className="mt-3 space-y-3">
              {dashboardStats.importantSources.map((source) => (
                <article key={source.id} className="rounded border border-slate-200 bg-white/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-5 text-slate-900">
                        {source.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {source.sourceType} / {source.year}
                      </p>
                    </div>
                    <ConfidenceBadge confidence={source.reliability} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <SectionCard title="High-priority gaps" eyebrow="Knowledge gaps">
          <div className="space-y-3">
            {dashboardStats.highPriorityGaps.map((gap) => (
              <article key={gap.id} className="rounded border border-amber-200 bg-amber-50/65 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{gap.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{gap.description}</p>
                  </div>
                  <StatusBadge label={gap.severity} tone={getGapTone(gap.severity)} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  <span className="font-semibold">Recommendation: </span>
                  {gap.recommendedAction}
                </p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Possible contradictions" eyebrow="Evidence conflicts">
          {dashboardStats.possibleContradictions.length > 0 ? (
            <div className="space-y-3">
              {dashboardStats.possibleContradictions.map((contradiction) => (
                <article
                  key={contradiction.id}
                  className="rounded border border-orange-200 bg-orange-50/65 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        {contradiction.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {contradiction.description}
                      </p>
                    </div>
                    <StatusBadge
                      label={contradiction.severity}
                      tone={getContradictionTone(contradiction.severity)}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {contradiction.sourceRefs.slice(0, 2).map((sourceRef, index) => (
                      <div key={sourceRef.chunkId} className="rounded border border-white/80 bg-white/80 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Source {index === 0 ? "A" : "B"}
                        </p>
                        <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
                          {sourceRef.documentTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          p. {sourceRef.page} / {sourceRef.year}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    <span className="font-semibold">Possible reason: </span>
                    {contradiction.resolutionHint}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              В текущем mock-корпусе явных противоречий нет.
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Demo scenarios overview" eyebrow="MVP scenarios">
        <div className="grid grid-cols-3 gap-4">
          {dashboardStats.scenarioOverviews.map((scenario) => (
            <article key={scenario.id} className="rounded border border-slate-200 bg-white/84 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">{scenario.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.description}</p>
                </div>
                {scenario.contradictionsCount > 0 ? (
                  <StatusBadge label="conflict" tone="warning" />
                ) : scenario.gapsCount > 0 ? (
                  <StatusBadge label="gap" tone="warning" />
                ) : (
                  <StatusBadge label="stable" tone="success" />
                )}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded bg-slate-50 px-2 py-3">
                  <p className="text-lg font-semibold text-slate-950">{scenario.claimsCount}</p>
                  <p className="text-xs text-slate-500">claims</p>
                </div>
                <div className="rounded bg-slate-50 px-2 py-3">
                  <p className="text-lg font-semibold text-slate-950">{scenario.sourcesCount}</p>
                  <p className="text-xs text-slate-500">sources</p>
                </div>
                <div className="rounded bg-slate-50 px-2 py-3">
                  <p className="text-lg font-semibold text-slate-950">
                    {scenario.graphNodesCount}/{scenario.graphEdgesCount}
                  </p>
                  <p className="text-xs text-slate-500">graph</p>
                </div>
                <div className="rounded bg-slate-50 px-2 py-3">
                  <p className="text-lg font-semibold text-slate-950">
                    {scenario.gapsCount}/{scenario.contradictionsCount}
                  </p>
                  <p className="text-xs text-slate-500">gaps/conflicts</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <section className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 rounded border border-graphite-800 bg-graphite-900 p-5 text-white shadow-glass">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-300">
            Next expert workflow
          </p>
          <h2 className="mt-2 text-xl font-semibold">Перейти от обзора к проверке доказательств</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Откройте evidence workspace для claims и source references или граф связей
            для визуального разбора зависимостей.
          </p>
        </div>
        <Link
          to="/search"
          className="rounded border border-ice-300/30 bg-ice-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ice-600"
        >
          Перейти к поиску доказательств
        </Link>
        <Link
          to="/graph"
          className="rounded border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
        >
          Открыть граф знаний
        </Link>
      </section>
    </div>
  );
}
