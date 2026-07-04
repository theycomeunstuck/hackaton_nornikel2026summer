"""Metadata + numeric filtering. Pure functions over SearchHit lists.

Numeric filtering has two sources, decided per-index:
  * STRUCTURED  — parameters.jsonl was indexed -> use it (claim-grade).
  * APPROXIMATE — no parameters -> re-parse numbers from the retrieved chunk
    text at query time (best-effort).

Hard rule (CLAUDE.md #5): NEVER silently drop a hit whose numbers we couldn't
parse. We only drop a hit that HAS a comparable condition that clearly does not
overlap the query. Unparseable hits are kept and marked ``numeric_status`` so the
answer/gaps can be honest about it.
"""
from __future__ import annotations

from ..contracts import Condition, SearchHit
from ..numeric import (condition_interval, extract_conditions,
                       intervals_overlap, same_unit)


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------
def apply_metadata_filters(hits: list[SearchHit], *, geography: str = "all",
                           time_range: dict | None = None,
                           source_types: list[str] | None = None) -> list[SearchHit]:
    """Filter by geography / year range / source_type. All optional. Chunks carry
    their own metadata (denormalized), so no document join is needed."""
    out = []
    for h in hits:
        if geography and geography not in ("all", "") and h.geography:
            if h.geography not in (geography, "mixed", "unknown"):
                continue
        if time_range and h.year is not None:
            lo, hi = time_range.get("from"), time_range.get("to")
            if lo is not None and h.year < lo:
                continue
            if hi is not None and h.year > hi:
                continue
        if source_types and h.source_type and h.source_type not in source_types:
            continue
        out.append(h)
    return out


# ---------------------------------------------------------------------------
# Numeric
# ---------------------------------------------------------------------------
def _conditions_from_params(rows: list[dict]) -> list[Condition]:
    return [Condition.from_param_row(r) for r in rows]


def hit_conditions(hit: SearchHit, params_by_chunk: dict[str, list[dict]]) -> tuple[list[Condition], str]:
    """Return (conditions, mode) for a hit. Structured if params exist for its
    chunk, else re-parsed from the chunk text."""
    rows = params_by_chunk.get(hit.chunk_id)
    if rows:
        return _conditions_from_params(rows), "structured"
    return extract_conditions(hit.text), "approximate"


def _matches_one(chunk_conds: list[Condition], q: Condition) -> str:
    """Return 'match' | 'conflict' | 'unknown' for a single query constraint."""
    qi = condition_interval(q)
    if qi is None:
        return "unknown"
    comparable = False
    for cc in chunk_conds:
        if not same_unit(cc.unit, q.unit):
            continue
        ci = condition_interval(cc)
        if ci is None:
            continue
        comparable = True
        if intervals_overlap(ci, qi):
            return "match"
    return "conflict" if comparable else "unknown"


def apply_numeric_filter(hits: list[SearchHit], query_conditions: list[Condition],
                         params_by_chunk: dict[str, list[dict]],
                         ) -> tuple[list[SearchHit], dict[str, str]]:
    """Keep hits that match or are unknown; drop only clear conflicts.

    Returns (kept_hits, status_by_chunk) where status is
    'structured'|'approximate'|'unmatched'|'none' per kept hit — used downstream
    for evidence tagging and honest warnings.
    """
    if not query_conditions:
        return hits, {h.chunk_id: "none" for h in hits}

    kept: list[SearchHit] = []
    status: dict[str, str] = {}
    for h in hits:
        conds, mode = hit_conditions(h, params_by_chunk)
        verdicts = [_matches_one(conds, q) for q in query_conditions]
        if "conflict" in verdicts and "match" not in verdicts:
            continue  # only drop on a clear, comparable conflict
        # kept
        if any(v == "match" for v in verdicts):
            status[h.chunk_id] = mode            # structured | approximate
        else:
            status[h.chunk_id] = "unmatched"     # kept, but couldn't confirm
        kept.append(h)
    return kept, status
