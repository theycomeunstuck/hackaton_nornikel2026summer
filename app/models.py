"""Pydantic-модели по контракту frontend (Backend Developer Brief, раздел 8).

Главный принцип: No source — no factual claim.
Каждый EvidenceClaim обязан иметь source reference и confidence.
"""
from __future__ import annotations

from typing import Literal, Optional, Union

from pydantic import BaseModel, Field

# --- Базовые перечисления ----------------------------------------------------

ConfidenceLevel = Literal["high", "medium", "low"]
ConditionOperator = Literal["eq", "lt", "lte", "gt", "gte", "range", "unknown"]
Geography = Literal["domestic", "foreign", "mixed", "unknown", "all"]
EffectDirection = Literal[
    "increase", "decrease", "improve", "worsen", "no_change", "unknown"
]
SourceType = Literal["publication", "report", "experiment", "patent", "standard"]
Language = Literal["ru", "en", "other"]
Domain = Literal[
    "hydrometallurgy", "pyrometallurgy", "ecology", "waste_processing", "other"
]


# --- Строительные блоки -------------------------------------------------------


class Condition(BaseModel):
    name: str
    operator: ConditionOperator
    min: Optional[float] = None
    max: Optional[float] = None
    value: Optional[Union[float, str]] = None
    unit: Optional[str] = None
    rawValue: str


class Effect(BaseModel):
    property: str
    direction: EffectDirection
    value: Optional[str] = None
    description: str


class SourceRef(BaseModel):
    documentId: str
    chunkId: str
    sourceName: str
    page: Optional[int] = None


class EvidenceClaim(BaseModel):
    claimId: str
    text: str
    materials: list[str] = Field(default_factory=list)
    process: Optional[str] = None
    technology: Optional[str] = None
    equipment: list[str] = Field(default_factory=list)
    conditions: list[Condition] = Field(default_factory=list)
    effect: Optional[Effect] = None
    source: SourceRef
    confidence: ConfidenceLevel
    geography: Literal["domestic", "foreign", "mixed", "unknown"] = "unknown"
    year: Optional[int] = None


class TimeRange(BaseModel):
    from_: Optional[int] = Field(default=None, alias="from")
    to: Optional[int] = None

    model_config = {"populate_by_name": True}


class ParsedQuery(BaseModel):
    intent: str
    materials: list[str] = Field(default_factory=list)
    processes: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    properties: list[str] = Field(default_factory=list)
    conditions: list[Condition] = Field(default_factory=list)
    geography: Geography = "all"
    timeRange: Optional[TimeRange] = None


class AnswerSummary(BaseModel):
    shortConclusion: str
    recommendation: Optional[str] = None
    confidence: ConfidenceLevel
    confidenceReason: str
    warnings: list[str] = Field(default_factory=list)


# --- Граф знаний --------------------------------------------------------------

GraphNodeType = Literal[
    "claim",
    "material",
    "process",
    "technology",
    "equipment",
    "condition",
    "effect",
    "source",
    "contradiction",
    "gap",
]


class GraphNode(BaseModel):
    id: str
    label: str
    type: GraphNodeType


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: str


class KnowledgeGraph(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


# --- Пробелы и противоречия ---------------------------------------------------


class KnowledgeGap(BaseModel):
    id: str
    title: str
    description: str
    type: Literal[
        "weak_coverage",
        "missing_combination",
        "missing_numeric_data",
        "missing_recent_sources",
    ]
    severity: Literal["info", "warning"] = "info"


class Contradiction(BaseModel):
    id: str
    title: str
    description: str
    sourceA: SourceRef
    sourceB: SourceRef
    status: Literal["possible", "confirmed", "needs_review"] = "possible"


# --- Главный контракт ---------------------------------------------------------


class SearchResult(BaseModel):
    queryId: str
    parsedQuery: ParsedQuery
    answer: AnswerSummary
    evidence: list[EvidenceClaim] = Field(default_factory=list)
    graph: KnowledgeGraph
    gaps: list[KnowledgeGap] = Field(default_factory=list)
    contradictions: list[Contradiction] = Field(default_factory=list)
    sources: list["Source"] = Field(default_factory=list)


class QueryFilters(BaseModel):
    material: Optional[str] = None
    process: Optional[str] = None
    geography: Optional[Literal["domestic", "foreign", "russia", "all"]] = None
    yearFrom: Optional[int] = None
    yearTo: Optional[int] = None
    confidence: Optional[ConfidenceLevel] = None
    sourceTypes: Optional[list[SourceType]] = None


class QueryRequest(BaseModel):
    query: str
    scenarioId: Optional[str] = None
    filters: Optional[QueryFilters] = None


# --- Источники ----------------------------------------------------------------


class Source(BaseModel):
    id: str
    title: str
    type: SourceType
    year: Optional[int] = None
    language: Language = "ru"
    geography: Literal["russia", "foreign", "unknown"] = "unknown"
    authors: list[str] = Field(default_factory=list)
    reliability: ConfidenceLevel = "medium"
    excerpt: Optional[str] = None
    url: Optional[str] = None
    documentId: Optional[str] = None
    relatedClaimIds: list[str] = Field(default_factory=list)


# --- Research Memory (evidence index) ----------------------------------------


class MemoryHistoryItem(BaseModel):
    date: str
    event: str
    changedBy: Optional[str] = None


class ResearchMemoryItem(BaseModel):
    id: str
    topic: str
    claim: str
    domain: Domain
    status: Literal["confirmed", "conflicting", "weakly_supported", "new"]
    confidence: ConfidenceLevel
    supportingSourcesCount: int
    contradictingSourcesCount: int
    lastUpdated: str
    gaps: list[str] = Field(default_factory=list)
    relatedMaterials: list[str] = Field(default_factory=list)
    relatedProcesses: list[str] = Field(default_factory=list)


class ResearchMemoryDetails(ResearchMemoryItem):
    supportingSources: list[Source] = Field(default_factory=list)
    contradictingSources: list[Source] = Field(default_factory=list)
    history: list[MemoryHistoryItem] = Field(default_factory=list)


# --- Auth ---------------------------------------------------------------------

Role = Literal["researcher", "analyst", "manager", "admin"]


class LoginRequest(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    role: Role
    organization: Optional[str] = None


class LoginResponse(BaseModel):
    accessToken: str
    user: UserPublic


class MeResponse(BaseModel):
    id: str
    name: str
    email: str
    role: Role


# --- Documents / ingestion ----------------------------------------------------

FileType = Literal["pdf", "docx", "txt", "csv", "xlsx"]
ProcessingStatus = Literal["uploaded", "processing", "processed", "failed"]


class UploadResponse(BaseModel):
    documentId: str
    title: str
    fileName: str
    fileType: FileType
    status: ProcessingStatus
    uploadedAt: str


class ProcessingStep(BaseModel):
    id: str
    name: str
    description: str
    status: Literal["pending", "running", "done", "failed"]


class ProcessingStatusResponse(BaseModel):
    documentId: str
    status: ProcessingStatus
    steps: list[ProcessingStep]


class ExtractedParameter(BaseModel):
    id: str
    name: str
    value: str
    unit: Optional[str] = None
    normalizedValue: Optional[float] = None
    normalizedUnit: Optional[str] = None
    sourceText: Optional[str] = None


class ExtractedConclusion(BaseModel):
    id: str
    claim: str
    confidence: ConfidenceLevel
    sourceIds: list[str] = Field(default_factory=list)


class ExtractedRelation(BaseModel):
    id: str
    from_: str = Field(alias="from")
    relation: str
    to: str
    confidence: ConfidenceLevel

    model_config = {"populate_by_name": True}


class ExtractionEntities(BaseModel):
    materials: list[str] = Field(default_factory=list)
    processes: list[str] = Field(default_factory=list)
    equipment: list[str] = Field(default_factory=list)
    properties: list[str] = Field(default_factory=list)
    experts: list[str] = Field(default_factory=list)


class ExtractionResultResponse(BaseModel):
    documentId: str
    entities: ExtractionEntities
    parameters: list[ExtractedParameter] = Field(default_factory=list)
    conclusions: list[ExtractedConclusion] = Field(default_factory=list)
    relations: list[ExtractedRelation] = Field(default_factory=list)


# --- Dashboard ----------------------------------------------------------------


class DashboardStats(BaseModel):
    documents: int
    claims: int
    sources: int
    graphRelations: int
    contradictions: int
    gaps: int
    averageConfidence: str
    domainsCoverage: dict[str, int]
    recentClaims: list[EvidenceClaim] = Field(default_factory=list)
    priorityGaps: list[KnowledgeGap] = Field(default_factory=list)


# --- Export -------------------------------------------------------------------


class ExportReportRequest(BaseModel):
    title: str
    format: Literal["pdf", "markdown", "json"]
    queryId: Optional[str] = None
    memoryItemIds: Optional[list[str]] = None
    includeGraph: bool = True
    includeSources: bool = True
    includeContradictions: bool = True
    includeGaps: bool = True


class ExportReportResponse(BaseModel):
    reportId: str
    downloadUrl: str
    format: Literal["pdf", "markdown", "json"]
    createdAt: str


SearchResult.model_rebuild()
