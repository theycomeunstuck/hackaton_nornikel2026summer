"""Демо-корпус «Научного клубка».

Реалистичные источники, claims, противоречия и пробелы для трёх демо-сценариев:
    - desalination  — обессоливание воды обогатительной фабрики;
    - catholyte     — циркуляция католита при электроэкстракции никеля;
    - metals        — распределение Au/Ag/МПГ между штейном и шлаком.

Каждый claim привязан к источнику (SourceRef), имеет условия, эффект и confidence.
Ни одного факта без источника — это ядро evidence-first платформы.
"""
from __future__ import annotations

from .models import (
    Condition,
    Contradiction,
    Effect,
    EvidenceClaim,
    KnowledgeGap,
    MemoryHistoryItem,
    ResearchMemoryDetails,
    ResearchMemoryItem,
    Source,
    SourceRef,
    UploadResponse,
)

# =============================================================================
# Источники
# =============================================================================

SOURCES: list[Source] = [
    # --- desalination ---
    Source(
        id="doc_001",
        documentId="doc_001",
        title="Water desalination for mineral processing plants: a review",
        type="publication",
        year=2021,
        language="en",
        geography="foreign",
        authors=["A. Kowalski", "M. Ferreira"],
        reliability="high",
        excerpt="Reverse osmosis reduces total dissolved solids below 1000 mg/L "
        "provided suspended solids and scaling ions are pre-treated.",
        url="https://example.org/water-desalination-review",
    ),
    Source(
        id="doc_002",
        documentId="doc_002",
        title="Пилотные испытания обратного осмоса на оборотной воде обогатительной фабрики",
        type="report",
        year=2023,
        language="ru",
        geography="russia",
        authors=["Иванова Е.С.", "Петров Д.А."],
        reliability="high",
        excerpt="При исходном солесодержании 200–300 мг/л по сульфатам и хлоридам "
        "обратный осмос обеспечил сухой остаток ≤1000 мг/дм³ при удельных "
        "затратах 2,8 кВт·ч/м³.",
        url="internal://reports/ro_pilot_2023.pdf",
    ),
    Source(
        id="doc_003",
        documentId="doc_003",
        title="Electrodialysis for brackish water in cold-climate concentrators",
        type="publication",
        year=2020,
        language="en",
        geography="foreign",
        authors=["S. Nielsen"],
        reliability="medium",
        excerpt="Electrodialysis is competitive for moderate salinity but energy "
        "demand rises sharply below 5 °C feed temperature.",
        url="https://example.org/electrodialysis-cold",
    ),
    Source(
        id="doc_004",
        documentId="doc_004",
        title="Способ доочистки шахтных вод нанофильтрацией",
        type="patent",
        year=2019,
        language="ru",
        geography="russia",
        authors=["ООО «ГидроТех»"],
        reliability="medium",
        excerpt="Нанофильтрация задерживает двухвалентные ионы (Ca²⁺, Mg²⁺, SO₄²⁻) "
        "при рабочем давлении 8–12 бар.",
        url="internal://patents/nf_2019.pdf",
    ),
    # --- catholyte ---
    Source(
        id="doc_014",
        documentId="doc_014",
        title="Nickel electrowinning: catholyte circulation review",
        type="publication",
        year=2022,
        language="en",
        geography="foreign",
        authors=["R. Zhang", "P. Andersson"],
        reliability="high",
        excerpt="A catholyte flow velocity of 0.3–0.5 m/s reduces concentration "
        "polarization during nickel electrowinning.",
        url="https://example.org/nickel-electrowinning-review",
    ),
    Source(
        id="doc_021",
        documentId="doc_021",
        title="Catholyte hydrodynamics and deposit stability study",
        type="experiment",
        year=2023,
        language="en",
        geography="foreign",
        authors=["L. Moreau"],
        reliability="high",
        excerpt="Above 0.6 m/s deposit adhesion and morphology may degrade despite "
        "lower polarization.",
        url="https://example.org/catholyte-hydrodynamics",
    ),
    Source(
        id="doc_022",
        documentId="doc_022",
        title="Опыт эксплуатации ванн электроэкстракции никеля",
        type="report",
        year=2021,
        language="ru",
        geography="russia",
        authors=["Сидоров К.В."],
        reliability="medium",
        excerpt="Принудительная циркуляция католита насосом с расходом, "
        "соответствующим 0,35–0,45 м/с, стабилизировала качество катодного осадка.",
        url="internal://reports/ew_operation_2021.pdf",
    ),
    # --- metals ---
    Source(
        id="doc_031",
        documentId="doc_031",
        title="Distribution of precious metals between matte and slag",
        type="publication",
        year=2022,
        language="en",
        geography="foreign",
        authors=["T. Yamamoto", "G. Rossi"],
        reliability="high",
        excerpt="Au and Ag partition strongly into copper matte; PGM distribution "
        "is sensitive to matte grade and oxygen potential.",
        url="https://example.org/pm-matte-slag",
    ),
    Source(
        id="doc_032",
        documentId="doc_032",
        title="Распределение МПГ между никелевым штейном и шлаком в условиях ПВП",
        type="experiment",
        year=2024,
        language="ru",
        geography="russia",
        authors=["Николаев А.П.", "Громова И.Л."],
        reliability="high",
        excerpt="Коэффициент распределения Pt между никелевым штейном и шлаком "
        "составил 120–180 при 1250–1300 °C.",
        url="internal://reports/pgm_distribution_2024.pdf",
    ),
    Source(
        id="doc_033",
        documentId="doc_033",
        title="Losses of silver to slag in flash smelting",
        type="publication",
        year=2018,
        language="en",
        geography="foreign",
        authors=["H. Berg"],
        reliability="medium",
        excerpt="Silver losses to slag increase with slag SiO2/Fe ratio.",
        url="https://example.org/ag-slag-losses",
    ),
]

SOURCES_BY_ID: dict[str, Source] = {s.id: s for s in SOURCES}


# =============================================================================
# Документы (для ingestion / dashboard)
# =============================================================================

DOCUMENTS: list[UploadResponse] = [
    UploadResponse(
        documentId=s.id,
        title=s.title,
        fileName=(s.url or f"{s.id}.pdf").split("/")[-1],
        fileType="pdf",
        status="processed",
        uploadedAt="2026-07-01T09:00:00Z",
    )
    for s in SOURCES
]


# =============================================================================
# Claims — ядро evidence index
# =============================================================================


def _claim(**kw) -> tuple[str, EvidenceClaim]:
    scenario = kw.pop("scenario")
    return scenario, EvidenceClaim(**kw)


CLAIM_RECORDS: list[tuple[str, EvidenceClaim]] = [
    # --- desalination ---
    _claim(
        scenario="desalination",
        claimId="claim_001",
        text="Обратный осмос применим для снижения сухого остатка воды до ≤1000 мг/дм³ "
        "при предварительном удалении взвесей и контроле солесодержания.",
        materials=["сульфаты", "хлориды", "Ca", "Mg", "Na"],
        process="обессоливание воды",
        technology="обратный осмос",
        equipment=["мембранный модуль", "насос высокого давления"],
        conditions=[
            Condition(name="сухой остаток", operator="lte", value=1000,
                      unit="мг/дм³", rawValue="≤1000 мг/дм³"),
            Condition(name="концентрация солей", operator="range", min=200, max=300,
                      unit="мг/л", rawValue="200–300 мг/л"),
        ],
        effect=Effect(property="сухой остаток", direction="decrease",
                      description="снижает сухой остаток до целевого уровня"),
        source=SourceRef(documentId="doc_002", chunkId="doc_002_p04_c02",
                         sourceName="ro_pilot_2023.pdf", page=4),
        confidence="high",
        geography="domestic",
        year=2023,
    ),
    _claim(
        scenario="desalination",
        claimId="claim_002",
        text="Нанофильтрация задерживает двухвалентные ионы (Ca²⁺, Mg²⁺, SO₄²⁻) "
        "при рабочем давлении 8–12 бар и может использоваться как предочистка перед RO.",
        materials=["Ca", "Mg", "сульфаты"],
        process="обессоливание воды",
        technology="нанофильтрация",
        equipment=["нанофильтрационная мембрана"],
        conditions=[
            Condition(name="рабочее давление", operator="range", min=8, max=12,
                      unit="бар", rawValue="8–12 бар"),
        ],
        effect=Effect(property="жёсткость", direction="decrease",
                      description="удаляет двухвалентные ионы"),
        source=SourceRef(documentId="doc_004", chunkId="doc_004_p02_c01",
                         sourceName="nf_2019.pdf", page=2),
        confidence="medium",
        geography="domestic",
        year=2019,
    ),
    _claim(
        scenario="desalination",
        claimId="claim_003",
        text="Электродиализ конкурентоспособен при умеренной минерализации, однако "
        "энергозатраты резко растут при температуре питающей воды ниже 5 °C.",
        materials=["сульфаты", "хлориды"],
        process="обессоливание воды",
        technology="электродиализ",
        equipment=["электродиализный аппарат"],
        conditions=[
            Condition(name="температура воды", operator="lt", value=5,
                      unit="°C", rawValue="< 5 °C"),
        ],
        effect=Effect(property="энергозатраты", direction="increase",
                      description="рост энергозатрат в холодном климате"),
        source=SourceRef(documentId="doc_003", chunkId="doc_003_p07_c03",
                         sourceName="electrodialysis-cold", page=7),
        confidence="medium",
        geography="foreign",
        year=2020,
    ),
    _claim(
        scenario="desalination",
        claimId="claim_004",
        text="Reverse osmosis reliably achieves TDS below 1000 mg/L when scaling ions "
        "are pre-treated; recovery is limited by sulfate saturation.",
        materials=["сульфаты", "Ca"],
        process="обессоливание воды",
        technology="обратный осмос",
        equipment=["мембранный модуль"],
        conditions=[
            Condition(name="сухой остаток", operator="lt", value=1000,
                      unit="mg/L", rawValue="below 1000 mg/L"),
        ],
        effect=Effect(property="сухой остаток", direction="decrease",
                      description="reliably reduces TDS"),
        source=SourceRef(documentId="doc_001", chunkId="doc_001_p11_c04",
                         sourceName="water-desalination-review", page=11),
        confidence="high",
        geography="foreign",
        year=2021,
    ),
    # --- catholyte ---
    _claim(
        scenario="catholyte",
        claimId="claim_010",
        text="Скорость циркуляции католита 0,3–0,5 м/с снижает концентрационную "
        "поляризацию при электроэкстракции никеля.",
        materials=["никель", "католит"],
        process="электроэкстракция никеля",
        technology="циркуляция католита",
        equipment=["ванна электроэкстракции", "циркуляционный насос"],
        conditions=[
            Condition(name="скорость потока", operator="range", min=0.3, max=0.5,
                      unit="м/с", rawValue="0,3–0,5 м/с"),
        ],
        effect=Effect(property="концентрационная поляризация", direction="decrease",
                      description="снижает концентрационную поляризацию"),
        source=SourceRef(documentId="doc_014", chunkId="doc_014_p12_c03",
                         sourceName="nickel_electrowinning_review.pdf", page=12),
        confidence="high",
        geography="foreign",
        year=2022,
    ),
    _claim(
        scenario="catholyte",
        claimId="claim_011",
        text="При скорости циркуляции выше 0,6 м/с возможно ухудшение адгезии и "
        "морфологии катодного осадка, несмотря на снижение поляризации.",
        materials=["никель", "католит"],
        process="электроэкстракция никеля",
        technology="циркуляция католита",
        equipment=["ванна электроэкстракции"],
        conditions=[
            Condition(name="скорость потока", operator="gt", value=0.6,
                      unit="м/с", rawValue="> 0,6 м/с"),
        ],
        effect=Effect(property="стабильность осадка", direction="worsen",
                      description="ухудшение адгезии и морфологии осадка"),
        source=SourceRef(documentId="doc_021", chunkId="doc_021_p08_c02",
                         sourceName="catholyte_hydrodynamics_study.pdf", page=8),
        confidence="high",
        geography="foreign",
        year=2023,
    ),
    _claim(
        scenario="catholyte",
        claimId="claim_012",
        text="Принудительная циркуляция католита насосом с расходом, соответствующим "
        "0,35–0,45 м/с, стабилизировала качество катодного осадка на промышленных ваннах.",
        materials=["никель", "католит"],
        process="электроэкстракция никеля",
        technology="принудительная циркуляция",
        equipment=["циркуляционный насос", "ванна электроэкстракции"],
        conditions=[
            Condition(name="скорость потока", operator="range", min=0.35, max=0.45,
                      unit="м/с", rawValue="0,35–0,45 м/с"),
        ],
        effect=Effect(property="качество осадка", direction="improve",
                      description="стабилизация качества катодного осадка"),
        source=SourceRef(documentId="doc_022", chunkId="doc_022_p05_c01",
                         sourceName="ew_operation_2021.pdf", page=5),
        confidence="medium",
        geography="domestic",
        year=2021,
    ),
    # --- metals ---
    _claim(
        scenario="metals",
        claimId="claim_020",
        text="Au и Ag преимущественно концентрируются в медном штейне; распределение "
        "МПГ чувствительно к степени десульфуризации штейна и кислородному потенциалу.",
        materials=["Au", "Ag", "МПГ", "медный штейн", "шлак"],
        process="распределение металлов",
        technology="плавка на штейн",
        equipment=["печь взвешенной плавки"],
        conditions=[
            Condition(name="кислородный потенциал", operator="unknown",
                      rawValue="варьируется по режиму"),
        ],
        effect=Effect(property="извлечение в штейн", direction="increase",
                      description="концентрирование Au/Ag в штейне"),
        source=SourceRef(documentId="doc_031", chunkId="doc_031_p09_c02",
                         sourceName="pm-matte-slag", page=9),
        confidence="high",
        geography="foreign",
        year=2022,
    ),
    _claim(
        scenario="metals",
        claimId="claim_021",
        text="Коэффициент распределения Pt между никелевым штейном и шлаком составил "
        "120–180 при температуре 1250–1300 °C.",
        materials=["Pt", "МПГ", "никелевый штейн", "шлак"],
        process="распределение металлов",
        technology="печь взвешенной плавки",
        equipment=["печь взвешенной плавки"],
        conditions=[
            Condition(name="коэффициент распределения Pt", operator="range",
                      min=120, max=180, unit="", rawValue="120–180"),
            Condition(name="температура", operator="range", min=1250, max=1300,
                      unit="°C", rawValue="1250–1300 °C"),
        ],
        effect=Effect(property="распределение Pt", direction="increase",
                      description="высокий переход Pt в штейн"),
        source=SourceRef(documentId="doc_032", chunkId="doc_032_p03_c01",
                         sourceName="pgm_distribution_2024.pdf", page=3),
        confidence="high",
        geography="domestic",
        year=2024,
    ),
    _claim(
        scenario="metals",
        claimId="claim_022",
        text="Потери серебра со шлаком возрастают при повышении отношения SiO₂/Fe в шлаке.",
        materials=["Ag", "шлак"],
        process="распределение металлов",
        technology="плавка на штейн",
        equipment=[],
        conditions=[
            Condition(name="отношение SiO₂/Fe", operator="unknown",
                      rawValue="повышенное"),
        ],
        effect=Effect(property="потери Ag со шлаком", direction="increase",
                      description="рост потерь серебра"),
        source=SourceRef(documentId="doc_033", chunkId="doc_033_p06_c02",
                         sourceName="ag-slag-losses", page=6),
        confidence="medium",
        geography="foreign",
        year=2018,
    ),
]


def claims_for(scenario: str) -> list[EvidenceClaim]:
    return [c for s, c in CLAIM_RECORDS if s == scenario]


ALL_CLAIMS: list[EvidenceClaim] = [c for _, c in CLAIM_RECORDS]


# =============================================================================
# Противоречия
# =============================================================================

CONTRADICTION_RECORDS: list[tuple[str, Contradiction]] = [
    (
        "catholyte",
        Contradiction(
            id="contr_001",
            title="Разные оценки оптимальной скорости циркуляции католита",
            description="Один источник сообщает о снижении поляризации при 0,3–0,5 м/с, "
            "другой указывает на ухудшение стабильности осадка при скоростях выше 0,6 м/с. "
            "Возможная причина — разные составы электролита и режимы электроэкстракции.",
            sourceA=SourceRef(documentId="doc_014", chunkId="doc_014_p12_c03",
                              sourceName="nickel_electrowinning_review.pdf", page=12),
            sourceB=SourceRef(documentId="doc_021", chunkId="doc_021_p08_c02",
                              sourceName="catholyte_hydrodynamics_study.pdf", page=8),
            status="possible",
        ),
    ),
    (
        "desalination",
        Contradiction(
            id="contr_002",
            title="Применимость электродиализа в холодном климате",
            description="Зарубежный источник отмечает конкурентоспособность электродиализа, "
            "но с оговоркой о резком росте энергозатрат при температуре воды ниже 5 °C, "
            "что ограничивает применимость в условиях обогатительных фабрик Крайнего Севера.",
            sourceA=SourceRef(documentId="doc_003", chunkId="doc_003_p07_c03",
                              sourceName="electrodialysis-cold", page=7),
            sourceB=SourceRef(documentId="doc_002", chunkId="doc_002_p04_c02",
                              sourceName="ro_pilot_2023.pdf", page=4),
            status="needs_review",
        ),
    ),
]


def contradictions_for(scenario: str) -> list[Contradiction]:
    return [c for s, c in CONTRADICTION_RECORDS if s == scenario]


ALL_CONTRADICTIONS: list[Contradiction] = [c for _, c in CONTRADICTION_RECORDS]


# =============================================================================
# Пробелы в знаниях
# =============================================================================

GAP_RECORDS: list[tuple[str, KnowledgeGap]] = [
    (
        "desalination",
        KnowledgeGap(
            id="gap_001",
            title="Нет данных по конкретной комбинации ионов в холодном климате",
            description="Мало источников по совместному присутствию сульфатов, хлоридов, "
            "Ca, Mg, Na в диапазоне 200–300 мг/л при низкой температуре питающей воды.",
            type="missing_combination",
            severity="warning",
        ),
    ),
    (
        "desalination",
        KnowledgeGap(
            id="gap_002",
            title="Недостаточно технико-экономических показателей",
            description="Для отечественных решений мало данных по удельным затратам "
            "и стоимости жизненного цикла установок обессоливания.",
            type="missing_numeric_data",
            severity="info",
        ),
    ),
    (
        "catholyte",
        KnowledgeGap(
            id="gap_010",
            title="Слабое покрытие отечественной практики свежими источниками",
            description="Большинство детальных данных по гидродинамике католита — "
            "зарубежные; отечественных публикаций за последние 3 года мало.",
            type="weak_coverage",
            severity="warning",
        ),
    ),
    (
        "metals",
        KnowledgeGap(
            id="gap_020",
            title="Мало свежих источников по распределению МПГ (последние 5 лет)",
            description="Недостаточно источников за 2020–2025 гг. по распределению "
            "Au, Ag и МПГ между медным/никелевым штейном и шлаком при заданных "
            "температурных условиях.",
            type="missing_recent_sources",
            severity="warning",
        ),
    ),
    (
        "metals",
        KnowledgeGap(
            id="gap_021",
            title="Нет числовых коэффициентов распределения для Au и Ag",
            description="Для золота и серебра доступны качественные выводы, но мало "
            "количественных коэффициентов распределения при разных режимах плавки.",
            type="missing_numeric_data",
            severity="info",
        ),
    ),
]


def gaps_for(scenario: str) -> list[KnowledgeGap]:
    return [g for s, g in GAP_RECORDS if s == scenario]


ALL_GAPS: list[KnowledgeGap] = [g for _, g in GAP_RECORDS]


# =============================================================================
# Research Memory (evidence index)
# =============================================================================

MEMORY_ITEMS: list[ResearchMemoryItem] = [
    ResearchMemoryItem(
        id="mem_001",
        topic="Обессоливание оборотной воды обогатительной фабрики",
        claim="Обратный осмос обеспечивает сухой остаток ≤1000 мг/дм³ при предочистке.",
        domain="ecology",
        status="confirmed",
        confidence="high",
        supportingSourcesCount=3,
        contradictingSourcesCount=0,
        lastUpdated="2026-06-28",
        gaps=["Мало данных по холодному климату"],
        relatedMaterials=["сульфаты", "хлориды", "Ca", "Mg", "Na"],
        relatedProcesses=["обессоливание воды"],
    ),
    ResearchMemoryItem(
        id="mem_002",
        topic="Оптимальная скорость циркуляции католита",
        claim="Оптимум скорости циркуляции католита лежит в области 0,3–0,5 м/с.",
        domain="hydrometallurgy",
        status="conflicting",
        confidence="medium",
        supportingSourcesCount=2,
        contradictingSourcesCount=1,
        lastUpdated="2026-06-30",
        gaps=["Разные режимы электролита не сопоставлены"],
        relatedMaterials=["никель", "католит"],
        relatedProcesses=["электроэкстракция никеля"],
    ),
    ResearchMemoryItem(
        id="mem_003",
        topic="Распределение МПГ между штейном и шлаком",
        claim="Коэффициент распределения Pt никелевый штейн/шлак составляет 120–180.",
        domain="pyrometallurgy",
        status="weakly_supported",
        confidence="medium",
        supportingSourcesCount=2,
        contradictingSourcesCount=0,
        lastUpdated="2026-07-02",
        gaps=["Мало свежих источников по Au/Ag"],
        relatedMaterials=["Au", "Ag", "МПГ", "штейн", "шлак"],
        relatedProcesses=["распределение металлов"],
    ),
]

MEMORY_BY_ID: dict[str, ResearchMemoryItem] = {m.id: m for m in MEMORY_ITEMS}

_MEMORY_SCENARIO = {
    "mem_001": "desalination",
    "mem_002": "catholyte",
    "mem_003": "metals",
}

_MEMORY_HISTORY = {
    "mem_001": [
        MemoryHistoryItem(date="2026-05-10", event="Создан по итогам пилотных испытаний",
                          changedBy="Иванова Е.С."),
        MemoryHistoryItem(date="2026-06-28", event="Добавлен зарубежный обзор 2021 г."),
    ],
    "mem_002": [
        MemoryHistoryItem(date="2026-06-15", event="Создан по обзору 2022 г."),
        MemoryHistoryItem(date="2026-06-30", event="Зафиксировано противоречие contr_001",
                          changedBy="Аналитик"),
    ],
    "mem_003": [
        MemoryHistoryItem(date="2026-07-02", event="Добавлен эксперимент 2024 г."),
    ],
}


def memory_details(memory_id: str) -> ResearchMemoryDetails | None:
    item = MEMORY_BY_ID.get(memory_id)
    if item is None:
        return None
    scenario = _MEMORY_SCENARIO.get(memory_id, "")
    claims = claims_for(scenario)
    supporting_doc_ids = {c.source.documentId for c in claims}
    supporting = [SOURCES_BY_ID[d] for d in supporting_doc_ids if d in SOURCES_BY_ID]
    contradicting: list[Source] = []
    for contr in contradictions_for(scenario):
        for ref in (contr.sourceA, contr.sourceB):
            src = SOURCES_BY_ID.get(ref.documentId)
            if src and src not in supporting:
                contradicting.append(src)
    return ResearchMemoryDetails(
        **item.model_dump(),
        supportingSources=supporting,
        contradictingSources=contradicting,
        history=_MEMORY_HISTORY.get(memory_id, []),
    )
