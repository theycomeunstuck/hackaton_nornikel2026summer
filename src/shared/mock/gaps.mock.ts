import type { KnowledgeGap } from "../../entities/gap/types";
import { sourceRefs } from "./sources.mock";

export const waterGaps: KnowledgeGap[] = [
  {
    id: "gap-water-long-term-fouling",
    scenarioId: "water-desalination",
    title: "Недостаточно данных по долгосрочному fouling при Ca/Mg",
    description:
      "Источники хорошо покрывают пилотные тесты, но не дают уверенного прогноза загрязнения мембран при длительной работе на воде с Ca и Mg.",
    severity: "medium",
    affectedMaterials: ["Ca", "Mg", "mine water"],
    affectedProcesses: ["reverse osmosis", "ion exchange polishing"],
    missingEvidence: "Long-run membrane fouling trend beyond 500 operating hours.",
    recommendedAction: "Запланировать ресурсный тест мембран и контроль индекса загрязнения.",
    confidence: "medium",
    relatedSourceRefs: [sourceRefs.waterPilotPage18, sourceRefs.waterMembranePage7],
  },
];

export const nickelGaps: KnowledgeGap[] = [];

export const pgmGaps: KnowledgeGap[] = [
  {
    id: "gap-pgm-last-five-years-pilot-data",
    scenarioId: "pgm-matte-slag-distribution",
    title: "Мало сопоставимых пилотных данных за последние 5 лет",
    description:
      "Публикация 2024 года закрывает лабораторный уровень, но пилотные наблюдения доступны только за 2020 год и отличаются по составу шлака.",
    severity: "high",
    affectedMaterials: ["Au", "Ag", "PGM / МПГ", "slag"],
    affectedProcesses: ["nickel-copper smelting", "matte-slag separation"],
    missingEvidence:
      "Recent pilot campaigns with aligned copper matte, nickel matte and slag chemistry.",
    recommendedAction:
      "Собрать публикации и внутренние эксперименты 2021-2026 годов по одинаковым диапазонам FeO/SiO2 и S.",
    confidence: "high",
    relatedSourceRefs: [sourceRefs.pgmDistributionPage10, sourceRefs.pgmFurnacePage24],
  },
];

export const mockGaps: KnowledgeGap[] = [...waterGaps, ...nickelGaps, ...pgmGaps];
