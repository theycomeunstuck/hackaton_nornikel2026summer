"""Deterministic, template-based answer. No LLM required.

Confidence and warnings are computed from the evidence, so the answer can never
claim more certainty than the sources support. Every sentence cites [N] with a
source name + page. An optional LLM can later rewrite ``short_conclusion`` prose
only — confidence/warnings stay evidence-derived.
"""
from __future__ import annotations

from ..contracts import (AnswerSummary, Contradiction, EvidenceItem, Gap,
                         ParsedQuery)

_ORDER = {"low": 0, "medium": 1, "high": 2}


def _overall_confidence(evidence: list[EvidenceItem], contradictions) -> str:
    if not evidence:
        return "low"
    top = max(_ORDER[e.confidence] for e in evidence)
    highs = sum(1 for e in evidence if e.confidence == "high")
    if top == 2 and highs >= 1 and len(evidence) >= 2 and not contradictions:
        return "high"
    if top >= 1 and len(evidence) >= 2:
        return "medium"
    return "low"


def _cite(e: EvidenceItem, n: int) -> str:
    p = f", стр. {e.source.page}" if e.source.page is not None else ""
    return f"[{n}] {e.source.source_name}{p}"


def synthesize_answer(pq: ParsedQuery, evidence: list[EvidenceItem],
                      gaps: list[Gap], contradictions: list[Contradiction],
                      numeric_mode: str) -> AnswerSummary:
    warnings: list[str] = []
    if contradictions:
        warnings.append(f"Источники расходятся ({len(contradictions)} противоречий) — см. раздел contradictions.")
    if pq.conditions and numeric_mode == "approximate":
        warnings.append("Числовые условия проверены приблизительно (нет структурированных параметров).")
    for g in gaps:
        # the explicit numeric warning above already covers missing_numeric_data
        if g.severity == "warning" and g.type != "missing_numeric_data" \
                and g.title not in warnings:
            warnings.append(g.title)

    if not evidence:
        return AnswerSummary(
            short_conclusion="По запросу не найдено подтверждённых источниками данных в индексе.",
            confidence="low",
            confidence_reason="Ноль релевантных чанков после ретрива и фильтрации.",
            warnings=warnings or ["Нет данных в индексе по этому запросу."],
            numeric_mode=numeric_mode)

    conf = _overall_confidence(evidence, contradictions)
    top = evidence[:3]
    lines = []
    for i, e in enumerate(top, 1):
        snippet = e.text.strip().rstrip(".")
        conds = "; ".join(c.raw_value for c in e.conditions if c.raw_value)
        extra = f" (условия: {conds})" if conds else ""
        lines.append(f"{snippet}{extra} {_cite(e, i)}.")
    conclusion = " ".join(lines)

    reason = (f"Найдено {len(evidence)} источников; "
              f"максимальная достоверность строки — "
              f"{max((e.confidence for e in evidence), key=lambda c: _ORDER[c])}."
              + (" Есть противоречия." if contradictions else ""))

    return AnswerSummary(short_conclusion=conclusion, confidence=conf,
                         confidence_reason=reason, warnings=warnings,
                         numeric_mode=numeric_mode)
