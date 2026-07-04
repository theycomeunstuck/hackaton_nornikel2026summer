"""Knowledge-gap detection over the retrieved evidence. Pure, deterministic."""
from __future__ import annotations

from ..contracts import EvidenceItem, Gap, ParsedQuery

_SUPPORT_SOURCES = {"experiment_protocol", "internal_report"}


def detect_gaps(pq: ParsedQuery, evidence: list[EvidenceItem],
                numeric_mode: str) -> list[Gap]:
    gaps: list[Gap] = []
    n = 0

    def add(gtype: str, title: str, desc: str, sev: str = "info") -> None:
        nonlocal n
        n += 1
        gaps.append(Gap(id=f"gap_{n:03d}", type=gtype, title=title, description=desc, severity=sev))

    if len(evidence) == 0:
        add("knowledge_gap", "Нет подтверждающих источников",
            "По запросу не найдено ни одного чанка с источником.", "warning")
        return gaps
    if len(evidence) == 1:
        add("weak_coverage", "Единственный источник",
            "Ответ опирается на один чанк — недостаточно для надёжного вывода.", "warning")

    geos = {e.source.geography for e in evidence if e.source.geography}
    if pq.geography == "all" and len(evidence) >= 2 and geos and geos <= {"domestic"}:
        add("geographic_gap", "Только отечественные источники",
            "Найдены только отечественные источники; зарубежная практика не покрыта.")
    elif pq.geography == "all" and len(evidence) >= 2 and geos and geos <= {"foreign"}:
        add("geographic_gap", "Только зарубежные источники",
            "Найдены только зарубежные источники; отечественная практика не покрыта.")

    if not any(e.source.source_type in _SUPPORT_SOURCES for e in evidence):
        add("evidence_gap", "Нет экспериментальных/внутренних отчётов",
            "Среди источников нет экспериментальных протоколов или внутренних отчётов — "
            "только публикации/справочники.")

    if pq.conditions and numeric_mode != "structured":
        add("missing_numeric_data",
            "Числовые условия проверены приблизительно" if numeric_mode == "approximate"
            else "Числовые условия не проверены",
            "Структурированные параметры (parameters.jsonl) недоступны — числовые "
            "ограничения проверены эвристически по тексту чанков, не на уровне claim.",
            "warning")

    combos = 0
    for mat in pq.materials:
        for proc in pq.processes:
            if combos >= 3:               # cap: don't flood the UI with combinations
                break
            covered = any(mat.lower() in e.text.lower() and proc.split()[0].lower() in e.text.lower()
                          for e in evidence)
            if not covered:
                combos += 1
                add("missing_combination", f"Нет данных по сочетанию «{mat}» + «{proc}»",
                    "Ни один источник не покрывает эту комбинацию материала и процесса.")
        if combos >= 3:
            break

    return gaps
