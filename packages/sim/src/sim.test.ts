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
  smokeStudy,
  type PolicyName,
} from "./index.js";

const start: PlayerCommand = {
  protocolVersion: PROTOCOL_VERSION,
  commandId: "test-start",
  kind: "start-expedition",
  instruments: ["sounding-line", "weather-glass"],
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
      protocolVersion: 1,
      commandId: "test-depart",
      kind: "travel",
      routeId: "r-hs",
    });
    const returnedHome = accepted(departed, {
      protocolVersion: 1,
      commandId: "test-home",
      kind: "travel",
      routeId: "r-hs",
    });
    const resolved = accepted(returnedHome, {
      protocolVersion: 1,
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
});

describe("headless simulation", () => {
  const policies: PolicyName[] = ["cautious", "aggressive", "random", "surveyor"];

  for (const policy of policies) {
    it(`${policy} produces no rejected commands or timeouts across 100 fixed seeds`, () => {
      const runs = Array.from({ length: 100 }, (_, index) => runExpedition(policy, 20_000 + index));
      expect(runs.every((run) => run.rejectedCommandCount === 0)).toBe(true);
      expect(runs.every((run) => !run.timedOut)).toBe(true);
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

  it("does not mark a returned run complete before publication", () => {
    const run = runExpedition("cautious", 9, 6);
    expect(run.replay.events.at(-1)?.kind).toBe("expedition-returned");
    expect(run.completedFullLoop).toBe(false);
    expect(run.timedOut).toBe(true);
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
        protocolVersion: 1,
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
