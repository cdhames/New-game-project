import {
  PROTOCOL_VERSION,
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
  type StableId,
  type TraceRecord,
} from "@long-map/protocol";

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
}
export interface Scenario {
  version: "1.0.0";
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
  supply: number;
  integrity: number;
  locationId: StableId;
  previousLocationId: StableId | null;
  visited: StableId[];
  observations: ObservationRecord[];
  unbankedReward: number;
  salvagedOpportunityIds: StableId[];
}
export interface CanonicalState {
  protocolVersion: typeof PROTOCOL_VERSION;
  scenarioVersion: "1.0.0";
  revision: number;
  logicalTime: number;
  rng: RngState;
  phase: "idle" | "expedition" | "returned" | "failed";
  expeditionSequence: number;
  resolvedExpeditions: number;
  driftDue: boolean;
  expedition: ExpeditionState | null;
  reports: ReportRecord[];
  personalObservations: ObservationRecord[];
  traces: TraceRecord[];
  bankedReward: number;
  driftedSubjects: StableId[];
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
const baseline = (
  n: number,
  subjectId: StableId,
  category: ObservationCategory,
  quality: EvidenceQuality,
  age: number,
): ReportRecord => ({
  id: `baseline-observation-${n}`,
  reportId: `baseline-report-${n}`,
  subjectId,
  category,
  value: category === "route" ? "passable" : n,
  observedRevision: 0,
  observedAt: age,
  expeditionId: `baseline-expedition-${n}`,
  method: n % 2 === 0 ? "sounding-line" : "weather-glass",
  quality,
  sourceClass: "baseline",
  publishedAt: age + 1,
  corroboratingExpeditionIds: [],
});
export const DEVELOPMENT_SCENARIO: Scenario = {
  version: "1.0.0",
  waystationId: "harbor",
  nodes,
  routes,
  baselineReports: [
    baseline(1, "r-hs", "route", "high", 0),
    baseline(2, "r-hg", "route", "medium", 1),
    baseline(3, "r-sn", "hazard", "low", 0),
    baseline(4, "r-gp", "condition", "medium", 2),
    baseline(5, "shoal", "opportunity", "low", 1),
    baseline(6, "glass-cay", "condition", "high", 2),
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
    logicalTime: 0,
    rng: { value: seed >>> 0 || 1 },
    phase: "idle",
    expeditionSequence: 0,
    resolvedExpeditions: 0,
    driftDue: false,
    expedition: null,
    reports: structuredClone(scenario.baselineReports),
    personalObservations: [],
    traces: [],
    bankedReward: 0,
    driftedSubjects: [],
    processedCommandIds: [],
  };
}
const instrumentFor: Record<ObservationCategory, Instrument> = {
  route: "sounding-line",
  hazard: "weather-glass",
  condition: "weather-glass",
  opportunity: "field-lens",
};
const routeAt = (scenario: Scenario, location: StableId, id: StableId): RouteTruth | undefined =>
  scenario.routes.find((r) => r.id === id && (r.a === location || r.b === location));
const otherEnd = (route: RouteTruth, location: StableId): StableId =>
  route.a === location ? route.b : route.a;
const localSubject = (scenario: Scenario, location: StableId, subjectId: StableId): boolean =>
  subjectId === location ||
  scenario.routes.some((r) => r.id === subjectId && (r.a === location || r.b === location));
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
): DomainEvent => event(kind, state.logicalTime, { ...payload, canonicalState: state });

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
  let kind: string;
  let payload: Record<string, unknown>;
  if (command.kind === "start-expedition") {
    if (state.phase !== "idle" && state.phase !== "returned" && state.phase !== "failed")
      return reject(state, "wrong-phase");
    if (new Set(command.instruments).size !== 2) return reject(state, "invalid-loadout");
    next.expeditionSequence += 1;
    next.phase = "expedition";
    next.expedition = {
      id: `expedition-${next.expeditionSequence}`,
      instruments: [...command.instruments].sort(),
      supply: 6,
      integrity: 3,
      locationId: scenario.waystationId,
      previousLocationId: null,
      visited: [scenario.waystationId],
      observations: [],
      unbankedReward: 0,
      salvagedOpportunityIds: [],
    };
    kind = "expedition-started";
    payload = { expeditionId: next.expedition.id, instruments: next.expedition.instruments };
  } else if (command.kind === "travel") {
    const ex = state.expedition;
    if (state.phase !== "expedition" || !ex) return reject(state, "wrong-phase");
    const route = routeAt(scenario, ex.locationId, command.routeId);
    if (!route) return reject(state, "route-not-connected");
    if (ex.supply < 1) return reject(state, "insufficient-supply");
    const roll = nextRandom(next.rng);
    next.rng = roll.rng;
    const damaged = roll.value % 6 < route.hazard;
    const target = otherEnd(route, ex.locationId);
    const mutable = next.expedition!;
    mutable.supply -= 1;
    mutable.previousLocationId = mutable.locationId;
    mutable.locationId = target;
    mutable.visited.push(target);
    if (damaged) mutable.integrity -= 1;
    kind = "route-traversed";
    payload = { routeId: route.id, target, damaged };
    if (mutable.integrity <= 0) fail(next, scenario, "integrity");
  } else if (command.kind === "observe") {
    const ex = state.expedition;
    if (state.phase !== "expedition" || !ex) return reject(state, "wrong-phase");
    if (ex.supply < 1) return reject(state, "insufficient-supply");
    if (!ex.instruments.includes(instrumentFor[command.category]))
      return reject(state, "instrument-required");
    if (!localSubject(scenario, ex.locationId, command.subjectId))
      return reject(state, "subject-not-local");
    const obs: ObservationRecord = {
      id: `observation-${ex.id}-${ex.observations.length + 1}`,
      subjectId: command.subjectId,
      category: command.category,
      value: observedValue(scenario, command.subjectId, command.category),
      observedRevision: state.revision,
      observedAt: next.logicalTime,
      expeditionId: ex.id,
      method: instrumentFor[command.category],
      quality: "high",
    };
    next.expedition!.supply -= 1;
    next.expedition!.observations.push(obs);
    kind = "observation-made";
    payload = { observation: obs };
  } else if (command.kind === "salvage") {
    const ex = state.expedition;
    if (state.phase !== "expedition" || !ex) return reject(state, "wrong-phase");
    const node = scenario.nodes.find((n) => n.id === ex.locationId);
    if (
      !node ||
      node.id !== command.opportunityId ||
      node.opportunity <= 0 ||
      ex.salvagedOpportunityIds.includes(node.id)
    )
      return reject(state, "opportunity-unavailable");
    if (ex.supply < 1) return reject(state, "insufficient-supply");
    next.expedition!.supply -= 1;
    next.expedition!.unbankedReward += node.opportunity;
    next.expedition!.salvagedOpportunityIds.push(node.id);
    kind = "opportunity-salvaged";
    payload = { opportunityId: node.id, reward: node.opportunity };
  } else if (command.kind === "resolve-return") {
    const ex = state.expedition;
    if (state.phase !== "expedition" || !ex) return reject(state, "wrong-phase");
    if (ex.locationId !== scenario.waystationId) return reject(state, "not-at-waystation");
    next.phase = "returned";
    next.bankedReward += ex.unbankedReward;
    next.personalObservations.push(...ex.observations);
    next.resolvedExpeditions += 1;
    next.driftDue = next.resolvedExpeditions % 3 === 0;
    kind = "expedition-returned";
    payload = { bankedReward: ex.unbankedReward, observationIds: ex.observations.map((o) => o.id) };
  } else if (command.kind === "resolve-failure") {
    if (state.phase !== "expedition" || !state.expedition) return reject(state, "wrong-phase");
    if (command.reason === "integrity" && state.expedition.integrity > 0)
      return reject(state, "failure-not-eligible");
    if (command.reason === "stranded" && canContinueOrReturn(state, scenario))
      return reject(state, "failure-not-eligible");
    fail(next, scenario, command.reason);
    kind = "expedition-failed";
    payload = { reason: command.reason, traceId: next.traces.at(-1)?.id };
  } else if (command.kind === "publish-reports") {
    if (state.phase !== "returned" || !state.expedition) return reject(state, "wrong-phase");
    if (command.observationIds.length > 3) return reject(state, "publication-limit");
    const eligible = state.expedition.observations.filter((o) =>
      command.observationIds.includes(o.id),
    );
    if (eligible.length !== new Set(command.observationIds).size)
      return reject(state, "observation-ineligible");
    const reports = eligible.map((o): ReportRecord => ({
      ...o,
      reportId: `report-${o.id}`,
      sourceClass: "player",
      publishedAt: next.logicalTime,
      corroboratingExpeditionIds: independentCorroborators(next.reports, o),
    }));
    next.reports.push(...reports);
    next.expedition = null;
    next.phase = "idle";
    kind = "reports-published";
    payload = { reportIds: reports.map((r) => r.reportId) };
  } else {
    if (!state.driftDue || state.phase === "expedition") return reject(state, "drift-not-due");
    const choices = [...scenario.routes].sort((a, b) => a.id.localeCompare(b.id));
    const roll = nextRandom(next.rng);
    next.rng = roll.rng;
    const count = (roll.value % 2) + 1;
    const selected: StableId[] = [];
    for (let i = 0; i < count; i += 1)
      selected.push(choices[(roll.value + i * 7) % choices.length]!.id);
    next.revision += 1;
    next.driftedSubjects = [...new Set([...next.driftedSubjects, ...selected])].sort();
    next.driftDue = false;
    kind = "drift-applied";
    payload = { revision: next.revision, subjectCount: selected.length };
  }
  return { ok: true, state: next, events: [snapshotEvent(next, kind, payload)] };
}

function observedValue(
  scenario: Scenario,
  subjectId: StableId,
  category: ObservationCategory,
): string | number {
  const route = scenario.routes.find((r) => r.id === subjectId);
  const node = scenario.nodes.find((n) => n.id === subjectId);
  if (category === "route") return route ? "passable" : "local";
  if (category === "hazard")
    return route?.hazard ?? (node?.category === "hazard" ? node.opportunity : 0);
  if (category === "condition") return route?.condition ?? node?.depth ?? 0;
  return node?.opportunity ?? 0;
}
function independentCorroborators(
  reports: ReportRecord[],
  observation: ObservationRecord,
): StableId[] {
  return [
    ...new Set(
      reports
        .filter(
          (r) =>
            r.subjectId === observation.subjectId &&
            r.category === observation.category &&
            r.value === observation.value &&
            r.expeditionId !== observation.expeditionId,
        )
        .map((r) => r.expeditionId),
    ),
  ].sort();
}
function canContinueOrReturn(state: CanonicalState, scenario: Scenario): boolean {
  const ex = state.expedition;
  if (!ex || ex.integrity <= 0 || ex.supply <= 0) return false;
  return scenario.routes.some((r) => r.a === ex.locationId || r.b === ex.locationId);
}
function fail(state: CanonicalState, scenario: Scenario, reason: "stranded" | "integrity"): void {
  const ex = state.expedition!;
  const recoverableReward = Math.floor(ex.unbankedReward / 2);
  const observationIds = ex.observations.slice(0, 2).map((o) => o.id);
  if (recoverableReward > 0 || observationIds.length > 0)
    state.traces.push({
      id: `trace-${ex.id}`,
      expeditionId: ex.id,
      associationId: ex.locationId || scenario.waystationId,
      recoverableReward,
      observationIds,
    });
  state.phase = "failed";
  state.resolvedExpeditions += 1;
  state.driftDue = state.resolvedExpeditions % 3 === 0;
  ex.integrity = reason === "integrity" ? 0 : ex.integrity;
  ex.unbankedReward = 0;
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
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonicalize(v)]),
    );
  return value;
}
export function serializeCanonicalState(state: CanonicalState): string {
  return JSON.stringify(canonicalize(state));
}
export function checksum(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
export function createPlayerProjection(
  state: CanonicalState,
  scenario = DEVELOPMENT_SCENARIO,
): PlayerSafeProjection {
  const ex = state.expedition;
  const location = ex?.locationId ?? scenario.waystationId;
  const atlas: AtlasClaim[] = state.reports.map((r) => ({
    ...r,
    age: state.logicalTime - r.observedAt,
    potentiallyStale:
      state.driftedSubjects.includes(r.subjectId) && r.observedRevision < state.revision,
    independentCorroboration: new Set([r.expeditionId, ...r.corroboratingExpeditionIds]).size - 1,
  }));
  return {
    protocolVersion: PROTOCOL_VERSION,
    scenarioVersion: state.scenarioVersion,
    revision: state.revision,
    logicalTime: state.logicalTime,
    phase: state.phase,
    locationId: location,
    supply: ex?.supply ?? 0,
    integrity: ex?.integrity ?? 0,
    selectedInstruments: ex?.instruments ?? [],
    visibleRouteIds: scenario.routes
      .filter((r) => !r.hidden && (r.a === location || r.b === location))
      .map((r) => r.id)
      .sort(),
    observations: [...state.personalObservations, ...(ex?.observations ?? [])],
    atlas,
    traces: structuredClone(state.traces),
    bankedReward: state.bankedReward,
    unbankedReward: ex?.unbankedReward ?? 0,
  };
}
