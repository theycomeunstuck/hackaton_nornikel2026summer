"""Deterministic numeric-condition parser. Pure, stdlib-only.

Ported from the extraction team's ``extraction/parameter_extractor.py`` so that:
  * the query parser and the chunk re-parser produce IDENTICAL structures, and
  * when ``parameters.jsonl`` appears, its rows map onto the SAME ``Condition``.

This is the single source of truth for "what is a numeric condition" across the
module. Never parse numbers with an LLM.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

from .normalize import normalize_term

# --- grammar (kept aligned with extraction/parameter_extractor.py) ----------
_NUMBER = r"\d+(?:[.,]\d+)?"
_UNIT = (
    r"(?:мг/дм[³3]|мг/л|г/л|мкг/л|м/с|т/сут|°[CС]|%|ppm|ppb|"
    r"МПа|кПа|Па|атм|об/мин|г/т|кг/т|м3/ч|м³/ч|А/м2|A/m2)"
)
_OP = r"(?:≤|<=|≥|>=|<|>|=)"

_FROM_TO = re.compile(
    rf"(?P<raw>от\s+(?P<min>{_NUMBER})\s+до\s+(?P<max>{_NUMBER})\s*(?P<unit>{_UNIT}))",
    re.IGNORECASE)
_RANGE = re.compile(
    rf"(?P<raw>(?P<min>{_NUMBER})\s*[–—-]\s*(?P<max>{_NUMBER})\s*(?P<unit>{_UNIT}))",
    re.IGNORECASE)
_OPVAL = re.compile(
    rf"(?P<raw>(?P<op>{_OP})\s*(?P<value>{_NUMBER})\s*(?P<unit>{_UNIT}))",
    re.IGNORECASE)
_VALUE = re.compile(
    rf"(?P<raw>(?P<value>{_NUMBER})\s*(?P<unit>{_UNIT}))", re.IGNORECASE)

_PARAM_NAMES = [
    "сухой остаток", "температура", "давление", "скорость потока", "скорость",
    "ph", "извлечение", "содержание", "концентрация", "расход",
    "плотность тока", "крупность", "продолжительность",
]

_OP_MAP = {"<": "lt", "<=": "lte", "≤": "lte", ">": "gt", ">=": "gte",
           "≥": "gte", "=": "eq"}


@dataclass
class Condition:
    """One numeric constraint. Matches the team Condition contract 1:1."""
    name: str = ""
    operator: str = "unknown"       # eq|lt|lte|gt|gte|range|unknown
    value: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    unit: str = ""
    raw_value: str = ""

    def to_api(self) -> dict:
        return {"name": self.name, "operator": self.operator, "value": self.value,
                "min": self.min, "max": self.max, "unit": self.unit,
                "rawValue": self.raw_value}

    @staticmethod
    def from_param_row(row: dict) -> "Condition":
        """Build from a parameters.jsonl record (ParameterValue schema)."""
        return Condition(
            name=row.get("name", "") or "",
            operator=row.get("operator", "unknown") or "unknown",
            value=_f(row.get("value")), min=_f(row.get("min")), max=_f(row.get("max")),
            unit=row.get("unit", "") or "", raw_value=row.get("raw_value", "") or "")


def _f(x) -> Optional[float]:
    if x is None or x == "":
        return None
    try:
        return float(str(x).replace(",", "."))
    except ValueError:
        return None


def _to_float(s: str) -> float:
    return float(s.replace(",", "."))


def _infer_name(text: str, start: int) -> str:
    window = normalize_term(text[max(0, start - 80): start + 20])
    for name in _PARAM_NAMES:
        if normalize_term(name) in window:
            return "pH" if name == "ph" else name
    return "numeric_value"


def _overlaps(s: int, e: int, spans: list[tuple[int, int]]) -> bool:
    return any(s < se and e > ss for ss, se in spans)


def extract_conditions(text: str) -> list[Condition]:
    """Extract all numeric conditions from free text. Deterministic order."""
    if not text:
        return []
    out: list[Condition] = []
    spans: list[tuple[int, int]] = []
    for regex, kind in ((_FROM_TO, "range"), (_RANGE, "range"),
                        (_OPVAL, "operator"), (_VALUE, "value")):
        for m in regex.finditer(text):
            s, e = m.span("raw")
            if _overlaps(s, e, spans):
                continue
            unit = m.group("unit")
            name = _infer_name(text, s)
            raw = m.group("raw")
            if kind == "range":
                lo, hi = sorted((_to_float(m.group("min")), _to_float(m.group("max"))))
                out.append(Condition(name=name, operator="range", min=lo, max=hi,
                                     unit=unit, raw_value=raw))
            elif kind == "operator":
                out.append(Condition(name=name, operator=_OP_MAP.get(m.group("op"), "unknown"),
                                     value=_to_float(m.group("value")), unit=unit, raw_value=raw))
            else:
                out.append(Condition(name=name, operator="eq",
                                     value=_to_float(m.group("value")), unit=unit, raw_value=raw))
            spans.append((s, e))
    out.sort(key=lambda c: text.find(c.raw_value))
    return out


# --- interval logic (used by numeric filtering) -----------------------------
INF = float("inf")


def condition_interval(c: Condition) -> Optional[tuple[float, float]]:
    """Collapse a condition into a closed interval, or None if not numeric."""
    if c.operator == "range" and c.min is not None and c.max is not None:
        return (min(c.min, c.max), max(c.min, c.max))
    v = c.value
    if c.operator == "eq" and v is not None:
        return (v, v)
    if c.operator in ("lt", "lte") and v is not None:
        return (-INF, v)
    if c.operator in ("gt", "gte") and v is not None:
        return (v, INF)
    if c.min is not None or c.max is not None:
        return (c.min if c.min is not None else -INF,
                c.max if c.max is not None else INF)
    return None


def intervals_overlap(a: tuple[float, float], b: tuple[float, float]) -> bool:
    return a[0] <= b[1] and b[0] <= a[1]


def same_unit(a: str, b: str) -> bool:
    na, nb = normalize_term(a), normalize_term(b)
    if not na or not nb:
        return True  # unknown unit -> don't block on it
    return na.replace("³", "3") == nb.replace("³", "3")


# Fold near-synonym parameter names so numeric comparison groups them together.
_PARAM_CANON = {
    "скорость": "скорость потока",
    "скорость циркуляции": "скорость потока",
    "расход": "скорость потока",
    "содержание": "концентрация",
}


def canonical_param(name: str) -> str:
    n = normalize_term(name)
    return _PARAM_CANON.get(n, n)
