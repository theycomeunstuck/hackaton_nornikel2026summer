import type { Condition, Effect, EvidenceClaim } from "../../entities/claim/types";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type EvidenceTableProps = {
  claims: EvidenceClaim[];
};

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

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "—";
}

export function EvidenceTable({ claims }: EvidenceTableProps) {
  return (
    <SectionCard title="Таблица доказательств" eyebrow="Evidence table" className="border-ice-100 bg-white/82">
      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-graphite-900 text-xs uppercase tracking-[0.12em] text-slate-200">
            <tr>
              <th className="w-[24%] px-4 py-3">Claim / утверждение</th>
              <th className="w-[10%] px-4 py-3">Material</th>
              <th className="w-[10%] px-4 py-3">Process</th>
              <th className="w-[10%] px-4 py-3">Technology</th>
              <th className="w-[13%] px-4 py-3">Conditions</th>
              <th className="w-[12%] px-4 py-3">Effect</th>
              <th className="w-[11%] px-4 py-3">Source</th>
              <th className="w-[5%] px-4 py-3">Page</th>
              <th className="w-[8%] px-4 py-3">Confidence</th>
              <th className="w-[5%] px-4 py-3">Year</th>
              <th className="w-[8%] px-4 py-3">Geography</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {claims.length > 0 ? (
              claims.map((claim) => (
                <tr key={claim.id} className="align-top transition hover:bg-ice-50/45">
                  <td className="px-4 py-4 leading-6 text-slate-900">{claim.statement}</td>
                  <td className="px-4 py-4 text-slate-600">{formatList(claim.materials)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatList(claim.processes)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatList(claim.equipment)}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {claim.conditions.length > 0
                      ? claim.conditions.map(formatCondition).join("; ")
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {claim.effects.length > 0 ? claim.effects.map(formatEffect).join("; ") : "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <span className="font-medium text-slate-800">{claim.sourceRef.documentTitle}</span>
                    <span className="mt-1 block text-xs text-slate-500">{claim.sourceRef.chunkId}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{claim.sourceRef.page}</td>
                  <td className="px-4 py-4">
                    <ConfidenceBadge confidence={claim.confidence} />
                  </td>
                  <td className="px-4 py-4 text-slate-600">{claim.year}</td>
                  <td className="px-4 py-4 text-slate-500">Не указана</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-sm text-slate-500">
                  По текущим фильтрам claims не найдены.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
