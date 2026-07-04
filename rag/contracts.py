"""Data contracts for the Retrieval / Graph / Analytics module (Mode B).

Two layers, on purpose:
  * INTERNAL (snake_case dataclasses): what we compute with.
  * API (``to_api()`` -> camelCase): what the frontend consumes.

The API boundary lives ONLY in ``to_api()`` methods. ``SearchResult.to_api()``
returns EXACTLY these 7 keys and must stay stable across Mode B / Mode A and
whether or not ``parameters.jsonl`` exists:

    parsedQuery, answer, evidence, graph, gaps, contradictions, sources

Fields marked ``# CONTRACT`` cross a teammate boundary — never rename ad hoc.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from .numeric import Condition  # re-exported; the shared numeric structure


# ---------------------------------------------------------------------------
# Source — the sacred four (+ context). Must ride on every piece of evidence.
# ---------------------------------------------------------------------------
@dataclass
class SourceRef:
    document_id: str = ""      # CONTRACT
    source_name: str = ""      # CONTRACT
    chunk_id: str = ""         # CONTRACT
    page: Optional[int] = None  # CONTRACT
    section_title: str = ""
    source_type: str = ""
    year: Optional[int] = None
    geography: str = ""

    def to_api(self) -> dict:
        return {"documentId": self.document_id, "sourceName": self.source_name,
                "chunkId": self.chunk_id, "page": self.page,
                "sectionTitle": self.section_title or None,
                "sourceType": self.source_type or None, "year": self.year,
                "geography": self.geography or None}


# ---------------------------------------------------------------------------
# Parsed query
# ---------------------------------------------------------------------------
@dataclass
class ParsedQuery:
    raw: str = ""
    intent: str = "general"
    materials: list[str] = field(default_factory=list)
    processes: list[str] = field(default_factory=list)
    technologies: list[str] = field(default_factory=list)
    properties: list[str] = field(default_factory=list)
    conditions: list[Condition] = field(default_factory=list)   # numeric constraints
    geography: str = "all"                                       # all|domestic|foreign
    time_range: Optional[dict] = None                           # {"from": int, "to": int}
    keywords: list[str] = field(default_factory=list)           # for FTS
    entity_ids: list[str] = field(default_factory=list)         # matched graph entities

    def to_api(self) -> dict:
        return {"intent": self.intent, "materials": self.materials,
                "processes": self.processes, "technologies": self.technologies,
                "properties": self.properties,
                "conditions": [c.to_api() for c in self.conditions],
                "geography": self.geography, "timeRange": self.time_range}


# ---------------------------------------------------------------------------
# Retrieval hit (raw, before curation into evidence)
# ---------------------------------------------------------------------------
@dataclass
class SearchHit:
    chunk_id: str                 # ref_id for RRF/dedup
    document_id: str = ""
    source_name: str = ""
    page: Optional[int] = None
    text: str = ""
    score: float = 0.0
    origin: str = ""              # "fts" | "entity" | "vector" | "rrf"
    year: Optional[int] = None
    source_type: str = ""
    geography: str = ""
    section_title: str = ""

    def source(self) -> SourceRef:
        return SourceRef(document_id=self.document_id, source_name=self.source_name,
                         chunk_id=self.chunk_id, page=self.page,
                         section_title=self.section_title, source_type=self.source_type,
                         year=self.year, geography=self.geography)


# ---------------------------------------------------------------------------
# Evidence item (curated; one row of the evidence table)
# ---------------------------------------------------------------------------
@dataclass
class EvidenceItem:
    id: str                                   # stable: "ev_<chunk_id>"
    text: str
    score: float
    confidence: str                           # high|medium|low
    source: SourceRef                         # CONTRACT — preserved from the chunk
    conditions: list[Condition] = field(default_factory=list)
    matched_terms: list[str] = field(default_factory=list)
    numeric_status: str = "none"              # structured|approximate|none|unmatched

    def to_api(self) -> dict:
        return {"id": self.id, "text": self.text, "score": round(self.score, 4),
                "confidence": self.confidence,
                "conditions": [c.to_api() for c in self.conditions],
                "matchedTerms": self.matched_terms,
                "numericStatus": self.numeric_status,
                "source": self.source.to_api()}


# ---------------------------------------------------------------------------
# Graph
# ---------------------------------------------------------------------------
@dataclass
class GraphNode:
    id: str
    label: str
    type: str                      # material|process|equipment|parameter|condition|...

    def to_api(self) -> dict:
        return {"id": self.id, "label": self.label, "type": self.type}


@dataclass
class GraphEdge:
    id: str
    source: str                    # node id
    target: str                    # node id
    relation: str
    source_ref: Optional[SourceRef] = None    # CONTRACT — where this edge came from
    evidence_text: str = ""

    def to_api(self) -> dict:
        return {"id": self.id, "source": self.source, "target": self.target,
                "relation": self.relation,
                "sourceRef": self.source_ref.to_api() if self.source_ref else None,
                "evidenceText": self.evidence_text or None}


@dataclass
class KnowledgeGraph:
    nodes: list[GraphNode] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)

    def to_api(self) -> dict:
        return {"nodes": [n.to_api() for n in self.nodes],
                "edges": [e.to_api() for e in self.edges]}


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
@dataclass
class Gap:
    id: str
    type: str            # knowledge_gap|weak_coverage|geographic_gap|evidence_gap|missing_numeric_data|missing_combination
    title: str
    description: str
    severity: str = "info"   # info|warning

    def to_api(self) -> dict:
        return {"id": self.id, "type": self.type, "title": self.title,
                "description": self.description, "severity": self.severity}


@dataclass
class Contradiction:
    id: str
    title: str
    description: str
    source_a: SourceRef
    source_b: SourceRef
    status: str = "possible"     # possible|needs_review|confirmed

    def to_api(self) -> dict:
        return {"id": self.id, "title": self.title, "description": self.description,
                "sourceA": self.source_a.to_api(), "sourceB": self.source_b.to_api(),
                "status": self.status}


@dataclass
class AnswerSummary:
    short_conclusion: str = ""
    confidence: str = "low"
    confidence_reason: str = ""
    warnings: list[str] = field(default_factory=list)
    numeric_mode: str = "none"    # structured|approximate|none

    def to_api(self) -> dict:
        return {"shortConclusion": self.short_conclusion, "confidence": self.confidence,
                "confidenceReason": self.confidence_reason, "warnings": self.warnings,
                "numericMode": self.numeric_mode}


# ---------------------------------------------------------------------------
# The single object the frontend renders the whole page from
# ---------------------------------------------------------------------------
@dataclass
class SearchResult:
    parsed_query: ParsedQuery
    answer: AnswerSummary
    evidence: list[EvidenceItem] = field(default_factory=list)
    graph: KnowledgeGraph = field(default_factory=KnowledgeGraph)
    gaps: list[Gap] = field(default_factory=list)
    contradictions: list[Contradiction] = field(default_factory=list)
    sources: list[SourceRef] = field(default_factory=list)

    def to_api(self) -> dict[str, Any]:
        return {
            "parsedQuery": self.parsed_query.to_api(),
            "answer": self.answer.to_api(),
            "evidence": [e.to_api() for e in self.evidence],
            "graph": self.graph.to_api(),
            "gaps": [g.to_api() for g in self.gaps],
            "contradictions": [c.to_api() for c in self.contradictions],
            "sources": [s.to_api() for s in self.sources],
        }
