import type { KnowledgeGraph } from "../../entities/graph/types";

export const waterDesalinationGraph: KnowledgeGraph = {
  nodes: [
    { id: "water-feed", type: "material", label: "Mine water" },
    { id: "sulfates", type: "parameter", label: "Sulfates 200-300 mg/l" },
    { id: "chlorides", type: "parameter", label: "Chlorides 200-300 mg/l" },
    { id: "ca-mg-na", type: "material", label: "Ca / Mg / Na ions" },
    { id: "dry-residue", type: "parameter", label: "Dry residue <=1000 mg/dm3" },
    { id: "reverse-osmosis", type: "technology", label: "Reverse osmosis" },
    { id: "ion-exchange", type: "technology", label: "Ion exchange polishing" },
    { id: "claim-water-technology-route", type: "claim", label: "Combined route is preferred", confidence: "high" },
    { id: "src-water-pilot-2024", type: "source", label: "Pilot desalination tests, 2024" },
  ],
  edges: [
    { id: "edge-water-1", source: "water-feed", target: "sulfates", relation: "contains", label: "contains" },
    { id: "edge-water-2", source: "water-feed", target: "chlorides", relation: "contains", label: "contains" },
    { id: "edge-water-3", source: "water-feed", target: "ca-mg-na", relation: "contains", label: "contains" },
    { id: "edge-water-4", source: "reverse-osmosis", target: "dry-residue", relation: "influences", label: "reduces" },
    { id: "edge-water-5", source: "ion-exchange", target: "dry-residue", relation: "influences", label: "polishes" },
    { id: "edge-water-6", source: "claim-water-technology-route", target: "reverse-osmosis", relation: "selected_for", label: "selects" },
    { id: "edge-water-7", source: "src-water-pilot-2024", target: "claim-water-technology-route", relation: "supports", label: "supports", confidence: "high" },
  ],
};

export const nickelCatholyteGraph: KnowledgeGraph = {
  nodes: [
    { id: "nickel-electrowinning", type: "process", label: "Nickel electrowinning" },
    { id: "catholyte-circulation", type: "process", label: "Catholyte circulation" },
    { id: "flow-velocity", type: "parameter", label: "Flow velocity 0.25-0.45 m/s" },
    { id: "cell-pump", type: "equipment", label: "Circulation pump" },
    { id: "deposit-quality", type: "effect", label: "Stable cathode deposit" },
    { id: "claim-nickel-optimal-range", type: "claim", label: "Optimal flow range", confidence: "medium" },
    { id: "claim-nickel-upper-limit", type: "claim", label: "Upper flow limitation", confidence: "medium" },
    { id: "src-nickel-catholyte-2023", type: "source", label: "Catholyte protocol, 2023" },
  ],
  edges: [
    { id: "edge-nickel-1", source: "nickel-electrowinning", target: "catholyte-circulation", relation: "requires", label: "requires" },
    { id: "edge-nickel-2", source: "catholyte-circulation", target: "flow-velocity", relation: "measured_in", label: "measured as" },
    { id: "edge-nickel-3", source: "cell-pump", target: "flow-velocity", relation: "influences", label: "sets" },
    { id: "edge-nickel-4", source: "flow-velocity", target: "deposit-quality", relation: "influences", label: "stabilizes", confidence: "medium" },
    { id: "edge-nickel-5", source: "src-nickel-catholyte-2023", target: "claim-nickel-optimal-range", relation: "supports", label: "supports", confidence: "high" },
    { id: "edge-nickel-6", source: "claim-nickel-upper-limit", target: "claim-nickel-optimal-range", relation: "contradicts", label: "narrows range", confidence: "medium" },
  ],
};

export const pgmMatteSlagGraph: KnowledgeGraph = {
  nodes: [
    { id: "au", type: "material", label: "Au" },
    { id: "ag", type: "material", label: "Ag" },
    { id: "pgm", type: "material", label: "PGM / МПГ" },
    { id: "copper-matte", type: "material", label: "Copper matte" },
    { id: "nickel-matte", type: "material", label: "Nickel matte" },
    { id: "slag", type: "material", label: "Slag" },
    { id: "partition-coefficient", type: "parameter", label: "Matte/slag partition coefficient" },
    { id: "claim-pgm-matte-affinity", type: "claim", label: "Precious metals prefer matte phase", confidence: "high" },
    { id: "src-pgm-distribution-2024", type: "source", label: "Distribution study, 2024" },
  ],
  edges: [
    { id: "edge-pgm-1", source: "au", target: "copper-matte", relation: "influences", label: "partitions to" },
    { id: "edge-pgm-2", source: "ag", target: "copper-matte", relation: "influences", label: "partitions to" },
    { id: "edge-pgm-3", source: "pgm", target: "nickel-matte", relation: "influences", label: "partitions to" },
    { id: "edge-pgm-4", source: "slag", target: "partition-coefficient", relation: "influences", label: "chemistry affects" },
    { id: "edge-pgm-5", source: "partition-coefficient", target: "claim-pgm-matte-affinity", relation: "supports", label: "supports", confidence: "high" },
    { id: "edge-pgm-6", source: "src-pgm-distribution-2024", target: "claim-pgm-matte-affinity", relation: "supports", label: "supports", confidence: "high" },
  ],
};
