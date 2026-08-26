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
  type Instrument,
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
  endingProvisions: number | null;
  endingVesselIntegrity: number | null;
  bankedFindings: number;
  unbankedFindings: number;
  observations: number;
  chargesConsumed: number;
  salvageFamilyOutcomes: Record<"findings-cache" | "provision-cache" | "repair-material", number>;
  returnReserveWarningsEncountered: Record<string, number>;
  reports: number;
  commissionFamily: string | null;
  commissionCompleted: boolean;
  commissionFindingsGranted: number;
  atlasContribution: number;
  preparationFindingsSpent: number;
  selectedPreparationCount: number;
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
  averageEndingProvisions: number | null;
  averageEndingVesselIntegrity: number | null;
  averageBankedFindings: number;
  averageUnbankedFindings: number;
  averageObservationsCreated: number;
  averageChargesConsumed: number;
  averageReportsPublished: number;
  commissionFamilySelections: Record<string, number>;
  commissionCompletionRate: number;
  averageCommissionFindingsGranted: number;
  averageAtlasContribution: number;
  averagePreparationFindingsSpent: number;
  averageSelectedPreparationCount: number;
  salvageFamilyOutcomes: Record<"findings-cache" | "provision-cache" | "repair-material", number>;
  returnReserveWarningsEncountered: Record<string, number>;
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
      failureReason: "stranded" | "vessel-integrity";
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
    for (const offer of view.commissionOffers) {
      const instruments: Instrument[] = [];
      if ("requiredInstrument" in offer) instruments.push(offer.requiredInstrument);
      for (const instrument of ["sounding-line", "weather-glass", "field-lens"] as Instrument[])
        if (!instruments.includes(instrument) && instruments.length < 2)
          instruments.push(instrument);
      add("start-expedition", {
        instruments,
        commissionId: offer.id,
        preparation: {
          extraProvisions: 0,
          reinforcedVesselIntegrity: false,
          extraChargeInstruments: [],
        },
      });
    }
  for (const routeId of view.actions.traversableRouteIds) add("travel", { routeId });
  for (const observation of view.actions.observations) add("observe", observation);
  for (const opportunity of view.actions.salvageableOpportunities)
    add("salvage", { opportunityId: opportunity.opportunityId });
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
  const resources = view.expeditionResources;
  const starts = legal.filter(
    (item): item is Extract<PlayerCommand, { kind: "start-expedition" }> =>
      item.kind === "start-expedition",
  );
  if (starts.length) {
    if (policy === "random") return starts[random % starts.length]!;
    const preferred =
      policy === "aggressive"
        ? ["reach-frontier"]
        : policy === "surveyor"
          ? ["verify-report", "survey"]
          : ["recover-salvage", "survey"];
    for (const family of preferred) {
      const match = starts.find(
        (item) =>
          view.commissionOffers.find((offer) => offer.id === item.commissionId)?.family === family,
      );
      if (match) return match;
    }
    return starts[0]!;
  }

  if (policy === "random") return legal[random % legal.length]!;

  const commission = view.activeCommission?.offer;
  if (
    policy === "surveyor" &&
    commission &&
    (commission.family === "verify-report" || commission.family === "survey")
  ) {
    const matching = legal.find(
      (item) =>
        item.kind === "observe" &&
        item.subjectId === commission.subjectId &&
        item.category === commission.category,
    );
    if (matching) return matching;
  }
  if (commission?.family === "recover-salvage") {
    const salvage = legal.find(
      (item) => item.kind === "salvage" && item.opportunityId === commission.targetLocationId,
    );
    if (salvage) return salvage;
    const toward = routeToward(view, legal, commission.targetLocationId);
    if (toward && policy === "cautious") return toward;
  }
  if (commission?.family === "reach-frontier" && policy === "aggressive") {
    const toward = routeToward(view, legal, commission.targetLocationId);
    if (toward) return toward;
  }

  if (policy === "surveyor") {
    const observed = new Set(view.observations.map((item) => `${item.subjectId}:${item.category}`));
    const survey = legal.find(
      (item) =>
        item.kind === "observe" &&
        !observed.has(`${item.subjectId}:${item.category}`) &&
        item.category !== "opportunity",
    );
    if (
      survey &&
      resources &&
      (resources.provisionMargin ?? -1) >= 1 &&
      resources.vesselIntegrity > 1
    )
      return survey;
    if (resolveReturn) return resolveReturn;
    if (resources && ((resources.provisionMargin ?? -1) <= 0 || resources.vesselIntegrity <= 1))
      return routeToward(view, legal, waystationId) ?? travels[0]!;
    return travels[0] ?? legal[0]!;
  }

  if (policy === "cautious") {
    if (
      resolveReturn &&
      resources &&
      ((resources.provisionMargin ?? -1) <= 1 || resources.vesselIntegrity <= 2)
    )
      return resolveReturn;
    if (resources && ((resources.provisionMargin ?? -1) <= 1 || resources.vesselIntegrity <= 2))
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
  let lastExpeditionResources: { provisions: number; vesselIntegrity: number } | null = null;
  const returnReserveWarningsEncountered: Record<string, number> = {};

  while (steps < stepLimit) {
    const view = createPlayerProjection(state);
    if (view.expeditionResources) {
      const warning = view.expeditionResources.returnReserveWarning;
      returnReserveWarningsEncountered[warning] =
        (returnReserveWarningsEncountered[warning] ?? 0) + 1;
    }
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
    if (state.expedition)
      lastExpeditionResources = {
        provisions: state.expedition.provisions,
        vesselIntegrity: state.expedition.vesselIntegrity,
      };
    events.push(...result.events);
    if (selected.kind === "publish-reports") published = true;
  }

  const timedOut =
    steps >= stepLimit && state.phase !== "failed" && !(state.phase === "idle" && published);
  const terminalChecksum = checksum(serializeCanonicalState(state));
  const playerReports = state.reports.filter((item) => item.sourceClass === "player").length;
  const startCommand = commands.find(
    (item): item is Extract<PlayerCommand, { kind: "start-expedition" }> =>
      item.kind === "start-expedition",
  );
  const result = state.previousCommissionResult;
  const active = state.expedition;
  const salvageFamilyOutcomes = {
    "findings-cache": 0,
    "provision-cache": 0,
    "repair-material": 0,
  };
  for (const domainEvent of events) {
    if (domainEvent.kind !== "opportunity-salvaged") continue;
    const family = domainEvent.payload["family"];
    if (family === "findings-cache" || family === "provision-cache" || family === "repair-material")
      salvageFamilyOutcomes[family] += 1;
  }
  return {
    completedFullLoop: state.phase === "idle" && published && !timedOut,
    failed: state.phase === "failed",
    timedOut,
    rejectedCommandCount,
    steps,
    maxDepth,
    endingProvisions: lastExpeditionResources?.provisions ?? null,
    endingVesselIntegrity: lastExpeditionResources?.vesselIntegrity ?? null,
    bankedFindings: state.bankedFindings,
    unbankedFindings: state.expedition?.unbankedFindings ?? 0,
    observations: state.personalObservations.length,
    chargesConsumed: commands.filter((item) => item.kind === "observe").length,
    salvageFamilyOutcomes,
    returnReserveWarningsEncountered,
    reports: playerReports,
    commissionFamily: result?.family ?? active?.commission.family ?? null,
    commissionCompleted:
      result?.result === "success" || active?.commissionProgress.status === "completed",
    commissionFindingsGranted: result?.findingsRewardGranted ?? 0,
    atlasContribution: state.atlasContribution,
    preparationFindingsSpent:
      result?.preparationFindingsSpent ?? active?.preparationFindingsSpent ?? 0,
    selectedPreparationCount: startCommand
      ? startCommand.preparation.extraProvisions +
        Number(startCommand.preparation.reinforcedVesselIntegrity) +
        startCommand.preparation.extraChargeInstruments.length
      : 0,
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
    const averageDefined = (pick: (run: RunMetrics) => number | null): number | null => {
      const values = runs.map(pick).filter((value): value is number => value !== null);
      return values.length
        ? values.reduce((total, value) => total + value, 0) / values.length
        : null;
    };
    return {
      policy,
      expeditions: count,
      completionRate: average((run) => Number(run.completedFullLoop)),
      failureRate: average((run) => Number(run.failed)),
      timeoutRate: average((run) => Number(run.timedOut)),
      rejectedCommandCount: runs.reduce((total, run) => total + run.rejectedCommandCount, 0),
      averageDecisionSteps: average((run) => run.steps),
      averageFrontierDepth: average((run) => run.maxDepth),
      averageEndingProvisions: averageDefined((run) => run.endingProvisions),
      averageEndingVesselIntegrity: averageDefined((run) => run.endingVesselIntegrity),
      averageBankedFindings: average((run) => run.bankedFindings),
      averageUnbankedFindings: average((run) => run.unbankedFindings),
      averageObservationsCreated: average((run) => run.observations),
      averageChargesConsumed: average((run) => run.chargesConsumed),
      averageReportsPublished: average((run) => run.reports),
      commissionFamilySelections: runs.reduce<Record<string, number>>((totals, run) => {
        if (run.commissionFamily)
          totals[run.commissionFamily] = (totals[run.commissionFamily] ?? 0) + 1;
        return totals;
      }, {}),
      commissionCompletionRate: average((run) => Number(run.commissionCompleted)),
      averageCommissionFindingsGranted: average((run) => run.commissionFindingsGranted),
      averageAtlasContribution: average((run) => run.atlasContribution),
      averagePreparationFindingsSpent: average((run) => run.preparationFindingsSpent),
      averageSelectedPreparationCount: average((run) => run.selectedPreparationCount),
      salvageFamilyOutcomes: runs.reduce(
        (totals, run) => {
          for (const family of Object.keys(totals) as Array<keyof typeof totals>)
            totals[family] += run.salvageFamilyOutcomes[family];
          return totals;
        },
        { "findings-cache": 0, "provision-cache": 0, "repair-material": 0 },
      ),
      returnReserveWarningsEncountered: runs.reduce<Record<string, number>>((totals, run) => {
        for (const [warning, occurrences] of Object.entries(run.returnReserveWarningsEncountered))
          totals[warning] = (totals[warning] ?? 0) + occurrences;
        return totals;
      }, {}),
      terminalChecksumSummary: checksum(runs.map((run) => run.checksum).join("")),
    };
  });
}
