import {
  applyCommand,
  checksum,
  createInitialState,
  createPlayerProjection,
  DEVELOPMENT_SCENARIO,
  nextRandom,
  serializeCanonicalState,
  type CanonicalState,
} from "@long-map/game-core";
import {
  PROTOCOL_VERSION,
  type PlayerCommand,
  type PlayerSafeProjection,
  type ReplayRecord,
} from "@long-map/protocol";

export type PolicyName = "cautious" | "aggressive" | "random";
export interface RunMetrics {
  completed: boolean;
  failed: boolean;
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
  averageDecisionSteps: number;
  averageFrontierDepth: number;
  averagePersonalRewardBanked: number;
  averageObservationsCreated: number;
  averageReportsPublished: number;
  terminalChecksumSummary: string;
}
const command = (
  kind: PlayerCommand["kind"],
  sequence: number,
  extra: Record<string, unknown> = {},
): PlayerCommand =>
  ({
    protocolVersion: PROTOCOL_VERSION,
    commandId: `command-${sequence}`,
    kind,
    ...extra,
  }) as PlayerCommand;
const depth = new Map(DEVELOPMENT_SCENARIO.nodes.map((n) => [n.id, n.depth]));

export function legalCommands(view: PlayerSafeProjection, sequence: number): PlayerCommand[] {
  if (view.phase === "idle" || view.phase === "failed")
    return [
      command("start-expedition", sequence, { instruments: ["sounding-line", "field-lens"] }),
    ];
  if (view.phase === "returned")
    return [
      command("publish-reports", sequence, {
        observationIds: view.observations.slice(-3).map((o) => o.id),
      }),
    ];
  const result: PlayerCommand[] =
    view.supply > 0
      ? view.visibleRouteIds.map((routeId) => command("travel", sequence, { routeId }))
      : [];
  if (view.supply > 0) {
    if (view.selectedInstruments.includes("field-lens"))
      result.push(
        command("observe", sequence, { subjectId: view.locationId, category: "opportunity" }),
      );
    result.push(command("salvage", sequence, { opportunityId: view.locationId }));
  }
  if (view.locationId === DEVELOPMENT_SCENARIO.waystationId)
    result.push(command("resolve-return", sequence));
  if (view.supply === 0 || view.integrity === 0)
    result.push(
      command("resolve-failure", sequence, {
        reason: view.integrity === 0 ? "integrity" : "stranded",
      }),
    );
  return result;
}
function choose(
  policy: PolicyName,
  view: PlayerSafeProjection,
  legal: PlayerCommand[],
  random: number,
  previous: PlayerCommand | undefined,
): PlayerCommand {
  if (legal.length === 1) return legal[0]!;
  const returns = legal.find((c) => c.kind === "resolve-return");
  if (policy === "cautious" && returns && view.supply < 6) return returns;
  const travels = legal.filter(
    (c): c is Extract<PlayerCommand, { kind: "travel" }> => c.kind === "travel",
  );
  const retreat =
    previous?.kind === "travel"
      ? travels.find((candidate) => candidate.routeId === previous.routeId)
      : undefined;
  if (policy === "cautious" && retreat) return retreat;
  if (policy === "aggressive" && travels.length > 0)
    return travels.slice().sort((a, b) => b.routeId.localeCompare(a.routeId))[0]!;
  if (policy === "cautious" && travels.length > 0)
    return travels.slice().sort((a, b) => a.routeId.localeCompare(b.routeId))[0]!;
  return legal[random % legal.length]!;
}
export function runExpedition(policy: PolicyName, seed: number): RunMetrics {
  const initial = createInitialState(seed);
  let state: CanonicalState = initial;
  const commands: PlayerCommand[] = [];
  const events = [];
  let steps = 0;
  let maxDepth = 0;
  let policyRng = { value: (seed ^ 0x9e3779b9) >>> 0 };
  while (steps < 40) {
    const view = createPlayerProjection(state);
    maxDepth = Math.max(maxDepth, depth.get(view.locationId) ?? 0);
    if ((view.phase === "idle" || view.phase === "failed") && commands.length > 0) break;
    const legal = legalCommands(view, steps + 1);
    const roll = nextRandom(policyRng);
    policyRng = roll.rng;
    const selected = choose(policy, view, legal, roll.value, commands.at(-1));
    const result = applyCommand(state, selected);
    commands.push(selected);
    steps += 1;
    if (!result.ok) {
      const fallback = legal.find((c) => c.kind !== selected.kind);
      if (!fallback) break;
      continue;
    }
    state = result.state;
    events.push(...result.events);
  }
  const terminal = serializeCanonicalState(state);
  const terminalChecksum = checksum(terminal);
  const published = state.reports.filter((r) => r.sourceClass === "player").length;
  return {
    completed: state.phase === "idle" || state.phase === "returned",
    failed: state.phase === "failed",
    steps,
    maxDepth,
    bankedReward: state.bankedReward,
    observations: state.personalObservations.length,
    reports: published,
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
  return (["cautious", "aggressive", "random"] as const).map((policy) => {
    const runs = Array.from({ length: count }, (_, i) => runExpedition(policy, 10_000 + i));
    const avg = (pick: (r: RunMetrics) => number): number =>
      runs.reduce((n, r) => n + pick(r), 0) / runs.length;
    return {
      policy,
      expeditions: count,
      completionRate: avg((r) => Number(r.completed)),
      failureRate: avg((r) => Number(r.failed)),
      averageDecisionSteps: avg((r) => r.steps),
      averageFrontierDepth: avg((r) => r.maxDepth),
      averagePersonalRewardBanked: avg((r) => r.bankedReward),
      averageObservationsCreated: avg((r) => r.observations),
      averageReportsPublished: avg((r) => r.reports),
      terminalChecksumSummary: checksum(runs.map((r) => r.checksum).join("")),
    };
  });
}
