import {
  PROTOCOL_VERSION,
  type ActionAffordances,
  type AtlasClaim,
  type DomainEvent,
  type EvidenceQuality,
  type Instrument,
  type ObservationCategory,
  type ObservationRecord,
  type PlayerCommand,
  type PlayerSafeProjection,
  type RejectionReason,
  type ReportRecord,
  type SalvageFamily,
  type SafeSalvageDescriptor,
  type SafeRouteDescriptor,
  type StableId,
  type TraceRecord,
} from "@long-map/protocol";

export const ROUTE_VALUE_MIN = 0;
export const ROUTE_VALUE_MAX = 3;
export const INITIAL_LOGICAL_TIME = 6;
export const BASE_PROVISIONS = 8;
export const BASE_VESSEL_INTEGRITY = 4;
export const BASE_INSTRUMENT_CHARGES = 2;
export const TRAVEL_PROVISION_COST = 1;
export const SALVAGE_PROVISION_COST = 1;

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
  version: "1.1.0";
  initialLogicalTime: number;
  waystationId: StableId;
  nodes: NodeTruth[];
  routes: RouteTruth[];
  baselineReports: ReportRecord[];
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
  instrumentCharges: Partial<Record<Instrument, number>>;
  locationId: StableId;
  previousLocationId: StableId | null;
  visited: StableId[];
  observations: ObservationRecord[];
  travelCount: number;
  unbankedFindings: number;
  salvagedOpportunityIds: StableId[];
}
export interface CanonicalState {
  protocolVersion: typeof PROTOCOL_VERSION;
  scenarioVersion: "1.1.0";
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
  version: "1.1.0",
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
  return (state.phase === "idle" || state.phase === "failed") && !state.driftDue;
}

function canResolveReturn(state: CanonicalState, scenario: Scenario): boolean {
  return (
    state.phase === "expedition" &&
    state.expedition !== null &&
    state.expedition.locationId === scenario.waystationId &&
    state.expedition.travelCount >= 2
  );
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

function actionAffordances(
  state: CanonicalState,
  scenario = DEVELOPMENT_SCENARIO,
): ActionAffordances {
  const expedition = state.expedition;
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
  const traversableRouteIds =
    state.phase === "expedition" && expedition && expedition.provisions > 0
      ? state.world.routes
          .filter(
            (route) =>
              knownRouteIds(state).has(route.id) &&
              (route.a === expedition.locationId || route.b === expedition.locationId),
          )
          .map((route) => route.id)
          .sort(compareCodeUnits)
      : [];
  const observations =
    underway && expedition
      ? localObservationCandidates
          .filter((candidate) => {
            const instrument = methodFor[candidate.category];
            return (
              expedition.instruments.includes(instrument) &&
              (expedition.instrumentCharges[instrument] ?? 0) > 0
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
    expedition.provisions > 0
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
    traversableRouteIds,
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
            : traversableRouteIds.length
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
  if (command.kind === "start-expedition") {
    if (state.phase !== "idle" && state.phase !== "failed") return reject(state, "wrong-phase");
    if (state.driftDue) return reject(state, "drift-required");
    if (new Set(command.instruments).size !== 2) return reject(state, "invalid-loadout");
    next.expeditionSequence += 1;
    next.phase = "expedition";
    next.expedition = {
      id: `expedition-${next.expeditionSequence}`,
      instruments: [...command.instruments].sort(compareCodeUnits),
      provisions: BASE_PROVISIONS,
      maximumProvisions: BASE_PROVISIONS,
      vesselIntegrity: BASE_VESSEL_INTEGRITY,
      maximumVesselIntegrity: BASE_VESSEL_INTEGRITY,
      instrumentCharges: Object.fromEntries(
        command.instruments.map((instrument) => [instrument, BASE_INSTRUMENT_CHARGES]),
      ),
      locationId: scenario.waystationId,
      previousLocationId: null,
      visited: [scenario.waystationId],
      observations: [],
      travelCount: 0,
      unbankedFindings: 0,
      salvagedOpportunityIds: [],
    };
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "expedition-started", {
          expeditionId: next.expedition.id,
          instruments: next.expedition.instruments,
        }),
      ],
    };
  }
  if (command.kind === "travel") {
    const expedition = state.expedition;
    if (state.phase !== "expedition" || !expedition) return reject(state, "wrong-phase");
    const route = routeAt(state.world, expedition.locationId, command.routeId);
    if (!route || !actionAffordances(state, scenario).traversableRouteIds.includes(command.routeId))
      return reject(state, "route-unavailable");
    if (expedition.provisions < TRAVEL_PROVISION_COST)
      return reject(state, "insufficient-provisions");
    const roll = nextRandom(next.rng);
    next.rng = roll.rng;
    const damaged = roll.value % 6 < route.hazard;
    const target = otherEnd(route, expedition.locationId);
    const mutable = next.expedition!;
    mutable.provisions -= TRAVEL_PROVISION_COST;
    mutable.travelCount += 1;
    mutable.previousLocationId = mutable.locationId;
    mutable.locationId = target;
    mutable.visited.push(target);
    if (damaged) mutable.vesselIntegrity -= 1;
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
    if ((expedition.instrumentCharges[instrument] ?? 0) < 1)
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
    next.expedition!.instrumentCharges[instrument] =
      next.expedition!.instrumentCharges[instrument]! - 1;
    next.expedition!.observations.push(observation);
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
    next.expedition!.salvagedOpportunityIds.push(node.id);
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "opportunity-salvaged", {
          opportunityId: node.id,
          family,
          provisionCost: SALVAGE_PROVISION_COST,
          nominalValue,
          appliedValue,
          netProvisionChange: next.expedition!.provisions - beforeProvisions,
          resultingProvisions: next.expedition!.provisions,
          resultingVesselIntegrity: next.expedition!.vesselIntegrity,
          resultingUnbankedFindings: next.expedition!.unbankedFindings,
        }),
      ],
    };
  }
  if (command.kind === "resolve-return") {
    const expedition = state.expedition;
    if (state.phase !== "expedition" || !expedition) return reject(state, "wrong-phase");
    if (expedition.locationId !== scenario.waystationId) return reject(state, "not-at-waystation");
    if (!canResolveReturn(state, scenario)) return reject(state, "expedition-not-underway");
    next.phase = "returned";
    const bankedFindings = expedition.unbankedFindings;
    next.bankedFindings += bankedFindings;
    next.expedition!.unbankedFindings = 0;
    next.personalObservations.push(...expedition.observations);
    next.resolvedExpeditions += 1;
    next.driftDue = next.driftDue || next.resolvedExpeditions % 3 === 0;
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "expedition-returned", {
          bankedFindings,
          observationIds: expedition.observations.map((item) => item.id),
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
  if (command.kind === "publish-reports") {
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
    next.expedition = null;
    next.phase = "idle";
    return {
      ok: true,
      state: next,
      events: [
        snapshotEvent(next, "reports-published", {
          reportIds: reports.map((item) => item.reportId),
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
  const atlas: AtlasClaim[] = state.reports.map((report) => ({
    ...report,
    age: state.logicalTime - report.observedAt,
    potentiallyStale:
      (state.world.subjectLastChangedRevision[report.subjectId] ?? 0) > report.observedRevision,
    independentCorroboration: new Set(
      compatibleReports(report, state.reports).map((item) => item.expeditionId),
    ).size,
  }));
  const returnReserve = expedition ? calculateReturnReserve(state, location, scenario) : null;
  const provisionMargin =
    expedition && returnReserve !== null ? expedition.provisions - returnReserve : null;
  const returnReserveWarning = !expedition
    ? "at-waystation"
    : returnReserve === null
      ? "route-unknown"
      : returnReserve === 0
        ? "at-waystation"
        : provisionMargin! >= 2
          ? "comfortable"
          : provisionMargin === 1
            ? "caution"
            : provisionMargin === 0
              ? "at-reserve"
              : "below-reserve";
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
    },
    expeditionResources: expedition
      ? {
          provisions: expedition.provisions,
          maximumProvisions: expedition.maximumProvisions,
          vesselIntegrity: expedition.vesselIntegrity,
          maximumVesselIntegrity: expedition.maximumVesselIntegrity,
          instrumentCharges: expedition.instruments.map((instrument) => ({
            instrument,
            remaining: expedition.instrumentCharges[instrument] ?? 0,
            maximum: BASE_INSTRUMENT_CHARGES,
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
  };
}
