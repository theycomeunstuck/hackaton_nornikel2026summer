import sampleCatholyte from "./raw/sampleCatholyte.json";
import sampleDesalination from "./raw/sampleDesalination.json";
import samplePgm from "./raw/samplePgm.json";
import { normalizeSearchResult } from "../api/searchResultAdapter";
import type { DemoScenario, SearchResult } from "../types/search";

type DemoScenarioRegistryItem = DemoScenario & {
  query: string;
  result: SearchResult;
};

export const demoScenarios: DemoScenarioRegistryItem[] = [
  {
    id: "desalination",
    title: "Обессоливание воды",
    description: "Выбор технологии по сульфатам, хлоридам, Ca, Mg, Na и сухому остатку",
    query:
      "Выбрать технологию обессоливания воды по сульфатам, хлоридам, Ca, Mg, Na и сухому остатку.",
    defaultQuery:
      "Выбрать технологию обессоливания воды по сульфатам, хлоридам, Ca, Mg, Na и сухому остатку.",
    searchResultId: "desalination",
    tags: ["обессоливание", "сульфаты", "хлориды", "сухой остаток"],
    result: normalizeSearchResult(sampleDesalination),
  },
  {
    id: "catholyte",
    title: "Циркуляция католита",
    description: "Электроэкстракция никеля, католит, скорость потока и противоречия",
    query:
      "Определить параметры циркуляции католита при электроэкстракции никеля и проверить противоречия.",
    defaultQuery:
      "Определить параметры циркуляции католита при электроэкстракции никеля и проверить противоречия.",
    searchResultId: "catholyte",
    tags: ["никель", "католит", "электроэкстракция", "скорость потока"],
    result: normalizeSearchResult(sampleCatholyte),
  },
  {
    id: "pgm",
    title: "Au / Ag / МПГ",
    description: "Распределение благородных металлов между штейном и шлаком",
    query:
      "Проанализировать распределение Au, Ag и МПГ между медно-никелевым штейном и шлаком.",
    defaultQuery:
      "Проанализировать распределение Au, Ag и МПГ между медно-никелевым штейном и шлаком.",
    searchResultId: "pgm",
    tags: ["Au", "Ag", "МПГ", "штейн", "шлак"],
    result: normalizeSearchResult(samplePgm),
  },
];
