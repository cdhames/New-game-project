import {
  PROTOCOL_VERSION,
  type ActionAffordances,
  type ActiveLeadState,
  type AdventureCapability,
  type AdventureClue,
  type AdventureClueId,
  type AdventureDiscovery,
  type AdventureLead,
  type AdventureLeadId,
  type AdventureResolution,
  type AtlasClaim,
  type CommissionOffer,
  type CommissionProgress,
  type DomainEvent,
  type EvidenceQuality,
  type ExpeditionOutcomeSummary,
  type ExpeditionResourceSnapshot,
  type Instrument,
  type ObservationCategory,
  type ObservationRecord,
  type PlayerCommand,
  type PlayerSafeProjection,
  type PreparationPlan,
  type RejectionReason,
  type ReportRecord,
  type SalvageFamily,
  type SafeSalvageDescriptor,
  type SafeSalvageOutcome,
  type SafeRouteLeg,
  type RouteEvidenceCategory,
  type RouteEvidenceClaim,
  type ReturnReserveWarning,
  type SafeRouteDescriptor,
  type SafeAdventureProjection,
  type SafeEncounterAction,
  type SimulatedOutsideClaim,
  type StableId,
  type TraceRecord,
  type VisibleDriftEvent,
} from "@long-map/protocol";

export const ROUTE_VALUE_MIN = 0;
export const ROUTE_VALUE_MAX = 3;
export const INITIAL_LOGICAL_TIME = 6;
export const BASE_PROVISIONS = 8;
export const BASE_VESSEL_INTEGRITY = 4;
export const BASE_INSTRUMENT_CHARGES = 2;
export const TRAVEL_PROVISION_COST = 1;
export const SALVAGE_PROVISION_COST = 1;
export const EXTRA_PROVISION_COST = 1;
export const REINFORCED_INTEGRITY_COST = 2;
export const EXTRA_CHARGE_COST = 1;

export interface RouteTruth {
  id: StableId;
  a: StableId;
  b: StableId;
  condition: number;
  hazard: number;
  hidden: boolean;
}
export interface NodeTruth {
  id: StableId;
  depth: number;
  opportunity: number;
  category: ObservationCategory;
  salvageFamily?: SalvageFamily;
  salvageValue?: number;
}
export interface WorldTruth {
  nodes: NodeTruth[];
  routes: RouteTruth[];
  subjectLastChangedRevision: Record<StableId, number>;
}
export interface Scenario {
  version: "1.4.0";
  initialLogicalTime: number;
  waystationId: StableId;
  nodes: NodeTruth[];
  routes: RouteTruth[];
  baselineReports: ReportRecord[];
}
export interface BellEncounterState {
  id: "encounter-bell-north-mark";
  phase: "active" | "resolved" | "withdrawn" | "failed";
  completedActionIds: Array<
    | "listen-surface"
    | "triangulate-sounding-line"
    | "separate-current-weather-glass"
    | "inspect-debris-field-lens"
    | "descend-into-resonance"
    | "withdraw-from-bell"
    | "tune-resonance-compass"
  >;
  clueIds: AdventureClueId[];
  discoveryRecovered: boolean;
  descended: boolean;
  withdrew: boolean;
}
export interface AdventureCanonicalState {
  primaryLeadId: "lead-bell-beneath-north-mark";
  availableLeadId: AdventureLeadId | null;
  activeLead: ActiveLeadState | null;
  encounter: BellEncounterState | null;
  clueIds: AdventureClueId[];
  discoveryRecovered: boolean;
  discoveryPublic: boolean;
  capabilityIds: Array<"capability-resonance-compass">;
  disclosurePending: boolean;
  outsideClaims: SimulatedOutsideClaim[];
  publicAnnotations: Array<{
    id: StableId;
    subjectId: StableId;
    summary: string;
    traversable: false;
  }>;
  privateAcousticRouteClue: boolean;
  visibleDriftEvent: VisibleDriftEvent | null;
  latestResolution: AdventureResolution | null;
  firstBellAdventureResolved: boolean;
}
export interface RngState {
  value: number;
}
export interface ExpeditionState {
  id: StableId;
  instruments: Instrument[];
  provisions: number;
  maximumProvisions: number;
  vesselIntegrity: number;
  maximumVesselIntegrity: number;
  instrumentCharges: Partial<Record<Instrument, { current: number; maximum: number }>>;
  locationId: StableId;
  previousLocationId: StableId | null;
  visited: StableId[];
  observations: ObservationRecord[];
  travelCount: number;
  unbankedFindings: number;
  salvagedOpportunityIds: StableId[];
  commission: CommissionOffer;
  commissionProgress: CommissionProgress;
  preparation: PreparationPlan;
  preparationFindingsSpent: number;
  startingResources: ExpeditionResourceSnapshot;
  routeLegs: SafeRouteLeg[];
  totalDamageSustained: number;
  salvageOutcomes: SafeSalvageOutcome[];
  findingsRecoveredFromSalvage: number;
}
export interface CanonicalState {
  protocolVersion: typeof PROTOCOL_VERSION;
  scenarioVersion: "1.4.0";
  revision: number;
  logicalTime: number;
  rng: RngState;
  world: WorldTruth;
  phase: "idle" | "expedition" | "returned" | "failed";
  expeditionSequence: number;
  resolvedExpeditions: number;
  driftDue: boolean;
  expedition: ExpeditionState | null;
  reports: ReportRecord[];
  personalObservations: ObservationRecord[];
  traces: TraceRecord[];
  bankedFindings: number;
  atlasContribution: number;
  latestExpeditionSummary: ExpeditionOutcomeSummary | null;
  adventure: AdventureCanonicalState;
  processedCommandIds: StableId[];
}
export interface ApplySuccess {
  ok: true;
  state: CanonicalState;
  events: DomainEvent[];
}
export interface ApplyRejection {
  ok: false;
  state: CanonicalState;
  reason: RejectionReason;
  events: [];
}
export type ApplyResult = ApplySuccess | ApplyRejection;

export function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const nodes: NodeTruth[] = [
  ["harbor", 0, 0, "condition"],
  ["shoal", 1, 1, "opportunity"],
  ["glass-cay", 1, 0, "condition"],
  ["north-mark", 2, 2, "opportunity"],
  ["reed-bank", 2, 1, "hazard"],
  ["pale-inlet", 2, 2, "opportunity"],
  ["deep-spur", 3, 3, "hazard"],
  ["rain-key", 3, 2, "condition"],
  ["far-sound", 3, 3, "opportunity"],
  ["needle-rock", 4, 4, "hazard"],
  ["outer-light", 4, 4, "condition"],
  ["last-cairn", 5, 5, "opportunity"],
].map(([id, depth, opportunity, category]) => ({
  id: id as StableId,
  depth: depth as number,
  opportunity: opportunity as number,
  category: category as ObservationCategory,
}));
const salvageByNode: Partial<Record<StableId, { family: SalvageFamily; value: number }>> = {
  shoal: { family: "provision-cache", value: 2 },
  "north-mark": { family: "findings-cache", value: 2 },
  "pale-inlet": { family: "repair-material", value: 1 },
  "far-sound": { family: "findings-cache", value: 3 },
  "last-cairn": { family: "findings-cache", value: 4 },
};
for (const node of nodes) {
  const salvage = salvageByNode[node.id];
  if (salvage) {
    node.salvageFamily = salvage.family;
    node.salvageValue = salvage.value;
  }
}
const edge = (
  id: StableId,
  a: StableId,
  b: StableId,
  condition: number,
  hazard: number,
  hidden = false,
): RouteTruth => ({ id, a, b, condition, hazard, hidden });
const routes: RouteTruth[] = [
  edge("r-hs", "harbor", "shoal", 1, 0),
  edge("r-hg", "harbor", "glass-cay", 1, 0),
  edge("r-sn", "shoal", "north-mark", 1, 1),
  edge("r-sr", "shoal", "reed-bank", 2, 1),
  edge("r-gn", "glass-cay", "north-mark", 2, 0),
  edge("r-gp", "glass-cay", "pale-inlet", 1, 1),
  edge("r-nr", "north-mark", "reed-bank", 1, 1),
  edge("r-nd", "north-mark", "deep-spur", 2, 2),
  edge("r-rd", "reed-bank", "deep-spur", 2, 2),
  edge("r-rr", "reed-bank", "rain-key", 1, 1),
  edge("r-pr", "pale-inlet", "rain-key", 2, 1),
  edge("r-pf", "pale-inlet", "far-sound", 2, 2, true),
  edge("r-dn", "deep-spur", "needle-rock", 2, 3),
  edge("r-rf", "rain-key", "far-sound", 1, 1),
  edge("r-ro", "rain-key", "outer-light", 2, 2),
  edge("r-fn", "far-sound", "needle-rock", 2, 2),
  edge("r-fo", "far-sound", "outer-light", 1, 2),
  edge("r-ol", "outer-light", "last-cairn", 2, 3, true),
];
const methodFor: Record<ObservationCategory, Instrument> = {
  route: "sounding-line",
  hazard: "weather-glass",
  condition: "weather-glass",
  opportunity: "field-lens",
};
const baselineValue = (subjectId: StableId, category: ObservationCategory): string | number => {
  const route = routes.find((item) => item.id === subjectId);
  const node = nodes.find((item) => item.id === subjectId);
  if (category === "route") return "passable";
  if (category === "hazard") return route?.hazard ?? node?.opportunity ?? 0;
  if (category === "condition") return route?.condition ?? node?.depth ?? 0;
  return node?.opportunity ?? 0;
};
const baseline = (
  n: number,
  subjectId: StableId,
  category: ObservationCategory,
  quality: EvidenceQuality,
  age: number,
): ReportRecord => {
  const observedAt = INITIAL_LOGICAL_TIME - age;
  return {
    id: `baseline-observation-${n}`,
    reportId: `baseline-report-${n}`,
    subjectId,
    category,
    value: baselineValue(subjectId, category),
    observedRevision: 0,
    observedAt,
    expeditionId: `baseline-expedition-${n}`,
    method: methodFor[category],
    quality,
    sourceClass: "baseline",
    publishedAt: Math.min(INITIAL_LOGICAL_TIME, observedAt + 1),
  };
};
export const DEVELOPMENT_SCENARIO: Scenario = {
  version: "1.4.0",
  initialLogicalTime: INITIAL_LOGICAL_TIME,
  waystationId: "harbor",
  nodes,
  routes,
  baselineReports: [
    baseline(1, "r-hs", "route", "high", 6),
    baseline(2, "r-pf", "route", "medium", 4),
    baseline(3, "r-sn", "hazard", "low", 3),
    baseline(4, "r-gp", "condition", "medium", 2),
    baseline(5, "shoal", "opportunity", "low", 1),
    baseline(6, "glass-cay", "condition", "high", 0),
  ],
};

const ADVENTURE_LEADS: Record<AdventureLeadId, AdventureLead> = {
  "lead-bell-beneath-north-mark": {
    id: "lead-bell-beneath-north-mark",
    title: "The Bell Beneath North Mark",
    targetLocationId: "north-mark",
    premise:
      "A repeating bell-like tone began beneath North Mark after a recent Drift, and existing claims disagree about its origin.",
    stakes:
      "Another explorer may act first; instruments can change the approaches available at the source.",
    recommendedInstruments: ["sounding-line", "weather-glass", "field-lens"],
    rewardSummary: "A discovery and a new capability, not merely Findings.",
  },
  "lead-follow-divided-resonance": {
    id: "lead-follow-divided-resonance",
    title: "Follow the Divided Resonance",
    targetLocationId: "north-mark",
    premise:
      "Public claims now disagree about which direction continues the Resonant Waystone signal.",
    stakes:
      "The shared Atlas is disputed, and the Resonance Compass can test the acoustic signature.",
    recommendedInstruments: ["sounding-line", "weather-glass"],
    rewardSummary: "Use the Resonance Compass to open a new encounter approach.",
  },
  "lead-return-before-rival-charts-bell": {
    id: "lead-return-before-rival-charts-bell",
    title: "Return Before the Rival Charts the Bell",
    targetLocationId: "north-mark",
    premise:
      "Mara Venn has publicly marked a contested resonance while your precise discovery remains private.",
    stakes:
      "Your Resonance Compass offers a temporary private advantage before the rival claim spreads.",
    recommendedInstruments: ["sounding-line", "weather-glass"],
    rewardSummary: "Use private knowledge to interpret the next resonance encounter.",
  },
};

const ADVENTURE_CLUES: Record<AdventureClueId, Omit<AdventureClue, "private">> = {
  "clue-bell-interval": {
    id: "clue-bell-interval",
    title: "Structured Bell Interval",
    safeSummary:
      "The tone repeats in a deliberate, structured interval, but its source remains unknown.",
  },
  "clue-fractured-shelf": {
    id: "clue-fractured-shelf",
    title: "Fractured Shelf Origin",
    safeSummary: "The strongest source lies beneath a fractured shelf at North Mark.",
  },
  "clue-current-independent": {
    id: "clue-current-independent",
    title: "Current-Independent Tone",
    safeSummary: "Present currents and weather do not fully explain the repeating tone.",
  },
  "clue-worked-stone": {
    id: "clue-worked-stone",
    title: "Worked Shelf Debris",
    safeSummary: "Visible fragments bear worked rather than natural surfaces.",
  },
  "clue-submerged-waystone": {
    id: "clue-submerged-waystone",
    title: "Submerged Waystone",
    safeSummary: "A worked submerged structure resonates with the shifting currents.",
  },
};

const RESONANCE_COMPASS: AdventureCapability = {
  id: "capability-resonance-compass",
  title: "Resonance Compass",
  safeDescription:
    "Identifies a safe acoustic-signature clue without revealing route hazard, condition, or safety.",
};

const adventureEncounterBlocking = (state: CanonicalState): boolean =>
  state.adventure.encounter?.phase === "active";

export function nextRandom(rng: RngState): { rng: RngState; value: number } {
  let x = rng.value | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return { rng: { value: x >>> 0 }, value: (x >>> 0) % 1_000_000 };
}
export function createInitialState(seed: number, scenario = DEVELOPMENT_SCENARIO): CanonicalState {
  return {
    protocolVersion: PROTOCOL_VERSION,
    scenarioVersion: scenario.version,
    revision: 0,
    logicalTime: scenario.initialLogicalTime,
    rng: { value: seed >>> 0 || 1 },
    world: {
      nodes: structuredClone(scenario.nodes),
      routes: structuredClone(scenario.routes),
      subjectLastChangedRevision: {},
    },
    phase: "idle",
    expeditionSequence: 0,
    resolvedExpeditions: 0,
    driftDue: false,
    expedition: null,
    reports: structuredClone(scenario.baselineReports),
    personalObservations: [],
    traces: [],
    bankedFindings: 0,
    atlasContribution: 0,
    latestExpeditionSummary: null,
    adventure: {
      primaryLeadId: "lead-bell-beneath-north-mark",
      availableLeadId: "lead-bell-beneath-north-mark",
      activeLead: null,
      encounter: null,
      clueIds: [],
      discoveryRecovered: false,
      discoveryPublic: false,
      capabilityIds: [],
      disclosurePending: false,
      outsideClaims: [],
      publicAnnotations: [],
      privateAcousticRouteClue: false,
      visibleDriftEvent: null,
      latestResolution: null,
      firstBellAdventureResolved: false,
    },
    processedCommandIds: [],
  };
}
const routeAt = (world: WorldTruth, location: StableId, id: StableId): RouteTruth | undefined =>
  world.routes.find((route) => route.id === id && (route.a === location || route.b === location));
const otherEnd = (route: RouteTruth, location: StableId): StableId =>
  route.a === location ? route.b : route.a;
const event = (kind: string, time: number, payload: Record<string, unknown>): DomainEvent => ({
  protocolVersion: PROTOCOL_VERSION,
  kind,
  logicalTime: time,
  payload,
});
const reject = (state: CanonicalState, reason: RejectionReason): ApplyRejection => ({
  ok: false,
  state,
  reason,
  events: [],
});
const snapshotEvent = (
  state: CanonicalState,
  kind: string,
  payload: Record<string, unknown>,
): DomainEvent =>
  event(kind, state.logicalTime, { ...payload, canonicalState: structuredClone(state) });

function knownRouteIds(state: CanonicalState): Set<StableId> {
  const known = new Set<StableId>(
    state.world.routes.filter((route) => !route.hidden).map((route) => route.id),
  );
  for (const evidence of [
    ...state.reports,
    ...state.personalObservations,
    ...(state.expedition?.observations ?? []),
  ])
    if (evidence.category === "route") known.add(evidence.subjectId);
  return known;
}
function planningKnownRouteIds(state: CanonicalState): Set<StableId> {
  const known = new Set<StableId>(
    state.world.routes.filter((route) => !route.hidden).map((route) => route.id),
  );
  for (const evidence of [...state.reports, ...state.personalObservations])
    if (evidence.category === "route") known.add(evidence.subjectId);
  return known;
}
function reportClaim(state: CanonicalState, report: ReportRecord): AtlasClaim {
  return {
    ...report,
    age: state.logicalTime - report.observedAt,
    potentiallyStale:
      (state.world.subjectLastChangedRevision[report.subjectId] ?? 0) > report.observedRevision,
    independentCorroboration: new Set(
      compatibleReports(report, state.reports).map((item) => item.expeditionId),
    ).size,
  };
}
function knownDistances(
  state: CanonicalState,
  origin: StableId,
  known = knownRouteIds(state),
): Map<StableId, number> {
  const distances = new Map<StableId, number>([[origin, 0]]);
  const queue = [origin];
  while (queue.length) {
    const current = queue.shift()!;
    for (const route of state.world.routes
      .filter((item) => known.has(item.id) && (item.a === current || item.b === current))
      .sort((a, b) => compareCodeUnits(a.id, b.id))) {
      const neighbor = otherEnd(route, current);
      if (!distances.has(neighbor)) {
        distances.set(neighbor, distances.get(current)! + 1);
        queue.push(neighbor);
      }
    }
  }
  return distances;
}
const qualityRank: Record<EvidenceQuality, number> = { low: 0, medium: 1, high: 2 };
function weakestEvidence(claims: AtlasClaim[]): AtlasClaim | undefined {
  return [...claims].sort(
    (a, b) =>
      Number(b.potentiallyStale) - Number(a.potentiallyStale) ||
      qualityRank[a.quality] - qualityRank[b.quality] ||
      a.independentCorroboration - b.independentCorroboration ||
      b.age - a.age ||
      compareCodeUnits(a.reportId, b.reportId),
  )[0];
}
export function generateCommissionOffers(
  state: CanonicalState,
  scenario = DEVELOPMENT_SCENARIO,
): CommissionOffer[] {
  if (!canStartExpedition(state)) return [];
  const knownRoutes = planningKnownRouteIds(state);
  const knownNodes = new Set<StableId>([
    scenario.waystationId,
    ...state.world.routes
      .filter((route) => knownRoutes.has(route.id))
      .flatMap((route) => [route.a, route.b]),
  ]);
  const claims = state.reports.map((report) => reportClaim(state, report));
  const legallyObservable = claims.filter((claim) => {
    const route = state.world.routes.find((item) => item.id === claim.subjectId);
    if (route)
      return (
        knownRoutes.has(route.id) &&
        (claim.category === "route" ||
          claim.category === "hazard" ||
          claim.category === "condition")
      );
    const node = state.world.nodes.find((item) => item.id === claim.subjectId);
    if (!node || !knownNodes.has(node.id)) return false;
    if (claim.category === "opportunity")
      return node.category === "opportunity" && node.opportunity > 0;
    return (
      (claim.category === "hazard" || claim.category === "condition") &&
      node.category === claim.category
    );
  });
  const offers: CommissionOffer[] = [];
  const verify = weakestEvidence(legallyObservable);
  if (verify)
    offers.push({
      id: "commission-verify",
      family: "verify-report",
      findingsReward: 3,
      publicationRequired: true,
      reportId: verify.reportId,
      subjectId: verify.subjectId,
      category: verify.category,
      requiredInstrument: methodFor[verify.category],
    });

  const surveyPairs = [...knownRoutes]
    .sort(compareCodeUnits)
    .flatMap((subjectId) =>
      (["route", "hazard", "condition"] as ObservationCategory[]).map((category) => ({
        subjectId,
        category,
        reports: claims.filter(
          (claim) => claim.subjectId === subjectId && claim.category === category,
        ),
      })),
    )
    .filter((pair) => !(verify?.subjectId === pair.subjectId && verify.category === pair.category))
    .sort((a, b) => {
      const aw = weakestEvidence(a.reports);
      const bw = weakestEvidence(b.reports);
      return (
        Number(a.reports.length > 0) - Number(b.reports.length > 0) ||
        Number(Boolean(bw?.potentiallyStale)) - Number(Boolean(aw?.potentiallyStale)) ||
        (aw ? qualityRank[aw.quality] : -1) - (bw ? qualityRank[bw.quality] : -1) ||
        (aw?.independentCorroboration ?? -1) - (bw?.independentCorroboration ?? -1) ||
        (bw?.age ?? 0) - (aw?.age ?? 0) ||
        compareCodeUnits(`${a.subjectId}:${a.category}`, `${b.subjectId}:${b.category}`)
      );
    });
  const survey = surveyPairs[0];
  if (survey)
    offers.push({
      id: "commission-survey",
      family: "survey",
      findingsReward: 2,
      publicationRequired: false,
      subjectId: survey.subjectId,
      category: survey.category,
      requiredInstrument: methodFor[survey.category],
    });

  const distances = knownDistances(state, scenario.waystationId, knownRoutes);
  const frontier = [...distances]
    .filter(
      ([nodeId, distance]) =>
        nodeId !== scenario.waystationId && distance >= 2 && distance <= 3 && distance * 2 <= 6,
    )
    .sort((a, b) => b[1] - a[1] || compareCodeUnits(a[0], b[0]))[0];
  if (frontier)
    offers.push({
      id: "commission-frontier",
      family: "reach-frontier",
      findingsReward: 3,
      publicationRequired: false,
      targetLocationId: frontier[0],
    });

  const salvage = claims
    .filter(
      (claim) =>
        claim.category === "opportunity" &&
        knownNodes.has(claim.subjectId) &&
        distances.has(claim.subjectId),
    )
    .sort(
      (a, b) =>
        distances.get(a.subjectId)! - distances.get(b.subjectId)! ||
        b.age - a.age ||
        qualityRank[a.quality] - qualityRank[b.quality] ||
        compareCodeUnits(a.subjectId, b.subjectId),
    )[0];
  if (salvage)
    offers.push({
      id: "commission-salvage",
      family: "recover-salvage",
      findingsReward: 2,
      publicationRequired: false,
      targetLocationId: salvage.subjectId,
    });
  return offers;
}
function observationApplicability(
  state: CanonicalState,
  location: StableId,
  subjectId: StableId,
  category: ObservationCategory,
): "valid" | "not-local" | "invalid" {
  const route = state.world.routes.find((item) => item.id === subjectId);
  if (route) {
    if (!knownRouteIds(state).has(route.id) || (route.a !== location && route.b !== location))
      return "not-local";
    return category === "route" || category === "hazard" || category === "condition"
      ? "valid"
      : "invalid";
  }
  const node = state.world.nodes.find((item) => item.id === subjectId);
  if (!node || node.id !== location) return "not-local";
  if (category === "opportunity")
    return node.category === "opportunity" && node.opportunity > 0 ? "valid" : "invalid";
  if (category === "hazard" || category === "condition")
    return node.category === category ? "valid" : "invalid";
  return "invalid";
}

function canStartExpedition(state: CanonicalState): boolean {
  return (
    (state.phase === "idle" || state.phase === "failed") &&
    !state.driftDue &&
    !state.adventure.visibleDriftEvent?.pendingAcknowledgement
  );
}

function canResolveReturn(state: CanonicalState, scenario: Scenario): boolean {
  return (
    state.phase === "expedition" &&
    state.expedition !== null &&
    state.expedition.locationId === scenario.waystationId &&
    state.expedition.travelCount >= 2
  );
}
function preparationCost(plan: PreparationPlan): number {
  return (
    plan.extraProvisions * EXTRA_PROVISION_COST +
    (plan.reinforcedVesselIntegrity ? REINFORCED_INTEGRITY_COST : 0) +
    plan.extraChargeInstruments.length * EXTRA_CHARGE_COST
  );
}
function objectiveMet(expedition: ExpeditionState): boolean {
  const progress = expedition.commissionProgress;
  if (expedition.commission.family === "reach-frontier") return progress.targetVisited;
  if (expedition.commission.family === "recover-salvage") return progress.targetSalvageRecovered;
  return progress.matchingObservationRecorded;
}
function updateObjectiveStatus(expedition: ExpeditionState): void {
  if (expedition.commissionProgress.status === "active" && objectiveMet(expedition))
    expedition.commissionProgress.status = "objective-met";
}
function resourceSnapshot(
  state: CanonicalState,
  expedition: ExpeditionState,
): ExpeditionResourceSnapshot {
  return {
    provisions: expedition.provisions,
    maximumProvisions: expedition.maximumProvisions,
    vesselIntegrity: expedition.vesselIntegrity,
    maximumVesselIntegrity: expedition.maximumVesselIntegrity,
    bankedFindings: state.bankedFindings,
    unbankedFindings: expedition.unbankedFindings,
  };
}
function outcomeSummary(
  state: CanonicalState,
  expedition: ExpeditionState,
  outcome: "returned" | "failed",
  failureReason: "stranded" | "vessel-integrity" | null,
  publicationStatus: "pending" | "completed" | "not-applicable",
  publishedReportIds: StableId[] = [],
  atlasContributionAdded = 0,
): ExpeditionOutcomeSummary {
  const offer = expedition.commission;
  const met = objectiveMet(expedition);
  const result =
    outcome === "failed"
      ? "failure"
      : expedition.commissionProgress.status === "completed"
        ? "success"
        : "incomplete";
  const trace = state.traces.find((item) => item.expeditionId === expedition.id);
  const retainedObservationIds =
    outcome === "returned" ? expedition.observations.map((o) => o.id) : [];
  const lostObservationIds = outcome === "failed" ? expedition.observations.map((o) => o.id) : [];
  return {
    expeditionId: expedition.id,
    outcome,
    failureReason,
    commissionId: offer.id,
    family: offer.family,
    commissionResult: result,
    commissionObjectiveMet: met,
    commissionFindingsOffered: offer.findingsReward,
    commissionFindingsGranted: expedition.commissionProgress.findingsRewardGranted
      ? offer.findingsReward
      : 0,
    publicationRequired: offer.publicationRequired,
    requiredPublicationOccurred: expedition.commissionProgress.requiredReportPublished,
    publicationStatus,
    preparation: structuredClone(expedition.preparation),
    preparationFindingsSpent: expedition.preparationFindingsSpent,
    startingResources: structuredClone(expedition.startingResources),
    endingResources: resourceSnapshot(state, expedition),
    routeLegs: structuredClone(expedition.routeLegs),
    visitedLocationIds: [...new Set(expedition.visited)],
    totalDamageSustained: expedition.totalDamageSustained,
    observationIds: expedition.observations.map((item) => item.id),
    retainedObservationIds,
    lostObservationIds,
    salvageOutcomes: structuredClone(expedition.salvageOutcomes),
    findingsRecoveredFromSalvage: expedition.findingsRecoveredFromSalvage,
    findingsBankedOnReturn:
      outcome === "returned"
        ? expedition.startingResources.unbankedFindings + expedition.findingsRecoveredFromSalvage
        : 0,
    findingsLostOnFailure: outcome === "failed" ? expedition.findingsRecoveredFromSalvage : 0,
    publishedReportIds: [...publishedReportIds],
    atlasContributionAdded,
    traceId: trace?.id ?? null,
    bankedFindingsAfter: state.bankedFindings,
    ...(offer.family === "verify-report" || offer.family === "survey"
      ? { subjectId: offer.subjectId }
      : { targetLocationId: offer.targetLocationId }),
  };
}

function eligibleFailureReason(
  state: CanonicalState,
  scenario: Scenario,
): "stranded" | "vessel-integrity" | null {
  if (state.phase !== "expedition" || !state.expedition) return null;
  if (state.expedition.vesselIntegrity <= 0) return "vessel-integrity";
  if (canResolveReturn(state, scenario)) return null;
  return canContinueOrReturn(state) ? null : "stranded";
}

function reserveWarning(reserve: number | null, margin: number | null): ReturnReserveWarning {
  if (reserve === null || margin === null) return "route-unknown";
  if (reserve === 0) return "at-waystation";
  if (margin >= 2) return "comfortable";
  if (margin === 1) return "caution";
  if (margin === 0) return "at-reserve";
  return "below-reserve";
}

function routeEvidenceCategory(
  state: CanonicalState,
  routeId: StableId,
  category: "route" | "hazard" | "condition",
): RouteEvidenceCategory {
  const claims: RouteEvidenceClaim[] = state.reports
    .filter((report) => report.subjectId === routeId && report.category === category)
    .map((report) => {
      const claim = reportClaim(state, report);
      return {
        reportId: claim.reportId,
        category,
        reportedValue: claim.value,
        age: claim.age,
        quality: claim.quality,
        sourceClass: claim.sourceClass,
        independentCorroboration: claim.independentCorroboration,
        potentiallyStale: claim.potentiallyStale,
        observedRevision: claim.observedRevision,
      };
    })
    .sort(
      (a, b) =>
        Number(a.potentiallyStale) - Number(b.potentiallyStale) ||
        b.observedRevision - a.observedRevision ||
        qualityRank[b.quality] - qualityRank[a.quality] ||
        b.independentCorroboration - a.independentCorroboration ||
        a.age - b.age ||
        compareCodeUnits(a.reportId, b.reportId),
    );
  const values = new Set(claims.map((claim) => serializeCanonical(claim.reportedValue)));
  return {
    state:
      claims.length === 0 ? "unknown" : values.size === 1 ? "single-value" : "conflicting-values",
    claims,
  };
}

function actionAffordances(
  state: CanonicalState,
  scenario = DEVELOPMENT_SCENARIO,
): ActionAffordances {
  const expedition = state.expedition;
  const encounterBlocking = adventureEncounterBlocking(state);
  const underway =
    state.phase === "expedition" && expedition !== null && expedition.travelCount > 0;
  const localObservationCandidates =
    underway && expedition
      ? [
          ...state.world.routes.flatMap((route) =>
            ["route", "hazard", "condition"].flatMap((category) =>
              observationApplicability(
                state,
                expedition.locationId,
                route.id,
                category as ObservationCategory,
              ) === "valid"
                ? [{ subjectId: route.id, category: category as ObservationCategory }]
                : [],
            ),
          ),
          ...state.world.nodes.flatMap((node) =>
            ["hazard", "condition", "opportunity"].flatMap((category) =>
              observationApplicability(
                state,
                expedition.locationId,
                node.id,
                category as ObservationCategory,
              ) === "valid"
                ? [{ subjectId: node.id, category: category as ObservationCategory }]
                : [],
            ),
          ),
        ]
      : [];
  const travelOptions =
    state.phase === "expedition" && expedition && expedition.provisions > 0 && !encounterBlocking
      ? state.world.routes
          .filter(
            (route) =>
              knownRouteIds(state).has(route.id) &&
              (route.a === expedition.locationId || route.b === expedition.locationId),
          )
          .map((route) => {
            const destinationNodeId = otherEnd(route, expedition.locationId);
            const projectedProvisions = expedition.provisions - TRAVEL_PROVISION_COST;
            const projectedReturnReserve = calculateReturnReserve(
              state,
              destinationNodeId,
              scenario,
            );
            const projectedProvisionMargin =
              projectedReturnReserve === null ? null : projectedProvisions - projectedReturnReserve;
            return {
              routeId: route.id,
              destinationNodeId,
              provisionCost: TRAVEL_PROVISION_COST as 1,
              destinationVisited: expedition.visited.includes(destinationNodeId),
              projectedProvisions,
              projectedReturnReserve,
              projectedProvisionMargin,
              projectedReturnReserveWarning: reserveWarning(
                projectedReturnReserve,
                projectedProvisionMargin,
              ),
              evidence: {
                route: routeEvidenceCategory(state, route.id, "route"),
                hazard: routeEvidenceCategory(state, route.id, "hazard"),
                condition: routeEvidenceCategory(state, route.id, "condition"),
              },
            };
          })
          .sort((a, b) => compareCodeUnits(a.routeId, b.routeId))
      : [];
  const observations =
    underway && expedition && !encounterBlocking
      ? localObservationCandidates
          .filter((candidate) => {
            const instrument = methodFor[candidate.category];
            return (
              expedition.instruments.includes(instrument) &&
              (expedition.instrumentCharges[instrument]?.current ?? 0) > 0
            );
          })
          .sort((a, b) =>
            compareCodeUnits(`${a.subjectId}:${a.category}`, `${b.subjectId}:${b.category}`),
          )
      : [];
  const salvageableOpportunities =
    state.phase === "expedition" &&
    expedition &&
    expedition.travelCount > 0 &&
    expedition.provisions > 0 &&
    !encounterBlocking
      ? state.world.nodes
          .filter(
            (node) =>
              node.id === expedition.locationId &&
              node.category === "opportunity" &&
              node.opportunity > 0 &&
              !expedition.salvagedOpportunityIds.includes(node.id),
          )
          .map((node): SafeSalvageDescriptor => ({
            opportunityId: node.id,
            locationId: node.id,
            family: node.salvageFamily!,
          }))
      : [];
  const selectedCandidates = expedition
    ? localObservationCandidates.filter((candidate) =>
        expedition.instruments.includes(methodFor[candidate.category]),
      )
    : [];
  const observeAvailability = !underway
    ? "expedition-not-underway"
    : localObservationCandidates.length === 0
      ? "no-applicable-observation"
      : selectedCandidates.length === 0
        ? "instrument-not-selected"
        : observations.length === 0
          ? "instrument-depleted"
          : "available";
  const canReturn = canResolveReturn(state, scenario);
  const failureReason = eligibleFailureReason(state, scenario);
  return {
    travelOptions,
    observations,
    salvageableOpportunities,
    canResolveReturn: canReturn,
    failureReason,
    publicationEligibleObservationIds:
      state.phase === "returned" && expedition
        ? [...new Set(expedition.observations.map((item) => item.id))].sort(compareCodeUnits)
        : [],
    publicationRequired: state.phase === "returned",
    canAdvanceDrift: state.driftDue && state.phase !== "expedition" && state.phase !== "returned",
    canStartExpedition: canStartExpedition(state),
    availability: {
      travel:
        state.phase !== "expedition"
          ? "expedition-not-underway"
          : expedition!.provisions < TRAVEL_PROVISION_COST
            ? "insufficient-provisions"
            : travelOptions.length
              ? "available"
              : "no-known-route",
      observe: observeAvailability,
      salvage: !underway
        ? "expedition-not-underway"
        : expedition!.provisions < SALVAGE_PROVISION_COST
          ? "insufficient-provisions"
          : salvageableOpportunities.length
            ? "available"
            : "no-salvage-opportunity",
      return: canReturn
        ? "available"
        : state.phase !== "expedition"
          ? "expedition-not-underway"
          : expedition!.locationId !== scenario.waystationId
            ? "not-at-waystation"
            : "return-not-earned",
      failure: failureReason
        ? "available"
        : canReturn
          ? "safe-return-available"
          : "expedition-not-underway",
    },
  };
}

function encounterActionAffordances(state: CanonicalState): SafeEncounterAction[] {
  const encounter = state.adventure.encounter;
  const expedition = state.expedition;
  const active = state.phase === "expedition" && encounter?.phase === "active" && !!expedition;
  const completed = new Set(encounter?.completedActionIds ?? []);
  const make = (
    id: SafeEncounterAction["id"],
    title: string,
    description: string,
    provisionCost: number,
    requiredInstrument: Instrument | null,
    instrumentChargeCost: number,
    possibleOutcome: string,
    extraAvailable = true,
    extraReason: SafeEncounterAction["unavailableReason"] = "available",
    minimumKnownDamage: number | null = null,
  ): SafeEncounterAction => {
    const alreadyCompleted = completed.has(id);
    let unavailableReason: SafeEncounterAction["unavailableReason"] = "available";
    if (!active) unavailableReason = "encounter-inactive";
    else if (alreadyCompleted) unavailableReason = "already-completed";
    else if (requiredInstrument && !expedition!.instruments.includes(requiredInstrument))
      unavailableReason = "instrument-not-selected";
    else if (
      requiredInstrument &&
      (expedition!.instrumentCharges[requiredInstrument]?.current ?? 0) < instrumentChargeCost
    )
      unavailableReason = "instrument-depleted";
    else if (expedition!.provisions < provisionCost) unavailableReason = "insufficient-provisions";
    else if (!extraAvailable) unavailableReason = extraReason;
    return {
      id,
      title,
      description,
      available: unavailableReason === "available",
      unavailableReason,
      provisionCost,
      instrumentChargeCost,
      requiredInstrument,
      minimumKnownDamage,
      alreadyCompleted,
      possibleOutcome,
    };
  };
  const mitigated =
    completed.has("triangulate-sounding-line") || completed.has("separate-current-weather-glass");
  const actions: SafeEncounterAction[] = [
    make(
      "listen-surface",
      "Listen from the surface",
      "Listen for structure in the repeating tone without risking the vessel.",
      0,
      null,
      0,
      "May establish the tone's interval without revealing its source.",
    ),
    make(
      "triangulate-sounding-line",
      "Triangulate with the Sounding Line",
      "Spend one Charge and one Provision to locate the source beneath the shelf.",
      1,
      "sounding-line",
      1,
      "May locate the source and reduce known descent damage.",
    ),
    make(
      "separate-current-weather-glass",
      "Separate the current with the Weather Glass",
      "Spend one Charge to test whether present currents explain the tone.",
      0,
      "weather-glass",
      1,
      "May rule out a current-only explanation and reduce known descent damage.",
    ),
    make(
      "inspect-debris-field-lens",
      "Inspect shelf debris with the Field Lens",
      "Spend one Charge to inspect whether visible fragments are natural or worked.",
      0,
      "field-lens",
      1,
      "May improve a later interpretation without reducing descent risk.",
    ),
    make(
      "descend-into-resonance",
      "Descend into the resonance",
      "Spend one Provision and accept the displayed deterministic Vessel Integrity damage.",
      1,
      null,
      0,
      "May recover a significant discovery; zero Vessel Integrity causes failure.",
      (encounter?.clueIds.length ?? 0) > 0,
      "clue-required",
      mitigated ? 1 : 2,
    ),
    make(
      "withdraw-from-bell",
      "Withdraw with current evidence",
      "End the encounter without further damage and preserve acquired clues.",
      0,
      null,
      0,
      "Resolves the Lead as incomplete and permits return travel.",
    ),
  ];
  if (state.adventure.capabilityIds.includes("capability-resonance-compass"))
    actions.push(
      make(
        "tune-resonance-compass",
        "Tune the Resonance Compass",
        "Compare the recovered acoustic signature with the contested route claims.",
        0,
        null,
        0,
        "Can distinguish an acoustic signature without revealing route danger.",
      ),
    );
  return actions;
}

function validatePreparation(
  state: CanonicalState,
  instruments: Instrument[],
  preparation: PreparationPlan,
): RejectionReason | null {
  if (new Set(instruments).size !== 2) return "invalid-loadout";
  const extraCharges = preparation.extraChargeInstruments;
  if (
    preparation.extraProvisions < 0 ||
    preparation.extraProvisions > 2 ||
    new Set(extraCharges).size !== extraCharges.length ||
    extraCharges.some((instrument) => !instruments.includes(instrument))
  )
    return "invalid-preparation";
  return state.bankedFindings < preparationCost(preparation) ? "insufficient-findings" : null;
}

function beginExpedition(
  next: CanonicalState,
  instruments: Instrument[],
  preparation: PreparationPlan,
  commission: CommissionOffer,
  scenario: Scenario,
): void {
  const cost = preparationCost(preparation);
  const extraCharges = preparation.extraChargeInstruments;
  next.expeditionSequence += 1;
  next.bankedFindings -= cost;
  next.phase = "expedition";
  const startingProvisions = BASE_PROVISIONS + preparation.extraProvisions;
  const startingVesselIntegrity =
    BASE_VESSEL_INTEGRITY + Number(preparation.reinforcedVesselIntegrity);
  next.expedition = {
    id: `expedition-${next.expeditionSequence}`,
    instruments: [...instruments].sort(compareCodeUnits),
    provisions: startingProvisions,
    maximumProvisions: startingProvisions,
    vesselIntegrity: startingVesselIntegrity,
    maximumVesselIntegrity: startingVesselIntegrity,
    instrumentCharges: Object.fromEntries(
      instruments.map((instrument) => {
        const maximum = BASE_INSTRUMENT_CHARGES + Number(extraCharges.includes(instrument));
        return [instrument, { current: maximum, maximum }];
      }),
    ),
    locationId: scenario.waystationId,
    previousLocationId: null,
    visited: [scenario.waystationId],
    observations: [],
    travelCount: 0,
    unbankedFindings: 0,
    salvagedOpportunityIds: [],
    commission: structuredClone(commission),
    commissionProgress: {
      status: "active",
      targetVisited: false,
      matchingObservationRecorded: false,
      targetSalvageRecovered: false,
      requiredReportPublished: false,
      findingsRewardGranted: false,
    },
    preparation: structuredClone(preparation),
    preparationFindingsSpent: cost,
    startingResources: {
      provisions: startingProvisions,
      maximumProvisions: startingProvisions,
      vesselIntegrity: startingVesselIntegrity,
      maximumVesselIntegrity: startingVesselIntegrity,
      bankedFindings: next.bankedFindings,
      unbankedFindings: 0,
    },
    routeLegs: [],
    totalDamageSustained: 0,
    salvageOutcomes: [],
    findingsRecoveredFromSalvage: 0,
  };
}

function scheduleBellResolution(
  state: CanonicalState,
  outcome: "shared" | "withheld" | "incomplete",
): void {
  const leadId = state.adventure.activeLead?.leadId ?? "lead-bell-beneath-north-mark";
  const choice = outcome === "shared" ? "share" : outcome === "withheld" ? "withhold" : null;
  const maraClaim: SimulatedOutsideClaim = {
    id: `mara-claim-${outcome}`,
    actorId: "actor-mara-venn-simulated",
    actorDisplayName: "Mara Venn — simulated expedition source",
    sourceType: "simulated-prototype",
    subjectId: "r-nr",
    category: "resonance-direction",
    reportedValue: "north-mark-reed-bank",
    quality: outcome === "shared" ? "medium" : "low",
    observedRevision: state.revision,
    publishedAt: state.logicalTime,
    age: 0,
    potentiallyStale: false,
    relationToPlayerClaim: outcome === "shared" ? "partial-corroboration" : "independent",
  };
  state.adventure.outsideClaims = [maraClaim];
  state.adventure.publicAnnotations =
    outcome === "shared"
      ? [
          {
            id: "annotation-resonant-waystone-north-mark",
            subjectId: "north-mark",
            summary: "North Mark is publicly marked as a Resonant Waystone site.",
            traversable: false,
          },
          {
            id: "annotation-resonance-r-nd",
            subjectId: "r-nd",
            summary: "The recovered fragment points toward the North Mark–Deep Spur direction.",
            traversable: false,
          },
        ]
      : [
          {
            id: "annotation-unresolved-north-mark",
            subjectId: "north-mark",
            summary: "A public unresolved resonance anomaly remains beneath North Mark.",
            traversable: false,
          },
        ];
  state.adventure.discoveryPublic = outcome === "shared";
  state.adventure.privateAcousticRouteClue = outcome === "withheld";
  if (outcome === "shared") state.atlasContribution += 1;
  state.adventure.availableLeadId =
    outcome === "shared" ? "lead-follow-divided-resonance" : "lead-return-before-rival-charts-bell";
  state.adventure.latestResolution = {
    leadId,
    outcome,
    clueIds: [...state.adventure.clueIds],
    discoveryRecovered: state.adventure.discoveryRecovered,
    capabilityUnlocked: state.adventure.capabilityIds.includes("capability-resonance-compass"),
    disclosureChoice: choice,
  };
  if (!state.adventure.firstBellAdventureResolved) {
    const routeId = outcome === "shared" ? "r-nd" : "r-nr";
    const route = state.world.routes.find((candidate) => candidate.id === routeId)!;
    state.revision += 1;
    route.condition = route.condition >= ROUTE_VALUE_MAX ? ROUTE_VALUE_MIN : route.condition + 1;
    state.world.subjectLastChangedRevision[routeId] = state.revision;
    const potentiallyStaleClaimIds = [
      ...state.reports
        .filter((report) => report.subjectId === routeId)
        .map((report) => report.reportId),
      ...state.adventure.publicAnnotations
        .filter((annotation) => annotation.subjectId === routeId)
        .map((annotation) => annotation.id),
      ...(maraClaim.subjectId === routeId ? [maraClaim.id] : []),
    ].sort(compareCodeUnits);
    state.adventure.visibleDriftEvent = {
      id: "drift-event-north-mark-resonance",
      affectedRegionId: "north-mark",
      revision: state.revision,
      summary: "Currents and the submerged shelf shifted near North Mark.",
      explanation: "The world changed, so some old knowledge may no longer be reliable.",
      potentiallyStaleClaimIds,
      pendingAcknowledgement: true,
    };
    state.adventure.firstBellAdventureResolved = true;
  }
}

export function applyCommand(
  state: CanonicalState,
  command: PlayerCommand,
  scenario = DEVELOPMENT_SCENARIO,
): ApplyResult {
  if (state.processedCommandIds.includes(command.commandId))
    return reject(state, "duplicate-command");
  const next = structuredClone(state);
  next.logicalTime += 1;
  next.processedCommandIds.push(command.commandId);
  if (command.kind === "start-lead-expedition") {
    if (state.phase !== "idle" && state.phase !== "failed") return reject(state, "wrong-phase");
    if (state.driftDue) return reject(state, "drift-required");
    if (state.adventure.visibleDriftEvent?.pendingAcknowledgement)
      return reject(state, "visible-drift-pending");
    if (state.adventure.availableLeadId !== command.leadId)
      return reject(state, "lead-unavailable");
    const preparationRejection = validatePreparation(
      state,
      command.instruments,
      command.preparation,
    );
    if (preparationRejection) return reject(state, preparationRejection);
    const bridgeCommission: CommissionOffer = {
      id: command.leadId,
      family: "reach-frontier",
      findingsReward: 3,
      publicationRequired: false,
      targetLocationId: "north-mark",
    };
    beginExpedition(next, command.instruments, command.preparation, bridgeCommission, scenario);
    next.adventure.activeLead = {
      leadId: command.leadId,
      status: "active",
      targetReached: false,
    };
    next.adventure.encounter = null;
    next.adventure.disclosurePending = false;
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "lead-expedition-started", {
          expeditionId: next.expedition!.id,
          leadId: command.leadId,
          instruments: next.expedition!.instruments,
          preparationFindingsSpent: next.expedition!.preparationFindingsSpent,
        }),
      ],
    };
  }
  if (command.kind === "start-expedition") {
    if (state.phase !== "idle" && state.phase !== "failed") return reject(state, "wrong-phase");
    if (state.driftDue) return reject(state, "drift-required");
    const preparationRejection = validatePreparation(
      state,
      command.instruments,
      command.preparation,
    );
    if (preparationRejection) return reject(state, preparationRejection);
    const offer = generateCommissionOffers(state, scenario).find(
      (candidate) => candidate.id === command.commissionId,
    );
    if (!offer) return reject(state, "commission-unavailable");
    if ("requiredInstrument" in offer && !command.instruments.includes(offer.requiredInstrument))
      return reject(state, "commission-incompatible-loadout");
    const cost = preparationCost(command.preparation);
    beginExpedition(next, command.instruments, command.preparation, offer, scenario);
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "expedition-started", {
          expeditionId: next.expedition!.id,
          instruments: next.expedition!.instruments,
          commissionId: offer.id,
          preparationFindingsSpent: cost,
        }),
      ],
    };
  }
  if (command.kind === "perform-encounter-action") {
    const projected = encounterActionAffordances(state).find(
      (action) => action.id === command.actionId,
    );
    if (!projected?.available || !state.expedition || !state.adventure.encounter)
      return reject(state, "encounter-action-unavailable");
    const expedition = next.expedition!;
    const encounter = next.adventure.encounter!;
    encounter.completedActionIds.push(command.actionId);
    const grantClue = (clueId: AdventureClueId): void => {
      if (!encounter.clueIds.includes(clueId)) encounter.clueIds.push(clueId);
      if (!next.adventure.clueIds.includes(clueId)) next.adventure.clueIds.push(clueId);
    };
    if (command.actionId === "listen-surface") grantClue("clue-bell-interval");
    if (command.actionId === "triangulate-sounding-line") {
      expedition.instrumentCharges["sounding-line"]!.current -= 1;
      expedition.provisions -= 1;
      grantClue("clue-fractured-shelf");
    }
    if (command.actionId === "separate-current-weather-glass") {
      expedition.instrumentCharges["weather-glass"]!.current -= 1;
      grantClue("clue-current-independent");
    }
    if (command.actionId === "inspect-debris-field-lens") {
      expedition.instrumentCharges["field-lens"]!.current -= 1;
      grantClue("clue-worked-stone");
    }
    if (command.actionId === "withdraw-from-bell") {
      encounter.phase = "withdrawn";
      encounter.withdrew = true;
      next.adventure.activeLead!.status = "returning";
    }
    if (command.actionId === "descend-into-resonance") {
      expedition.provisions -= 1;
      encounter.descended = true;
      const mitigated =
        encounter.completedActionIds.includes("triangulate-sounding-line") ||
        encounter.completedActionIds.includes("separate-current-weather-glass");
      const damage = mitigated ? 1 : 2;
      expedition.vesselIntegrity -= damage;
      expedition.totalDamageSustained += damage;
      if (expedition.vesselIntegrity <= 0) {
        encounter.phase = "failed";
        next.adventure.activeLead!.status = "failed";
        fail(next, scenario, "vessel-integrity");
        next.adventure.latestResolution = {
          leadId: next.adventure.activeLead!.leadId,
          outcome: "failed",
          clueIds: [...encounter.clueIds],
          discoveryRecovered: false,
          capabilityUnlocked: false,
          disclosureChoice: null,
        };
      } else {
        grantClue("clue-submerged-waystone");
        encounter.discoveryRecovered = true;
        encounter.phase = "resolved";
        next.adventure.discoveryRecovered = true;
        if (!next.adventure.capabilityIds.includes("capability-resonance-compass"))
          next.adventure.capabilityIds.push("capability-resonance-compass");
        next.adventure.activeLead!.status = "returning";
      }
    }
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "bell-encounter-action-resolved", {
          actionId: command.actionId,
          clueIds: [...encounter.clueIds],
          provisions: expedition.provisions,
          vesselIntegrity: expedition.vesselIntegrity,
          encounterPhase: encounter.phase,
        }),
      ],
    };
  }
  if (command.kind === "travel") {
    const expedition = state.expedition;
    if (state.phase !== "expedition" || !expedition) return reject(state, "wrong-phase");
    const route = routeAt(state.world, expedition.locationId, command.routeId);
    if (
      !route ||
      !actionAffordances(state, scenario).travelOptions.some(
        (option) => option.routeId === command.routeId,
      )
    )
      return reject(state, "route-unavailable");
    if (expedition.provisions < TRAVEL_PROVISION_COST)
      return reject(state, "insufficient-provisions");
    const roll = nextRandom(next.rng);
    next.rng = roll.rng;
    const damaged = roll.value % 6 < route.hazard;
    const target = otherEnd(route, expedition.locationId);
    const origin = expedition.locationId;
    const mutable = next.expedition!;
    mutable.provisions -= TRAVEL_PROVISION_COST;
    mutable.travelCount += 1;
    mutable.previousLocationId = mutable.locationId;
    mutable.locationId = target;
    mutable.visited.push(target);
    if (next.adventure.activeLead && target === "north-mark" && !next.adventure.encounter) {
      next.adventure.activeLead.targetReached = true;
      next.adventure.activeLead.status = "encounter";
      next.adventure.encounter = {
        id: "encounter-bell-north-mark",
        phase: "active",
        completedActionIds: [],
        clueIds: [],
        discoveryRecovered: false,
        descended: false,
        withdrew: false,
      };
    }
    if (
      mutable.commission.family === "reach-frontier" &&
      mutable.commission.targetLocationId === target
    )
      mutable.commissionProgress.targetVisited = true;
    updateObjectiveStatus(mutable);
    if (damaged) {
      mutable.vesselIntegrity -= 1;
      mutable.totalDamageSustained += 1;
    }
    mutable.routeLegs.push({
      routeId: route.id,
      originNodeId: origin,
      destinationNodeId: target,
      damageSustained: damaged,
    });
    const traversal = snapshotEvent(next, "route-traversed", {
      routeId: route.id,
      target,
      damaged,
    });
    if (mutable.vesselIntegrity > 0) return { ok: true, state: next, events: [traversal] };
    fail(next, scenario, "vessel-integrity");
    return {
      ok: true,
      state: next,
      events: [
        traversal,
        snapshotEvent(next, "expedition-failed", {
          reason: "vessel-integrity",
          traceId: next.traces.at(-1)?.id,
        }),
      ],
    };
  }
  if (command.kind === "observe") {
    const expedition = state.expedition;
    if (state.phase !== "expedition" || !expedition) return reject(state, "wrong-phase");
    if (expedition.travelCount === 0) return reject(state, "expedition-not-underway");
    const applicability = observationApplicability(
      state,
      expedition.locationId,
      command.subjectId,
      command.category,
    );
    if (applicability === "not-local") return reject(state, "subject-not-local");
    if (applicability === "invalid") return reject(state, "invalid-observation-subject");
    const instrument = methodFor[command.category];
    if (!expedition.instruments.includes(instrument)) return reject(state, "instrument-required");
    if ((expedition.instrumentCharges[instrument]?.current ?? 0) < 1)
      return reject(state, "instrument-depleted");
    const observation: ObservationRecord = {
      id: `observation-${expedition.id}-${expedition.observations.length + 1}`,
      subjectId: command.subjectId,
      category: command.category,
      value: observedValue(state.world, command.subjectId, command.category),
      observedRevision: state.revision,
      observedAt: next.logicalTime,
      expeditionId: expedition.id,
      method: methodFor[command.category],
      quality: "high",
    };
    next.expedition!.instrumentCharges[instrument]!.current -= 1;
    next.expedition!.observations.push(observation);
    const commission = next.expedition!.commission;
    if (
      (commission.family === "survey" || commission.family === "verify-report") &&
      commission.subjectId === observation.subjectId &&
      commission.category === observation.category
    )
      next.expedition!.commissionProgress.matchingObservationRecorded = true;
    updateObjectiveStatus(next.expedition!);
    return {
      ok: true,
      state: next,
      events: [snapshotEvent(next, "observation-made", { observation })],
    };
  }
  if (command.kind === "salvage") {
    const expedition = state.expedition;
    if (state.phase !== "expedition" || !expedition) return reject(state, "wrong-phase");
    if (expedition.travelCount === 0) return reject(state, "expedition-not-underway");
    const node = state.world.nodes.find((item) => item.id === expedition.locationId);
    if (
      !node ||
      node.id !== command.opportunityId ||
      node.category !== "opportunity" ||
      node.opportunity <= 0 ||
      expedition.salvagedOpportunityIds.includes(node.id) ||
      !actionAffordances(state, scenario).salvageableOpportunities.some(
        (item) => item.opportunityId === node.id,
      )
    )
      return reject(state, "opportunity-unavailable");
    if (expedition.provisions < SALVAGE_PROVISION_COST)
      return reject(state, "insufficient-provisions");
    const family = node.salvageFamily!;
    const nominalValue = node.salvageValue!;
    const beforeProvisions = expedition.provisions;
    next.expedition!.provisions -= SALVAGE_PROVISION_COST;
    let appliedValue = nominalValue;
    if (family === "findings-cache") next.expedition!.unbankedFindings += appliedValue;
    if (family === "provision-cache") {
      appliedValue = Math.min(
        nominalValue,
        next.expedition!.maximumProvisions - next.expedition!.provisions,
      );
      next.expedition!.provisions += appliedValue;
    }
    if (family === "repair-material") {
      appliedValue = Math.min(
        nominalValue,
        next.expedition!.maximumVesselIntegrity - next.expedition!.vesselIntegrity,
      );
      next.expedition!.vesselIntegrity += appliedValue;
    }
    const salvageOutcome: SafeSalvageOutcome = {
      opportunityId: node.id,
      family,
      provisionCost: SALVAGE_PROVISION_COST,
      nominalValue,
      appliedValue,
      netProvisionChange: next.expedition!.provisions - beforeProvisions,
      resultingProvisions: next.expedition!.provisions,
      resultingVesselIntegrity: next.expedition!.vesselIntegrity,
      resultingUnbankedFindings: next.expedition!.unbankedFindings,
    };
    next.expedition!.salvageOutcomes.push(salvageOutcome);
    if (family === "findings-cache") next.expedition!.findingsRecoveredFromSalvage += appliedValue;
    next.expedition!.salvagedOpportunityIds.push(node.id);
    if (
      next.expedition!.commission.family === "recover-salvage" &&
      next.expedition!.commission.targetLocationId === node.id
    )
      next.expedition!.commissionProgress.targetSalvageRecovered = true;
    updateObjectiveStatus(next.expedition!);
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "opportunity-salvaged", {
          ...salvageOutcome,
        }),
      ],
    };
  }
  if (command.kind === "resolve-return") {
    const expedition = state.expedition;
    if (state.phase !== "expedition" || !expedition) return reject(state, "wrong-phase");
    if (expedition.locationId !== scenario.waystationId) return reject(state, "not-at-waystation");
    if (!canResolveReturn(state, scenario)) return reject(state, "expedition-not-underway");
    if (state.adventure.activeLead) {
      const bankedFindings = expedition.unbankedFindings;
      next.bankedFindings += bankedFindings;
      next.expedition!.unbankedFindings = 0;
      next.personalObservations.push(...expedition.observations);
      next.resolvedExpeditions += 1;
      next.latestExpeditionSummary = outcomeSummary(
        next,
        next.expedition!,
        "returned",
        null,
        next.adventure.discoveryRecovered ? "pending" : "not-applicable",
      );
      if (next.adventure.discoveryRecovered) {
        next.phase = "returned";
        next.adventure.activeLead!.status = "disclosure-pending";
        next.adventure.disclosurePending = true;
      } else {
        next.adventure.activeLead!.status = "incomplete";
        scheduleBellResolution(next, "incomplete");
        next.phase = "idle";
        next.expedition = null;
        next.adventure.activeLead = null;
      }
      return {
        ok: true,
        state: next,
        events: [
          snapshotEvent(next, "lead-expedition-returned", {
            leadId: state.adventure.activeLead.leadId,
            discoveryRecovered: next.adventure.discoveryRecovered,
            disclosurePending: next.adventure.disclosurePending,
            bankedFindings,
          }),
        ],
      };
    }
    next.phase = "returned";
    const bankedFindings = expedition.unbankedFindings;
    next.bankedFindings += bankedFindings;
    next.expedition!.unbankedFindings = 0;
    next.personalObservations.push(...expedition.observations);
    next.resolvedExpeditions += 1;
    next.driftDue = next.driftDue || next.resolvedExpeditions % 3 === 0;
    let commissionFindings = 0;
    if (
      expedition.commission.family !== "verify-report" &&
      objectiveMet(expedition) &&
      !next.expedition!.commissionProgress.findingsRewardGranted
    ) {
      commissionFindings = expedition.commission.findingsReward;
      next.bankedFindings += commissionFindings;
      next.expedition!.commissionProgress.findingsRewardGranted = true;
      next.expedition!.commissionProgress.status = "completed";
    }
    next.latestExpeditionSummary = outcomeSummary(
      next,
      next.expedition!,
      "returned",
      null,
      "pending",
    );
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "expedition-returned", {
          bankedFindings,
          observationIds: expedition.observations.map((item) => item.id),
          commissionFindings,
        }),
      ],
    };
  }
  if (command.kind === "resolve-failure") {
    if (state.phase !== "expedition" || !state.expedition) return reject(state, "wrong-phase");
    if (eligibleFailureReason(state, scenario) !== command.reason)
      return reject(state, "failure-not-eligible");
    fail(next, scenario, command.reason);
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "expedition-failed", {
          reason: command.reason,
          traceId: next.traces.at(-1)?.id,
        }),
      ],
    };
  }
  if (command.kind === "resolve-discovery-disclosure") {
    if (
      state.phase !== "returned" ||
      !state.expedition ||
      !state.adventure.activeLead ||
      !state.adventure.disclosurePending ||
      !state.adventure.discoveryRecovered
    )
      return reject(state, "disclosure-not-pending");
    scheduleBellResolution(next, command.choice === "share" ? "shared" : "withheld");
    next.adventure.disclosurePending = false;
    next.latestExpeditionSummary = outcomeSummary(
      next,
      next.expedition!,
      "returned",
      null,
      "completed",
      [],
      command.choice === "share" ? 1 : 0,
    );
    next.expedition = null;
    next.phase = "idle";
    next.adventure.activeLead = null;
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "discovery-disclosure-resolved", {
          choice: command.choice,
          nextLeadId: next.adventure.availableLeadId,
          outsideClaimId: next.adventure.outsideClaims[0]?.id,
          visibleDriftEventId: next.adventure.visibleDriftEvent?.id,
        }),
      ],
    };
  }
  if (command.kind === "acknowledge-visible-drift") {
    if (!state.adventure.visibleDriftEvent?.pendingAcknowledgement)
      return reject(state, "visible-drift-not-pending");
    next.adventure.visibleDriftEvent!.pendingAcknowledgement = false;
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "visible-drift-acknowledged", {
          driftEventId: next.adventure.visibleDriftEvent!.id,
          revision: next.adventure.visibleDriftEvent!.revision,
        }),
      ],
    };
  }
  if (command.kind === "publish-reports") {
    if (state.adventure.disclosurePending) return reject(state, "disclosure-required");
    if (state.phase !== "returned" || !state.expedition) return reject(state, "wrong-phase");
    const distinctIds = new Set(command.observationIds);
    if (command.observationIds.length > 3 || distinctIds.size > 3)
      return reject(state, "publication-limit");
    if (distinctIds.size !== command.observationIds.length)
      return reject(state, "observation-ineligible");
    const byId = new Map(state.expedition.observations.map((item) => [item.id, item]));
    const eligible = command.observationIds.map((id) => byId.get(id));
    if (eligible.some((item) => !item)) return reject(state, "observation-ineligible");
    const reports = eligible.map((item): ReportRecord => ({
      ...item!,
      reportId: `report-${item!.id}`,
      sourceClass: "player",
      publishedAt: next.logicalTime,
    }));
    next.reports.push(...reports);
    next.atlasContribution += reports.length;
    const commission = next.expedition!.commission;
    if (commission.family === "verify-report") {
      const matchingPublished = eligible.some(
        (item) => item?.subjectId === commission.subjectId && item.category === commission.category,
      );
      if (matchingPublished && next.expedition!.commissionProgress.matchingObservationRecorded) {
        next.expedition!.commissionProgress.requiredReportPublished = true;
        next.expedition!.commissionProgress.findingsRewardGranted = true;
        next.expedition!.commissionProgress.status = "completed";
        next.bankedFindings += commission.findingsReward;
      }
    }
    next.latestExpeditionSummary = outcomeSummary(
      next,
      next.expedition!,
      "returned",
      null,
      "completed",
      reports.map((item) => item.reportId),
      reports.length,
    );
    next.expedition = null;
    next.phase = "idle";
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "reports-published", {
          reportIds: reports.map((item) => item.reportId),
          atlasContributionAdded: reports.length,
        }),
      ],
    };
  }
  if (!state.driftDue || state.phase === "expedition" || state.phase === "returned")
    return reject(state, "drift-not-due");
  const choices = [...state.world.routes].sort((a, b) => compareCodeUnits(a.id, b.id));
  const countRoll = nextRandom(next.rng);
  next.rng = countRoll.rng;
  const count = (countRoll.value % 2) + 1;
  const selected: RouteTruth[] = [];
  while (selected.length < count) {
    const selectionRoll = nextRandom(next.rng);
    next.rng = selectionRoll.rng;
    const candidate = choices[selectionRoll.value % choices.length]!;
    if (!selected.some((item) => item.id === candidate.id)) selected.push(candidate);
  }
  next.revision += 1;
  const changes = selected
    .sort((a, b) => compareCodeUnits(a.id, b.id))
    .map((selectedRoute, index) => {
      const route = next.world.routes.find((item) => item.id === selectedRoute.id)!;
      const property = (countRoll.value + index) % 2 === 0 ? "condition" : "hazard";
      const before = route[property];
      route[property] = before >= ROUTE_VALUE_MAX ? ROUTE_VALUE_MIN : before + 1;
      next.world.subjectLastChangedRevision[route.id] = next.revision;
      return { subjectId: route.id, property, before, after: route[property] };
    });
  next.driftDue = false;
  return {
    ok: true,
    state: next,
    events: [snapshotEvent(next, "drift-applied", { revision: next.revision, changes })],
  };
}

function observedValue(
  world: WorldTruth,
  subjectId: StableId,
  category: ObservationCategory,
): string | number {
  const route = world.routes.find((item) => item.id === subjectId);
  const node = world.nodes.find((item) => item.id === subjectId);
  if (category === "route") return "passable";
  if (category === "hazard") return route?.hazard ?? node!.opportunity;
  if (category === "condition") return route?.condition ?? node!.depth;
  return node!.opportunity;
}
function canContinueOrReturn(state: CanonicalState): boolean {
  const expedition = state.expedition;
  if (!expedition || expedition.vesselIntegrity <= 0 || expedition.provisions <= 0) return false;
  const known = knownRouteIds(state);
  return state.world.routes.some(
    (route) =>
      known.has(route.id) &&
      (route.a === expedition.locationId || route.b === expedition.locationId),
  );
}
function fail(
  state: CanonicalState,
  scenario: Scenario,
  reason: "stranded" | "vessel-integrity",
): void {
  const expedition = state.expedition!;
  const recoverableFindings = Math.floor(expedition.unbankedFindings / 2);
  const observationIds = expedition.observations.slice(0, 2).map((item) => item.id);
  if (recoverableFindings > 0 || observationIds.length > 0)
    state.traces.push({
      id: `trace-${expedition.id}`,
      expeditionId: expedition.id,
      associationId: expedition.locationId || scenario.waystationId,
      recoverableFindings,
      observationIds,
    });
  state.phase = "failed";
  state.resolvedExpeditions += 1;
  state.driftDue = state.driftDue || state.resolvedExpeditions % 3 === 0;
  expedition.vesselIntegrity = reason === "vessel-integrity" ? 0 : expedition.vesselIntegrity;
  expedition.unbankedFindings = 0;
  expedition.commissionProgress.status = "failed";
  expedition.commissionProgress.findingsRewardGranted = false;
  if (state.adventure.activeLead) {
    state.adventure.activeLead.status = "failed";
    if (state.adventure.encounter?.phase === "active") state.adventure.encounter.phase = "failed";
    state.adventure.disclosurePending = false;
    state.adventure.latestResolution = {
      leadId: state.adventure.activeLead.leadId,
      outcome: "failed",
      clueIds: [...state.adventure.clueIds],
      discoveryRecovered: state.adventure.discoveryRecovered,
      capabilityUnlocked: state.adventure.capabilityIds.includes("capability-resonance-compass"),
      disclosureChoice: null,
    };
  }
  state.latestExpeditionSummary = outcomeSummary(
    state,
    expedition,
    "failed",
    reason,
    "not-applicable",
  );
}
export function evolveFromEvent(_state: CanonicalState, domainEvent: DomainEvent): CanonicalState {
  const snapshot = domainEvent.payload["canonicalState"];
  if (!snapshot || typeof snapshot !== "object") throw new Error("Event lacks canonical state");
  return structuredClone(snapshot as CanonicalState);
}
export function replayEvents(initial: CanonicalState, events: DomainEvent[]): CanonicalState {
  return events.reduce(evolveFromEvent, initial);
}
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => compareCodeUnits(a, b))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  return value;
}
export function serializeCanonical(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}
export function serializeCanonicalState(state: CanonicalState): string {
  return serializeCanonical(state);
}
export function checksum(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function compatibleReports(report: ReportRecord, reports: ReportRecord[]): ReportRecord[] {
  return reports.filter(
    (candidate) =>
      candidate.reportId !== report.reportId &&
      candidate.expeditionId !== report.expeditionId &&
      candidate.subjectId === report.subjectId &&
      candidate.category === report.category &&
      candidate.value === report.value &&
      candidate.observedRevision === report.observedRevision,
  );
}
export function calculateReturnReserve(
  state: CanonicalState,
  locationId: StableId,
  scenario = DEVELOPMENT_SCENARIO,
): number | null {
  if (locationId === scenario.waystationId) return 0;
  const known = knownRouteIds(state);
  const queue: Array<{ nodeId: StableId; distance: number }> = [
    { nodeId: locationId, distance: 0 },
  ];
  const visited = new Set<StableId>([locationId]);
  while (queue.length) {
    const current = queue.shift()!;
    const neighbors = state.world.routes
      .filter(
        (route) =>
          known.has(route.id) && (route.a === current.nodeId || route.b === current.nodeId),
      )
      .map((route) => otherEnd(route, current.nodeId))
      .sort(compareCodeUnits);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      const distance = current.distance + TRAVEL_PROVISION_COST;
      if (neighbor === scenario.waystationId) return distance;
      visited.add(neighbor);
      queue.push({ nodeId: neighbor, distance });
    }
  }
  return null;
}
function createAdventureProjection(state: CanonicalState): SafeAdventureProjection {
  const hasCompass = state.adventure.capabilityIds.includes("capability-resonance-compass");
  const onFollowupLead =
    state.adventure.activeLead !== null &&
    state.adventure.activeLead.leadId !== "lead-bell-beneath-north-mark";
  return {
    primaryLead: structuredClone(ADVENTURE_LEADS["lead-bell-beneath-north-mark"]),
    availableLead: state.adventure.availableLeadId
      ? structuredClone(ADVENTURE_LEADS[state.adventure.availableLeadId])
      : null,
    activeLead: structuredClone(state.adventure.activeLead),
    aftermathOfRecentDrift:
      !state.adventure.firstBellAdventureResolved ||
      Boolean(state.adventure.visibleDriftEvent?.pendingAcknowledgement),
    encounter: state.adventure.encounter
      ? {
          id: "encounter-bell-north-mark",
          phase: state.adventure.encounter.phase,
          instruction:
            state.adventure.encounter.phase === "active"
              ? "Resolve or withdraw from the Bell encounter before ordinary travel can continue."
              : "The Bell encounter is resolved; return travel is available if the Expedition can continue.",
          actions: encounterActionAffordances(state),
        }
      : null,
    clues: state.adventure.clueIds.map((id) => ({
      ...ADVENTURE_CLUES[id],
      private: !state.adventure.discoveryPublic,
    })),
    discoveries: state.adventure.discoveryRecovered
      ? [
          {
            id: "discovery-resonant-waystone-fragment",
            title: "Resonant Waystone Fragment",
            interpretation: state.adventure.clueIds.includes("clue-worked-stone")
              ? "Worked shelf debris supports the interpretation that the fragment came from a constructed submerged waystone."
              : "The fragment came from a resonant submerged structure; its makers remain unknown.",
            public: state.adventure.discoveryPublic,
          } satisfies AdventureDiscovery,
        ]
      : [],
    capabilities: hasCompass ? [structuredClone(RESONANCE_COMPASS)] : [],
    disclosurePending: state.adventure.disclosurePending,
    outsideClaims: state.adventure.outsideClaims.map((claim) => ({
      ...structuredClone(claim),
      age: state.logicalTime - claim.publishedAt,
      potentiallyStale:
        (state.world.subjectLastChangedRevision[claim.subjectId] ?? 0) > claim.observedRevision,
    })),
    publicResonanceEvidenceState:
      state.adventure.outsideClaims.length === 0
        ? "unknown"
        : state.adventure.publicAnnotations.some((annotation) => annotation.subjectId === "r-nd")
          ? "conflicting-values"
          : "single-value",
    publicAnnotations: structuredClone(state.adventure.publicAnnotations),
    privateAcousticRouteClue:
      hasCompass && (state.adventure.privateAcousticRouteClue || onFollowupLead)
        ? {
            routeId: "r-nd",
            summary:
              "The recovered fragment's acoustic signature is consistent with r-nd, not Mara's r-nr claim; this says nothing about route hazard, condition, or safety.",
          }
        : null,
    visibleDriftEvent: structuredClone(state.adventure.visibleDriftEvent),
    latestResolution: structuredClone(state.adventure.latestResolution),
  };
}
export function createPlayerProjection(
  state: CanonicalState,
  scenario = DEVELOPMENT_SCENARIO,
): PlayerSafeProjection {
  const expedition = state.expedition;
  const location = expedition?.locationId ?? scenario.waystationId;
  const known = knownRouteIds(state);
  const knownRoutes: SafeRouteDescriptor[] = state.world.routes
    .filter((route) => known.has(route.id))
    .map((route) => ({ id: route.id, a: route.a, b: route.b }))
    .sort((a, b) => compareCodeUnits(a.id, b.id));
  const knownNodeIds = [
    ...new Set([scenario.waystationId, ...knownRoutes.flatMap((route) => [route.a, route.b])]),
  ].sort(compareCodeUnits);
  const observations = new Map<StableId, ObservationRecord>();
  for (const item of [...state.personalObservations, ...(expedition?.observations ?? [])])
    observations.set(item.id, item);
  const atlas: AtlasClaim[] = state.reports.map((report) => reportClaim(state, report));
  const returnReserve = expedition ? calculateReturnReserve(state, location, scenario) : null;
  const provisionMargin =
    expedition && returnReserve !== null ? expedition.provisions - returnReserve : null;
  const returnReserveWarning = !expedition
    ? "at-waystation"
    : reserveWarning(returnReserve, provisionMargin);
  return {
    protocolVersion: PROTOCOL_VERSION,
    scenarioVersion: state.scenarioVersion,
    revision: state.revision,
    logicalTime: state.logicalTime,
    driftDue: state.driftDue,
    phase: state.phase,
    locationId: location,
    waystation: {
      baseProvisions: BASE_PROVISIONS,
      baseVesselIntegrity: BASE_VESSEL_INTEGRITY,
      baseChargesPerSelectedInstrument: BASE_INSTRUMENT_CHARGES,
      bankedFindings: state.bankedFindings,
      atlasContribution: state.atlasContribution,
    },
    commissionOffers: generateCommissionOffers(state, scenario),
    activeCommission: expedition
      ? {
          offer: structuredClone(expedition.commission),
          progress: structuredClone(expedition.commissionProgress),
        }
      : null,
    preparationCatalog: {
      extraProvisionCost: 1,
      maximumExtraProvisions: 2,
      reinforcedVesselIntegrityCost: 2,
      maximumReinforcedVesselIntegrity: 1,
      extraChargeCost: 1,
      maximumExtraChargePerInstrument: 1,
      bankedFindings: state.bankedFindings,
    },
    currentExpeditionSummary:
      state.phase === "returned" || state.phase === "failed"
        ? structuredClone(state.latestExpeditionSummary)
        : null,
    previousExpeditionSummary:
      state.phase === "idle" || state.phase === "expedition"
        ? structuredClone(state.latestExpeditionSummary)
        : null,
    expeditionResources: expedition
      ? {
          provisions: expedition.provisions,
          maximumProvisions: expedition.maximumProvisions,
          vesselIntegrity: expedition.vesselIntegrity,
          maximumVesselIntegrity: expedition.maximumVesselIntegrity,
          instrumentCharges: expedition.instruments.map((instrument) => ({
            instrument,
            remaining: expedition.instrumentCharges[instrument]?.current ?? 0,
            maximum: expedition.instrumentCharges[instrument]?.maximum ?? 0,
          })),
          returnReserve,
          provisionMargin,
          returnReserveWarning,
          unbankedFindings: expedition.unbankedFindings,
        }
      : null,
    selectedInstruments: expedition?.instruments ?? [],
    knownRoutes,
    knownNodeIds,
    visitedNodeIds: expedition ? [...new Set(expedition.visited)] : [],
    previousLocationId: expedition?.previousLocationId ?? null,
    actions: actionAffordances(state, scenario),
    observations: [...observations.values()],
    atlas,
    traces: structuredClone(state.traces),
    adventure: createAdventureProjection(state),
  };
}
