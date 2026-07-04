"""Mode-B retrieval pipeline. One entry point: ``Engine.search`` / ``search``.

Wires the stages; each stage is separately tested. Deterministic given
(query, index, filters) because the vector channel is a no-op by default.

Design notes:
  * ``pq.geography`` / ``pq.time_range`` are parsed for display. Only EXPLICIT
    ``filters`` hard-filter by geography; time filtering also honors the natural
    "за последние N лет" from the query (users expect that to apply).
  * numeric_mode = "structured" if the index has parameters.jsonl and the query
    carries numeric constraints; "approximate" if it re-parses from chunks;
    "none" if the query has no numeric constraints.
"""
from __future__ import annotations

from ..analytics.contradictions import detect_contradictions
from ..analytics.gaps import detect_gaps
from ..answer.synthesize import synthesize_answer
from ..contracts import SearchResult, SourceRef
from ..graph.graph_build import build_graph
from ..index import Index
from ..loader import Entities, load_synonyms, resolve
from ..normalize import normalize_term
from .evidence import build_evidence
from .filters import apply_metadata_filters, apply_numeric_filter
from .fusion import rrf_merge
from .lexical import lexical_search
from .query_parser import parse_query
from .vector import NullVectorSearcher, VectorSearcher


def search(query: str, index: Index, entities: Entities, synonyms: dict | None = None,
           *, filters: dict | None = None, vector: VectorSearcher | None = None,
           top_k: int = 12, now_year: int = 2026) -> SearchResult:
    filters = filters or {}
    vector = vector if vector is not None else NullVectorSearcher()

    # 1. understand
    pq = parse_query(query, synonyms, entities, now_year=now_year)

    # 2. retrieval channels
    lex = lexical_search(index, pq, synonyms, k=max(top_k * 4, 40))
    ent = index.chunks_for_entities(pq.entity_ids, k=max(top_k * 2, 20))
    vec = vector.search(query, k=max(top_k * 4, 40))

    # 3. fuse (hybrid; RRF reproduces lexical order when other channels empty)
    fused = rrf_merge(lex, ent, vec, limit=max(top_k * 4, 40))

    # 4. metadata filters (explicit geography; time from query or filters)
    fused = apply_metadata_filters(
        fused, geography=filters.get("geography", "all"),
        time_range=filters.get("time_range") or pq.time_range,
        source_types=filters.get("source_types"))

    # 5. numeric filter (structured if params indexed, else re-parse; safe fallback)
    params_by_chunk = index.parameters_for_chunks([h.chunk_id for h in fused])
    kept, status = apply_numeric_filter(fused, pq.conditions, params_by_chunk)

    numeric_mode = ("none" if not pq.conditions
                    else "structured" if index.has_parameters() else "approximate")

    # 6. evidence table (source preserved)
    evidence = build_evidence(kept, pq, params_by_chunk, status,
                              min_items=8, max_items=15)[:top_k + 3]

    # 7. graph + analytics over the evidence
    ev_chunk_ids = [e.source.chunk_id for e in evidence]
    graph = build_graph(index, ev_chunk_ids, entities, max_nodes=30, max_edges=50)
    contradictions = detect_contradictions(index, evidence, entities)
    gaps = detect_gaps(pq, evidence, numeric_mode)

    # 8. answer + deduped sources
    answer = synthesize_answer(pq, evidence, gaps, contradictions, numeric_mode)
    sources, seen = [], set()
    for e in evidence:
        key = (e.source.document_id, e.source.chunk_id)
        if key not in seen:
            seen.add(key)
            sources.append(e.source)

    return SearchResult(parsed_query=pq, answer=answer, evidence=evidence,
                        graph=graph, gaps=gaps, contradictions=contradictions,
                        sources=sources)


class Engine:
    """Loads the small in-RAM stores once; holds the index handle. Reuse across
    queries (e.g. behind a FastAPI app)."""

    def __init__(self, index_path: str, data_root: str,
                 entities_path: str | None = None, synonyms_path: str | None = None,
                 now_year: int = 2026) -> None:
        self.index = Index(index_path)
        ep = entities_path or resolve(data_root, "entities")
        self.entities = Entities.load(ep) if ep else Entities()
        sp = synonyms_path or resolve(data_root, "synonyms")
        self.synonyms = load_synonyms(sp)
        self.now_year = now_year

    def search(self, query: str, *, filters: dict | None = None,
               top_k: int = 12, vector: VectorSearcher | None = None) -> SearchResult:
        return search(query, self.index, self.entities, self.synonyms,
                      filters=filters, vector=vector, top_k=top_k, now_year=self.now_year)

    def close(self) -> None:
        self.index.close()
