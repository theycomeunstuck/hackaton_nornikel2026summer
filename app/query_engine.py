"""Движок разбора запроса и синтеза evidence-first ответа.

Реализует упрощённый NLP-пайплайн (без внешних моделей):
    - извлечение сущностей по доменному словарю (RU/EN синонимы);
    - извлечение числовых условий и диапазонов регулярными выражениями;
    - определение географии и временного диапазона;
    - маршрутизацию к демо-сценарию по ключевым словам;
    - применение фильтров;
    - построение графа знаний из найденных claims;
    - синтез краткого вывода с confidence и warnings.

Внешний контракт остаётся evidence-first: любой вывод опирается на claims,
каждый claim — на источник.
"""
from __future__ import annotations

import re
import uuid

from . import data
from .models import (
    AnswerSummary,
    Condition,
    Contradiction,
    EvidenceClaim,
    GraphEdge,
    GraphNode,
    KnowledgeGap,
    KnowledgeGraph,
    ParsedQuery,
    QueryFilters,
    SearchResult,
    Source,
    TimeRange,
)

# =============================================================================
# Доменный словарь (канонический термин -> синонимы, в нижнем регистре)
# =============================================================================

MATERIALS = {
    "сульфаты": ["сульфат", "sulfate", "so4", "so₄"],
    "хлориды": ["хлорид", "chloride", "cl"],
    "Ca": ["кальций", "calcium", "ca"],
    "Mg": ["магний", "magnesium", "mg"],
    "Na": ["натрий", "sodium", "na"],
    "никель": ["nickel", "ni"],
    "католит": ["catholyte"],
    "медь": ["copper", "cu"],
    "Au": ["золото", "gold", "au"],
    "Ag": ["серебро", "silver", "ag"],
    "МПГ": ["мпг", "pgm", "платиноиды", "платиновые металлы"],
    "Pt": ["платина", "platinum", "pt"],
    "штейн": ["matte", "штейна", "штейном"],
    "медный штейн": ["copper matte", "медного штейна"],
    "никелевый штейн": ["nickel matte", "никелевого штейна"],
    "шлак": ["slag", "шлаком", "шлаке"],
}

PROCESSES = {
    "обессоливание воды": ["обессоливание", "desalination", "водоподготовка",
                            "water treatment", "обессол"],
    "электроэкстракция никеля": ["электроэкстракция", "electrowinning",
                                 "electroextraction", "электроэкстракци"],
    "распределение металлов": ["распределение", "distribution", "partition"],
    "выщелачивание": ["выщелачивание", "leaching"],
}

TECHNOLOGIES = {
    "обратный осмос": ["обратный осмос", "reverse osmosis", "осмос", "ro "],
    "нанофильтрация": ["нанофильтрация", "nanofiltration"],
    "электродиализ": ["электродиализ", "electrodialysis"],
    "ионный обмен": ["ионный обмен", "ion exchange"],
    "циркуляция католита": ["циркуляция католита", "catholyte circulation",
                            "циркуляц"],
    "печь взвешенной плавки": ["печь взвешенной плавки", "пвп",
                               "flash smelting", "fluidized bed furnace"],
}

PROPERTIES = {
    "сухой остаток": ["сухой остаток", "tds", "total dissolved solids",
                      "солесодержание"],
    "концентрационная поляризация": ["поляризация", "polarization"],
    "скорость потока": ["скорость потока", "скорость циркуляции", "flow velocity"],
    "коэффициент распределения": ["коэффициент распределения",
                                  "distribution coefficient"],
    "энергозатраты": ["энергозатраты", "энергопотребление", "energy"],
}

EQUIPMENT = {
    "ванна электроэкстракции": ["ванна электроэкстракции", "electrowinning cell"],
    "мембранный модуль": ["мембранный модуль", "мембрана", "membrane"],
    "печь взвешенной плавки": ["печь взвешенной плавки", "пвп"],
}

# Ключевые слова для маршрутизации к сценарию
SCENARIO_KEYWORDS = {
    "desalination": [
        "обессол", "вод", "сухой остаток", "сульфат", "хлорид", "осмос",
        "нанофильтр", "электродиализ", "desalination", "tds", "солесодержание",
    ],
    "catholyte": [
        "католит", "циркуляц", "электроэкстракц", "поляризац", "catholyte",
        "electrowinning", "скорость потока", "ванна",
    ],
    "metals": [
        "au", "ag", "мпг", "pgm", "штейн", "шлак", "распределени", "металл",
        "золот", "серебр", "платин", "matte", "slag",
    ],
}

SCENARIO_INTENT = {
    "desalination": "technology_selection",
    "catholyte": "technology_review",
    "metals": "evidence_lookup",
    "generic": "information_retrieval",
}


# =============================================================================
# Извлечение числовых условий
# =============================================================================

# нормализация: запятая как десятичный разделитель, разные тире
_DASHES = "–—−-"
_NUM = r"\d+(?:[.,]\d+)?"


def _to_float(s: str) -> float:
    return float(s.replace(",", ".").replace(" ", ""))


def _unit_after(text: str, pos: int) -> str:
    """Единица измерения сразу после числа."""
    tail = text[pos:pos + 20]
    m = re.match(r"\s*([°%A-Za-zА-Яа-я/·²³/]+(?:/[A-Za-zА-Яа-я³²]+)?)", tail)
    if not m:
        return ""
    unit = m.group(1).strip()
    # обрезаем «слипшиеся» слова
    unit = re.split(r"\s", unit)[0]
    return unit if len(unit) <= 12 else ""


def extract_conditions(text: str) -> list[Condition]:
    conditions: list[Condition] = []
    seen: set[str] = set()

    # 1. Диапазоны:  200–300 мг/л,  0,3–0,5 м/с
    for m in re.finditer(rf"({_NUM})\s*[{_DASHES}]\s*({_NUM})", text):
        raw_start = m.start()
        unit = _unit_after(text, m.end())
        raw = text[raw_start:m.end()] + (f" {unit}" if unit else "")
        key = f"range:{m.group(1)}:{m.group(2)}:{unit}"
        if key in seen:
            continue
        seen.add(key)
        conditions.append(Condition(
            name="числовой диапазон",
            operator="range",
            min=_to_float(m.group(1)),
            max=_to_float(m.group(2)),
            unit=unit or None,
            rawValue=raw.strip(),
        ))

    # 2. Ограничения ≤ ≥ < > =
    op_map = {"≤": "lte", "<=": "lte", "≥": "gte", ">=": "gte",
              "<": "lt", ">": "gt", "=": "eq"}
    for m in re.finditer(rf"(≤|≥|<=|>=|<|>|=)\s*({_NUM})", text):
        op = op_map[m.group(1)]
        unit = _unit_after(text, m.end())
        raw = text[m.start():m.end()] + (f" {unit}" if unit else "")
        key = f"{op}:{m.group(2)}:{unit}"
        if key in seen:
            continue
        seen.add(key)
        conditions.append(Condition(
            name="числовое ограничение",
            operator=op,  # type: ignore[arg-type]
            value=_to_float(m.group(2)),
            unit=unit or None,
            rawValue=raw.strip(),
        ))

    return conditions


# =============================================================================
# Извлечение сущностей
# =============================================================================


def _match_vocab(text_lower: str, vocab: dict[str, list[str]]) -> list[str]:
    found: list[str] = []
    for canonical, synonyms in vocab.items():
        terms = [canonical.lower()] + synonyms
        for term in terms:
            # для коротких токенов (ca, ni, au) требуем границу слова
            if len(term) <= 3:
                pattern = rf"(?<![a-zA-Zа-яА-Я]){re.escape(term)}(?![a-zA-Zа-яА-Я])"
                if re.search(pattern, text_lower):
                    found.append(canonical)
                    break
            elif term in text_lower:
                found.append(canonical)
                break
    return found


def detect_geography(text_lower: str) -> str:
    domestic = any(w in text_lower for w in
                   ["росси", "отечествен", "внутренн", "domestic", "рф"])
    foreign = any(w in text_lower for w in
                  ["зарубеж", "мировой практик", "world", "foreign", "иностран",
                   "international"])
    if domestic and foreign:
        return "mixed"
    if domestic:
        return "domestic"
    if foreign:
        return "foreign"
    return "all"


def detect_time_range(text_lower: str) -> TimeRange | None:
    # «за последние 5 лет»
    m = re.search(r"последн\w*\s+(\d+)\s+(?:год|лет|года)", text_lower)
    if m:
        n = int(m.group(1))
        return TimeRange(**{"from": 2026 - n, "to": 2026})
    # «с 2020 по 2024»
    m = re.search(r"(?:с|from)\s*(\d{4}).*?(?:по|до|to)\s*(\d{4})", text_lower)
    if m:
        return TimeRange(**{"from": int(m.group(1)), "to": int(m.group(2))})
    years = re.findall(r"(19|20)\d{2}", text_lower)
    if len(years) == 1:
        y = int(re.search(r"(19|20)\d{2}", text_lower).group(0))
        return TimeRange(**{"from": y, "to": None})
    return None


def route_scenario(text_lower: str, explicit: str | None) -> str:
    if explicit and explicit in SCENARIO_KEYWORDS:
        return explicit
    scores = {
        name: sum(1 for kw in kws if kw in text_lower)
        for name, kws in SCENARIO_KEYWORDS.items()
    }
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "generic"


def parse_query(query: str, scenario: str) -> ParsedQuery:
    text_lower = query.lower()
    return ParsedQuery(
        intent=SCENARIO_INTENT.get(scenario, "information_retrieval"),
        materials=_match_vocab(text_lower, MATERIALS),
        processes=_match_vocab(text_lower, PROCESSES),
        technologies=_match_vocab(text_lower, TECHNOLOGIES),
        properties=_match_vocab(text_lower, PROPERTIES),
        conditions=extract_conditions(query),
        geography=detect_geography(text_lower),  # type: ignore[arg-type]
        timeRange=detect_time_range(text_lower),
    )


# =============================================================================
# Фильтрация claims
# =============================================================================


def apply_filters(
    claims: list[EvidenceClaim], filters: QueryFilters | None,
    parsed: ParsedQuery,
) -> list[EvidenceClaim]:
    result = claims
    conf_rank = {"low": 0, "medium": 1, "high": 2}

    # временной диапазон из parsed query
    if parsed.timeRange:
        lo = parsed.timeRange.from_
        hi = parsed.timeRange.to
        result = [c for c in result if c.year is None or (
            (lo is None or c.year >= lo) and (hi is None or c.year <= hi))]

    # география из parsed query (если конкретизирована)
    if parsed.geography in ("domestic", "foreign"):
        result = [c for c in result
                  if c.geography in (parsed.geography, "mixed", "unknown")]

    if not filters:
        return result

    if filters.material:
        ml = filters.material.lower()
        result = [c for c in result
                  if any(ml in m.lower() for m in c.materials)]
    if filters.process:
        pl = filters.process.lower()
        result = [c for c in result if c.process and pl in c.process.lower()]
    if filters.geography and filters.geography != "all":
        geo = "domestic" if filters.geography in ("domestic", "russia") else filters.geography
        result = [c for c in result if c.geography in (geo, "mixed")]
    if filters.yearFrom:
        result = [c for c in result if c.year is None or c.year >= filters.yearFrom]
    if filters.yearTo:
        result = [c for c in result if c.year is None or c.year <= filters.yearTo]
    if filters.confidence:
        need = conf_rank[filters.confidence]
        result = [c for c in result if conf_rank[c.confidence] >= need]

    return result


# =============================================================================
# Построение графа знаний
# =============================================================================


def _node_id(prefix: str, label: str) -> str:
    slug = re.sub(r"[^a-zа-я0-9]+", "_", label.lower()).strip("_")
    return f"{prefix}:{slug}"[:60]


def build_graph(
    claims: list[EvidenceClaim],
    contradictions: list[Contradiction],
    gaps: list[KnowledgeGap],
) -> KnowledgeGraph:
    nodes: dict[str, GraphNode] = {}
    edges: list[GraphEdge] = []
    edge_ids: set[str] = set()

    def add_node(nid: str, label: str, ntype: str) -> str:
        if nid not in nodes:
            nodes[nid] = GraphNode(id=nid, label=label, type=ntype)  # type: ignore[arg-type]
        return nid

    def add_edge(src: str, tgt: str, relation: str) -> None:
        eid = f"{src}->{tgt}:{relation}"
        if eid in edge_ids:
            return
        edge_ids.add(eid)
        edges.append(GraphEdge(id=f"e{len(edges)}", source=src, target=tgt,
                               relation=relation))

    for claim in claims:
        cid = add_node(f"claim:{claim.claimId}", claim.claimId, "claim")

        for mat in claim.materials:
            mid = add_node(_node_id("mat", mat), mat, "material")
            add_edge(cid, mid, "mentions_material")
        if claim.process:
            pid = add_node(_node_id("proc", claim.process), claim.process, "process")
            add_edge(cid, pid, "applies_to")
        if claim.technology:
            tid = add_node(_node_id("tech", claim.technology), claim.technology,
                           "technology")
            add_edge(cid, tid, "uses_technology")
        for eq in claim.equipment:
            eqid = add_node(_node_id("eq", eq), eq, "equipment")
            add_edge(cid, eqid, "uses_equipment")
        for cond in claim.conditions:
            label = cond.rawValue
            condid = add_node(_node_id("cond", f"{cond.name}_{label}"), label, "condition")
            add_edge(cid, condid, "has_condition")
        if claim.effect:
            efid = add_node(_node_id("eff", claim.effect.property),
                            claim.effect.description, "effect")
            add_edge(cid, efid, f"has_effect:{claim.effect.direction}")
        # источник
        sid = add_node(f"source:{claim.source.documentId}",
                       claim.source.sourceName, "source")
        add_edge(cid, sid, "supported_by")

    for contr in contradictions:
        cnid = add_node(f"contr:{contr.id}", contr.title, "contradiction")
        add_edge(f"source:{contr.sourceA.documentId}", cnid, "involved_in")
        add_edge(f"source:{contr.sourceB.documentId}", cnid, "involved_in")

    for gap in gaps:
        gid = add_node(f"gap:{gap.id}", gap.title, "gap")
        # свяжем gap с первым процессом графа, если есть
        proc_nodes = [n for n in nodes.values() if n.type == "process"]
        if proc_nodes:
            add_edge(proc_nodes[0].id, gid, "has_gap")

    return KnowledgeGraph(nodes=list(nodes.values()), edges=edges)


# =============================================================================
# Синтез ответа
# =============================================================================

_SCENARIO_CONCLUSION = {
    "desalination": (
        "Для снижения сухого остатка до ≤1000 мг/дм³ применимы обратный осмос "
        "(основной метод) и нанофильтрация как предочистка; электродиализ "
        "ограниченно применим в холодном климате. Требуется проверка состава воды "
        "и режима эксплуатации.",
        "Рекомендуется схема «нанофильтрация → обратный осмос» с контролем "
        "сульфатного насыщения; электродиализ рассматривать только при температуре "
        "питающей воды выше 5 °C.",
    ),
    "catholyte": (
        "Оптимальная скорость циркуляции католита при электроэкстракции никеля по "
        "большинству источников лежит в диапазоне 0,3–0,5 м/с и снижает "
        "концентрационную поляризацию; при скоростях выше 0,6 м/с возможно "
        "ухудшение качества осадка.",
        "Поддерживать скорость циркуляции 0,35–0,45 м/с; при повышении скорости "
        "контролировать адгезию и морфологию катодного осадка.",
    ),
    "metals": (
        "Au и Ag преимущественно концентрируются в штейне; коэффициент "
        "распределения Pt между никелевым штейном и шлаком составляет 120–180 при "
        "1250–1300 °C. Данных за последние 5 лет по ряду комбинаций недостаточно.",
        "Для количественной оценки распределения Au/Ag рекомендуется провести "
        "дополнительные эксперименты при контролируемом кислородном потенциале.",
    ),
    "generic": (
        "По данному запросу найдено ограниченное число подтверждённых утверждений. "
        "Ответ носит частичный характер.",
        "Рекомендуется уточнить материалы, процесс и числовые условия запроса.",
    ),
}


def _compute_confidence(
    claims: list[EvidenceClaim], contradictions: list[Contradiction],
    gaps: list[KnowledgeGap],
) -> tuple[str, str, list[str]]:
    warnings: list[str] = []
    if not claims:
        return ("low", "Не найдено подтверждённых источников по запросу.",
                ["Нет источников — ответ не может считаться фактическим."])

    conf_rank = {"low": 1, "medium": 2, "high": 3}
    avg = sum(conf_rank[c.confidence] for c in claims) / len(claims)
    high_count = sum(1 for c in claims if c.confidence == "high")

    if avg >= 2.5 and len(claims) >= 3:
        level = "high"
    elif avg >= 1.8:
        level = "medium"
    else:
        level = "low"

    if contradictions:
        warnings.append(
            f"Обнаружены противоречия между источниками ({len(contradictions)}); "
            "часть выводов требует верификации.")
        if level == "high":
            level = "medium"
    if gaps:
        warn_gaps = [g for g in gaps if g.severity == "warning"]
        if warn_gaps:
            warnings.append(
                f"Есть пробелы в покрытии ({len(warn_gaps)}): часть комбинаций "
                "материал/процесс/условие не подтверждена источниками.")

    domestic = sum(1 for c in claims if c.geography == "domestic")
    foreign = sum(1 for c in claims if c.geography == "foreign")
    if foreign and not domestic:
        warnings.append("Все подтверждающие источники — зарубежные.")

    reason = (f"Найдено {len(claims)} claim(ов), из них {high_count} с высоким "
              f"уровнем достоверности; средний уровень — {level}.")
    if contradictions:
        reason += " Наличие противоречий снижает итоговую уверенность."
    return level, reason, warnings


def synthesize(scenario: str, claims: list[EvidenceClaim],
               contradictions: list[Contradiction],
               gaps: list[KnowledgeGap]) -> AnswerSummary:
    conclusion, recommendation = _SCENARIO_CONCLUSION.get(
        scenario, _SCENARIO_CONCLUSION["generic"])
    level, reason, warnings = _compute_confidence(claims, contradictions, gaps)
    if not claims:
        conclusion = ("По запросу не найдено подтверждённых источников. "
                      "Система не выдаёт факт без источника.")
    answer_status = level
    return AnswerSummary(
        shortConclusion=conclusion,
        recommendation=recommendation,
        confidence=level,  # type: ignore[arg-type]
        confidenceReason=reason,
        warnings=warnings,
    )


# =============================================================================
# Главная точка входа
# =============================================================================


def sources_for_claims(claims: list[EvidenceClaim]) -> list[Source]:
    doc_ids: list[str] = []
    for c in claims:
        if c.source.documentId not in doc_ids:
            doc_ids.append(c.source.documentId)
    return [data.SOURCES_BY_ID[d] for d in doc_ids if d in data.SOURCES_BY_ID]


def run_query(query: str, scenario_id: str | None = None,
              filters: QueryFilters | None = None) -> SearchResult:
    text_lower = query.lower()
    scenario = route_scenario(text_lower, scenario_id)

    parsed = parse_query(query, scenario)

    claims = data.claims_for(scenario)
    contradictions = data.contradictions_for(scenario)
    gaps = data.gaps_for(scenario)

    filtered = apply_filters(claims, filters, parsed)

    # если фильтры отсекли все claims — фиксируем это как пробел
    if not filtered and claims:
        gaps = gaps + [KnowledgeGap(
            id="gap_filtered",
            title="Нет источников под заданные фильтры",
            description="После применения фильтров (география/год/достоверность) "
            "не осталось подтверждающих claims. Ослабьте фильтры или расширьте запрос.",
            type="weak_coverage",
            severity="warning",
        )]

    # противоречия оставляем только если оба источника присутствуют в claims
    present_docs = {c.source.documentId for c in filtered}
    active_contradictions = [
        c for c in contradictions
        if c.sourceA.documentId in present_docs
        and c.sourceB.documentId in present_docs
    ] if filtered else []

    answer = synthesize(scenario, filtered, active_contradictions, gaps)
    graph = build_graph(filtered, active_contradictions, gaps)
    sources = sources_for_claims(filtered)

    return SearchResult(
        queryId=f"q_{uuid.uuid4().hex[:12]}",
        parsedQuery=parsed,
        answer=answer,
        evidence=filtered,
        graph=graph,
        gaps=gaps,
        contradictions=active_contradictions,
        sources=sources,
    )
