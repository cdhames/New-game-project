import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  PROTOCOL_VERSION,
  PlayerCommandSchema,
  type DomainEvent,
  type ObservationRecord,
  type PlayerCommand,
  type ReportRecord,
} from "@long-map/protocol";
import {
  applyCommand,
  BASE_INSTRUMENT_CHARGES,
  BASE_PROVISIONS,
  BASE_VESSEL_INTEGRITY,
  calculateReturnReserve,
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
  commissionId: "commission-salvage",
  preparation: {
    extraProvisions: 0,
    reinforcedVesselIntegrity: false,
    extraChargeInstruments: [],
  },
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
    provisions: 2,
    maximumProvisions: 8,
    vesselIntegrity: 3,
    maximumVesselIntegrity: 4,
    instrumentCharges: {
      "field-lens": { current: 2, maximum: 2 },
      "sounding-line": { current: 2, maximum: 2 },
    },
    locationId: "harbor",
    previousLocationId: "shoal",
    visited: ["harbor", "shoal", "harbor"],
    unbankedFindings: 0,
    salvagedOpportunityIds: [],
    observations,
    travelCount: 2,
    commission: createPlayerProjection(createInitialState(3)).commissionOffers[0]!,
    commissionProgress: {
      status: "active",
      targetVisited: false,
      matchingObservationRecorded: false,
      targetSalvageRecovered: false,
      requiredReportPublished: false,
      findingsRewardGranted: false,
    },
    preparation: {
      extraProvisions: 0,
      reinforcedVesselIntegrity: false,
      extraChargeInstruments: [],
    },
    preparationFindingsSpent: 0,
    startingResources: {
      provisions: 8,
      maximumProvisions: 8,
      vesselIntegrity: 4,
      maximumVesselIntegrity: 4,
      bankedFindings: 0,
      unbankedFindings: 0,
    },
    routeLegs: [],
    totalDamageSustained: 0,
    salvageOutcomes: [],
    findingsRecoveredFromSalvage: 0,
  };
  state.personalObservations = structuredClone(observations);
  return state;
};

describe("deterministic expedition core", () => {
  it("accepts protocol 4 commands and rejects protocol 3 commands", () => {
    expect(PlayerCommandSchema.safeParse(start()).success).toBe(true);
    expect(PlayerCommandSchema.safeParse({ ...start(), protocolVersion: 3 }).success).toBe(false);
    expect(createInitialState(1)).toMatchObject({
      protocolVersion: PROTOCOL_VERSION,
      scenarioVersion: "1.3.0",
    });
  });
  it("starts with the Revision 0.2 loadout and spends Charges rather than Provisions", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    expect(begun.state.expedition).toMatchObject({
      provisions: BASE_PROVISIONS,
      maximumProvisions: BASE_PROVISIONS,
      vesselIntegrity: BASE_VESSEL_INTEGRITY,
      maximumVesselIntegrity: BASE_VESSEL_INTEGRITY,
      instrumentCharges: {
        "sounding-line": { current: BASE_INSTRUMENT_CHARGES, maximum: BASE_INSTRUMENT_CHARGES },
        "field-lens": { current: BASE_INSTRUMENT_CHARGES, maximum: BASE_INSTRUMENT_CHARGES },
      },
      unbankedFindings: 0,
    });
    expect(begun.state.expedition?.instrumentCharges["weather-glass"]).toBeUndefined();
    const departed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "loadout-depart",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(departed.ok).toBe(true);
    if (!departed.ok) return;
    expect(departed.state.expedition?.provisions).toBe(BASE_PROVISIONS - 1);
    const beforeObservation = departed.state.expedition!.provisions;
    const observed = applyCommand(departed.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "charge-observe-1",
      kind: "observe",
      subjectId: "r-hs",
      category: "route",
    });
    expect(observed.ok).toBe(true);
    if (!observed.ok) return;
    expect(observed.state.expedition?.provisions).toBe(beforeObservation);
    expect(observed.state.expedition?.instrumentCharges["sounding-line"]?.current).toBe(1);
    const observedAgain = applyCommand(observed.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "charge-observe-2",
      kind: "observe",
      subjectId: "r-hs",
      category: "route",
    });
    expect(observedAgain.ok).toBe(true);
    if (!observedAgain.ok) return;
    const depleted = applyCommand(observedAgain.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "charge-observe-3",
      kind: "observe",
      subjectId: "r-hs",
      category: "route",
    });
    expect(depleted).toMatchObject({ ok: false, reason: "instrument-depleted" });
    expect(createPlayerProjection(observedAgain.state).actions.observations).not.toContainEqual({
      subjectId: "r-hs",
      category: "route",
    });
  });

  it("calculates Return Reserve solely over known topology with stable warning thresholds", () => {
    const state = createInitialState(2);
    expect(calculateReturnReserve(state, "harbor")).toBe(0);
    expect(calculateReturnReserve(state, "shoal")).toBe(1);
    expect(calculateReturnReserve(state, "north-mark")).toBe(2);
    expect(createPlayerProjection(state).knownRoutes.some((route) => route.id === "r-ol")).toBe(
      false,
    );
    const isolated = structuredClone(state);
    isolated.world.routes = isolated.world.routes.map((route) =>
      route.id === "r-hs" || route.id === "r-hg" ? { ...route, hidden: true } : route,
    );
    isolated.reports = isolated.reports.filter((item) => item.subjectId !== "r-hs");
    expect(calculateReturnReserve(isolated, "shoal")).toBeNull();
    isolated.personalObservations.push(observation("known-hidden"));
    expect(calculateReturnReserve(isolated, "shoal")).toBe(1);

    const begun = applyCommand(state, start("reserve-start"));
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    for (const [provisions, warning] of [
      [4, "comfortable"],
      [3, "caution"],
      [2, "at-reserve"],
      [1, "below-reserve"],
    ] as const) {
      const candidate = structuredClone(begun.state);
      candidate.expedition!.locationId = "north-mark";
      candidate.expedition!.travelCount = 2;
      candidate.expedition!.provisions = provisions;
      expect(
        candidate.expedition && createPlayerProjection(candidate).expeditionResources,
      ).toMatchObject({
        returnReserve: 2,
        provisionMargin: provisions - 2,
        returnReserveWarning: warning,
      });
    }
  });

  it("applies typed salvage utility, caps restoration, and prevents repeat salvage", () => {
    const begun = applyCommand(createInitialState(3), start("salvage-start"));
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const shoal = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "salvage-depart",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(shoal.ok).toBe(true);
    if (!shoal.ok) return;
    const salvaged = applyCommand(shoal.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "salvage-shoal",
      kind: "salvage",
      opportunityId: "shoal",
    });
    expect(salvaged.ok).toBe(true);
    if (!salvaged.ok) return;
    expect(salvaged.state.expedition?.provisions).toBe(BASE_PROVISIONS);
    expect(salvaged.events[0]?.payload).toMatchObject({
      family: "provision-cache",
      provisionCost: 1,
      nominalValue: 2,
      appliedValue: 2,
      netProvisionChange: 1,
      resultingProvisions: 8,
      resultingVesselIntegrity: 4,
      resultingUnbankedFindings: 0,
    });
    expect(
      applyCommand(salvaged.state, {
        protocolVersion: PROTOCOL_VERSION,
        commandId: "salvage-shoal-again",
        kind: "salvage",
        opportunityId: "shoal",
      }),
    ).toMatchObject({ ok: false, reason: "opportunity-unavailable" });
    expect(
      createPlayerProjection(shoal.state).actions.salvageableOpportunities[0],
    ).not.toHaveProperty("value");
  });

  it("reports bounded applied salvage values for capped restoration, repair, and Findings", () => {
    const begun = applyCommand(createInitialState(4), start("salvage-effects-start"));
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;

    const cappedProvisionState = structuredClone(begun.state);
    cappedProvisionState.expedition!.locationId = "shoal";
    cappedProvisionState.expedition!.travelCount = 1;
    const capped = applyCommand(cappedProvisionState, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "capped-provision-cache",
      kind: "salvage",
      opportunityId: "shoal",
    });
    expect(capped.ok).toBe(true);
    if (!capped.ok) return;
    expect(capped.events[0]?.payload).toMatchObject({
      family: "provision-cache",
      nominalValue: 2,
      appliedValue: 1,
      netProvisionChange: 0,
      resultingProvisions: 8,
    });

    const damagedRepairState = structuredClone(begun.state);
    damagedRepairState.expedition!.locationId = "pale-inlet";
    damagedRepairState.expedition!.travelCount = 1;
    damagedRepairState.expedition!.vesselIntegrity = 3;
    const repaired = applyCommand(damagedRepairState, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "damaged-repair-material",
      kind: "salvage",
      opportunityId: "pale-inlet",
    });
    expect(repaired.ok).toBe(true);
    if (!repaired.ok) return;
    expect(repaired.events[0]?.payload).toMatchObject({
      family: "repair-material",
      provisionCost: 1,
      nominalValue: 1,
      appliedValue: 1,
      resultingVesselIntegrity: 4,
    });

    const fullRepairState = structuredClone(begun.state);
    fullRepairState.expedition!.locationId = "pale-inlet";
    fullRepairState.expedition!.travelCount = 1;
    const fullRepair = applyCommand(fullRepairState, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "full-repair-material",
      kind: "salvage",
      opportunityId: "pale-inlet",
    });
    expect(fullRepair.ok).toBe(true);
    if (!fullRepair.ok) return;
    expect(fullRepair.events[0]?.payload).toMatchObject({
      family: "repair-material",
      nominalValue: 1,
      appliedValue: 0,
      resultingVesselIntegrity: 4,
    });

    const findingsState = structuredClone(begun.state);
    findingsState.expedition!.locationId = "north-mark";
    findingsState.expedition!.travelCount = 2;
    const findings = applyCommand(findingsState, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "north-mark-findings",
      kind: "salvage",
      opportunityId: "north-mark",
    });
    expect(findings.ok).toBe(true);
    if (!findings.ok) return;
    expect(findings.events[0]?.payload).toMatchObject({
      family: "findings-cache",
      provisionCost: 1,
      nominalValue: 2,
      appliedValue: 2,
      netProvisionChange: -1,
      resultingProvisions: 7,
      resultingUnbankedFindings: 2,
    });
  });

  it("produces byte-identical results and replays ordered events", () => {
    const commands: PlayerCommand[] = [
      start(),
      { protocolVersion: PROTOCOL_VERSION, commandId: "go-1", kind: "travel", routeId: "r-hs" },
      { protocolVersion: PROTOCOL_VERSION, commandId: "back-1", kind: "travel", routeId: "r-hs" },
      { protocolVersion: PROTOCOL_VERSION, commandId: "return-1", kind: "resolve-return" },
      {
        protocolVersion: PROTOCOL_VERSION,
        commandId: "publish-1",
        kind: "publish-reports",
        observationIds: [],
      },
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
      protocolVersion: PROTOCOL_VERSION,
      commandId: "empty-return",
      kind: "resolve-return",
    });
    expect(rejected).toMatchObject({ ok: false, reason: "expedition-not-underway" });
    expect(serializeCanonicalState(rejected.state)).toBe(before);
    expect(rejected.state.resolvedExpeditions).toBe(0);
    expect(rejected.state.driftDue).toBe(false);
  });

  it("blocks resource actions before departure without changing canonical state", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const before = serializeCanonicalState(begun.state);
    const projection = createPlayerProjection(begun.state);
    expect(projection.actions.travelOptions.map((option) => option.routeId)).toEqual([
      "r-hg",
      "r-hs",
    ]);
    expect(projection.actions.observations).toEqual([]);
    expect(projection.actions.salvageableOpportunities).toEqual([]);
    expect(projection.actions.canResolveReturn).toBe(false);
    expect(projection.actions.failureReason).toBeNull();
    const observe = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "premature-observe",
      kind: "observe",
      subjectId: "r-hs",
      category: "route",
    });
    const salvage = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "premature-salvage",
      kind: "salvage",
      opportunityId: "shoal",
    });
    expect(observe).toMatchObject({ ok: false, reason: "expedition-not-underway" });
    expect(salvage).toMatchObject({ ok: false, reason: "expedition-not-underway" });
    expect(serializeCanonicalState(observe.state)).toBe(before);
    expect(serializeCanonicalState(salvage.state)).toBe(before);
  });

  it("advertises normal Observation and salvage actions after departure", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const departed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "depart-for-actions",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(departed.ok).toBe(true);
    if (!departed.ok) return;
    const actions = createPlayerProjection(departed.state).actions;
    expect(actions.observations).toContainEqual({ subjectId: "r-hs", category: "route" });
    expect(actions.salvageableOpportunities).toContainEqual({
      opportunityId: "shoal",
      locationId: "shoal",
      family: "provision-cache",
    });
  });

  it("permits return only after departure and subsequent traversal home", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const departed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "depart",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(departed.ok).toBe(true);
    if (!departed.ok) return;
    const returned = applyCommand(departed.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "come-home",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(returned.ok).toBe(true);
    if (!returned.ok) return;
    expect(createPlayerProjection(returned.state).actions.canResolveReturn).toBe(true);
    expect(
      applyCommand(returned.state, {
        protocolVersion: PROTOCOL_VERSION,
        commandId: "resolve-real-return",
        kind: "resolve-return",
      }).ok,
    ).toBe(true);
  });

  it("resolves a legitimate zero-supply return instead of stranded failure", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const departed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "zero-supply-depart",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(departed.ok).toBe(true);
    if (!departed.ok) return;
    const home = applyCommand(departed.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "zero-supply-home",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(home.ok).toBe(true);
    if (!home.ok || !home.state.expedition) return;
    home.state.expedition.provisions = 0;
    home.state.expedition.unbankedFindings = 4;
    home.state.expedition.observations.push(observation("zero-supply-observation"));
    const projection = createPlayerProjection(home.state);
    expect(projection.actions.canResolveReturn).toBe(true);
    expect(projection.actions.failureReason).toBeNull();
    const beforeFailure = serializeCanonicalState(home.state);
    const failure = applyCommand(home.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "reject-stranded-at-home",
      kind: "resolve-failure",
      reason: "stranded",
    });
    expect(failure).toMatchObject({ ok: false, reason: "failure-not-eligible", events: [] });
    expect(serializeCanonicalState(failure.state)).toBe(beforeFailure);
    const resolved = applyCommand(home.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "resolve-zero-supply-return",
      kind: "resolve-return",
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.state.bankedFindings).toBe(4);
    expect(resolved.state.expedition?.unbankedFindings).toBe(0);
    expect(resolved.state.personalObservations).toContainEqual(
      observation("zero-supply-observation"),
    );
    expect(resolved.state.traces).toEqual([]);
    expect(resolved.events.map((event) => event.kind)).toEqual(["expedition-returned"]);
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
    expect(projection.actions.travelOptions.map((option) => option.routeId)).toEqual([
      "r-hg",
      "r-hs",
    ]);
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
      protocolVersion: PROTOCOL_VERSION,
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
      protocolVersion: PROTOCOL_VERSION,
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
      protocolVersion: PROTOCOL_VERSION,
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
    begun.state.expedition.vesselIntegrity = 0;
    const failed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "failure-with-drift-due",
      kind: "resolve-failure",
      reason: "vessel-integrity",
    });
    expect(failed.ok && failed.state.driftDue).toBe(true);
  });

  it("does not expose or authorize a guessed unrevealed hidden route", () => {
    const begun = applyCommand(createInitialState(1), start());
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.locationId = "outer-light";
    begun.state.expedition.travelCount = 1;
    const projection = createPlayerProjection(begun.state);
    expect(projection.knownRoutes.some((route) => route.id === "r-ol")).toBe(false);
    expect(
      applyCommand(begun.state, {
        protocolVersion: PROTOCOL_VERSION,
        commandId: "guess-travel",
        kind: "travel",
        routeId: "r-ol",
      }),
    ).toMatchObject({ ok: false, reason: "route-unavailable" });
    expect(
      applyCommand(begun.state, {
        protocolVersion: PROTOCOL_VERSION,
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
    begun.state.expedition.travelCount = 1;
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
        protocolVersion: PROTOCOL_VERSION,
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
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.travelCount = 1;
    const invalid = {
      protocolVersion: PROTOCOL_VERSION,
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
        protocolVersion: PROTOCOL_VERSION,
        commandId: "publish-four",
        kind: "publish-reports",
        observationIds: observations.map((item) => item.id),
      }),
    ).toMatchObject({ ok: false, reason: "publication-limit" });
    expect(
      applyCommand(state, {
        protocolVersion: PROTOCOL_VERSION,
        commandId: "publish-duplicate",
        kind: "publish-reports",
        observationIds: [observations[0]!.id, observations[0]!.id],
      }),
    ).toMatchObject({ ok: false, reason: "observation-ineligible" });
    expect(
      applyCommand(state, {
        protocolVersion: PROTOCOL_VERSION,
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
    begun.state.expedition.vesselIntegrity = 1;
    begun.state.world.routes.find((route) => route.id === "r-hs")!.hazard = 3;
    const failed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
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
          protocolVersion: PROTOCOL_VERSION,
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
          protocolVersion: PROTOCOL_VERSION,
          commandId: `move-${seed}`,
          kind: "travel",
          routeId: "r-hs",
        });
        return (
          moved.ok &&
          !!moved.state.expedition &&
          Number.isInteger(moved.state.expedition.provisions) &&
          moved.state.expedition.provisions >= 0 &&
          moved.state.expedition.vesselIntegrity >= 0 &&
          moved.state.bankedFindings >= 0
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

describe("Revision 0.2 Commission and preparation foundation", () => {
  const zeroPreparation = {
    extraProvisions: 0,
    reinforcedVesselIntegrity: false,
    extraChargeInstruments: [] as Array<"sounding-line" | "weather-glass" | "field-lens">,
  };
  const startOffer = (
    state: CanonicalState,
    commissionId: string,
    instruments: Array<"sounding-line" | "weather-glass" | "field-lens">,
    preparation = zeroPreparation,
  ) =>
    applyCommand(state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: `start-${commissionId}`,
      kind: "start-expedition",
      commissionId,
      instruments,
      preparation,
    });

  it("generates deterministic, varied, player-safe fresh offers", () => {
    const a = createPlayerProjection(createInitialState(44));
    const b = createPlayerProjection(createInitialState(44));
    expect(a.commissionOffers).toEqual(b.commissionOffers);
    expect(new Set(a.commissionOffers.map((offer) => offer.family)).size).toBeGreaterThanOrEqual(2);
    expect(a.commissionOffers).toHaveLength(4);
    expect(serializeCanonical(a.commissionOffers)).not.toContain("r-ol");
    expect(serializeCanonical(a.commissionOffers)).not.toContain("last-cairn");
    const verify = a.commissionOffers.find((offer) => offer.family === "verify-report")!;
    const survey = a.commissionOffers.find((offer) => offer.family === "survey")!;
    expect(verify).toMatchObject({ subjectId: "r-sn", category: "hazard" });
    expect(`${survey.subjectId}:${survey.category}`).not.toBe(
      `${verify.subjectId}:${verify.category}`,
    );
    expect(a.commissionOffers.find((offer) => offer.family === "reach-frontier")).toMatchObject({
      targetLocationId: "deep-spur",
    });
    expect(a.commissionOffers.find((offer) => offer.family === "recover-salvage")).toMatchObject({
      targetLocationId: "shoal",
    });
  });

  it("allows a known condition node to be the highest-ranked verify target", () => {
    const state = createInitialState(45);
    state.reports = [
      report("node-condition-report", "node-condition-expedition", {
        subjectId: "glass-cay",
        category: "condition",
        value: 0,
        method: "weather-glass",
        quality: "low",
        observedAt: 0,
        observedRevision: 0,
      }),
    ];
    state.world.subjectLastChangedRevision["glass-cay"] = 1;
    expect(createPlayerProjection(state).commissionOffers[0]).toMatchObject({
      family: "verify-report",
      subjectId: "glass-cay",
      category: "condition",
    });
  });

  it("allows a known hazard node to be the highest-ranked verify target", () => {
    const state = createInitialState(46);
    state.reports = [
      report("node-hazard-report", "node-hazard-expedition", {
        subjectId: "reed-bank",
        category: "hazard",
        value: 1,
        method: "weather-glass",
        quality: "low",
        observedAt: 0,
        observedRevision: 0,
      }),
    ];
    state.world.subjectLastChangedRevision["reed-bank"] = 1;
    expect(createPlayerProjection(state).commissionOffers[0]).toMatchObject({
      family: "verify-report",
      subjectId: "reed-bank",
      category: "hazard",
    });
  });

  it("does not offer an inapplicable category merely because its node is known", () => {
    const state = createInitialState(47);
    state.reports = [
      report("invalid-node-report", "invalid-node-expedition", {
        subjectId: "shoal",
        category: "hazard",
        value: 3,
        method: "weather-glass",
        quality: "low",
        observedAt: 0,
      }),
      report("valid-route-report", "valid-route-expedition", {
        subjectId: "r-hs",
        category: "route",
        quality: "high",
      }),
    ];
    expect(createPlayerProjection(state).commissionOffers[0]).toMatchObject({
      family: "verify-report",
      reportId: "valid-route-report",
    });
  });

  it("keeps failed-state offers stable when the failed Expedition is overwritten", () => {
    const begun = startOffer(createInitialState(48), "commission-salvage", [
      "field-lens",
      "sounding-line",
    ]);
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.phase = "failed";
    begun.state.expedition.observations.push({
      ...observation("failed-hidden-route"),
      subjectId: "r-ol",
    });
    const failedProjection = createPlayerProjection(begun.state);
    expect(serializeCanonical(failedProjection.commissionOffers)).not.toContain("r-ol");
    const offer = failedProjection.commissionOffers[0]!;
    const requiredInstrument =
      "requiredInstrument" in offer ? offer.requiredInstrument : "sounding-line";
    const secondInstrument = requiredInstrument === "field-lens" ? "sounding-line" : "field-lens";
    const restarted = startOffer(begun.state, offer.id, [requiredInstrument, secondInstrument]);
    expect(restarted.ok).toBe(true);
    if (!restarted.ok) return;
    const restartedProjection = createPlayerProjection(restarted.state);
    const active = restartedProjection.activeCommission!.offer;
    const target = "subjectId" in active ? active.subjectId : active.targetLocationId;
    expect(
      restartedProjection.knownNodeIds.includes(target) ||
        restartedProjection.knownRoutes.some((route) => route.id === target),
    ).toBe(true);
  });

  it("requires a current compatible Commission and rejects invalid starts byte-identically", () => {
    const state = createInitialState(2);
    const before = serializeCanonicalState(state);
    expect(
      startOffer(state, "missing-commission", ["sounding-line", "weather-glass"]),
    ).toMatchObject({ ok: false, reason: "commission-unavailable" });
    expect(serializeCanonicalState(state)).toBe(before);
    expect(startOffer(state, "commission-verify", ["sounding-line", "field-lens"])).toMatchObject({
      ok: false,
      reason: "commission-incompatible-loadout",
    });
    expect(serializeCanonicalState(state)).toBe(before);
  });

  it("applies exact preparation costs, caps, and current/maximum resources", () => {
    const state = createInitialState(3);
    state.bankedFindings = 6;
    const prepared = startOffer(state, "commission-salvage", ["field-lens", "sounding-line"], {
      extraProvisions: 2,
      reinforcedVesselIntegrity: true,
      extraChargeInstruments: ["field-lens", "sounding-line"],
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.state.bankedFindings).toBe(0);
    expect(prepared.state.expedition).toMatchObject({
      provisions: 10,
      maximumProvisions: 10,
      vesselIntegrity: 5,
      maximumVesselIntegrity: 5,
      preparationFindingsSpent: 6,
    });
    expect(prepared.state.expedition?.instrumentCharges["field-lens"]).toEqual({
      current: 3,
      maximum: 3,
    });
    const insufficient = createInitialState(3);
    expect(
      startOffer(insufficient, "commission-salvage", ["field-lens", "sounding-line"], {
        extraProvisions: 1,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      }),
    ).toMatchObject({ ok: false, reason: "insufficient-findings" });
    const invalid = {
      extraProvisions: 0,
      reinforcedVesselIntegrity: false,
      extraChargeInstruments: ["weather-glass"] as Array<"weather-glass">,
    };
    expect(
      startOffer(state, "commission-salvage", ["field-lens", "sounding-line"], invalid),
    ).toMatchObject({ ok: false, reason: "invalid-preparation" });
  });

  it("tracks salvage completion, rewards only on return, and retains the result", () => {
    const begun = startOffer(createInitialState(5), "commission-salvage", [
      "field-lens",
      "sounding-line",
    ]);
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const outward = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "salvage-out",
      kind: "travel",
      routeId: "r-hs",
    });
    if (!outward.ok) return;
    const salvaged = applyCommand(outward.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "salvage-target",
      kind: "salvage",
      opportunityId: "shoal",
    });
    expect(salvaged.ok && salvaged.state.expedition?.commissionProgress.status).toBe(
      "objective-met",
    );
    if (!salvaged.ok) return;
    expect(salvaged.state.bankedFindings).toBe(0);
    const home = applyCommand(salvaged.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "salvage-home",
      kind: "travel",
      routeId: "r-hs",
    });
    if (!home.ok) return;
    const returned = applyCommand(home.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "salvage-return",
      kind: "resolve-return",
    });
    expect(returned.ok && returned.state.bankedFindings).toBe(2);
    if (!returned.ok) return;
    const published = applyCommand(returned.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "salvage-publish",
      kind: "publish-reports",
      observationIds: [],
    });
    expect(published.ok && published.state.latestExpeditionSummary).toMatchObject({
      commissionResult: "success",
      commissionFindingsGranted: 2,
    });
  });

  it("requires matching verify evidence and explicit publication, while counting Atlas contribution", () => {
    const begun = startOffer(createInitialState(6), "commission-verify", [
      "weather-glass",
      "sounding-line",
    ]);
    expect(begun.ok).toBe(true);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.locationId = "shoal";
    begun.state.expedition.travelCount = 1;
    const observed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "verify-observe",
      kind: "observe",
      subjectId: "r-sn",
      category: "hazard",
    });
    expect(observed.ok && observed.state.expedition?.commissionProgress.status).toBe(
      "objective-met",
    );
    if (!observed.ok || !observed.state.expedition) return;
    observed.state.expedition.locationId = "harbor";
    observed.state.expedition.travelCount = 2;
    const returned = applyCommand(observed.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "verify-return",
      kind: "resolve-return",
    });
    expect(returned.ok && returned.state.bankedFindings).toBe(0);
    if (!returned.ok) return;
    const empty = applyCommand(structuredClone(returned.state), {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "verify-empty",
      kind: "publish-reports",
      observationIds: [],
    });
    expect(empty.ok && empty.state.bankedFindings).toBe(0);
    const published = applyCommand(returned.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "verify-publish",
      kind: "publish-reports",
      observationIds: [observed.state.expedition.observations[0]!.id],
    });
    expect(published.ok && published.state.bankedFindings).toBe(3);
    expect(published.ok && published.state.atlasContribution).toBe(1);
    expect(published.ok && published.state.latestExpeditionSummary).toMatchObject({
      commissionResult: "success",
      requiredPublicationOccurred: true,
    });
  });

  it("marks failure without granting a reward", () => {
    const begun = startOffer(createInitialState(7), "commission-salvage", [
      "field-lens",
      "sounding-line",
    ]);
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.provisions = 0;
    const failed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "commission-fail",
      kind: "resolve-failure",
      reason: "stranded",
    });
    expect(failed.ok && failed.state.latestExpeditionSummary).toMatchObject({
      commissionResult: "failure",
      commissionFindingsGranted: 0,
    });
    expect(failed.ok && failed.state.bankedFindings).toBe(0);
  });
});

describe("protocol 4 route evidence and Expedition outcomes", () => {
  it("projects only legal known travel options with explicit historical evidence and consequences", () => {
    const begun = applyCommand(createInitialState(81), start("route-evidence-start"));
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const projection = createPlayerProjection(begun.state);
    expect(projection.actions.travelOptions.map((option) => option.routeId)).toEqual([
      "r-hg",
      "r-hs",
    ]);
    expect(serializeCanonical(projection.actions.travelOptions)).not.toContain("r-ol");
    const shoal = projection.actions.travelOptions.find((option) => option.routeId === "r-hs")!;
    expect(shoal).toMatchObject({
      destinationNodeId: "shoal",
      provisionCost: 1,
      destinationVisited: false,
      projectedProvisions: 7,
      projectedReturnReserve: 1,
      projectedProvisionMargin: 6,
      projectedReturnReserveWarning: "comfortable",
    });
    expect(shoal.evidence.route.state).toBe("single-value");
    expect(shoal.evidence.hazard).toEqual({ state: "unknown", claims: [] });
    expect(shoal.evidence.condition).toEqual({ state: "unknown", claims: [] });
    expect(serializeCanonical(shoal)).not.toContain('"hazard":0');
    expect(serializeCanonical(shoal)).not.toContain('"condition":1');
  });

  it("preserves conflicts, corroboration, and deterministic evidence ordering", () => {
    const state = createInitialState(82);
    state.logicalTime = 20;
    state.reports.push(
      report("hazard-old", "hazard-old-expedition", {
        subjectId: "r-hs",
        category: "hazard",
        value: 1,
        method: "weather-glass",
        quality: "low",
        observedAt: 2,
        observedRevision: 0,
      }),
      report("hazard-fresh", "hazard-fresh-expedition", {
        subjectId: "r-hs",
        category: "hazard",
        value: 2,
        method: "weather-glass",
        quality: "high",
        observedAt: 19,
        observedRevision: 1,
      }),
      report("hazard-corroborating", "hazard-corroborating-expedition", {
        subjectId: "r-hs",
        category: "hazard",
        value: 2,
        method: "weather-glass",
        quality: "medium",
        observedAt: 18,
        observedRevision: 1,
      }),
    );
    const begun = applyCommand(state, start("conflict-start"));
    if (!begun.ok) return;
    const hazard = createPlayerProjection(begun.state).actions.travelOptions.find(
      (option) => option.routeId === "r-hs",
    )!.evidence.hazard;
    expect(hazard.state).toBe("conflicting-values");
    expect(hazard.claims.map((claim) => claim.reportId)).toEqual([
      "hazard-fresh",
      "hazard-corroborating",
      "hazard-old",
    ]);
    expect(hazard.claims[0]!.independentCorroboration).toBe(1);
    expect(hazard.claims[1]!.independentCorroboration).toBe(1);
  });

  it("journals ordered legs, accumulated damage, and actual salvage effects", () => {
    const state = createInitialState(83);
    state.world.routes.find((route) => route.id === "r-hs")!.hazard = 6;
    const begun = applyCommand(state, start("journal-start"));
    if (!begun.ok) return;
    const traveled = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "journal-travel",
      kind: "travel",
      routeId: "r-hs",
    });
    expect(traveled.ok).toBe(true);
    if (!traveled.ok) return;
    expect(traveled.state.expedition).toMatchObject({
      totalDamageSustained: 1,
      routeLegs: [
        {
          routeId: "r-hs",
          originNodeId: "harbor",
          destinationNodeId: "shoal",
          damageSustained: true,
        },
      ],
    });
    const salvaged = applyCommand(traveled.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "journal-salvage",
      kind: "salvage",
      opportunityId: "shoal",
    });
    expect(salvaged.ok && salvaged.state.expedition?.salvageOutcomes[0]).toMatchObject({
      family: "provision-cache",
      provisionCost: 1,
      nominalValue: 2,
      appliedValue: 2,
      netProvisionChange: 1,
    });
  });

  it("exposes pending return facts then finalizes exact publication without rewriting later", () => {
    const begun = applyCommand(createInitialState(84), start("summary-start"));
    if (!begun.ok) return;
    const outward = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "summary-out",
      kind: "travel",
      routeId: "r-hs",
    });
    if (!outward.ok) return;
    const observed = applyCommand(outward.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "summary-observe",
      kind: "observe",
      subjectId: "r-hs",
      category: "route",
    });
    if (!observed.ok) return;
    const home = applyCommand(observed.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "summary-home",
      kind: "travel",
      routeId: "r-hs",
    });
    if (!home.ok) return;
    const returned = applyCommand(home.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "summary-return",
      kind: "resolve-return",
    });
    expect(returned.ok).toBe(true);
    if (!returned.ok) return;
    expect(createPlayerProjection(returned.state).currentExpeditionSummary).toMatchObject({
      outcome: "returned",
      publicationStatus: "pending",
      observationIds: ["observation-expedition-1-1"],
      retainedObservationIds: ["observation-expedition-1-1"],
      lostObservationIds: [],
    });
    const published = applyCommand(returned.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "summary-publish",
      kind: "publish-reports",
      observationIds: ["observation-expedition-1-1"],
    });
    expect(published.ok).toBe(true);
    if (!published.ok) return;
    expect(createPlayerProjection(published.state).previousExpeditionSummary).toMatchObject({
      publicationStatus: "completed",
      publishedReportIds: ["report-observation-expedition-1-1"],
      atlasContributionAdded: 1,
    });
    const serialized = serializeCanonical(published.state.latestExpeditionSummary);
    const next = applyCommand(published.state, start("later-summary-start"));
    expect(next.ok && serializeCanonical(next.state.latestExpeditionSummary)).toBe(serialized);
    expect(
      replayEvents(createInitialState(84), [
        ...begun.events,
        ...outward.events,
        ...observed.events,
        ...home.events,
        ...returned.events,
        ...published.events,
      ]),
    ).toEqual(published.state);
  });

  it("finalizes failure with lost findings, observations, and safe Trace information", () => {
    const begun = applyCommand(createInitialState(85), start("failure-summary-start"));
    if (!begun.ok || !begun.state.expedition) return;
    begun.state.expedition.locationId = "shoal";
    begun.state.expedition.travelCount = 1;
    begun.state.expedition.provisions = 0;
    begun.state.expedition.unbankedFindings = 4;
    begun.state.expedition.findingsRecoveredFromSalvage = 4;
    begun.state.expedition.observations.push(observation("failed-observation"));
    const failed = applyCommand(begun.state, {
      protocolVersion: PROTOCOL_VERSION,
      commandId: "failure-summary-resolve",
      kind: "resolve-failure",
      reason: "stranded",
    });
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(createPlayerProjection(failed.state).currentExpeditionSummary).toMatchObject({
      outcome: "failed",
      failureReason: "stranded",
      commissionResult: "failure",
      commissionFindingsGranted: 0,
      findingsLostOnFailure: 4,
      retainedObservationIds: [],
      lostObservationIds: ["failed-observation"],
      traceId: "trace-expedition-1",
      publicationStatus: "not-applicable",
    });
  });
});
