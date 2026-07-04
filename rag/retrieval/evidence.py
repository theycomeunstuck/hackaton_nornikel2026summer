"""Evidence builder: curate ranked hits into the evidence table. Pure.

Rules:
  * 8–15 rows (configurable), diversified by document_id (avoid one doc dominating).
  * every row keeps its SourceRef (document_id, source_name, chunk_id, page).
  * attach numeric conditions (structured if available, else re-parsed).
  * deterministic confidence from source + numeric availability.
"""
from __future__ import annotations

from ..contracts import EvidenceItem, ParsedQuery, SearchHit
from ..normalize import normalize_term
from .filters import hit_conditions

_STRONG_SOURCES = {"internal_report", "experiment_protocol", "standard"}


def _confidence(has_conditions: bool, numeric_status: str, source_type: str,
                rank: int) -> str:
    if numeric_status == "structured":
        return "high"
    if has_conditions or source_type in _STRONG_SOURCES or numeric_status == "approximate":
        return "medium"
    if rank < 3:
        return "medium"
    return "low"


def _matched_terms(pq: ParsedQuery, text: str) -> list[str]:
    low = normalize_term(text)
    hits = [kw for kw in dict.fromkeys(pq.keywords) if kw in low]
    return hits[:8]


def build_evidence(hits: list[SearchHit], pq: ParsedQuery,
                   params_by_chunk: dict[str, list[dict]],
                   numeric_status: dict[str, str],
                   min_items: int = 8, max_items: int = 15,
                   per_doc: int = 2) -> list[EvidenceItem]:
    """Diversify by document, cap size, preserve sources."""
    def pick(cap: int) -> list[SearchHit]:
        seen: dict[str, int] = {}
        chosen = []
        for h in hits:
            n = seen.get(h.document_id, 0)
            if n >= cap:
                continue
            seen[h.document_id] = n + 1
            chosen.append(h)
            if len(chosen) >= max_items:
                break
        return chosen

    chosen = pick(per_doc)
    if len(chosen) < min(min_items, len(hits)):
        chosen = pick(max_items)   # relax diversity to reach the floor

    out: list[EvidenceItem] = []
    for rank, h in enumerate(chosen):
        conds, mode = hit_conditions(h, params_by_chunk)
        status = numeric_status.get(h.chunk_id, "none")
        conf = _confidence(bool(conds), status, h.source_type, rank)
        out.append(EvidenceItem(
            id=f"ev_{h.chunk_id}", text=h.text, score=h.score, confidence=conf,
            source=h.source(), conditions=conds,
            matched_terms=_matched_terms(pq, h.text),
            numeric_status=status if status != "none" else (mode if conds else "none")))
    return out
