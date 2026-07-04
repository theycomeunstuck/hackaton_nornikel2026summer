"""Vector search — OPTIONAL, day-2. Interface + no-op default.

Mode B ships without embeddings; the pipeline runs on FTS alone and RRF simply
reproduces the FTS order. When you wire real embeddings, return SearchHit with
``chunk_id`` set so RRF fuses with the lexical channel unchanged.
"""
from __future__ import annotations

from typing import Protocol

from ..contracts import SearchHit


class VectorSearcher(Protocol):
    available: bool

    def search(self, query: str, k: int = 40) -> list[SearchHit]:
        ...


class NullVectorSearcher:
    """Default. No vector backend -> pipeline degrades to lexical-only."""
    available = False

    def search(self, query: str, k: int = 40) -> list[SearchHit]:
        return []


class QdrantVectorSearcher:
    """TODO(day-2). Mirror HydraX search/indexer.py:
        model 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
        index chunks by chunk_id so returned SearchHit.chunk_id == chunk_id.
    """
    available = False

    def __init__(self, *_a, **_k):
        raise NotImplementedError("Vector search is day-2; use NullVectorSearcher for now.")

    def search(self, query: str, k: int = 40) -> list[SearchHit]:
        raise NotImplementedError
