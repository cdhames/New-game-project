import { z } from "zod";

export const PROTOCOL_VERSION = 2 as const;
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
    reason: z.enum(["stranded", "vessel-integrity"]),
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
  "drift-required",
  "invalid-loadout",
  "route-unavailable",
  "insufficient-provisions",
  "instrument-required",
  "instrument-depleted",
  "subject-not-local",
  "invalid-observation-subject",
  "opportunity-unavailable",
  "not-at-waystation",
  "expedition-not-underway",
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
}
export interface TraceRecord {
  id: StableId;
  expeditionId: StableId;
  associationId: StableId;
  recoverableFindings: number;
  observationIds: StableId[];
}
export interface AtlasClaim extends ReportRecord {
  age: number;
  potentiallyStale: boolean;
  independentCorroboration: number;
}
export const SafeRouteDescriptorSchema = z.object({ id: stableId, a: stableId, b: stableId });
export type SafeRouteDescriptor = z.infer<typeof SafeRouteDescriptorSchema>;
export const ObservationAffordanceSchema = z.object({
  subjectId: stableId,
  category: ObservationCategorySchema,
});
export type ObservationAffordance = z.infer<typeof ObservationAffordanceSchema>;
export const ActionAvailabilityReasonSchema = z.enum([
  "available",
  "expedition-not-underway",
  "no-known-route",
  "insufficient-provisions",
  "no-applicable-observation",
  "instrument-not-selected",
  "instrument-depleted",
  "no-salvage-opportunity",
  "not-at-waystation",
  "return-not-earned",
  "safe-return-available",
]);
export type ActionAvailabilityReason = z.infer<typeof ActionAvailabilityReasonSchema>;
export const SalvageFamilySchema = z.enum(["findings-cache", "provision-cache", "repair-material"]);
export type SalvageFamily = z.infer<typeof SalvageFamilySchema>;
export const SafeSalvageDescriptorSchema = z.object({
  opportunityId: stableId,
  locationId: stableId,
  family: SalvageFamilySchema,
});
export type SafeSalvageDescriptor = z.infer<typeof SafeSalvageDescriptorSchema>;
export const ActionAffordancesSchema = z.object({
  traversableRouteIds: z.array(stableId),
  observations: z.array(ObservationAffordanceSchema),
  salvageableOpportunities: z.array(SafeSalvageDescriptorSchema),
  canResolveReturn: z.boolean(),
  failureReason: z.enum(["stranded", "vessel-integrity"]).nullable(),
  publicationEligibleObservationIds: z.array(stableId),
  publicationRequired: z.boolean(),
  canAdvanceDrift: z.boolean(),
  canStartExpedition: z.boolean(),
  availability: z.object({
    travel: ActionAvailabilityReasonSchema,
    observe: ActionAvailabilityReasonSchema,
    salvage: ActionAvailabilityReasonSchema,
    return: ActionAvailabilityReasonSchema,
    failure: ActionAvailabilityReasonSchema,
  }),
});
export type ActionAffordances = z.infer<typeof ActionAffordancesSchema>;
export interface InstrumentChargeState {
  instrument: Instrument;
  remaining: number;
  maximum: number;
}
export type ReturnReserveWarning =
  "at-waystation" | "comfortable" | "caution" | "at-reserve" | "below-reserve" | "route-unknown";
export interface ActiveExpeditionResources {
  provisions: number;
  maximumProvisions: number;
  vesselIntegrity: number;
  maximumVesselIntegrity: number;
  instrumentCharges: InstrumentChargeState[];
  returnReserve: number | null;
  provisionMargin: number | null;
  returnReserveWarning: ReturnReserveWarning;
  unbankedFindings: number;
}
export interface WaystationBaseline {
  baseProvisions: number;
  baseVesselIntegrity: number;
  baseChargesPerSelectedInstrument: number;
  bankedFindings: number;
}
export interface PlayerSafeProjection {
  protocolVersion: typeof PROTOCOL_VERSION;
  scenarioVersion: ScenarioVersion;
  revision: WorldRevision;
  logicalTime: LogicalTime;
  driftDue: boolean;
  phase: "idle" | "expedition" | "returned" | "failed";
  locationId: StableId;
  waystation: WaystationBaseline;
  expeditionResources: ActiveExpeditionResources | null;
  selectedInstruments: Instrument[];
  knownRoutes: SafeRouteDescriptor[];
  knownNodeIds: StableId[];
  visitedNodeIds: StableId[];
  previousLocationId: StableId | null;
  actions: ActionAffordances;
  observations: ObservationRecord[];
  atlas: AtlasClaim[];
  traces: TraceRecord[];
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
