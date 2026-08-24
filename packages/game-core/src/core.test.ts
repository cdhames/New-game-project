import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { PROTOCOL_VERSION, type DomainEvent, type PlayerCommand } from "@long-map/protocol";
import {
  applyCommand,
  createInitialState,
  createPlayerProjection,
  DEVELOPMENT_SCENARIO,
  replayEvents,
  serializeCanonicalState,
} from "./index.js";

const start: PlayerCommand = {
  protocolVersion: PROTOCOL_VERSION,
  commandId: "start-1",
  kind: "start-expedition",
  instruments: ["sounding-line", "field-lens"],
};
const apply = (commands: PlayerCommand[]) =>
  commands.reduce(
    (acc, command) => {
      const result = applyCommand(acc.state, command);
      if (!result.ok) return acc;
      return { state: result.state, events: [...acc.events, ...result.events] };
    },
    {
      state: createInitialState(42),
      events: [] as DomainEvent[],
    },
  );

describe("deterministic expedition core", () => {
  it("produces byte-identical results and replays its events", () => {
    const commands: PlayerCommand[] = [
      start,
      { protocolVersion: 1, commandId: "go-1", kind: "travel", routeId: "r-hs" },
      { protocolVersion: 1, commandId: "back-1", kind: "travel", routeId: "r-hs" },
      { protocolVersion: 1, commandId: "return-1", kind: "resolve-return" },
    ];
    const a = apply(commands);
    const b = apply(commands);
    expect(serializeCanonicalState(a.state)).toBe(serializeCanonicalState(b.state));
    expect(serializeCanonicalState(replayEvents(createInitialState(42), a.events))).toBe(
      serializeCanonicalState(a.state),
    );
  });
  it("rejects invalid commands with stable reasons", () => {
    const result = applyCommand(createInitialState(1), {
      protocolVersion: 1,
      commandId: "bad",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(result).toMatchObject({ ok: false, reason: "wrong-phase", events: [] });
  });
  it("requires instruments and local subjects for observations", () => {
    const begun = applyCommand(createInitialState(1), start);
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const missing = applyCommand(begun.state, {
      protocolVersion: 1,
      commandId: "observe-1",
      kind: "observe",
      subjectId: "harbor",
      category: "hazard",
    });
    expect(missing).toMatchObject({ ok: false, reason: "instrument-required" });
  });
  it("never exposes hidden ground truth in the player projection", () => {
    const text = JSON.stringify(createPlayerProjection(createInitialState(1)));
    expect(text).not.toContain("hidden");
    expect(text).not.toContain('hazard":');
    expect(text).not.toContain('opportunity":');
    expect(text).not.toContain("r-pf");
  });
  it("canonicalizes logically equivalent insertion order", () => {
    const a = createInitialState(1);
    const b = createInitialState(1);
    b.rng = { value: b.rng.value };
    expect(serializeCanonicalState(a)).toBe(serializeCanonicalState(b));
  });
  it("maintains bounded integer resources under arbitrary seeds", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 0x7fffffff }), (seed) => {
        const begun = applyCommand(createInitialState(seed), start);
        if (!begun.ok || !begun.state.expedition) return false;
        const moved = applyCommand(begun.state, {
          protocolVersion: 1,
          commandId: `move-${seed}`,
          kind: "travel",
          routeId: "r-hs",
        });
        return (
          moved.ok &&
          !!moved.state.expedition &&
          Number.isInteger(moved.state.expedition.supply) &&
          moved.state.expedition.supply >= 0 &&
          moved.state.expedition.integrity >= 0 &&
          moved.state.bankedReward >= 0
        );
      }),
    );
  });
  it("scenario has the provisional coherent scale", () => {
    expect(DEVELOPMENT_SCENARIO.nodes).toHaveLength(12);
    expect(DEVELOPMENT_SCENARIO.routes).toHaveLength(18);
    expect(DEVELOPMENT_SCENARIO.baselineReports).toHaveLength(6);
  });

  it("publishes only observations from the returned expedition and enforces the limit", () => {
    const state = createInitialState(3);
    state.phase = "returned";
    state.expedition = {
      id: "expedition-1",
      instruments: ["field-lens", "sounding-line"],
      supply: 2,
      integrity: 3,
      locationId: "harbor",
      previousLocationId: "shoal",
      visited: ["harbor", "shoal", "harbor"],
      unbankedReward: 0,
      salvagedOpportunityIds: [],
      observations: [],
    };
    const invented = applyCommand(state, {
      protocolVersion: 1,
      commandId: "publish-invented",
      kind: "publish-reports",
      observationIds: ["invented-observation"],
    });
    expect(invented).toMatchObject({ ok: false, reason: "observation-ineligible" });
  });

  it("does not count repeated reports from one expedition as independent corroboration", () => {
    const state = createInitialState(4);
    const first = state.reports[0]!;
    state.reports.push({ ...first, id: "duplicate-observation", reportId: "duplicate-report" });
    const claims = createPlayerProjection(state).atlas.filter(
      (claim) => claim.subjectId === first.subjectId,
    );
    expect(claims.every((claim) => claim.independentCorroboration === 0)).toBe(true);
  });

  it("applies deterministic Drift and warns without rewriting historical reports", () => {
    const state = createInitialState(8);
    state.driftDue = true;
    const command: PlayerCommand = {
      protocolVersion: 1,
      commandId: "drift-1",
      kind: "advance-drift",
    };
    const a = applyCommand(state, command);
    const b = applyCommand(state, command);
    expect(a).toEqual(b);
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const affected = a.state.driftedSubjects[0]!;
    a.state.reports.push({ ...a.state.reports[0]!, subjectId: affected, reportId: "old-report" });
    expect(
      createPlayerProjection(a.state).atlas.find((claim) => claim.reportId === "old-report")
        ?.potentiallyStale,
    ).toBe(true);
  });

  it("creates a bounded Trace when failure loses eligible value", () => {
    const begun = applyCommand(createInitialState(5), start);
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.integrity = 0;
    begun.state.expedition.unbankedReward = 5;
    const failed = applyCommand(begun.state, {
      protocolVersion: 1,
      commandId: "fail-1",
      kind: "resolve-failure",
      reason: "integrity",
    });
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.state.traces[0]?.recoverableReward).toBe(2);
  });
});
