"""Small deterministic text utilities. Pure, stdlib-only.

Two jobs:
  * ``normalize_term`` — fold a term for matching (lowercase, ё→е, collapse
    whitespace, strip punctuation edges). Used by the query parser and entity
    matching so "Ni-Cu", "ni cu" and "NiCu" line up.
  * ``repair_mojibake`` — best-effort, NON-destructive repair of the classic
    UTF-8-decoded-as-CP1251 damage seen in the extracted chunk text. Only acts
    when a mojibake signature is present, otherwise returns the input unchanged,
    so it can never corrupt already-clean Russian text.
"""
from __future__ import annotations

import re

_WS = re.compile(r"\s+")
_EDGE_PUNCT = re.compile(r"^[\s\.,;:!\?\(\)\[\]\"'«»–—-]+|[\s\.,;:!\?\(\)\[\]\"'«»–—-]+$")

# Characters that strongly indicate CP1251<->UTF-8 mojibake in Cyrillic text.
_MOJIBAKE_MARKERS = ("Ð", "Ñ", "Ð°", "â€", "Ã", "�")


def normalize_term(text: str) -> str:
    """Lowercase, ё→е, strip edge punctuation, collapse internal whitespace."""
    if not text:
        return ""
    t = text.replace("ё", "е").replace("Ё", "Е").lower()
    t = _WS.sub(" ", t).strip()
    t = _EDGE_PUNCT.sub("", t)
    return t.strip()


def repair_mojibake(text: str) -> str:
    """Best-effort fix for UTF-8 text that was decoded as CP1251.

    Conservative: only attempts repair if a mojibake marker is present AND the
    round-trip produces valid Cyrillic-looking text; otherwise returns the
    original untouched.
    """
    if not text or not any(m in text for m in _MOJIBAKE_MARKERS):
        return text
    try:
        repaired = text.encode("cp1251", errors="strict").decode("utf-8", errors="strict")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text
    # Accept the repair only if it increased the share of Cyrillic characters.
    if _cyrillic_ratio(repaired) > _cyrillic_ratio(text):
        return repaired
    return text


def _cyrillic_ratio(text: str) -> float:
    if not text:
        return 0.0
    cyr = sum(1 for ch in text if "Ѐ" <= ch <= "ӿ")
    return cyr / len(text)
