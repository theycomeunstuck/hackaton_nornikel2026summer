import type { EvidenceClaim } from "../../entities/claim/types";
import type { SearchResult } from "../types/search";
import { nickelContradictions, pgmContradictions, waterContradictions } from "./contradictions.mock";
import { nickelGaps, pgmGaps, waterGaps } from "./gaps.mock";
import { nickelCatholyteGraph, pgmMatteSlagGraph, waterDesalinationGraph } from "./graph.mock";
import { mockSources, sourceRefs } from "./sources.mock";

const waterSources = mockSources.filter((source) =>
  ["src-water-pilot-2024", "src-water-membrane-2022"].includes(source.id),
);

const nickelSources = mockSources.filter((source) =>
  ["src-nickel-catholyte-2023", "src-nickel-hydrodynamics-2021"].includes(source.id),
);

const pgmSources = mockSources.filter((source) =>
  ["src-pgm-distribution-2024", "src-pgm-furnace-2020"].includes(source.id),
);

const waterEvidence: EvidenceClaim[] = [
  {
    id: "claim-water-feed-composition",
    scenarioId: "water-desalination",
    claimType: "material_behavior",
    statement:
      "Исходная вода с сульфатами и хлоридами 200-300 mg/l относится к умеренно минерализованному sulfate-chloride feed и требует контроля Ca/Mg перед мембранной стадией.",
    confidence: "high",
    confidenceReason: "Пилотный отчет содержит прямой анализ состава feed water и повторные замеры по ионам.",
    sourceRef: sourceRefs.waterPilotPage12,
    conditions: [
      {
        id: "cond-water-sulfates",
        kind: "concentration",
        parameter: "sulfates",
        operator: "range",
        minValue: 200,
        maxValue: 300,
        unit: "mg/l",
        material: "mine water",
      },
      {
        id: "cond-water-chlorides",
        kind: "concentration",
        parameter: "chlorides",
        operator: "range",
        minValue: 200,
        maxValue: 300,
        unit: "mg/l",
        material: "mine water",
      },
    ],
    effects: [
      {
        id: "effect-water-scaling-risk",
        target: "membrane scaling risk",
        direction: "risk",
        description: "Ca and Mg increase scaling risk without pretreatment.",
      },
    ],
    materials: ["sulfates", "chlorides", "Ca", "Mg", "Na"],
    processes: ["feed characterization"],
    equipment: [],
    year: 2024,
  },
  {
    id: "claim-water-dry-residue-target",
    scenarioId: "water-desalination",
    claimType: "parameter_range",
    statement:
      "Требование dry residue <=1000 mg/dm3 достижимо при комбинированной схеме с мембранным обессоливанием и polishing stage.",
    confidence: "medium",
    confidenceReason: "Вывод подтвержден статьей по комбинированным схемам, но зависит от recovery и antiscalant режима.",
    sourceRef: sourceRefs.waterMembranePage7,
    conditions: [
      {
        id: "cond-water-dry-residue",
        kind: "dry_residue",
        parameter: "dry residue",
        operator: "less_than_or_equal",
        value: 1000,
        unit: "mg/dm3",
        material: "treated water",
      },
    ],
    effects: [
      {
        id: "effect-water-target-enable",
        target: "treated water quality",
        direction: "enable",
        description: "Combined treatment route enables dry residue target.",
      },
    ],
    materials: ["treated water"],
    processes: ["reverse osmosis", "ion exchange polishing"],
    equipment: ["RO membrane unit", "ion exchange column"],
    year: 2022,
  },
  {
    id: "claim-water-technology-route",
    scenarioId: "water-desalination",
    claimType: "technology_selection",
    statement:
      "Для заданного состава наиболее обоснована технологическая связка softening/antiscalant control, reverse osmosis и ion-exchange polishing.",
    confidence: "high",
    confidenceReason: "Пилотный screening сравнивает одиночные и комбинированные маршруты на близком составе воды.",
    sourceRef: sourceRefs.waterPilotPage18,
    conditions: [
      {
        id: "cond-water-hardness-ions",
        kind: "composition",
        parameter: "Ca/Mg/Na presence",
        operator: "equals",
        unit: "present",
        material: "mine water",
        note: "Structured as qualitative composition condition.",
      },
    ],
    effects: [
      {
        id: "effect-water-route-stabilize",
        target: "technology selection",
        direction: "stabilize",
        description: "Pretreatment reduces scaling pressure on RO membranes.",
      },
    ],
    materials: ["Ca", "Mg", "Na", "mine water"],
    processes: ["softening", "reverse osmosis", "ion exchange polishing"],
    equipment: ["clarifier", "RO membrane unit", "ion exchange column"],
    year: 2024,
  },
  {
    id: "claim-water-ion-exchange-polishing",
    scenarioId: "water-desalination",
    claimType: "process_effect",
    statement:
      "Ion-exchange polishing is most useful after membrane desalination when residual hardness and sodium leakage must be reduced before reuse.",
    confidence: "medium",
    confidenceReason: "Evidence is indirect but consistent with process water polishing cases.",
    sourceRef: sourceRefs.waterMembranePage7,
    conditions: [],
    effects: [
      {
        id: "effect-water-polishing-decrease",
        target: "residual ionic load",
        direction: "decrease",
        description: "Polishing decreases residual ions after RO.",
      },
    ],
    materials: ["Ca", "Mg", "Na"],
    processes: ["ion exchange polishing"],
    equipment: ["ion exchange column"],
    year: 2022,
  },
];

const nickelEvidence: EvidenceClaim[] = [
  {
    id: "claim-nickel-optimal-range",
    scenarioId: "nickel-catholyte-circulation",
    claimType: "parameter_range",
    statement:
      "В пилотной ячейке диапазон скорости циркуляции католита 0.25-0.45 m/s поддерживал стабильный массоперенос при электроэкстракции никеля.",
    confidence: "high",
    confidenceReason: "Экспериментальный протокол содержит серию режимов с сопоставимыми токовыми нагрузками.",
    sourceRef: sourceRefs.nickelCatholytePage9,
    conditions: [
      {
        id: "cond-nickel-flow-velocity",
        kind: "flow_velocity",
        parameter: "catholyte flow velocity",
        operator: "range",
        minValue: 0.25,
        maxValue: 0.45,
        unit: "m/s",
        material: "catholyte",
      },
    ],
    effects: [
      {
        id: "effect-nickel-mass-transfer",
        target: "mass transfer",
        direction: "stabilize",
        description: "Circulation stabilizes nickel ion delivery near cathode surface.",
      },
    ],
    materials: ["nickel catholyte", "Ni2+"],
    processes: ["nickel electrowinning", "catholyte circulation"],
    equipment: ["electrowinning cell", "circulation pump"],
    year: 2023,
  },
  {
    id: "claim-nickel-deposit-quality",
    scenarioId: "nickel-catholyte-circulation",
    claimType: "process_effect",
    statement:
      "Повышение циркуляции до среднего диапазона снижало локальное истощение Ni2+ и улучшало равномерность катодного осадка.",
    confidence: "medium",
    confidenceReason: "Качество осадка описано через visual inspection и variation trend, но без полной статистики дефектов.",
    sourceRef: sourceRefs.nickelCatholytePage21,
    conditions: [
      {
        id: "cond-nickel-middle-range",
        kind: "flow_velocity",
        parameter: "catholyte flow velocity",
        operator: "range",
        minValue: 0.3,
        maxValue: 0.4,
        unit: "m/s",
        material: "catholyte",
      },
    ],
    effects: [
      {
        id: "effect-nickel-deposit-stabilize",
        target: "cathode deposit quality",
        direction: "stabilize",
        description: "More uniform flow decreases edge depletion risk.",
      },
    ],
    materials: ["nickel catholyte"],
    processes: ["electrodeposition"],
    equipment: ["cathode cell"],
    year: 2023,
  },
  {
    id: "claim-nickel-upper-limit",
    scenarioId: "nickel-catholyte-circulation",
    claimType: "equipment_requirement",
    statement:
      "Для части геометрий ячейки скорость выше 0.35 m/s может создавать локальную турбулентность и ухудшать поверхность осадка.",
    confidence: "medium",
    confidenceReason: "Статья обобщает несколько конфигураций ячеек, но не полностью совпадает с пилотным стендом.",
    sourceRef: sourceRefs.nickelHydroPage11,
    conditions: [
      {
        id: "cond-nickel-upper-limit",
        kind: "flow_velocity",
        parameter: "catholyte flow velocity",
        operator: "greater_than",
        value: 0.35,
        unit: "m/s",
        material: "catholyte",
      },
    ],
    effects: [
      {
        id: "effect-nickel-turbulence-risk",
        target: "cathode edge turbulence",
        direction: "risk",
        description: "Higher velocity may create non-uniform local hydrodynamics.",
      },
    ],
    materials: ["nickel catholyte"],
    processes: ["catholyte circulation"],
    equipment: ["cathode cell", "circulation pump"],
    year: 2021,
  },
  {
    id: "claim-nickel-pump-control",
    scenarioId: "nickel-catholyte-circulation",
    claimType: "equipment_requirement",
    statement:
      "Регулируемый насос и контроль распределения потока нужны, чтобы удерживать velocity window без локального short-circuiting.",
    confidence: "medium",
    confidenceReason: "Вывод поддержан hydrodynamic review и согласуется с пилотной настройкой насосов.",
    sourceRef: sourceRefs.nickelHydroPage11,
    conditions: [
      {
        id: "cond-nickel-pump-setting",
        kind: "equipment_setting",
        parameter: "pump speed control",
        operator: "equals",
        unit: "available",
        note: "Pump must support adjustable operating range.",
      },
    ],
    effects: [
      {
        id: "effect-nickel-flow-stabilize",
        target: "cell flow distribution",
        direction: "stabilize",
        description: "Adjustable pump control stabilizes circulation profile.",
      },
    ],
    materials: ["catholyte"],
    processes: ["catholyte circulation"],
    equipment: ["variable-speed circulation pump"],
    year: 2021,
  },
];

const pgmEvidence: EvidenceClaim[] = [
  {
    id: "claim-pgm-matte-affinity",
    scenarioId: "pgm-matte-slag-distribution",
    claimType: "material_behavior",
    statement:
      "Au, Ag и PGM преимущественно распределяются в matte phase, а не в slag, при типичных условиях nickel-copper smelting.",
    confidence: "high",
    confidenceReason: "Публикация 2024 года приводит коэффициенты распределения и сравнение с pilot observations.",
    sourceRef: sourceRefs.pgmDistributionPage6,
    conditions: [
      {
        id: "cond-pgm-time-scope",
        kind: "time",
        parameter: "publication window",
        operator: "greater_than_or_equal",
        value: 2021,
        unit: "year",
      },
    ],
    effects: [
      {
        id: "effect-pgm-matte-increase",
        target: "precious metal recovery to matte",
        direction: "increase",
        description: "Precious metals show high matte affinity.",
      },
    ],
    materials: ["Au", "Ag", "PGM / МПГ", "copper matte", "nickel matte", "slag"],
    processes: ["matte-slag separation"],
    equipment: ["smelting furnace"],
    year: 2024,
  },
  {
    id: "claim-pgm-slag-chemistry",
    scenarioId: "pgm-matte-slag-distribution",
    claimType: "process_effect",
    statement:
      "Состав шлака, особенно FeO/SiO2 ratio, влияет на потери Ag и части PGM в slag phase.",
    confidence: "medium",
    confidenceReason: "Sensitivity shown experimentally, but exact coefficients vary by matte composition.",
    sourceRef: sourceRefs.pgmDistributionPage10,
    conditions: [
      {
        id: "cond-pgm-slag-ratio",
        kind: "ratio",
        parameter: "FeO/SiO2",
        operator: "approximately",
        value: 1.2,
        unit: "ratio",
        material: "slag",
      },
    ],
    effects: [
      {
        id: "effect-pgm-slag-loss-risk",
        target: "Ag and PGM slag losses",
        direction: "risk",
        description: "Slag chemistry can increase precious metal entrainment or dissolution.",
      },
    ],
    materials: ["Ag", "PGM / МПГ", "slag"],
    processes: ["smelting", "slag cleaning"],
    equipment: ["furnace"],
    year: 2024,
  },
  {
    id: "claim-pgm-copper-vs-nickel-matte",
    scenarioId: "pgm-matte-slag-distribution",
    claimType: "material_behavior",
    statement:
      "Copper matte generally captures Au and Ag more strongly, while nickel matte behavior is more sensitive to sulfur potential and matte grade.",
    confidence: "medium",
    confidenceReason: "Internal pilot observations are realistic but older than the preferred five-year evidence window.",
    sourceRef: sourceRefs.pgmFurnacePage24,
    conditions: [
      {
        id: "cond-pgm-matte-grade",
        kind: "composition",
        parameter: "matte grade",
        operator: "range",
        minValue: 35,
        maxValue: 55,
        unit: "% metal",
        material: "copper/nickel matte",
      },
    ],
    effects: [
      {
        id: "effect-pgm-capture-stabilize",
        target: "Au and Ag capture",
        direction: "stabilize",
        description: "Higher copper matte affinity stabilizes Au and Ag recovery.",
      },
    ],
    materials: ["Au", "Ag", "copper matte", "nickel matte"],
    processes: ["matte formation"],
    equipment: ["pilot furnace"],
    year: 2020,
  },
  {
    id: "claim-pgm-recent-evidence-limitation",
    scenarioId: "pgm-matte-slag-distribution",
    claimType: "source_limitation",
    statement:
      "За последние 5 лет хорошо покрыты лабораторные публикации, но не хватает сопоставимых pilot campaigns по одному диапазону шлаковой химии.",
    confidence: "high",
    confidenceReason: "Сравнение источников показывает разрыв между свежими публикациями и более старым пилотным отчетом.",
    sourceRef: sourceRefs.pgmDistributionPage10,
    conditions: [
      {
        id: "cond-pgm-last-five-years",
        kind: "time",
        parameter: "evidence recency",
        operator: "range",
        minValue: 2021,
        maxValue: 2026,
        unit: "year",
      },
    ],
    effects: [
      {
        id: "effect-pgm-gap-risk",
        target: "scale-up confidence",
        direction: "risk",
        description: "Limited recent pilot data reduces scale-up confidence.",
      },
    ],
    materials: ["Au", "Ag", "PGM / МПГ", "slag"],
    processes: ["matte-slag separation", "pilot smelting"],
    equipment: ["pilot furnace"],
    year: 2024,
  },
];

export const waterDesalinationResult: SearchResult = {
  id: "result-water-desalination",
  scenarioId: "water-desalination",
  title: "Обессоливание воды",
  parsedQuery: {
    id: "parsed-water-desalination",
    originalText:
      "Какая технология подходит для обессоливания воды с сульфатами и хлоридами 200-300 мг/л, Ca/Mg/Na и сухим остатком не выше 1000 мг/дм3?",
    normalizedQuestion:
      "Select a desalination route for sulfate-chloride mine water with Ca/Mg/Na and dry residue target <=1000 mg/dm3.",
    domain: "water_treatment",
    intent: "technology_selection",
    materials: ["sulfates", "chlorides", "Ca", "Mg", "Na", "mine water"],
    processes: ["softening", "reverse osmosis", "ion exchange polishing"],
    equipment: ["RO membrane unit", "ion exchange column"],
    targetParameters: ["dry residue", "sulfates", "chlorides", "hardness ions"],
    numericConditions: [
      {
        id: "parsed-cond-water-sulfates",
        kind: "concentration",
        parameter: "sulfates",
        operator: "range",
        minValue: 200,
        maxValue: 300,
        unit: "mg/l",
      },
      {
        id: "parsed-cond-water-chlorides",
        kind: "concentration",
        parameter: "chlorides",
        operator: "range",
        minValue: 200,
        maxValue: 300,
        unit: "mg/l",
      },
      {
        id: "parsed-cond-water-dry-residue",
        kind: "dry_residue",
        parameter: "dry residue",
        operator: "less_than_or_equal",
        value: 1000,
        unit: "mg/dm3",
      },
    ],
  },
  answer: {
    shortConclusion:
      "Наиболее обоснована комбинированная схема: контроль накипеобразования, reverse osmosis и ion-exchange polishing для достижения dry residue <=1000 mg/dm3.",
    confidence: "medium",
    confidenceReason:
      "Есть прямой пилотный источник и статья по маршрутам, но долгосрочный fouling при Ca/Mg требует проверки.",
    keyFindings: [
      "Sulfates and chlorides 200-300 mg/l fit a moderate sulfate-chloride feed profile.",
      "Dry residue target is reachable only with combined treatment rather than a single polishing step.",
      "Ca and Mg create scaling risk and should be controlled before RO.",
    ],
    limitations: ["Long-term membrane fouling evidence is incomplete."],
  },
  evidence: waterEvidence,
  graph: waterDesalinationGraph,
  contradictions: waterContradictions,
  gaps: waterGaps,
  sources: waterSources,
  generatedAt: "2026-07-03T08:00:00.000Z",
};

export const nickelCatholyteResult: SearchResult = {
  id: "result-nickel-catholyte-circulation",
  scenarioId: "nickel-catholyte-circulation",
  title: "Циркуляция католита при электроэкстракции никеля",
  parsedQuery: {
    id: "parsed-nickel-catholyte",
    originalText:
      "Какой диапазон скорости циркуляции католита оптимален при электроэкстракции никеля и где есть противоречия в источниках?",
    normalizedQuestion:
      "Find catholyte circulation velocity range for nickel electrowinning and identify source contradictions.",
    domain: "nickel_electrowinning",
    intent: "parameter_optimization",
    materials: ["nickel catholyte", "Ni2+"],
    processes: ["nickel electrowinning", "catholyte circulation", "electrodeposition"],
    equipment: ["electrowinning cell", "circulation pump", "cathode cell"],
    targetParameters: ["flow velocity", "deposit quality", "pump control"],
    numericConditions: [
      {
        id: "parsed-cond-nickel-flow",
        kind: "flow_velocity",
        parameter: "catholyte flow velocity",
        operator: "range",
        minValue: 0.25,
        maxValue: 0.45,
        unit: "m/s",
      },
    ],
  },
  answer: {
    shortConclusion:
      "Рабочее окно 0.25-0.45 m/s поддержано пилотными данными, но для части геометрий безопаснее проверять верхний предел около 0.35 m/s.",
    confidence: "medium",
    confidenceReason:
      "Пилотные данные сильные, но есть структурированное противоречие с обзором гидродинамических ограничений.",
    keyFindings: [
      "Средний диапазон 0.30-0.40 m/s связан с более равномерным катодным осадком.",
      "Регулируемый насос нужен для удержания velocity window.",
      "Верхняя граница зависит от геометрии ячейки и локальной турбулентности.",
    ],
    limitations: ["Нужно сопоставить источники с конкретной геометрией промышленной ячейки."],
  },
  evidence: nickelEvidence,
  graph: nickelCatholyteGraph,
  contradictions: nickelContradictions,
  gaps: nickelGaps,
  sources: nickelSources,
  generatedAt: "2026-07-03T08:05:00.000Z",
};

export const pgmMatteSlagResult: SearchResult = {
  id: "result-pgm-matte-slag-distribution",
  scenarioId: "pgm-matte-slag-distribution",
  title: "Au / Ag / МПГ между штейном и шлаком",
  parsedQuery: {
    id: "parsed-pgm-matte-slag",
    originalText:
      "Что известно за последние 5 лет о распределении Au, Ag и МПГ между медным и никелевым штейном и шлаком?",
    normalizedQuestion:
      "Review last-five-year evidence on Au, Ag and PGM partitioning between copper/nickel matte and slag.",
    domain: "matte_slag_partitioning",
    intent: "evidence_review",
    materials: ["Au", "Ag", "PGM / МПГ", "copper matte", "nickel matte", "slag"],
    processes: ["nickel-copper smelting", "matte-slag separation", "slag cleaning"],
    equipment: ["smelting furnace", "pilot furnace"],
    targetParameters: ["partition coefficient", "slag chemistry", "matte grade"],
    numericConditions: [
      {
        id: "parsed-cond-pgm-window",
        kind: "time",
        parameter: "publication and experiment window",
        operator: "range",
        minValue: 2021,
        maxValue: 2026,
        unit: "year",
      },
    ],
    timeScope: {
      fromYear: 2021,
      toYear: 2026,
    },
  },
  answer: {
    shortConclusion:
      "Данные указывают на преимущественный переход Au, Ag и МПГ в matte phase, но уверенность по scale-up ограничена нехваткой свежих пилотных кампаний.",
    confidence: "medium",
    confidenceReason:
      "Есть свежая публикация 2024 года и пилотный отчет 2020 года, но полный набор сопоставимых данных за 2021-2026 годы неполный.",
    keyFindings: [
      "Au and Ag generally show strong affinity to copper matte.",
      "PGM behavior in nickel matte is sensitive to sulfur potential and matte grade.",
      "Slag FeO/SiO2 chemistry can increase precious metal losses.",
    ],
    limitations: ["Недостаточно recent pilot data with aligned slag chemistry."],
  },
  evidence: pgmEvidence,
  graph: pgmMatteSlagGraph,
  contradictions: pgmContradictions,
  gaps: pgmGaps,
  sources: pgmSources,
  generatedAt: "2026-07-03T08:10:00.000Z",
};

export const mockSearchResults: SearchResult[] = [
  waterDesalinationResult,
  nickelCatholyteResult,
  pgmMatteSlagResult,
];
