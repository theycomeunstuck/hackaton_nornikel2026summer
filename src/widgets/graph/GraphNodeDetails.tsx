import type { ConfidenceLevel } from "../../entities/source/types";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";

export type GraphNodeDetailsData = {
  id: string;
  label: string;
  type: string;
  confidence?: ConfidenceLevel;
  description?: string;
  relatedIds?: string[];
  metadata?: Record<string, string | number | boolean>;
};

type GraphNodeDetailsProps = {
  node: GraphNodeDetailsData | null;
};

export function GraphNodeDetails({ node }: GraphNodeDetailsProps) {
  if (!node) {
    return (
      <aside className="rounded border border-slate-200 bg-white/85 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Node details
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Выберите узел графа, чтобы увидеть тип, confidence, описание и связанные
          идентификаторы.
        </p>
      </aside>
    );
  }

  const metadataEntries = Object.entries(node.metadata ?? {});

  return (
    <aside className="rounded border border-ice-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
        Node details
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-6 text-slate-950">{node.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {node.type}
          </p>
        </div>
        {node.confidence ? <ConfidenceBadge confidence={node.confidence} /> : null}
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">ID</dt>
          <dd className="mt-1 break-all text-slate-700">{node.id}</dd>
        </div>

        {node.description ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Description
            </dt>
            <dd className="mt-1 leading-6 text-slate-700">{node.description}</dd>
          </div>
        ) : null}

        {node.relatedIds && node.relatedIds.length > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Related IDs
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {node.relatedIds.map((relatedId) => (
                <span key={relatedId} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  {relatedId}
                </span>
              ))}
            </dd>
          </div>
        ) : null}

        {metadataEntries.length > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Metadata
            </dt>
            <dd className="mt-2 space-y-1">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3 text-xs">
                  <span className="text-slate-500">{key}</span>
                  <span className="text-right font-medium text-slate-700">{String(value)}</span>
                </div>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
