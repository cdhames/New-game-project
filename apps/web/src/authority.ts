import {
  applyCommand,
  createInitialState,
  createPlayerProjection,
  DEVELOPMENT_SCENARIO,
  type CanonicalState,
} from "@long-map/game-core";
import {
  PlayerCommandSchema,
  PROTOCOL_VERSION,
  type DomainEvent,
  type Instrument,
  type ObservationCategory,
  type PlayerCommand,
  type PlayerSafeProjection,
  type StableId,
} from "@long-map/protocol";
import { displayName } from "./presentation";

export const LEGACY_LOCAL_RECORD_KEY = "the-long-map.local-prototype.v1";
export const LOCAL_RECORD_KEY = "the-long-map.local-prototype.v2";
export const LOCAL_RECORD_VERSION = 2 as const;
export const DEFAULT_DEVELOPMENT_SEED = 20_260_804;

export interface LocalRecord {
  version: typeof LOCAL_RECORD_VERSION;
  protocolVersion: typeof PROTOCOL_VERSION;
  scenarioVersion: typeof DEVELOPMENT_SCENARIO.version;
  seed: number;
  commands: PlayerCommand[];
}

export interface SafeEventSummary {
  id: string;
  logicalTime: number;
  kind: string;
  message: string;
  tone: "neutral" | "positive" | "warning";
}

export interface AuthorityView {
  projection: PlayerSafeProjection;
  activity: SafeEventSummary[];
  acceptedCommandCount: number;
  statusMessage: string;
}

export type CommandIntent =
  | { kind: "start-expedition"; instruments: Instrument[] }
  | { kind: "travel"; routeId: StableId }
  | { kind: "observe"; subjectId: StableId; category: ObservationCategory }
  | { kind: "salvage"; opportunityId: StableId }
  | { kind: "resolve-return" }
  | { kind: "resolve-failure"; reason: "stranded" | "vessel-integrity" }
  | { kind: "publish-reports"; observationIds: StableId[] }
  | { kind: "advance-drift" };

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadFailure {
  ok: false;
  message: string;
}

export interface LoadSuccess {
  ok: true;
  authority: LocalAuthority;
}

export type AuthorityLoadResult = LoadFailure | LoadSuccess;

const isRecordShape = (
  value: unknown,
): value is {
  version: unknown;
  protocolVersion: unknown;
  scenarioVersion: unknown;
  seed: unknown;
  commands: unknown;
} =>
  typeof value === "object" &&
  value !== null &&
  "version" in value &&
  "protocolVersion" in value &&
  "scenarioVersion" in value &&
  "seed" in value &&
  "commands" in value;

const validateRecord = (raw: string): LocalRecord => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("The saved local expedition record is not valid JSON.");
  }
  if (!isRecordShape(parsed) || parsed.version !== LOCAL_RECORD_VERSION)
    throw new Error("The saved local expedition record uses an incompatible version.");
  if (
    parsed.protocolVersion !== PROTOCOL_VERSION ||
    parsed.scenarioVersion !== DEVELOPMENT_SCENARIO.version
  )
    throw new Error("The saved local expedition record uses incompatible deterministic rules.");
  if (!Number.isInteger(parsed.seed) || typeof parsed.seed !== "number" || parsed.seed < 0)
    throw new Error("The saved local expedition record has an invalid deterministic seed.");
  if (!Array.isArray(parsed.commands))
    throw new Error("The saved local expedition record does not contain a command history.");
  const commands = parsed.commands.map((command, index) => {
    const result = PlayerCommandSchema.safeParse(command);
    if (!result.success)
      throw new Error(`Saved command ${index + 1} is invalid for this prototype version.`);
    return result.data;
  });
  return {
    version: LOCAL_RECORD_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    scenarioVersion: DEVELOPMENT_SCENARIO.version,
    seed: parsed.seed,
    commands,
  };
};

const safeSummary = (domainEvent: DomainEvent, sequence: number): SafeEventSummary => {
  const id = `activity-${sequence}`;
  const base = { id, logicalTime: domainEvent.logicalTime, kind: domainEvent.kind };
  if (domainEvent.kind === "expedition-started")
    return { ...base, message: "Expedition started from Lantern Harbor.", tone: "neutral" };
  if (domainEvent.kind === "route-traversed") {
    const target = domainEvent.payload["target"];
    const damaged = domainEvent.payload["damaged"] === true;
    return {
      ...base,
      message: `${damaged ? "Damage sustained while reaching" : "Route traversed to"} ${
        typeof target === "string" ? displayName(target) : "the next known location"
      }.`,
      tone: damaged ? "warning" : "neutral",
    };
  }
  if (domainEvent.kind === "observation-made")
    return { ...base, message: "A new Observation was recorded in the Logbook.", tone: "positive" };
  if (domainEvent.kind === "opportunity-salvaged") {
    const family = domainEvent.payload["family"];
    const value = domainEvent.payload["value"];
    const result =
      family === "provision-cache"
        ? `${value} Provisions restored`
        : family === "repair-material"
          ? `${value} Vessel Integrity restored`
          : family === "findings-cache"
            ? `${value} unbanked Findings recovered`
            : "salvage recovered";
    return {
      ...base,
      message: `${result}.`,
      tone: "positive",
    };
  }
  if (domainEvent.kind === "expedition-returned")
    return {
      ...base,
      message: "The Expedition returned safely. Publication is ready.",
      tone: "positive",
    };
  if (domainEvent.kind === "expedition-failed")
    return {
      ...base,
      message: "The Expedition failed. A later journey may find its Trace.",
      tone: "warning",
    };
  if (domainEvent.kind === "reports-published")
    return {
      ...base,
      message: "Publication completed and the Atlas was updated.",
      tone: "positive",
    };
  if (domainEvent.kind === "drift-applied")
    return {
      ...base,
      message: "Drift moved through the region; historical Reports were preserved.",
      tone: "warning",
    };
  return { ...base, message: "The Expedition record advanced.", tone: "neutral" };
};

const commandOutcome = (event: DomainEvent): string => safeSummary(event, 0).message;

const LOCAL_COMMAND_ID_PATTERN = /^local-command-([1-9]\d*)$/;

const deriveCommandSequence = (commands: PlayerCommand[]): number => {
  let maximum = 0;
  for (const [index, command] of commands.entries()) {
    const match = LOCAL_COMMAND_ID_PATTERN.exec(command.commandId);
    const sequence = match ? Number(match[1]) : Number.NaN;
    if (!Number.isSafeInteger(sequence) || sequence <= 0)
      throw new Error(
        `Saved command ${index + 1} does not use a compatible browser-local command ID.`,
      );
    maximum = Math.max(maximum, sequence);
  }
  return maximum;
};

export class LocalAuthority {
  readonly seed: number;
  private state: CanonicalState;
  private readonly commands: PlayerCommand[];
  private readonly activity: SafeEventSummary[];
  private commandSequence: number;
  private statusMessage: string;

  private constructor(
    private readonly storage: StoragePort,
    record: LocalRecord,
    state: CanonicalState,
    activity: SafeEventSummary[],
    commandSequence: number,
  ) {
    this.seed = record.seed;
    this.commands = [...record.commands];
    this.state = state;
    this.activity = activity;
    this.commandSequence = commandSequence;
    this.statusMessage = record.commands.length
      ? "Saved local expedition history restored."
      : "A fresh local Atlas is ready.";
  }

  static load(storage: StoragePort): AuthorityLoadResult {
    const raw = storage.getItem(LOCAL_RECORD_KEY);
    if (!raw && storage.getItem(LEGACY_LOCAL_RECORD_KEY) !== null)
      return {
        ok: false,
        message:
          "The deterministic resource rules changed in Revision 0.2. Your version-1 history cannot be replayed safely by this prototype and remains untouched until you confirm reset.",
      };
    const record = raw
      ? (() => {
          try {
            return validateRecord(raw);
          } catch (error) {
            return error instanceof Error ? error : new Error("The saved local record is invalid.");
          }
        })()
      : ({
          version: LOCAL_RECORD_VERSION,
          protocolVersion: PROTOCOL_VERSION,
          scenarioVersion: DEVELOPMENT_SCENARIO.version,
          seed: DEFAULT_DEVELOPMENT_SEED,
          commands: [],
        } satisfies LocalRecord);
    if (record instanceof Error) return { ok: false, message: record.message };

    let commandSequence: number;
    try {
      commandSequence = deriveCommandSequence(record.commands);
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "The saved local command IDs are incompatible with this prototype version.",
      };
    }

    let state = createInitialState(record.seed);
    const activity: SafeEventSummary[] = [];
    for (const [index, command] of record.commands.entries()) {
      const result = applyCommand(state, command);
      if (!result.ok)
        return {
          ok: false,
          message: `Saved command ${index + 1} cannot be replayed by the current deterministic core.`,
        };
      state = result.state;
      for (const domainEvent of result.events)
        activity.push(safeSummary(domainEvent, activity.length + 1));
    }
    return {
      ok: true,
      authority: new LocalAuthority(storage, record, state, activity, commandSequence),
    };
  }

  view(): AuthorityView {
    return {
      projection: createPlayerProjection(this.state),
      activity: this.activity.slice(-12).reverse(),
      acceptedCommandCount: this.commands.length,
      statusMessage: this.statusMessage,
    };
  }

  dispatch(intent: CommandIntent): AuthorityView {
    const candidateSequence = this.commandSequence + 1;
    const candidate: unknown = {
      protocolVersion: PROTOCOL_VERSION,
      commandId: `local-command-${candidateSequence}`,
      ...intent,
    };
    const parsed = PlayerCommandSchema.safeParse(candidate);
    if (!parsed.success) {
      this.statusMessage =
        "That action could not be formed safely. Your saved history is unchanged.";
      return this.view();
    }
    const result = applyCommand(this.state, parsed.data);
    if (!result.ok) {
      this.statusMessage =
        "An advertised action was rejected by the deterministic core. Your saved history is unchanged.";
      return this.view();
    }
    const nextCommands = [...this.commands, parsed.data];
    const nextRecord: LocalRecord = {
      version: LOCAL_RECORD_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      scenarioVersion: DEVELOPMENT_SCENARIO.version,
      seed: this.seed,
      commands: nextCommands,
    };
    try {
      this.storage.setItem(LOCAL_RECORD_KEY, JSON.stringify(nextRecord));
    } catch {
      this.statusMessage =
        "The action was not saved or applied because local storage is unavailable. You can safely retry.";
      return this.view();
    }
    this.commandSequence = candidateSequence;
    this.commands.push(parsed.data);
    this.state = result.state;
    for (const domainEvent of result.events)
      this.activity.push(safeSummary(domainEvent, this.activity.length + 1));
    this.statusMessage = result.events.at(-1)
      ? commandOutcome(result.events.at(-1)!)
      : "The action was accepted.";
    return this.view();
  }

  reset(): void {
    this.storage.removeItem(LOCAL_RECORD_KEY);
    this.storage.removeItem(LEGACY_LOCAL_RECORD_KEY);
  }
}

export const createLocalAuthority = (
  storage: StoragePort = window.localStorage,
): AuthorityLoadResult => LocalAuthority.load(storage);
