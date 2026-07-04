import { demoScenarios } from "../mock/demoScenarios";
import type { DemoScenarioId, SearchResult } from "../types/search";

const searchDelayMs = 250;

export class UnknownDemoScenarioError extends Error {
  constructor(scenarioId: DemoScenarioId) {
    super(`Unknown demo scenario: ${scenarioId}`);
    this.name = "UnknownDemoScenarioError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function searchEvidenceByScenario(
  scenarioId: DemoScenarioId,
): Promise<SearchResult> {
  await delay(searchDelayMs);

  const scenario = demoScenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new UnknownDemoScenarioError(scenarioId);
  }

  return scenario.result;
}
