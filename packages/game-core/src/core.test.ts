import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  PROTOCOL_VERSION,
  type DomainEvent,
  type ObservationRecord,
  type PlayerCommand,
  type ReportRecord,
} from "@long-map/protocol";
import {
  applyCommand,
  compareCodeUnits,
  createInitialState,
  createPlayerProjection,
  DEVELOPMENT_SCENARIO,
  replayEvents,
  ROUTE_VALUE_MAX,
  ROUTE_VALUE_MIN,
  serializeCanonical,
  serializeCanonicalState,
  type CanonicalState,
} from "./index.js";

const start = (id = "start-1"): PlayerCommand => ({
  protocolVersion: PROTOCOL_VERSION,
  commandId: id,
  kind: "start-expedition",
  instruments: ["sounding-line", "field-lens"],
});
const observation = (id: string, expeditionId = "expedition-1"): ObservationRecord => ({
  id,
  subjectId: "r-hs",
  category: "route",
  value: "passable",
  observedRevision: 0,
  observedAt: 6,
  expeditionId,
  method: "sounding-line",
  quality: "high",
});
const report = (
  reportId: string,
  expeditionId: string,
  overrides: Partial<ReportRecord> = {},
): ReportRecord => ({
  ...observation(`observation-${reportId}`, expeditionId),
  reportId,
  sourceClass: "player",
  publishedAt: 7,
  ...overrides,
});
const returnedState = (observations: ObservationRecord[]): CanonicalState => {
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
    observations,
    travelCount: 2,
  };
  state.personalObservations = structuredClone(observations);
  return state;
};

describe("deterministic expedition core", () => {
  it("produces byte-identical results and replays ordered events", () => {
    const commands: PlayerCommand[] = [
      start(),
      { protocolVersion: 1, commandId: "go-1", kind: "travel", routeId: "r-hs" },
      { protocolVersion: 1, commandId: "back-1", kind: "travel", routeId: "r-hs" },
      { protocolVersion: 1, commandId: "return-1", kind: "resolve-return" },
      { protocolVersion: 1, commandId: "publish-1", kind: "publish-reports", observationIds: [] },
    ];
    const run = (): { state: CanonicalState; events: DomainEvent[] } =>
      commands.reduce(
        (accumulator, command) => {
          const result = applyCommand(accumulator.state, command);
          expect(result.ok).toBe(true);
          return result.ok
            ? { state: result.state, events: [...accumulator.events, ...result.events] }
            : accumulator;
        },
        { state: createInitialState(42), events: [] as DomainEvent[] },
      );
    const first = run();
    const second = run();
    expect(serializeCanonicalState(first.state)).toBe(serializeCanonicalState(second.state));
    expect(serializeCanonicalState(replayEvents(createInitialState(42), first.events))).toBe(
      serializeCanonicalState(first.state),
    );
  });

  it("starts baseline Reports with exact mixed nonnegative ages and valid times", () => {
    const state = createInitialState(1);
    expect(createPlayerProjection(state).atlas.map((claim) => claim.age)).toEqual([
      6, 4, 3, 2, 1, 0,
    ]);
    expect(
      state.reports.every(
        (item) =>
          item.observedAt >= 0 &&
          item.observedAt <= state.logicalTime &&
          item.publishedAt >= item.observedAt &&
          item.publishedAt <= state.logicalTime,
      ),
    ).toBe(true);
  });

  it("rejects an immediate empty return without changing canonical state", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const before = serializeCanonicalState(begun.state);
    const rejected = applyCommand(begun.state, {
      protocolVersion: 1,
      commandId: "empty-return",
      kind: "resolve-return",
    });
    expect(rejected).toMatchObject({ ok: false, reason: "expedition-not-underway" });
    expect(serializeCanonicalState(rejected.state)).toBe(before);
    expect(rejected.state.resolvedExpeditions).toBe(0);
    expect(rejected.state.driftDue).toBe(false);
  });

  it("permits return only after departure and subsequent traversal home", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const departed = applyCommand(begun.state, {
      protocolVersion: 1,
      commandId: "depart",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(departed.ok).toBe(true);
    if (!departed.ok) return;
    const returned = applyCommand(departed.state, {
      protocolVersion: 1,
      commandId: "come-home",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(returned.ok).toBe(true);
    if (!returned.ok) return;
    expect(createPlayerProjection(returned.state).actions.canResolveReturn).toBe(true);
    expect(
      applyCommand(returned.state, {
        protocolVersion: 1,
        commandId: "resolve-real-return",
        kind: "resolve-return",
      }).ok,
    ).toBe(true);
  });

  it("projects globally known topology and legal action affordances without hidden truth", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const projection = createPlayerProjection(begun.state);
    expect(projection.knownRoutes.length).toBe(DEVELOPMENT_SCENARIO.routes.length - 1);
    expect(projection.knownRoutes.some((route) => route.id === "r-pf")).toBe(true);
    expect(projection.knownRoutes.some((route) => route.id === "r-ol")).toBe(false);
    expect(projection.knownNodeIds).toContain("far-sound");
    expect(projection.knownNodeIds).not.toContain("last-cairn");
    expect(projection.actions.traversableRouteIds).toEqual(["r-hg", "r-hs"]);
    expect(projection.actions.canResolveReturn).toBe(false);
    expect(projection.actions.publicationRequired).toBe(false);
    expect(JSON.stringify(projection)).not.toContain('"hidden"');
  });

  it("copies mutable Ground truth into canonical state", () => {
    const state = createInitialState(1);
    expect(state.world.routes).toEqual(DEVELOPMENT_SCENARIO.routes);
    expect(state.world.routes).not.toBe(DEVELOPMENT_SCENARIO.routes);
    state.world.routes[0]!.hazard = 3;
    expect(DEVELOPMENT_SCENARIO.routes[0]!.hazard).toBe(0);
  });

  it("changes only unique selected bounded route truth deterministically and preserves Reports", () => {
    const state = createInitialState(8);
    state.driftDue = true;
    const command: PlayerCommand = {
      protocolVersion: 1,
      commandId: "drift-1",
      kind: "advance-drift",
    };
    const reportsBefore = serializeCanonical(state.reports);
    const first = applyCommand(state, command);
    const second = applyCommand(state, command);
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const changedIds = Object.keys(first.state.world.subjectLastChangedRevision);
    expect(new Set(changedIds).size).toBe(changedIds.length);
    expect(changedIds.length === 1 || changedIds.length === 2).toBe(true);
    for (const route of first.state.world.routes) {
      const before = state.world.routes.find((item) => item.id === route.id)!;
      const changed = route.condition !== before.condition || route.hazard !== before.hazard;
      expect(changed).toBe(changedIds.includes(route.id));
      expect(route.condition).toBeGreaterThanOrEqual(ROUTE_VALUE_MIN);
      expect(route.condition).toBeLessThanOrEqual(ROUTE_VALUE_MAX);
      expect(route.hazard).toBeGreaterThanOrEqual(ROUTE_VALUE_MIN);
      expect(route.hazard).toBeLessThanOrEqual(ROUTE_VALUE_MAX);
    }
    expect(serializeCanonical(first.state.reports)).toBe(reportsBefore);
  });

  it("marks only older Reports for subjects changed after their observed revision stale", () => {
    const state = createInitialState(9);
    state.driftDue = true;
    const drift = applyCommand(state, {
      protocolVersion: 1,
      commandId: "drift-2",
      kind: "advance-drift",
    });
    expect(drift.ok).toBe(true);
    if (!drift.ok) return;
    const changed = Object.keys(drift.state.world.subjectLastChangedRevision)[0]!;
    const unchanged = drift.state.world.routes.find((route) => route.id !== changed)!.id;
    drift.state.reports.push(
      report("changed-old", "expedition-a", { subjectId: changed }),
      report("unchanged-old", "expedition-b", { subjectId: unchanged }),
    );
    const projection = createPlayerProjection(drift.state);
    expect(
      projection.atlas.find((claim) => claim.reportId === "changed-old")?.potentiallyStale,
    ).toBe(true);
    expect(
      projection.atlas.find((claim) => claim.reportId === "unchanged-old")?.potentiallyStale,
    ).toBe(false);
  });

  it("requires publication, then required Drift, before another Expedition", () => {
    const state = returnedState([]);
    state.driftDue = true;
    expect(applyCommand(state, start("bypass-publication"))).toMatchObject({
      ok: false,
      reason: "wrong-phase",
    });
    const published = applyCommand(state, {
      protocolVersion: 1,
      commandId: "publish-empty",
      kind: "publish-reports",
      observationIds: [],
    });
    expect(published.ok).toBe(true);
    if (!published.ok) return;
    expect(published.state.driftDue).toBe(true);
    expect(createPlayerProjection(published.state).driftDue).toBe(true);
    expect(applyCommand(published.state, start("bypass-drift"))).toMatchObject({
      ok: false,
      reason: "drift-required",
    });
  });

  it("preserves an already-due Drift flag through a later failure resolution", () => {
    const begun = applyCommand(createInitialState(2), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.driftDue = true;
    begun.state.expedition.integrity = 0;
    const failed = applyCommand(begun.state, {
      protocolVersion: 1,
      commandId: "failure-with-drift-due",
      kind: "resolve-failure",
      reason: "integrity",
    });
    expect(failed.ok && failed.state.driftDue).toBe(true);
  });

  it("does not expose or authorize a guessed unrevealed hidden route", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.locationId = "outer-light";
    const projection = createPlayerProjection(begun.state);
    expect(projection.knownRoutes.some((route) => route.id === "r-ol")).toBe(false);
    expect(
      applyCommand(begun.state, {
        protocolVersion: 1,
        commandId: "guess-travel",
        kind: "travel",
        routeId: "r-ol",
      }),
    ).toMatchObject({ ok: false, reason: "route-unavailable" });
    expect(
      applyCommand(begun.state, {
        protocolVersion: 1,
        commandId: "guess-observe",
        kind: "observe",
        subjectId: "r-ol",
        category: "route",
      }),
    ).toMatchObject({ ok: false, reason: "subject-not-local" });
  });

  it("makes exactly the baseline-reported hidden route safely usable without exposing truth", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.locationId = "pale-inlet";
    const projection = createPlayerProjection(begun.state);
    expect(projection.knownRoutes).toContainEqual({
      id: "r-pf",
      a: "pale-inlet",
      b: "far-sound",
    });
    const text = JSON.stringify(projection);
    expect(text).not.toContain('"hidden"');
    expect(Object.keys(projection.knownRoutes.find((route) => route.id === "r-pf")!)).toEqual([
      "id",
      "a",
      "b",
    ]);
    expect(
      applyCommand(begun.state, {
        protocolVersion: 1,
        commandId: "known-hidden",
        kind: "travel",
        routeId: "r-pf",
      }).ok,
    ).toBe(true);
  });

  it("authorizes a hidden route represented by valid personal route evidence", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    const evidence = observation("personally-revealed-route", "earlier-expedition");
    evidence.subjectId = "r-ol";
    begun.state.personalObservations.push(evidence);
    begun.state.expedition.locationId = "outer-light";
    expect(createPlayerProjection(begun.state).knownRoutes).toContainEqual({
      id: "r-ol",
      a: "outer-light",
      b: "last-cairn",
    });
  });

  it("rejects invalid Observation subject/category combinations deterministically", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const invalid = {
      protocolVersion: 1,
      commandId: "invalid-observation",
      kind: "observe",
      subjectId: "harbor",
      category: "opportunity",
    } as const;
    expect(applyCommand(begun.state, invalid)).toMatchObject({
      ok: false,
      reason: "invalid-observation-subject",
    });
    expect(applyCommand(begun.state, invalid)).toEqual(applyCommand(begun.state, invalid));
  });

  it("enforces distinct publication provenance and limit and deduplicates returned projection", () => {
    const observations = [1, 2, 3, 4].map((number) => observation(`observation-${number}`));
    const state = returnedState(observations);
    expect(createPlayerProjection(state).observations).toHaveLength(4);
    expect(
      applyCommand(state, {
        protocolVersion: 1,
        commandId: "publish-four",
        kind: "publish-reports",
        observationIds: observations.map((item) => item.id),
      }),
    ).toMatchObject({ ok: false, reason: "publication-limit" });
    expect(
      applyCommand(state, {
        protocolVersion: 1,
        commandId: "publish-duplicate",
        kind: "publish-reports",
        observationIds: [observations[0]!.id, observations[0]!.id],
      }),
    ).toMatchObject({ ok: false, reason: "observation-ineligible" });
    expect(
      applyCommand(state, {
        protocolVersion: 1,
        commandId: "publish-invented",
        kind: "publish-reports",
        observationIds: ["invented-observation"],
      }),
    ).toMatchObject({ ok: false, reason: "observation-ineligible" });
  });

  it("derives symmetric independent corroboration and excludes duplicates and incompatibilities", () => {
    const state = createInitialState(4);
    state.reports = [
      report("report-a", "expedition-a"),
      report("report-b", "expedition-b"),
      report("report-a-duplicate", "expedition-a"),
      report("report-incompatible", "expedition-c", { value: "blocked" }),
      report("report-other-time", "expedition-d", { observedAt: 5 }),
      report("report-other-revision", "expedition-e", { observedRevision: 1 }),
    ];
    const claims = createPlayerProjection(state).atlas;
    expect(claims.find((claim) => claim.reportId === "report-a")?.independentCorroboration).toBe(2);
    expect(claims.find((claim) => claim.reportId === "report-b")?.independentCorroboration).toBe(2);
    expect(
      claims.find((claim) => claim.reportId === "report-a-duplicate")?.independentCorroboration,
    ).toBe(2);
    expect(
      claims.find((claim) => claim.reportId === "report-incompatible")?.independentCorroboration,
    ).toBe(0);
    expect(
      claims.find((claim) => claim.reportId === "report-other-time")?.independentCorroboration,
    ).toBe(2);
    expect(
      claims.find((claim) => claim.reportId === "report-other-revision")?.independentCorroboration,
    ).toBe(0);
  });

  it("emits traversal then failure and replays travel-caused integrity failure exactly", () => {
    const begun = applyCommand(createInitialState(2), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.integrity = 1;
    begun.state.world.routes.find((route) => route.id === "r-hs")!.hazard = 3;
    const failed = applyCommand(begun.state, {
      protocolVersion: 1,
      commandId: "fatal-travel",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.events.map((item) => item.kind)).toEqual([
      "route-traversed",
      "expedition-failed",
    ]);
    expect(serializeCanonicalState(replayEvents(begun.state, failed.events))).toBe(
      serializeCanonicalState(failed.state),
    );
  });

  it("canonicalizes genuinely equivalent nested insertion orders without locale comparison", () => {
    const left = { z: { b: 2, a: 1 }, a: [{ d: 4, c: 3 }] };
    const right = { a: [{ c: 3, d: 4 }], z: { a: 1, b: 2 } };
    const original = String.prototype.localeCompare;
    String.prototype.localeCompare = () => {
      throw new Error("locale comparison used");
    };
    try {
      expect(serializeCanonical(left)).toBe(serializeCanonical(right));
      expect(compareCodeUnits("a", "b")).toBe(-1);
      const state = createInitialState(12);
      state.driftDue = true;
      expect(
        applyCommand(state, {
          protocolVersion: 1,
          commandId: "locale-free-drift",
          kind: "advance-drift",
        }).ok,
      ).toBe(true);
    } finally {
      String.prototype.localeCompare = original;
    }
  });

  it("maintains bounded integer resources under arbitrary seeds", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 0x7fffffff }), (seed) => {
        const begun = applyCommand(createInitialState(seed), start(`start-${seed}`));
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

  it("retains the provisional scenario scale", () => {
    expect(DEVELOPMENT_SCENARIO.nodes).toHaveLength(12);
    expect(DEVELOPMENT_SCENARIO.routes).toHaveLength(18);
    expect(DEVELOPMENT_SCENARIO.baselineReports).toHaveLength(6);
    expect(DEVELOPMENT_SCENARIO.routes.filter((route) => route.hidden)).toHaveLength(2);
  });
});
