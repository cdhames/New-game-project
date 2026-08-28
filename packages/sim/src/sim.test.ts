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
  runBellAdventurePath,
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
      protocolVersion: PROTOCOL_VERSION,
      commandId: "test-depart",
      kind: "travel",
      routeId: "r-hs",
    });
    const returnedHome = accepted(departed, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "test-home",
      kind: "travel",
      routeId: "r-hs",
    });
    const resolved = accepted(returnedHome, {
      protocolVersion: PROTOCOL_VERSION,
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
    const run = runExpedition("cautious", 9, 5);
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
        protocolVersion: PROTOCOL_VERSION,
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

describe("Bell adventure headless paths", () => {
  it.each([
    ["careful-shared-discovery", "shared", "lead-follow-divided-resonance"],
    ["careful-private-discovery", "withheld", "lead-return-before-rival-charts-bell"],
    ["early-withdrawal", "incomplete", "lead-return-before-rival-charts-bell"],
    ["risky-failed-descent", "failed", "lead-bell-beneath-north-mark"],
  ] as const)("replays %s through commands and events", (path, outcome, nextLeadId) => {
    const run = runBellAdventurePath(path);
    expect(run.projection.adventure.latestResolution?.outcome).toBe(outcome);
    expect(run.projection.adventure.availableLead?.id).toBe(nextLeadId);
    expect(run.commandReplayMatches).toBe(true);
    expect(run.eventReplayMatches).toBe(true);
    expect(run.commands.every((command) => command.protocolVersion === PROTOCOL_VERSION)).toBe(
      true,
    );
    const repeated = runBellAdventurePath(path);
    expect(repeated.canonicalOutput).toBe(run.canonicalOutput);
    expect(repeated.projectionOutput).toBe(run.projectionOutput);
  });

  it("keeps shared and private consequences distinct and Mara explicitly simulated", () => {
    const shared = runBellAdventurePath("careful-shared-discovery").projection.adventure;
    const withheld = runBellAdventurePath("careful-private-discovery").projection.adventure;
    expect(shared.publicAnnotations).toEqual(
      expect.arrayContaining([expect.objectContaining({ subjectId: "r-nd", traversable: false })]),
    );
    expect(shared.privateAcousticRouteClue).toBeNull();
    expect(withheld.publicAnnotations).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ subjectId: "r-nd" })]),
    );
    expect(withheld.privateAcousticRouteClue).toMatchObject({ routeId: "r-nd" });
    for (const claim of [...shared.outsideClaims, ...withheld.outsideClaims])
      expect(claim).toMatchObject({
        actorId: "actor-mara-venn-simulated",
        actorDisplayName: "Mara Venn — simulated expedition source",
        sourceType: "simulated-prototype",
        subjectId: "r-nr",
      });
    expect(shared.outsideClaims[0]?.quality).toBe("medium");
    expect(withheld.outsideClaims[0]?.quality).toBe("low");
    expect(shared.outsideClaims[0]).not.toEqual(withheld.outsideClaims[0]);
    expect(shared.publicResonanceEvidenceState).toBe("conflicting-values");
    expect(withheld.publicResonanceEvidenceState).toBe("single-value");
    expect(withheld.outsideClaims[0]?.potentiallyStale).toBe(true);
  });

  it("applies a safe visible North Mark Drift and retains capability/discovery rules", () => {
    const shared = runBellAdventurePath("careful-shared-discovery");
    expect(shared.state.revision).toBe(1);
    expect(shared.projection.adventure.visibleDriftEvent).toMatchObject({
      id: "drift-event-north-mark-resonance",
      affectedRegionId: "north-mark",
      pendingAcknowledgement: false,
      explanation: "The world changed, so some old knowledge may no longer be reliable.",
    });
    const disclosureEvent = shared.events.find(
      (event) => event.kind === "discovery-disclosure-resolved",
    );
    const disclosureSnapshot = disclosureEvent?.payload["canonicalState"] as
      CanonicalState | undefined;
    expect(disclosureSnapshot?.adventure.visibleDriftEvent).toMatchObject({
      pendingAcknowledgement: true,
      affectedRegionId: "north-mark",
    });
    expect(disclosureSnapshot?.adventure.visibleDriftEvent?.potentiallyStaleClaimIds).toContain(
      "annotation-resonance-r-nd",
    );
    expect(shared.projection.adventure.capabilities).toEqual([
      expect.objectContaining({ id: "capability-resonance-compass" }),
    ]);
    expect(shared.projection.adventure.discoveries).toEqual([
      expect.objectContaining({ id: "discovery-resonant-waystone-fragment", public: true }),
    ]);

    const withdrawn = runBellAdventurePath("early-withdrawal").projection.adventure;
    expect(withdrawn.latestResolution).toMatchObject({
      discoveryRecovered: false,
      capabilityUnlocked: false,
    });
    expect(withdrawn.capabilities).toEqual([]);

    const failed = runBellAdventurePath("risky-failed-descent").projection.adventure;
    expect(failed.latestResolution).toMatchObject({
      outcome: "failed",
      clueIds: ["clue-bell-interval"],
      discoveryRecovered: false,
      capabilityUnlocked: false,
    });
    expect(failed.disclosurePending).toBe(false);
  });

  it("exposes the Compass clue and tune action on the next Lead without exposing danger", () => {
    const first = runBellAdventurePath("careful-private-discovery");
    let state = accepted(first.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "followup-start",
      kind: "start-lead-expedition",
      leadId: "lead-return-before-rival-charts-bell",
      instruments: ["sounding-line", "weather-glass"],
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "followup-hs",
      kind: "travel",
      routeId: "r-hs",
    });
    state = accepted(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "followup-sn",
      kind: "travel",
      routeId: "r-sn",
    });
    const safe = createPlayerProjection(state);
    expect(safe.adventure.privateAcousticRouteClue).toMatchObject({ routeId: "r-nd" });
    expect(safe.adventure.encounter?.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "tune-resonance-compass", available: true }),
      ]),
    );
    expect(safe.adventure.privateAcousticRouteClue?.summary).not.toMatch(
      /hazard [0-9]|condition [0-9]/,
    );
  });
});
