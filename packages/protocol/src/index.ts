import { z } from "zod";

export const PROTOCOL_VERSION = 1 as const;
const stableId = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
export const StableIdSchema = stableId;
export type StableId = z.infer<typeof StableIdSchema>;
export const ScenarioVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
export type ScenarioVersion = z.infer<typeof ScenarioVersionSchema>;
export const LogicalTimeSchema = z.number().int().nonnegative();
export type LogicalTime = z.infer<typeof LogicalTimeSchema>;
export const WorldRevisionSchema = z.number().int().nonnegative();
export type WorldRevision = z.infer<typeof WorldRevisionSchema>;

export const InstrumentSchema = z.enum(["sounding-line", "weather-glass", "field-lens"]);
export type Instrument = z.infer<typeof InstrumentSchema>;
export const ObservationCategorySchema = z.enum(["route", "hazard", "condition", "opportunity"]);
export type ObservationCategory = z.infer<typeof ObservationCategorySchema>;
export const EvidenceQualitySchema = z.enum(["low", "medium", "high"]);
export type EvidenceQuality = z.infer<typeof EvidenceQualitySchema>;
export const SourceClassSchema = z.enum(["player", "baseline", "synthetic"]);
export type SourceClass = z.infer<typeof SourceClassSchema>;

const commandBase = z.object({ protocolVersion: z.literal(PROTOCOL_VERSION), commandId: stableId });
export const PlayerCommandSchema = z.discriminatedUnion("kind", [
  commandBase.extend({
    kind: z.literal("start-expedition"),
    instruments: z.array(InstrumentSchema).length(2),
  }),
  commandBase.extend({ kind: z.literal("travel"), routeId: stableId }),
  commandBase.extend({
    kind: z.literal("observe"),
    subjectId: stableId,
    category: ObservationCategorySchema,
  }),
  commandBase.extend({ kind: z.literal("salvage"), opportunityId: stableId }),
  commandBase.extend({ kind: z.literal("resolve-return") }),
  commandBase.extend({
    kind: z.literal("resolve-failure"),
    reason: z.enum(["stranded", "integrity"]),
  }),
  commandBase.extend({
    kind: z.literal("publish-reports"),
    observationIds: z.array(stableId).max(3),
  }),
  commandBase.extend({ kind: z.literal("advance-drift") }),
]);
export type PlayerCommand = z.infer<typeof PlayerCommandSchema>;

export const RejectionReasonSchema = z.enum([
  "wrong-phase",
  "invalid-loadout",
  "route-not-connected",
  "insufficient-supply",
  "instrument-required",
  "subject-not-local",
  "opportunity-unavailable",
  "not-at-waystation",
  "observation-ineligible",
  "publication-limit",
  "duplicate-command",
  "drift-not-due",
  "failure-not-eligible",
]);
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;

export interface ObservationRecord {
  id: StableId;
  subjectId: StableId;
  category: ObservationCategory;
  value: string | number;
  observedRevision: WorldRevision;
  observedAt: LogicalTime;
  expeditionId: StableId;
  method: Instrument;
  quality: EvidenceQuality;
}
export interface ReportRecord extends ObservationRecord {
  reportId: StableId;
  sourceClass: SourceClass;
  publishedAt: LogicalTime;
  corroboratingExpeditionIds: StableId[];
}
export interface TraceRecord {
  id: StableId;
  expeditionId: StableId;
  associationId: StableId;
  recoverableReward: number;
  observationIds: StableId[];
}
export interface AtlasClaim extends ReportRecord {
  age: number;
  potentiallyStale: boolean;
  independentCorroboration: number;
}
export interface PlayerSafeProjection {
  protocolVersion: typeof PROTOCOL_VERSION;
  scenarioVersion: ScenarioVersion;
  revision: WorldRevision;
  logicalTime: LogicalTime;
  phase: "idle" | "expedition" | "returned" | "failed";
  locationId: StableId;
  supply: number;
  integrity: number;
  selectedInstruments: Instrument[];
  visibleRouteIds: StableId[];
  observations: ObservationRecord[];
  atlas: AtlasClaim[];
  traces: TraceRecord[];
  bankedReward: number;
  unbankedReward: number;
}

export interface DomainEvent {
  protocolVersion: typeof PROTOCOL_VERSION;
  kind: string;
  logicalTime: LogicalTime;
  payload: Record<string, unknown>;
}
export const DomainEventSchema = z.object({
  protocolVersion: z.literal(PROTOCOL_VERSION),
  kind: z.string().min(1),
  logicalTime: LogicalTimeSchema,
  payload: z.record(z.string(), z.unknown()),
});
export interface ReplayRecord {
  protocolVersion: typeof PROTOCOL_VERSION;
  scenarioVersion: ScenarioVersion;
  seed: number;
  initialRngState: number;
  commands: PlayerCommand[];
  events: DomainEvent[];
  terminalChecksum: string;
}
