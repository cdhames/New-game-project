import { z } from "zod";

export const PROTOCOL_VERSION = 5 as const;
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

export const PreparationPlanSchema = z.object({
  extraProvisions: z.number().int().min(0).max(2),
  reinforcedVesselIntegrity: z.boolean(),
  extraChargeInstruments: z.array(InstrumentSchema).max(2),
});
export type PreparationPlan = z.infer<typeof PreparationPlanSchema>;

export const AdventureLeadIdSchema = z.enum([
  "lead-bell-beneath-north-mark",
  "lead-follow-divided-resonance",
  "lead-return-before-rival-charts-bell",
]);
export type AdventureLeadId = z.infer<typeof AdventureLeadIdSchema>;
export const BellEncounterActionIdSchema = z.enum([
  "listen-surface",
  "triangulate-sounding-line",
  "separate-current-weather-glass",
  "inspect-debris-field-lens",
  "descend-into-resonance",
  "withdraw-from-bell",
  "tune-resonance-compass",
]);
export type BellEncounterActionId = z.infer<typeof BellEncounterActionIdSchema>;
export const AdventureClueIdSchema = z.enum([
  "clue-bell-interval",
  "clue-fractured-shelf",
  "clue-current-independent",
  "clue-worked-stone",
  "clue-submerged-waystone",
]);
export type AdventureClueId = z.infer<typeof AdventureClueIdSchema>;
export const AdventureDiscoveryIdSchema = z.literal("discovery-resonant-waystone-fragment");
export type AdventureDiscoveryId = z.infer<typeof AdventureDiscoveryIdSchema>;
export const AdventureCapabilityIdSchema = z.literal("capability-resonance-compass");
export type AdventureCapabilityId = z.infer<typeof AdventureCapabilityIdSchema>;
export const RevealChoiceSchema = z.enum(["share", "withhold"]);
export type RevealChoice = z.infer<typeof RevealChoiceSchema>;
export const EncounterPhaseSchema = z.enum([
  "inactive",
  "active",
  "resolved",
  "withdrawn",
  "failed",
]);
export type EncounterPhase = z.infer<typeof EncounterPhaseSchema>;
export const AdventureLeadSchema = z.object({
  id: AdventureLeadIdSchema,
  title: z.string().min(1),
  targetLocationId: z.literal("north-mark"),
  premise: z.string().min(1),
  stakes: z.string().min(1),
  recommendedInstruments: z.array(InstrumentSchema),
  rewardSummary: z.string().min(1),
});
export type AdventureLead = z.infer<typeof AdventureLeadSchema>;
export const ActiveLeadStateSchema = z.object({
  leadId: AdventureLeadIdSchema,
  status: z.enum([
    "active",
    "encounter",
    "returning",
    "disclosure-pending",
    "completed",
    "incomplete",
    "failed",
  ]),
  targetReached: z.boolean(),
});
export type ActiveLeadState = z.infer<typeof ActiveLeadStateSchema>;
export const AdventureClueSchema = z.object({
  id: AdventureClueIdSchema,
  title: z.string().min(1),
  safeSummary: z.string().min(1),
  private: z.boolean(),
});
export type AdventureClue = z.infer<typeof AdventureClueSchema>;
export const AdventureDiscoverySchema = z.object({
  id: AdventureDiscoveryIdSchema,
  title: z.literal("Resonant Waystone Fragment"),
  interpretation: z.string().min(1),
  public: z.boolean(),
});
export type AdventureDiscovery = z.infer<typeof AdventureDiscoverySchema>;
export const AdventureCapabilitySchema = z.object({
  id: AdventureCapabilityIdSchema,
  title: z.literal("Resonance Compass"),
  safeDescription: z.string().min(1),
});
export type AdventureCapability = z.infer<typeof AdventureCapabilitySchema>;
export const SimulatedOutsideClaimSchema = z.object({
  id: stableId,
  actorId: z.literal("actor-mara-venn-simulated"),
  actorDisplayName: z.literal("Mara Venn — simulated expedition source"),
  sourceType: z.literal("simulated-prototype"),
  subjectId: z.enum(["r-nd", "r-nr"]),
  category: z.literal("resonance-direction"),
  reportedValue: z.enum(["north-mark-deep-spur", "north-mark-reed-bank"]),
  quality: EvidenceQualitySchema,
  observedRevision: WorldRevisionSchema,
  publishedAt: LogicalTimeSchema,
  age: z.number().int().nonnegative(),
  potentiallyStale: z.boolean(),
  relationToPlayerClaim: z.enum(["partial-corroboration", "conflict", "independent"]),
});
export type SimulatedOutsideClaim = z.infer<typeof SimulatedOutsideClaimSchema>;
export const VisibleDriftEventSchema = z.object({
  id: z.literal("drift-event-north-mark-resonance"),
  affectedRegionId: z.literal("north-mark"),
  revision: WorldRevisionSchema,
  summary: z.literal("Currents and the submerged shelf shifted near North Mark."),
  explanation: z.literal("The world changed, so some old knowledge may no longer be reliable."),
  potentiallyStaleClaimIds: z.array(stableId),
  pendingAcknowledgement: z.boolean(),
});
export type VisibleDriftEvent = z.infer<typeof VisibleDriftEventSchema>;
export const AdventureResolutionSchema = z.object({
  leadId: AdventureLeadIdSchema,
  outcome: z.enum(["shared", "withheld", "incomplete", "failed"]),
  clueIds: z.array(AdventureClueIdSchema),
  discoveryRecovered: z.boolean(),
  capabilityUnlocked: z.boolean(),
  disclosureChoice: RevealChoiceSchema.nullable(),
});
export type AdventureResolution = z.infer<typeof AdventureResolutionSchema>;
export const SafeEncounterActionSchema = z.object({
  id: BellEncounterActionIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  available: z.boolean(),
  unavailableReason: z.enum([
    "available",
    "encounter-inactive",
    "already-completed",
    "instrument-not-selected",
    "instrument-depleted",
    "insufficient-provisions",
    "clue-required",
    "capability-required",
  ]),
  provisionCost: z.number().int().nonnegative(),
  instrumentChargeCost: z.number().int().nonnegative(),
  requiredInstrument: InstrumentSchema.nullable(),
  minimumKnownDamage: z.number().int().nonnegative().nullable(),
  alreadyCompleted: z.boolean(),
  possibleOutcome: z.string().min(1),
});
export type SafeEncounterAction = z.infer<typeof SafeEncounterActionSchema>;
export const SafeAdventureProjectionSchema = z.object({
  primaryLead: AdventureLeadSchema,
  availableLead: AdventureLeadSchema.nullable(),
  activeLead: ActiveLeadStateSchema.nullable(),
  aftermathOfRecentDrift: z.boolean(),
  encounter: z
    .object({
      id: z.literal("encounter-bell-north-mark"),
      phase: EncounterPhaseSchema,
      instruction: z.string().min(1),
      actions: z.array(SafeEncounterActionSchema),
    })
    .nullable(),
  clues: z.array(AdventureClueSchema),
  discoveries: z.array(AdventureDiscoverySchema),
  capabilities: z.array(AdventureCapabilitySchema),
  disclosurePending: z.boolean(),
  outsideClaims: z.array(SimulatedOutsideClaimSchema),
  publicResonanceEvidenceState: z.enum(["unknown", "single-value", "conflicting-values"]),
  publicAnnotations: z.array(
    z.object({
      id: stableId,
      subjectId: stableId,
      summary: z.string().min(1),
      traversable: z.literal(false),
    }),
  ),
  privateAcousticRouteClue: z
    .object({ routeId: z.literal("r-nd"), summary: z.string().min(1) })
    .nullable(),
  visibleDriftEvent: VisibleDriftEventSchema.nullable(),
  latestResolution: AdventureResolutionSchema.nullable(),
});
export type SafeAdventureProjection = z.infer<typeof SafeAdventureProjectionSchema>;

const commissionBase = z.object({
  id: stableId,
  findingsReward: z.number().int().nonnegative(),
  publicationRequired: z.boolean(),
});
export const CommissionOfferSchema = z.discriminatedUnion("family", [
  commissionBase.extend({
    family: z.literal("verify-report"),
    findingsReward: z.literal(3),
    publicationRequired: z.literal(true),
    reportId: stableId,
    subjectId: stableId,
    category: ObservationCategorySchema,
    requiredInstrument: InstrumentSchema,
  }),
  commissionBase.extend({
    family: z.literal("survey"),
    findingsReward: z.literal(2),
    publicationRequired: z.literal(false),
    subjectId: stableId,
    category: ObservationCategorySchema,
    requiredInstrument: InstrumentSchema,
  }),
  commissionBase.extend({
    family: z.literal("reach-frontier"),
    findingsReward: z.literal(3),
    publicationRequired: z.literal(false),
    targetLocationId: stableId,
  }),
  commissionBase.extend({
    family: z.literal("recover-salvage"),
    findingsReward: z.literal(2),
    publicationRequired: z.literal(false),
    targetLocationId: stableId,
  }),
]);
export type CommissionOffer = z.infer<typeof CommissionOfferSchema>;
export const CommissionProgressSchema = z.object({
  status: z.enum(["active", "objective-met", "completed", "failed"]),
  targetVisited: z.boolean(),
  matchingObservationRecorded: z.boolean(),
  targetSalvageRecovered: z.boolean(),
  requiredReportPublished: z.boolean(),
  findingsRewardGranted: z.boolean(),
});
export type CommissionProgress = z.infer<typeof CommissionProgressSchema>;

const commandBase = z.object({ protocolVersion: z.literal(PROTOCOL_VERSION), commandId: stableId });
export const PlayerCommandSchema = z.discriminatedUnion("kind", [
  commandBase.extend({
    kind: z.literal("start-expedition"),
    instruments: z.array(InstrumentSchema).length(2),
    commissionId: stableId,
    preparation: PreparationPlanSchema,
  }),
  commandBase.extend({
    kind: z.literal("start-lead-expedition"),
    leadId: AdventureLeadIdSchema,
    instruments: z.array(InstrumentSchema).length(2),
    preparation: PreparationPlanSchema,
  }),
  commandBase.extend({
    kind: z.literal("perform-encounter-action"),
    actionId: BellEncounterActionIdSchema,
  }),
  commandBase.extend({
    kind: z.literal("resolve-discovery-disclosure"),
    choice: RevealChoiceSchema,
  }),
  commandBase.extend({ kind: z.literal("acknowledge-visible-drift") }),
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
  "commission-unavailable",
  "commission-incompatible-loadout",
  "invalid-preparation",
  "insufficient-findings",
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
  "lead-unavailable",
  "encounter-action-unavailable",
  "disclosure-not-pending",
  "disclosure-required",
  "visible-drift-pending",
  "visible-drift-not-pending",
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
export const RouteEvidenceClaimSchema = z.object({
  reportId: stableId,
  category: z.enum(["route", "hazard", "condition"]),
  reportedValue: z.union([z.string(), z.number()]),
  age: z.number().int().nonnegative(),
  quality: EvidenceQualitySchema,
  sourceClass: SourceClassSchema,
  independentCorroboration: z.number().int().nonnegative(),
  potentiallyStale: z.boolean(),
  observedRevision: WorldRevisionSchema,
});
export type RouteEvidenceClaim = z.infer<typeof RouteEvidenceClaimSchema>;
export const RouteEvidenceCategorySchema = z.object({
  state: z.enum(["unknown", "single-value", "conflicting-values"]),
  claims: z.array(RouteEvidenceClaimSchema),
});
export type RouteEvidenceCategory = z.infer<typeof RouteEvidenceCategorySchema>;
export const SafeTravelOptionSchema = z.object({
  routeId: stableId,
  destinationNodeId: stableId,
  provisionCost: z.literal(1),
  destinationVisited: z.boolean(),
  projectedProvisions: z.number().int().nonnegative(),
  projectedReturnReserve: z.number().int().nonnegative().nullable(),
  projectedProvisionMargin: z.number().int().nullable(),
  projectedReturnReserveWarning: z.enum([
    "at-waystation",
    "comfortable",
    "caution",
    "at-reserve",
    "below-reserve",
    "route-unknown",
  ]),
  evidence: z.object({
    route: RouteEvidenceCategorySchema,
    hazard: RouteEvidenceCategorySchema,
    condition: RouteEvidenceCategorySchema,
  }),
});
export type SafeTravelOption = z.infer<typeof SafeTravelOptionSchema>;
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
  travelOptions: z.array(SafeTravelOptionSchema),
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
  atlasContribution: number;
}
export interface ActiveCommission {
  offer: CommissionOffer;
  progress: CommissionProgress;
}
export interface PreparationCatalog {
  extraProvisionCost: 1;
  maximumExtraProvisions: 2;
  reinforcedVesselIntegrityCost: 2;
  maximumReinforcedVesselIntegrity: 1;
  extraChargeCost: 1;
  maximumExtraChargePerInstrument: 1;
  bankedFindings: number;
}
export interface ExpeditionResourceSnapshot {
  provisions: number;
  maximumProvisions: number;
  vesselIntegrity: number;
  maximumVesselIntegrity: number;
  bankedFindings: number;
  unbankedFindings: number;
}
export interface SafeRouteLeg {
  routeId: StableId;
  originNodeId: StableId;
  destinationNodeId: StableId;
  damageSustained: boolean;
}
export interface SafeSalvageOutcome {
  opportunityId: StableId;
  family: SalvageFamily;
  provisionCost: number;
  nominalValue: number;
  appliedValue: number;
  netProvisionChange: number;
  resultingProvisions: number;
  resultingVesselIntegrity: number;
  resultingUnbankedFindings: number;
}
export interface ExpeditionOutcomeSummary {
  expeditionId: StableId;
  outcome: "returned" | "failed";
  failureReason: "stranded" | "vessel-integrity" | null;
  commissionId: StableId;
  family: CommissionOffer["family"];
  subjectId?: StableId;
  targetLocationId?: StableId;
  commissionResult: "success" | "failure" | "incomplete";
  commissionObjectiveMet: boolean;
  commissionFindingsOffered: number;
  commissionFindingsGranted: number;
  publicationRequired: boolean;
  requiredPublicationOccurred: boolean;
  publicationStatus: "pending" | "completed" | "not-applicable";
  preparation: PreparationPlan;
  preparationFindingsSpent: number;
  startingResources: ExpeditionResourceSnapshot;
  endingResources: ExpeditionResourceSnapshot;
  routeLegs: SafeRouteLeg[];
  visitedLocationIds: StableId[];
  totalDamageSustained: number;
  observationIds: StableId[];
  retainedObservationIds: StableId[];
  lostObservationIds: StableId[];
  salvageOutcomes: SafeSalvageOutcome[];
  findingsRecoveredFromSalvage: number;
  findingsBankedOnReturn: number;
  findingsLostOnFailure: number;
  publishedReportIds: StableId[];
  atlasContributionAdded: number;
  traceId: StableId | null;
  bankedFindingsAfter: number;
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
  commissionOffers: CommissionOffer[];
  activeCommission: ActiveCommission | null;
  preparationCatalog: PreparationCatalog;
  currentExpeditionSummary: ExpeditionOutcomeSummary | null;
  previousExpeditionSummary: ExpeditionOutcomeSummary | null;
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
  adventure: SafeAdventureProjection;
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
