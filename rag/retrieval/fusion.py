"""Reciprocal Rank Fusion. Pure, deterministic.

Merges any number of ranked SearchHit lists into one ranking. RRF only uses
each item's RANK, so it works even with a single active channel today (it simply
reproduces that channel's order) and strengthens automatically when the vector
channel is switched on. Identity for fusion is ``SearchHit.chunk_id``.
"""
from __future__ import annotations

from ..contracts import SearchHit

RRF_K = 60


def rrf_merge(*ranked_lists: list[SearchHit], k: int = RRF_K,
              limit: int | None = None) -> list[SearchHit]:
    fused: dict[str, float] = {}
    best: dict[str, SearchHit] = {}
    for ranked in ranked_lists:
        for rank, hit in enumerate(ranked):
            fused[hit.chunk_id] = fused.get(hit.chunk_id, 0.0) + 1.0 / (k + rank + 1)
            # keep the hit carrying the most text/metadata for this chunk
            prev = best.get(hit.chunk_id)
            if prev is None or (len(hit.text) > len(prev.text)):
                best[hit.chunk_id] = hit

    out: list[SearchHit] = []
    for cid, score in fused.items():
        h = best[cid]
        out.append(SearchHit(
            chunk_id=cid, document_id=h.document_id, source_name=h.source_name,
            page=h.page, text=h.text, score=score, origin="rrf", year=h.year,
            source_type=h.source_type, geography=h.geography,
            section_title=h.section_title))
    out.sort(key=lambda s: (-s.score, s.chunk_id))
    return out[:limit] if limit else out
