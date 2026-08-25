import {
  applyCommand,
  checksum,
  compareCodeUnits,
  createInitialState,
  createPlayerProjection,
  nextRandom,
  serializeCanonicalState,
  type CanonicalState,
} from "@long-map/game-core";
import {
  PROTOCOL_VERSION,
  PlayerCommandSchema,
  type DomainEvent,
  type PlayerCommand,
  type PlayerSafeProjection,
  type ReplayRecord,
  type RejectionReason,
  type StableId,
} from "@long-map/protocol";

export type PolicyName = "cautious" | "aggressive" | "random" | "surveyor";
export interface RunMetrics {
  completedFullLoop: boolean;
  failed: boolean;
  timedOut: boolean;
  rejectedCommandCount: number;
  steps: number;
  maxDepth: number;
  bankedReward: number;
  observations: number;
  reports: number;
  checksum: string;
  replay: ReplayRecord;
}
export interface Aggregate {
  policy: PolicyName;
  expeditions: number;
  completionRate: number;
  failureRate: number;
  timeoutRate: number;
  rejectedCommandCount: number;
  averageDecisionSteps: number;
  averageFrontierDepth: number;
  averagePersonalRewardBanked: number;
  averageObservationsCreated: number;
  averageReportsPublished: number;
  terminalChecksumSummary: string;
}
export interface CommandReplaySuccess {
  ok: true;
  state: CanonicalState;
  events: DomainEvent[];
  terminalChecksum: string;
}
export interface CommandReplayRejection {
  ok: false;
  state: CanonicalState;
  events: DomainEvent[];
  command: PlayerCommand;
  reason: RejectionReason;
  step: number;
}
export type CommandReplayResult = CommandReplaySuccess | CommandReplayRejection;

type SimulationInvariantContext =
  | {
      kind: "contradictory-affordances";
      phase: PlayerSafeProjection["phase"];
      locationId: StableId;
      canResolveReturn: true;
      failureReason: "stranded" | "integrity";
    }
  | {
      kind: "command-rejection";
      policy: PolicyName;
      seed: number;
      decisionStep: number;
      command: PlayerCommand;
      rejectionReason: RejectionReason;
      stateChecksum: string;
      replay: ReplayRecord;
    };

export class SimulationInvariantError extends Error {
  readonly context: SimulationInvariantContext;

  constructor(context: SimulationInvariantContext) {
    super(
      context.kind === "command-rejection"
        ? `Simulation command rejected: ${context.rejectionReason}`
        : `Simulation projection advertised both return and ${context.failureReason} failure`,
    );
    this.name = "SimulationInvariantError";
    this.context = context;
  }
}

function command(
  kind: PlayerCommand["kind"],
  sequence: number,
  variant: number,
  extra: Record<string, unknown> = {},
): PlayerCommand {
  return PlayerCommandSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    commandId: `command-${sequence}-${variant}`,
    kind,
    ...extra,
  });
}

export function legalCommands(view: PlayerSafeProjection, sequence: number): PlayerCommand[] {
  if (view.actions.canResolveReturn && view.actions.failureReason) {
    throw new SimulationInvariantError({
      kind: "contradictory-affordances",
      phase: view.phase,
      locationId: view.locationId,
      canResolveReturn: true,
      failureReason: view.actions.failureReason,
    });
  }
  const commands: PlayerCommand[] = [];
  const add = (kind: PlayerCommand["kind"], extra: Record<string, unknown> = {}): void => {
    commands.push(command(kind, sequence, commands.length + 1, extra));
  };
  if (view.actions.publicationRequired) {
    add("publish-reports", {
      observationIds: view.actions.publicationEligibleObservationIds.slice(0, 3),
    });
    return commands;
  }
  if (view.actions.canAdvanceDrift) add("advance-drift");
  if (view.actions.canStartExpedition)
    add("start-expedition", { instruments: ["sounding-line", "weather-glass"] });
  for (const routeId of view.actions.traversableRouteIds) add("travel", { routeId });
  for (const observation of view.actions.observations) add("observe", observation);
  for (const opportunityId of view.actions.salvageableOpportunityIds)
    add("salvage", { opportunityId });
  if (view.actions.canResolveReturn) add("resolve-return");
  if (view.actions.failureReason) add("resolve-failure", { reason: view.actions.failureReason });
  return commands;
}

function adjacency(
  view: PlayerSafeProjection,
): Map<StableId, Array<{ node: StableId; routeId: StableId }>> {
  const graph = new Map<StableId, Array<{ node: StableId; routeId: StableId }>>();
  for (const route of view.knownRoutes) {
    graph.set(route.a, [...(graph.get(route.a) ?? []), { node: route.b, routeId: route.id }]);
    graph.set(route.b, [...(graph.get(route.b) ?? []), { node: route.a, routeId: route.id }]);
  }
  for (const edges of graph.values()) edges.sort((a, b) => compareCodeUnits(a.routeId, b.routeId));
  return graph;
}

function graphDistances(view: PlayerSafeProjection, origin: StableId): Map<StableId, number> {
  const graph = adjacency(view);
  const distances = new Map<StableId, number>([[origin, 0]]);
  const queue: StableId[] = [origin];
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const edge of graph.get(node) ?? []) {
      if (distances.has(edge.node)) continue;
      distances.set(edge.node, distances.get(node)! + 1);
      queue.push(edge.node);
    }
  }
  return distances;
}

function destination(view: PlayerSafeProjection, routeId: StableId): StableId {
  const route = view.knownRoutes.find((item) => item.id === routeId)!;
  return route.a === view.locationId ? route.b : route.a;
}

function routeToward(
  view: PlayerSafeProjection,
  legal: PlayerCommand[],
  target: StableId,
): PlayerCommand | undefined {
  const distances = graphDistances(view, target);
  return legal
    .filter((item): item is Extract<PlayerCommand, { kind: "travel" }> => item.kind === "travel")
    .sort((a, b) => {
      const distance = (id: StableId): number => distances.get(destination(view, id)) ?? 1_000;
      return distance(a.routeId) - distance(b.routeId) || compareCodeUnits(a.routeId, b.routeId);
    })[0];
}

function chooseCommand(
  policy: PolicyName,
  view: PlayerSafeProjection,
  legal: PlayerCommand[],
  random: number,
  waystationId: StableId,
): PlayerCommand {
  if (legal.length === 0) throw new Error("Projection exposed no legal command");
  if (legal.length === 1) return legal[0]!;
  const publication = legal.find((item) => item.kind === "publish-reports");
  if (publication) return publication;
  const failure = legal.find((item) => item.kind === "resolve-failure");
  if (failure) return failure;
  const resolveReturn = legal.find((item) => item.kind === "resolve-return");
  const travels = legal.filter(
    (item): item is Extract<PlayerCommand, { kind: "travel" }> => item.kind === "travel",
  );

  if (policy === "random") return legal[random % legal.length]!;

  if (policy === "surveyor") {
    const observed = new Set(view.observations.map((item) => `${item.subjectId}:${item.category}`));
    const survey = legal.find(
      (item) =>
        item.kind === "observe" &&
        !observed.has(`${item.subjectId}:${item.category}`) &&
        item.category !== "opportunity",
    );
    if (survey && view.supply > 3 && view.integrity > 1) return survey;
    if (resolveReturn) return resolveReturn;
    if (view.supply <= 3 || view.integrity <= 1)
      return routeToward(view, legal, waystationId) ?? travels[0]!;
    return travels[0] ?? legal[0]!;
  }

  if (policy === "cautious") {
    if (resolveReturn && (view.supply <= 4 || view.integrity <= 2)) return resolveReturn;
    if (view.supply <= 4 || view.integrity <= 2)
      return routeToward(view, legal, waystationId) ?? travels[0]!;
    return travels[0] ?? resolveReturn ?? legal[0]!;
  }

  const distances = graphDistances(view, waystationId);
  const alternatives = travels.filter(
    (item) => destination(view, item.routeId) !== view.previousLocationId,
  );
  const candidates = alternatives.length > 0 ? alternatives : travels;
  const unvisited = candidates.filter(
    (item) => !view.visitedNodeIds.includes(destination(view, item.routeId)),
  );
  const ranked = (unvisited.length > 0 ? unvisited : candidates).sort((a, b) => {
    const depth = (item: Extract<PlayerCommand, { kind: "travel" }>): number =>
      distances.get(destination(view, item.routeId)) ?? -1;
    return depth(b) - depth(a) || compareCodeUnits(a.routeId, b.routeId);
  });
  return ranked[0] ?? resolveReturn ?? legal[0]!;
}

export function replayCommands(seed: number, commands: PlayerCommand[]): CommandReplayResult {
  let state = createInitialState(seed);
  const events: DomainEvent[] = [];
  for (const [index, retainedCommand] of commands.entries()) {
    const result = applyCommand(state, retainedCommand);
    if (!result.ok)
      return {
        ok: false,
        state,
        events,
        command: retainedCommand,
        reason: result.reason,
        step: index + 1,
      };
    state = result.state;
    events.push(...result.events);
  }
  return {
    ok: true,
    state,
    events,
    terminalChecksum: checksum(serializeCanonicalState(state)),
  };
}

export function runExpedition(policy: PolicyName, seed: number, stepLimit = 40): RunMetrics {
  const initial = createInitialState(seed);
  let state: CanonicalState = initial;
  const commands: PlayerCommand[] = [];
  const events: DomainEvent[] = [];
  let steps = 0;
  let maxDepth = 0;
  const rejectedCommandCount = 0;
  let policyRng = { value: (seed ^ 0x9e3779b9) >>> 0 };
  const waystationId = createPlayerProjection(initial).locationId;
  let published = false;

  while (steps < stepLimit) {
    const view = createPlayerProjection(state);
    maxDepth = Math.max(maxDepth, graphDistances(view, waystationId).get(view.locationId) ?? 0);
    if (state.phase === "failed" || (state.phase === "idle" && published)) break;
    const legal = legalCommands(view, steps + 1);
    const roll = nextRandom(policyRng);
    policyRng = roll.rng;
    const selected = chooseCommand(policy, view, legal, roll.value, waystationId);
    const result = applyCommand(state, selected);
    commands.push(selected);
    steps += 1;
    if (!result.ok) {
      const terminalChecksum = checksum(serializeCanonicalState(state));
      throw new SimulationInvariantError({
        kind: "command-rejection",
        policy,
        seed,
        decisionStep: steps,
        command: selected,
        rejectionReason: result.reason,
        stateChecksum: terminalChecksum,
        replay: {
          protocolVersion: PROTOCOL_VERSION,
          scenarioVersion: state.scenarioVersion,
          seed,
          initialRngState: initial.rng.value,
          commands,
          events,
          terminalChecksum,
        },
      });
    }
    state = result.state;
    events.push(...result.events);
    if (selected.kind === "publish-reports") published = true;
  }

  const timedOut =
    steps >= stepLimit && state.phase !== "failed" && !(state.phase === "idle" && published);
  const terminalChecksum = checksum(serializeCanonicalState(state));
  const playerReports = state.reports.filter((item) => item.sourceClass === "player").length;
  return {
    completedFullLoop: state.phase === "idle" && published && !timedOut,
    failed: state.phase === "failed",
    timedOut,
    rejectedCommandCount,
    steps,
    maxDepth,
    bankedReward: state.bankedReward,
    observations: state.personalObservations.length,
    reports: playerReports,
    checksum: terminalChecksum,
    replay: {
      protocolVersion: PROTOCOL_VERSION,
      scenarioVersion: state.scenarioVersion,
      seed,
      initialRngState: initial.rng.value,
      commands,
      events,
      terminalChecksum,
    },
  };
}

export function smokeStudy(count = 100): Aggregate[] {
  return (["cautious", "aggressive", "random", "surveyor"] as const).map((policy) => {
    const runs = Array.from({ length: count }, (_, index) => runExpedition(policy, 10_000 + index));
    const average = (pick: (run: RunMetrics) => number): number =>
      runs.reduce((total, run) => total + pick(run), 0) / runs.length;
    return {
      policy,
      expeditions: count,
      completionRate: average((run) => Number(run.completedFullLoop)),
      failureRate: average((run) => Number(run.failed)),
      timeoutRate: average((run) => Number(run.timedOut)),
      rejectedCommandCount: runs.reduce((total, run) => total + run.rejectedCommandCount, 0),
      averageDecisionSteps: average((run) => run.steps),
      averageFrontierDepth: average((run) => run.maxDepth),
      averagePersonalRewardBanked: average((run) => run.bankedReward),
      averageObservationsCreated: average((run) => run.observations),
      averageReportsPublished: average((run) => run.reports),
      terminalChecksumSummary: checksum(runs.map((run) => run.checksum).join("")),
    };
  });
}
