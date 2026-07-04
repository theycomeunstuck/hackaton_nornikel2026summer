"""Lexical (FTS5/BM25) retrieval channel. Thin wrapper over the SQLite index."""
from __future__ import annotations

from ..contracts import ParsedQuery, SearchHit
from ..index import Index
from .query_parser import expand_synonyms


def lexical_search(index: Index, pq: ParsedQuery, synonyms: dict | None = None,
                   k: int = 40) -> list[SearchHit]:
    """FTS BM25 over chunk text/contextual_text using expanded query terms."""
    terms = expand_synonyms(pq, synonyms)
    if not terms:
        terms = pq.keywords
    return index.search_chunks(terms, k=k)
