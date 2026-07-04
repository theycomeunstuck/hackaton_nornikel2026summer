"""Contradiction detection (Mode B — DEGRADED and honest).

Without claims we cannot do claim-grade conflict, so we emit two best-effort
signals. Each attaches two real ``SourceRef``s, is de-duplicated, ranked, and
capped — a handful of high-signal items instead of a combinatorial flood.

  1. Relation-effect conflict — the SAME directed entity pair carries OPPOSITE
     typed effect relations on the SAME axis, across DIFFERENT documents:
         quantity axis:  INCREASES  vs  REDUCES
         quality  axis:  IMPROVES   vs  WORSENS
     status = "possible". Cross-axis pairs (e.g. IMPROVES vs REDUCES) are NOT
     opposites and are never emitted. Weak relations (conf < 0.7, e.g.
     MENTIONED_WITH at 0.62) are ignored.

  2. Numeric conflict — two evidence items from DIFFERENT documents report the
     SAME *comparable* parameter with the same unit and non-overlapping intervals.
     status = "needs_review". Comparisons are bucketed by (param_head, SUBJECT,
     unit): a generic quantity head (``содержание``/``концентрация``/``извлечение``
     = "content/concentration/recovery OF what?") is comparable ONLY when the name
     carries a subject (e.g. "содержание железа"), and then only against the SAME
     subject — so "содержание железа 50 %" vs "…10–15 %" is a contradiction while
     "содержание железа" vs "содержание кремния" is not. Two name classes are
     always IGNORED as unsound to compare across sources:
       * unnamed ``numeric_value`` blobs (bucket unrelated numbers by unit alone,
         e.g. "выход по току 95–98 %" vs "выход из строя 40 % мощности");
       * BARE generic heads with no subject ("содержание" alone).
     Self-contained process parameters (скорость потока, температура, pH, сухой
     остаток, плотность тока …) carry their subject implicitly and stay comparable.

     The subject comes from the parameter NAME — the only reliable subject signal
     in the indexed data. A separate subject-entity link via HAS_PARAMETER was
     evaluated and REJECTED: it is ambiguous (many candidate subjects per value)
     and coarse (owner material, not the measured substance). See docs/ROADMAP.md.

Mode A hook: when claims.jsonl exists, a stronger claim-effect detector can be
added here without changing the output contract.
"""
from __future__ import annotations

from ..contracts import Contradiction, EvidenceItem, SourceRef
from ..index import Index
from ..loader import Entities
from ..normalize import normalize_term
from ..numeric import (canonical_param, condition_interval, intervals_overlap,
                       same_unit)

# effect relation type -> (axis, direction). Opposition = same axis, opposite dir.
_EFFECT_AXIS = {
    "INCREASES": ("quantity", +1), "REDUCES": ("quantity", -1),
    "IMPROVES":  ("quality",  +1), "WORSENS":  ("quality",  -1),
}
_MIN_REL_CONF = 0.7          # effect relations sit at 0.78; MENTIONED_WITH at 0.62
# Generic quantity heads meaningless without a subject ("content OF what?").
# canonical_param folds bare "содержание" -> "концентрация".
_GENERIC_HEADS = {"содержание", "концентрация", "извлечение"}


def _param_subject_key(name: str):
    """Bucket key ``(head, subject)`` for a numeric parameter, or ``None`` if the
    parameter must not be compared across sources.

    * ``numeric_value`` / empty                         -> None (unnamed blob)
    * bare generic head ("содержание")                  -> None (subject unknown)
    * subject-qualified generic ("содержание железа")   -> ("содержание", "железа")
    * self-contained parameter ("температура")          -> ("температура", "")
    """
    canon = canonical_param(name)
    if not canon or canon == "numeric_value":
        return None
    toks = canon.split()
    if toks[0] in _GENERIC_HEADS:
        subject = " ".join(toks[1:])
        return (toks[0], subject) if subject else None
    return (canon, "")


def detect_contradictions(index: Index, evidence: list[EvidenceItem],
                          entities: Entities, *, limit: int = 6,
                          max_effect: int = 3, max_numeric: int = 3) -> list[Contradiction]:
    out: list[Contradiction] = []
    out.extend(_relation_effect(index, evidence, entities, max_effect))
    out.extend(_numeric(evidence, max_numeric))
    out = out[:limit]
    for i, c in enumerate(out, 1):
        c.id = f"contr_{i:03d}"
    return out


# --- signal 1: opposite typed effect on the same axis -----------------------
def _relation_effect(index: Index, evidence: list[EvidenceItem],
                     entities: Entities, cap: int) -> list[Contradiction]:
    rels = index.relations_for_chunks([e.source.chunk_id for e in evidence], cap=400)
    # (source_entity, target_entity, axis) -> {+1: [rows], -1: [rows]}
    groups: dict[tuple[str, str, str], dict[int, list[dict]]] = {}
    for r in rels:
        axis_dir = _EFFECT_AXIS.get(r["type"])
        if axis_dir is None or (r.get("confidence") or 0.0) < _MIN_REL_CONF:
            continue
        axis, direction = axis_dir
        groups.setdefault((r["source_entity_id"], r["target_entity_id"], axis), {}) \
              .setdefault(direction, []).append(r)

    ranked: list[tuple[float, Contradiction]] = []
    for (a, b, _axis), by_dir in groups.items():
        pair = _cross_doc_pair(by_dir.get(+1, []), by_dir.get(-1, []))
        if pair is None:
            continue
        ru, rd = pair
        score = min(ru.get("confidence") or 0.0, rd.get("confidence") or 0.0)
        label = f"{entities.name_of(a)} → {entities.name_of(b)}"
        ranked.append((score, Contradiction(
            id="",
            title=f"Противоположный эффект: {label}",
            description=(f"{ru['source_name']}: {ru['type']} «{(ru['evidence_text'] or '')[:90]}»; "
                        f"{rd['source_name']}: {rd['type']} «{(rd['evidence_text'] or '')[:90]}»."),
            source_a=_ref(ru), source_b=_ref(rd), status="possible")))
    ranked.sort(key=lambda t: t[0], reverse=True)
    return [c for _, c in ranked[:cap]]


def _cross_doc_pair(ups: list[dict], downs: list[dict]):
    """Highest-confidence up/down rows that come from DIFFERENT documents."""
    if not ups or not downs:
        return None
    ups = sorted(ups, key=lambda r: r.get("confidence") or 0.0, reverse=True)
    downs = sorted(downs, key=lambda r: r.get("confidence") or 0.0, reverse=True)
    for ru in ups:
        for rd in downs:
            if ru["document_id"] != rd["document_id"]:
                return ru, rd
    return None


# --- signal 2: non-overlapping numeric intervals for the SAME named param ----
def _numeric(evidence: list[EvidenceItem], cap: int) -> list[Contradiction]:
    # (head, subject, unit) -> [(evidence, condition, interval)]; comparable params only
    buckets: dict[tuple[str, str, str], list[tuple[EvidenceItem, object, tuple]]] = {}
    for e in evidence:
        for c in e.conditions:
            key = _param_subject_key(c.name)
            if key is None:
                continue
            iv = condition_interval(c)
            if iv is None:
                continue
            head, subject = key
            buckets.setdefault((head, subject, normalize_term(c.unit)), []).append((e, c, iv))

    ranked: list[tuple[float, Contradiction]] = []
    for (_head, _subject, _unit), items in buckets.items():
        best = _widest_conflict(items)   # one representative per bucket
        if best is None:
            continue
        gap, ea, ca, eb, cb = best
        ranked.append((gap, Contradiction(
            id="",
            title=f"Расхождение по параметру «{ca.name}»",
            description=(f"{ea.source.source_name}: {ca.raw_value or ca.name}; "
                        f"{eb.source.source_name}: {cb.raw_value or cb.name}."),
            source_a=ea.source, source_b=eb.source, status="needs_review")))
    ranked.sort(key=lambda t: t[0], reverse=True)
    return [c for _, c in ranked[:cap]]


def _widest_conflict(items):
    """The cross-document, same-unit, non-overlapping pair with the largest gap."""
    best = None
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            ea, ca, iva = items[i]
            eb, cb, ivb = items[j]
            if ea.source.document_id == eb.source.document_id:
                continue
            if not same_unit(ca.unit, cb.unit) or intervals_overlap(iva, ivb):
                continue
            gap = max(ivb[0] - iva[1], iva[0] - ivb[1])
            if best is None or gap > best[0]:
                best = (gap, ea, ca, eb, cb)
    return best


def _ref(r: dict) -> SourceRef:
    return SourceRef(document_id=r["document_id"], source_name=r["source_name"],
                     chunk_id=r["chunk_id"], page=r["page"])
