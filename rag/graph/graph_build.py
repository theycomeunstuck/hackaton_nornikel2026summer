"""Small, frontend-ready knowledge graph from the RETRIEVED chunks only.

We never return the global graph. We take the relations that live in the
retrieved chunks (so every edge is sourced to a chunk the user can open), cap at
``max_nodes`` / ``max_edges``, and label nodes from the in-RAM entity store.

Pure given (index, entities). Deterministic ordering.
"""
from __future__ import annotations

from ..contracts import GraphEdge, GraphNode, KnowledgeGraph, SourceRef
from ..index import Index
from ..loader import Entities

# entity type (from entities.jsonl / entity_id prefix) -> frontend node type
_TYPE_MAP = {
    "material": "material", "process": "process", "equipment": "equipment",
    "parameter": "parameter", "condition": "condition", "property": "property",
    "technology": "technology", "experiment": "experiment", "reagent": "material",
    "product": "material", "waste": "material", "metric": "parameter",
    "organization": "organization", "location": "location",
}


def _node_type(entities: Entities, entity_id: str) -> str:
    return _TYPE_MAP.get(entities.type_of(entity_id).lower(), "entity")


def build_graph(index: Index, chunk_ids: list[str], entities: Entities,
                max_nodes: int = 30, max_edges: int = 50) -> KnowledgeGraph:
    rels = index.relations_for_chunks(chunk_ids, cap=max_edges * 3)

    nodes: dict[str, GraphNode] = {}
    edges: dict[str, GraphEdge] = {}

    def add_node(entity_id: str) -> bool:
        if entity_id in nodes:
            return True
        if len(nodes) >= max_nodes:
            return False
        nodes[entity_id] = GraphNode(id=entity_id, label=entities.name_of(entity_id),
                                     type=_node_type(entities, entity_id))
        return True

    for r in rels:
        if len(edges) >= max_edges:
            break
        s, t = r["source_entity_id"], r["target_entity_id"]
        if not s or not t:
            continue
        if not (add_node(s) and add_node(t)):
            continue  # node cap reached; skip edges we can't anchor
        eid = f"{s}|{r['type']}|{t}|{r['chunk_id']}"
        if eid in edges:
            continue
        edges[eid] = GraphEdge(
            id=eid, source=s, target=t, relation=r["type"],
            source_ref=SourceRef(document_id=r["document_id"], source_name=r["source_name"],
                                 chunk_id=r["chunk_id"], page=r["page"]),
            evidence_text=(r.get("evidence_text") or "")[:200])

    return KnowledgeGraph(nodes=list(nodes.values()), edges=list(edges.values()))
