"""Query understanding. Pure (given loaded synonyms/entities). No network/LLM.

Produces a ParsedQuery: entities (material/process/tech/property), numeric
conditions (via the shared numeric parser), geography, time range, FTS keywords,
and matched graph entity_ids. Tuned to cover the three demo scenarios.
"""
from __future__ import annotations

import re

from ..contracts import ParsedQuery
from ..loader import Entities
from ..normalize import normalize_term
from ..numeric import extract_conditions

DEFAULT_NOW_YEAR = 2026   # deterministic; override in parse_query for tests/app

# Built-in domain lexicon so the 3 demo scenarios work even without synonyms.json.
# canonical -> stems (all matched as normalized substrings).
_LEXICON = {
    "materials": {
        "вода": ["вода", "воды", "water"],
        "сульфаты": ["сульфат"], "хлориды": ["хлорид"],
        "кальций": ["ca", "кальци"], "магний": ["mg", "магни"], "натрий": ["na", "натри"],
        "никель": ["никел", "nickel", " ni "], "медь": ["медн", "медь", "copper"],
        "католит": ["католит", "catholyte"],
        "золото": ["золот", "au", "gold"], "серебро": ["серебр", "ag", "silver"],
        "МПГ": ["мпг", "pgm", "платиновой группы", "platinum group"],
        "штейн": ["штейн", "matte"], "шлак": ["шлак", "slag"],
    },
    "processes": {
        "обессоливание воды": ["обессоливан", "desalination", "водоподготовк"],
        "электроэкстракция никеля": ["электроэкстракц", "electrowinning", "электролиз никел"],
        "флотация": ["флотац", "flotation"],
        "обогащение": ["обогащен", "обогатительн"],
    },
    "technologies": {
        "обратный осмос": ["обратн осмос", "reverse osmosis", " ro "],
        "ионный обмен": ["ионн обмен", "ion exchange"],
        "циркуляция католита": ["циркуляц католит", "циркуляции католита", "catholyte circulation"],
    },
    "properties": {
        "сухой остаток": ["сухой остаток", "сухого остатка", "tds", "dry residue"],
        "скорость потока": ["скорость поток", "скорости поток", "скорость циркуляц", "flow"],
        "извлечение": ["извлечен", "recovery", "распределени"],
        "температура": ["температур", "temperature"],
        "концентрационная поляризация": ["поляризац", "polarization"],
    },
}

_STOP = {"и", "в", "на", "для", "с", "по", "при", "не", "или", "что", "как",
         "если", "между", "за", "the", "of", "a", "to", "in", "and", "для"}
_TOKEN = re.compile(r"[а-яёa-z0-9]+", re.IGNORECASE)


def _detect(norm_q: str, vocab: dict[str, list[str]]) -> list[str]:
    out = []
    for canon, stems in vocab.items():
        if any(s.strip() in norm_q for s in stems) or normalize_term(canon) in norm_q:
            out.append(canon)
    return out


def _time_range(norm_q: str, now_year: int):
    m = re.search(r"последн\w*\s+(\d+)\s+(?:лет|год)", norm_q) or \
        re.search(r"last\s+(\d+)\s+year", norm_q)
    if m:
        n = int(m.group(1))
        return {"from": now_year - n, "to": now_year}
    m2 = re.search(r"с\s+(\d{4})\s+год", norm_q) or re.search(r"since\s+(\d{4})", norm_q)
    if m2:
        return {"from": int(m2.group(1)), "to": now_year}
    return None


def _geography(norm_q: str) -> str:
    if any(w in norm_q for w in ("зарубеж", "иностран", "мировой практик", "мировая практик", "foreign", "world practice")):
        return "foreign"
    if any(w in norm_q for w in ("отечествен", "росси", "норникел", "domestic")):
        return "domestic"
    return "all"


def _intent(norm_q: str) -> str:
    if any(w in norm_q for w in ("эксперимент", "публикац", "experiment", "publication")):
        return "experiments_lookup"
    if any(w in norm_q for w in ("обзор", "мировой практик", "review", "practice")):
        return "literature_review"
    if any(w in norm_q for w in ("метод", "подход", "выбор", "технолог", "selection")):
        return "technology_selection"
    return "general"


def parse_query(query: str, synonyms: dict | None = None,
                entities: Entities | None = None,
                now_year: int = DEFAULT_NOW_YEAR) -> ParsedQuery:
    norm_q = " " + normalize_term(query) + " "

    materials = _detect(norm_q, _LEXICON["materials"])
    processes = _detect(norm_q, _LEXICON["processes"])
    technologies = _detect(norm_q, _LEXICON["technologies"])
    properties = _detect(norm_q, _LEXICON["properties"])

    keywords = [w for w in _TOKEN.findall(query.lower().replace("ё", "е"))
                if len(w) > 2 and w not in _STOP]

    entity_ids: list[str] = []
    if entities is not None:
        for key, ids in entities.alias_index.items():
            if len(key) >= 3 and key in norm_q:
                for eid in ids:
                    if eid not in entity_ids:
                        entity_ids.append(eid)

    return ParsedQuery(
        raw=query, intent=_intent(norm_q),
        materials=materials, processes=processes, technologies=technologies,
        properties=properties, conditions=extract_conditions(query),
        geography=_geography(norm_q), time_range=_time_range(norm_q, now_year),
        keywords=keywords, entity_ids=entity_ids[:50],
    )


def expand_synonyms(pq: ParsedQuery, synonyms: dict | None = None) -> list[str]:
    """Keywords + all known surface forms of detected entities. Used to build the
    FTS query. Deterministic, deduped."""
    terms: list[str] = list(pq.keywords)
    # built-in lexicon stems
    for kind in ("materials", "processes", "technologies", "properties"):
        for canon in getattr(pq, kind):
            terms.append(canon)
            terms.extend(_LEXICON[kind].get(canon, []))
    # loaded synonyms.json (canonical + aliases)
    if synonyms:
        detected = set(pq.materials + pq.processes + pq.technologies + pq.properties)
        for canon, aliases in synonyms.items():
            if canon in detected or normalize_term(canon) in normalize_term(pq.raw):
                terms.append(canon)
                terms.extend(aliases)
    out, seen = [], set()
    for t in terms:
        tl = normalize_term(t)
        if tl and tl not in seen and tl not in _STOP:
            seen.add(tl)
            out.append(tl)
    return out
