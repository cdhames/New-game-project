import { describe, expect, it } from "vitest";
import { PROTOCOL_VERSION } from "@long-map/protocol";
import {
  createLocalAuthority,
  DEFAULT_DEVELOPMENT_SEED,
  LOCAL_RECORD_KEY,
  LOCAL_RECORD_VERSION,
  type StoragePort,
} from "./authority";

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  failNextWrite = false;
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error("simulated storage failure");
    }
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const commandIds = (storage: MemoryStorage): string[] => {
  const record = JSON.parse(storage.getItem(LOCAL_RECORD_KEY)!) as {
    commands: Array<{ commandId: string }>;
  };
  return record.commands.map((command) => command.commandId);
};

const load = (storage: MemoryStorage) => {
  const result = createLocalAuthority(storage);
  if (!result.ok) throw new Error(result.message);
  return result.authority;
};

const roundTrip = (storage: MemoryStorage, publish: boolean): void => {
  const authority = load(storage);
  authority.dispatch({
    kind: "start-expedition",
    instruments: ["sounding-line", "weather-glass"],
    commissionId: "commission-salvage",
    preparation: {
      extraProvisions: 0,
      reinforcedVesselIntegrity: false,
      extraChargeInstruments: [],
    },
  });
  authority.dispatch({ kind: "travel", routeId: "r-hs" });
  authority.dispatch({ kind: "observe", subjectId: "r-hs", category: "route" });
  authority.dispatch({ kind: "travel", routeId: "r-hs" });
  authority.dispatch({ kind: "resolve-return" });
  const eligible = authority.view().projection.actions.publicationEligibleObservationIds;
  authority.dispatch({ kind: "publish-reports", observationIds: publish ? eligible : [] });
};

describe("local browser authority", () => {
  it("loads the fixed fresh world with six baseline Reports and only safe topology", () => {
    const storage = new MemoryStorage();
    const authority = load(storage);
    const view = authority.view();
    expect(authority.seed).toBe(DEFAULT_DEVELOPMENT_SEED);
    expect(view.projection.atlas).toHaveLength(6);
    expect(view.projection.knownNodeIds).toContain("far-sound");
    expect(view.projection.knownRoutes.map((route) => route.id)).toContain("r-pf");
    expect(view.projection.knownNodeIds).not.toContain("last-cairn");
    expect(view.projection.knownRoutes.map((route) => route.id)).not.toContain("r-ol");
  });

  it("completes a deterministic round trip and publishes through advertised actions", () => {
    const storage = new MemoryStorage();
    roundTrip(storage, true);
    const authority = load(storage);
    const view = authority.view();
    expect(view.projection.phase).toBe("idle");
    expect(view.projection.atlas).toHaveLength(7);
    expect(view.projection.observations).toHaveLength(1);
    expect(view.activity.some((item) => item.kind === "reports-published")).toBe(true);
  });

  it("keeps publishing nothing legal", () => {
    const storage = new MemoryStorage();
    roundTrip(storage, false);
    const view = load(storage).view();
    expect(view.projection.phase).toBe("idle");
    expect(view.projection.atlas).toHaveLength(6);
  });

  it("persists accepted command history and reconstructs the same projection", () => {
    const storage = new MemoryStorage();
    const authority = load(storage);
    authority.dispatch({
      kind: "start-expedition",
      instruments: ["sounding-line", "field-lens"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    const before = authority.view().projection;
    const after = load(storage).view().projection;
    expect(after).toEqual(before);
    const record = JSON.parse(storage.getItem(LOCAL_RECORD_KEY)!) as Record<string, unknown>;
    expect(record).toMatchObject({ version: LOCAL_RECORD_VERSION, seed: DEFAULT_DEVELOPMENT_SEED });
    expect(record).not.toHaveProperty("events");
    expect(record).not.toHaveProperty("canonicalState");
  });

  it("rejects corrupt or incompatible local records without discarding them", () => {
    const storage = new MemoryStorage();
    storage.setItem(LOCAL_RECORD_KEY, "{not-json");
    const first = createLocalAuthority(storage);
    expect(first.ok).toBe(false);
    expect(storage.getItem(LOCAL_RECORD_KEY)).toBe("{not-json");
    storage.setItem(LOCAL_RECORD_KEY, JSON.stringify({ version: 99, seed: 1, commands: [] }));
    expect(createLocalAuthority(storage).ok).toBe(false);
  });

  it("makes Drift sticky after three resolved loops and exposes only the legal advance action", () => {
    const storage = new MemoryStorage();
    roundTrip(storage, false);
    roundTrip(storage, false);
    roundTrip(storage, false);
    const authority = load(storage);
    const before = authority.view().projection;
    expect(before.driftDue).toBe(true);
    expect(before.actions.canStartExpedition).toBe(false);
    expect(before.actions.canAdvanceDrift).toBe(true);
    authority.dispatch({ kind: "advance-drift" });
    const after = authority.view().projection;
    expect(after.driftDue).toBe(false);
    expect(after.actions.canStartExpedition).toBe(true);
    expect(after.atlas.some((claim) => claim.potentiallyStale)).toBe(true);
  });

  it("does not consume an accepted sequence number when the core rejects a command", () => {
    const storage = new MemoryStorage();
    const authority = load(storage);
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    expect(authority.view().acceptedCommandCount).toBe(0);
    authority.dispatch({
      kind: "start-expedition",
      instruments: ["sounding-line", "weather-glass"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    expect(commandIds(storage)).toEqual(["local-command-1"]);
  });

  it("does not consume an accepted sequence number when command schema validation fails", () => {
    const storage = new MemoryStorage();
    const authority = load(storage);
    authority.dispatch({
      kind: "start-expedition",
      instruments: ["sounding-line"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    expect(authority.view().acceptedCommandCount).toBe(0);
    authority.dispatch({
      kind: "start-expedition",
      instruments: ["sounding-line", "weather-glass"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    expect(commandIds(storage)).toEqual(["local-command-1"]);
  });

  it("keeps IDs unique and increasing after rejection, reload, and acceptance", () => {
    const storage = new MemoryStorage();
    const authority = load(storage);
    authority.dispatch({
      kind: "start-expedition",
      instruments: ["sounding-line", "weather-glass"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    authority.dispatch({ kind: "observe", subjectId: "r-hs", category: "route" });

    const reloaded = load(storage);
    reloaded.dispatch({ kind: "travel", routeId: "r-hs" });
    const ids = commandIds(storage);
    const sequences = ids.map((id) => Number(id.replace("local-command-", "")));
    expect(new Set(ids).size).toBe(ids.length);
    expect(sequences.at(-1)).toBeGreaterThan(Math.max(...sequences.slice(0, -1)));
    expect(load(storage).view().projection.locationId).toBe("shoal");
  });

  it("derives the next sequence from the maximum valid non-contiguous ID", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_RECORD_KEY,
      JSON.stringify({
        version: LOCAL_RECORD_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        scenarioVersion: "1.4.0",
        seed: DEFAULT_DEVELOPMENT_SEED,
        commands: [
          {
            protocolVersion: PROTOCOL_VERSION,
            commandId: "local-command-1",
            kind: "start-expedition",
            instruments: ["sounding-line", "weather-glass"],
            commissionId: "commission-salvage",
            preparation: {
              extraProvisions: 0,
              reinforcedVesselIntegrity: false,
              extraChargeInstruments: [],
            },
          },
          {
            protocolVersion: PROTOCOL_VERSION,
            commandId: "local-command-4",
            kind: "travel",
            routeId: "r-hs",
          },
        ],
      }),
    );
    const authority = load(storage);
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    expect(commandIds(storage)).toEqual(["local-command-1", "local-command-4", "local-command-5"]);
  });

  it("rejects otherwise valid histories with incompatible browser-local IDs", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_RECORD_KEY,
      JSON.stringify({
        version: LOCAL_RECORD_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        scenarioVersion: "1.4.0",
        seed: DEFAULT_DEVELOPMENT_SEED,
        commands: [
          {
            protocolVersion: PROTOCOL_VERSION,
            commandId: "imported-command",
            kind: "start-expedition",
            instruments: ["sounding-line", "weather-glass"],
            commissionId: "commission-salvage",
            preparation: {
              extraProvisions: 0,
              reinforcedVesselIntegrity: false,
              extraChargeInstruments: [],
            },
          },
        ],
      }),
    );
    const result = createLocalAuthority(storage);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("compatible browser-local command ID");
  });

  it("keeps authority state transactional when storage persistence fails", () => {
    const storage = new MemoryStorage();
    const authority = load(storage);
    const before = authority.view();
    storage.failNextWrite = true;
    const failed = authority.dispatch({
      kind: "start-expedition",
      instruments: ["sounding-line", "weather-glass"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });

    expect(JSON.stringify(failed.projection)).toBe(JSON.stringify(before.projection));
    expect(failed.acceptedCommandCount).toBe(before.acceptedCommandCount);
    expect(failed.activity).toEqual(before.activity);
    expect(failed.statusMessage).toContain("not saved or applied");
    expect(storage.getItem(LOCAL_RECORD_KEY)).toBeNull();

    const retried = authority.dispatch({
      kind: "start-expedition",
      instruments: ["sounding-line", "weather-glass"],
      commissionId: "commission-salvage",
      preparation: {
        extraProvisions: 0,
        reinforcedVesselIntegrity: false,
        extraChargeInstruments: [],
      },
    });
    expect(retried.projection.phase).toBe("expedition");
    expect(commandIds(storage)).toEqual(["local-command-1"]);
  });
});
