import { describe, expect, it } from "vitest";
import {
  applyCommand,
  checksum,
  createInitialState,
  createPlayerProjection,
  replayEvents,
  serializeCanonicalState,
  type CanonicalState,
} from "@long-map/game-core";
import { PROTOCOL_VERSION, PlayerCommandSchema, type PlayerCommand } from "@long-map/protocol";
import {
  legalCommands,
  replayCommands,
  runExpedition,
  SimulationInvariantError,
  smokeStudy,
  type PolicyName,
} from "./index.js";

const start: PlayerCommand = {
  protocolVersion: PROTOCOL_VERSION,
  commandId: "test-start",
  kind: "start-expedition",
  instruments: ["sounding-line", "weather-glass"],
  commissionId: "commission-survey",
  preparation: {
    extraProvisions: 0,
    reinforcedVesselIntegrity: false,
    extraChargeInstruments: [],
  },
};

function accepted(state: CanonicalState, command: PlayerCommand): CanonicalState {
  const result = applyCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

describe("player-safe action contract", () => {
  it("returns only schema-valid commands accepted for each originating state", () => {
    const initial = createInitialState(31);
    const begun = accepted(initial, start);
    const departed = accepted(begun, {
      protocolVersion: 3,
      commandId: "test-depart",
      kind: "travel",
      routeId: "r-hs",
    });
    const returnedHome = accepted(departed, {
      protocolVersion: 3,
      commandId: "test-home",
      kind: "travel",
      routeId: "r-hs",
    });
    const resolved = accepted(returnedHome, {
      protocolVersion: 3,
      commandId: "test-resolve",
      kind: "resolve-return",
    });
    for (const state of [initial, begun, departed, returnedHome, resolved]) {
      const commands = legalCommands(createPlayerProjection(state), 20);
      expect(commands.length).toBeGreaterThan(0);
      for (const command of commands) {
        expect(PlayerCommandSchema.safeParse(command).success).toBe(true);
        expect(applyCommand(state, command).ok).toBe(true);
      }
    }
  });

  it("raises a structured invariant error for contradictory return and failure affordances", () => {
    const projection = createPlayerProjection(createInitialState(31));
    projection.actions.canResolveReturn = true;
    projection.actions.failureReason = "stranded";
    try {
      legalCommands(projection, 1);
      throw new Error("Expected contradictory affordances to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SimulationInvariantError);
      expect((error as SimulationInvariantError).context).toMatchObject({
        kind: "contradictory-affordances",
        canResolveReturn: true,
        failureReason: "stranded",
      });
    }
  });
});

describe("two-Expedition preparation proof", () => {
  it("earns Commission Findings, spends one, and starts with a higher maximum", () => {
    let state = createInitialState(20260804);
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "proof-start-one",
      kind: "start-expedition",
      instruments: ["field-lens", "sounding-line"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "proof-out",
      kind: "travel",
      routeId: "r-hs",
    });
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "proof-salvage",
      kind: "salvage",
      opportunityId: "shoal",
    });
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "proof-home",
      kind: "travel",
      routeId: "r-hs",
    });
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "proof-return",
      kind: "resolve-return",
    });
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "proof-publish",
      kind: "publish-reports",
      observationIds: [],
    });
    expect(state.bankedFindings).toBe(2);
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "proof-start-two",
      kind: "start-expedition",
      instruments: ["field-lens", "sounding-line"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 1,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    expect(state.bankedFindings).toBe(1);
    expect(state.expedition).toMatchObject({
      provisions: 9,
      maximumProvisions: 9,
      preparationFindingsSpent: 1,
    });
  });
});

describe("headless simulation", () => {
  const policies: PolicyName[] = ["cautious", "aggressive", "random", "surveyor"];

  for (const policy of policies) {
    it(`${policy} produces no rejected commands or timeouts across 100 fixed seeds`, () => {
      const runs = Array.from({ length: 100 }, (_, index) => runExpedition(policy, 20_000 + index));
      expect(runs.every((run) => run.rejectedCommandCount === 0)).toBe(true);
      expect(runs.every((run) => !run.timedOut)).toBe(true);
      for (const run of runs) {
        let state = createInitialState(run.replay.seed);
        for (const command of run.replay.commands) {
          if (command.kind === "resolve-failure" && command.reason === "stranded") {
            expect(createPlayerProjection(state).actions.canResolveReturn).toBe(false);
          }
          state = accepted(state, command);
        }
      }
    });
  }

  it("aggressive cohorts reach farther than cautious cohorts", () => {
    const results = smokeStudy(100);
    const cautious = results.find((result) => result.policy === "cautious")!;
    const aggressive = results.find((result) => result.policy === "aggressive")!;
    expect(aggressive.averageFrontierDepth).toBeGreaterThan(cautious.averageFrontierDepth);
  });

  it("surveyor cohorts intentionally create and publish evidence", () => {
    const surveyor = smokeStudy(100).find((result) => result.policy === "surveyor")!;
    expect(surveyor.averageObservationsCreated).toBeGreaterThan(0);
    expect(surveyor.averageReportsPublished).toBeGreaterThan(0);
  });

  it("retains successful Expedition outcome resources after publication clears canonical state", () => {
    const run = Array.from({ length: 100 }, (_, index) =>
      runExpedition("random", 30_000 + index),
    ).find((candidate) => candidate.completedFullLoop && (candidate.endingProvisions ?? 0) > 0);
    expect(run).toBeDefined();
    if (!run) return;
    expect(run.completedFullLoop).toBe(true);
    expect(run.endingProvisions).not.toBeNull();
    expect(run.endingProvisions).toBeGreaterThan(0);
    expect(run.endingVesselIntegrity).not.toBeNull();
  });

  it("does not mark a returned run complete before publication", () => {
    const run = runExpedition("cautious", 9, 6);
    expect(run.completedFullLoop).toBe(false);
    expect(run.timedOut).toBe(true);
    expect(run.replay.commands.some((command) => command.kind === "publish-reports")).toBe(false);
  });

  it("replays retained commands and events to the same terminal checksum", () => {
    const run = runExpedition("surveyor", 17);
    const commandReplay = replayCommands(run.replay.seed, run.replay.commands);
    expect(commandReplay.ok).toBe(true);
    if (!commandReplay.ok) return;
    expect(commandReplay.terminalChecksum).toBe(run.replay.terminalChecksum);
    expect(serializeCanonicalState(commandReplay.state)).toBe(
      serializeCanonicalState(replayEvents(createInitialState(run.replay.seed), run.replay.events)),
    );
    const eventReplay = replayEvents(createInitialState(run.replay.seed), run.replay.events);
    expect(checksum(serializeCanonicalState(eventReplay))).toBe(run.replay.terminalChecksum);
  });

  it("surfaces command-stream rejection context", () => {
    const replay = replayCommands(1, [
      {
        protocolVersion: 3,
        commandId: "invalid-replay-return",
        kind: "resolve-return",
      },
    ]);
    expect(replay).toMatchObject({ ok: false, reason: "wrong-phase", step: 1 });
  });

  it("is deterministic across repeated smoke studies", () => {
    expect(smokeStudy(25)).toEqual(smokeStudy(25));
  });
});
