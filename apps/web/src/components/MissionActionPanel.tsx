import { type FormEvent } from "react";
import type {
  CommissionOffer,
  ExpeditionOutcomeSummary,
  Instrument,
  ObservationRecord,
  RouteEvidenceCategory,
  SafeTravelOption,
  StableId,
} from "@long-map/protocol";
import {
  categoryName,
  displayName,
  humanize,
  INSTRUMENTS,
  qualityLabel,
  readingLabel,
} from "../presentation";
import type { MissionControlProps } from "./types";

export function MissionActionPanel(props: MissionControlProps): React.JSX.Element {
  return (
    <section
      id="expedition-controls"
      className="mission-action-panel panel"
      aria-labelledby="control-title"
      data-testid="mission-action-panel"
    >
      <div className="panel-scroll">
        <ContextualGuidance projection={props.projection} />
        <PhaseControls {...props} />
      </div>
    </section>
  );
}

function PhaseControls(props: MissionControlProps): React.JSX.Element {
  const { projection } = props;
  if (projection.phase === "returned") return <PublicationControls {...props} />;
  if (projection.driftDue && projection.actions.canAdvanceDrift)
    return (
      <>
        <p className="eyebrow">Drift boundary</p>
        <h2 id="control-title">The world has shifted</h2>
        <p>Drift changes hidden truth without rewriting historical Reports.</p>
        <button
          className="primary-button"
          type="button"
          disabled={props.disabled}
          onClick={() => props.dispatch({ kind: "advance-drift" })}
        >
          Advance Drift
        </button>
      </>
    );
  if (projection.phase === "expedition") return <ExpeditionControls {...props} />;
  return <SetupControls {...props} />;
}

function SetupControls(props: MissionControlProps): React.JSX.Element {
  const { projection, selectedInstruments } = props;
  const exactPair = selectedInstruments.length === 2;
  const selectedCommission = projection.commissionOffers.find(
    (offer) => offer.id === props.selectedCommissionId,
  );
  const requiredInstrument =
    selectedCommission && "requiredInstrument" in selectedCommission
      ? selectedCommission.requiredInstrument
      : null;
  const compatible = !requiredInstrument || selectedInstruments.includes(requiredInstrument);
  const catalog = projection.preparationCatalog;
  const proposedCost =
    props.preparation.extraProvisions * catalog.extraProvisionCost +
    Number(props.preparation.reinforcedVesselIntegrity) * catalog.reinforcedVesselIntegrityCost +
    props.preparation.extraChargeInstruments.length * catalog.extraChargeCost;
  const remaining = catalog.bankedFindings - proposedCost;
  const toggle = (instrument: Instrument): void => {
    if (selectedInstruments.includes(instrument)) {
      props.setSelectedInstruments(selectedInstruments.filter((item) => item !== instrument));
      props.setPreparation({
        ...props.preparation,
        extraChargeInstruments: props.preparation.extraChargeInstruments.filter(
          (item) => item !== instrument,
        ),
      });
    } else if (selectedInstruments.length < 2)
      props.setSelectedInstruments([...selectedInstruments, instrument]);
  };
  return (
    <>
      <p className="eyebrow">Expedition setup</p>
      <h2 id="control-title">
        {projection.phase === "failed" ? "Chart the next attempt" : "Prepare a local Expedition"}
      </h2>
      {projection.phase === "failed" && projection.currentExpeditionSummary ? (
        <OutcomeSummary summary={projection.currentExpeditionSummary} kind="failure" />
      ) : null}
      {projection.previousExpeditionSummary ? (
        <OutcomeSummary summary={projection.previousExpeditionSummary} kind="previous" />
      ) : null}
      <section aria-labelledby="commission-choice-title">
        <h3 id="commission-choice-title">1. Choose a Commission</h3>
        <p className="field-hint">A Commission is the reason for the Expedition.</p>
        <div className="commission-grid">
          {projection.commissionOffers.map((offer) => (
            <label
              className={`commission-card ${props.selectedCommissionId === offer.id ? "selected" : ""}`}
              key={offer.id}
            >
              <input
                type="radio"
                name="commission"
                checked={props.selectedCommissionId === offer.id}
                onChange={() => props.setSelectedCommissionId(offer.id)}
              />
              <CommissionDescription offer={offer} />
            </label>
          ))}
        </div>
      </section>
      <fieldset className="instrument-fieldset">
        <legend>2. Choose exactly two instruments</legend>
        <p className="selection-count" aria-live="polite">
          {selectedInstruments.length} of 2 selected
        </p>
        <div className="instrument-grid">
          {INSTRUMENTS.map((instrument) => {
            const checked = selectedInstruments.includes(instrument.id);
            return (
              <label className={`instrument-card ${checked ? "selected" : ""}`} key={instrument.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selectedInstruments.length >= 2}
                  onChange={() => toggle(instrument.id)}
                />
                <span className="instrument-name">{instrument.name}</span>
                <span>{instrument.description}</span>
                <span className="selected-word">{checked ? "Selected ✓" : "Not selected"}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {!compatible ? (
        <p className="failure-note" role="alert">
          This Commission requires the {humanize(requiredInstrument!)}. Keep the Commission or
          change the loadout before departure.
        </p>
      ) : null}
      <fieldset className="preparation-fieldset">
        <legend>3. Choose optional preparation</legend>
        <p>
          Banked Findings available: <strong>{catalog.bankedFindings}</strong>. Purchases apply only
          to the next Expedition.
        </p>
        <label>
          Extra Provisions (0–{catalog.maximumExtraProvisions}, {catalog.extraProvisionCost} Finding
          each)
          <select
            aria-label="Extra Provisions"
            value={props.preparation.extraProvisions}
            onChange={(event) =>
              props.setPreparation({
                ...props.preparation,
                extraProvisions: Number(event.target.value),
              })
            }
          >
            {[0, 1, 2].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={props.preparation.reinforcedVesselIntegrity}
            onChange={(event) =>
              props.setPreparation({
                ...props.preparation,
                reinforcedVesselIntegrity: event.target.checked,
              })
            }
          />
          Reinforced Vessel Integrity (+1 maximum, {catalog.reinforcedVesselIntegrityCost} Findings)
        </label>
        {selectedInstruments.map((instrument) => (
          <label key={instrument}>
            <input
              type="checkbox"
              checked={props.preparation.extraChargeInstruments.includes(instrument)}
              onChange={(event) =>
                props.setPreparation({
                  ...props.preparation,
                  extraChargeInstruments: event.target.checked
                    ? [...props.preparation.extraChargeInstruments, instrument]
                    : props.preparation.extraChargeInstruments.filter(
                        (item) => item !== instrument,
                      ),
                })
              }
            />
            Extra {humanize(instrument)} Charge (+1 current and maximum, {catalog.extraChargeCost}{" "}
            Finding)
          </label>
        ))}
      </fieldset>
      <div className="preparation-total" role="status">
        <strong>4. Total cost: {proposedCost} Findings</strong>
        <span>Findings remaining: {remaining}</span>
      </div>
      <p className="field-hint">
        Each Expedition starts with 8 Provisions, 4 Vessel Integrity, and 2 Charges per selected
        instrument. Travel spends Provisions; Observations spend Charges. Zero Vessel Integrity
        causes failure. The Waystation restores this base loadout before departure.
      </p>
      <button
        className="primary-button start-button"
        type="button"
        disabled={
          props.disabled ||
          !selectedCommission ||
          !exactPair ||
          !compatible ||
          remaining < 0 ||
          !projection.actions.canStartExpedition
        }
        onClick={() =>
          props.dispatch({
            kind: "start-expedition",
            instruments: selectedInstruments,
            commissionId: selectedCommission!.id,
            preparation: props.preparation,
          })
        }
      >
        Start Expedition
      </button>
      {!selectedCommission ? <p className="field-hint">Choose one Commission to depart.</p> : null}
      {!exactPair ? <p className="field-hint">Select exactly two instruments to depart.</p> : null}
    </>
  );
}

function ExpeditionControls(props: MissionControlProps): React.JSX.Element {
  const { projection } = props;
  const resources = projection.expeditionResources!;
  const routes = projection.actions.travelOptions;
  return (
    <>
      <p className="eyebrow">Expedition underway</p>
      <h2 id="control-title">At {displayName(projection.locationId)}</h2>
      <ActiveCommissionCard projection={projection} />
      <div className="resource-row" aria-label="Expedition resources">
        <span>
          <strong>
            {resources.provisions} / {resources.maximumProvisions}
          </strong>{" "}
          Provisions
        </span>
        <span>
          <strong>
            {resources.vesselIntegrity} / {resources.maximumVesselIntegrity}
          </strong>{" "}
          Vessel Integrity
        </span>
        <span>
          <strong>{resources.unbankedFindings}</strong> Unbanked Findings
        </span>
        <span>
          <strong>{projection.waystation.bankedFindings}</strong> Banked Findings
        </span>
      </div>
      <p className="instrument-summary">
        Charges:{" "}
        {resources.instrumentCharges
          .map((item) => `${humanize(item.instrument)} ${item.remaining}/${item.maximum}`)
          .join(" · ")}
      </p>
      <p className={`reserve-warning ${resources.returnReserveWarning}`} role="status">
        Return Reserve: {resources.returnReserve ?? "unknown"} Provisions · margin{" "}
        {resources.provisionMargin ?? "unknown"}. This estimate uses known routes only and is not a
        safety guarantee.
      </p>
      <p className="instrument-summary">
        Instruments: {projection.selectedInstruments.map(humanize).join(" · ")}
      </p>
      <ActionGroup title="Travel">
        {routes.length ? (
          <>
            <p className="route-evidence-explainer">
              Reports are historical claims and can conflict. Unknown does not mean safe. Return
              Reserve uses known topology only; projected margins are before unknown travel damage.
            </p>
            {routes.map((route) => (
              <TravelOptionCard
                key={route.routeId}
                option={route}
                commission={projection.activeCommission?.offer ?? null}
                disabled={props.disabled}
                travel={() => props.dispatch({ kind: "travel", routeId: route.routeId })}
              />
            ))}
          </>
        ) : (
          <Unavailable>{availabilityText(projection.actions.availability.travel)}</Unavailable>
        )}
      </ActionGroup>
      <ActionGroup title="Observe">
        {projection.actions.observations.length ? (
          projection.actions.observations.map((action) => {
            const commission = projection.activeCommission?.offer;
            const required =
              commission &&
              (commission.family === "survey" || commission.family === "verify-report") &&
              commission.subjectId === action.subjectId &&
              commission.category === action.category;
            return (
              <div className="commission-action" key={`${action.subjectId}-${action.category}`}>
                {required ? <strong>◎ Required Commission Observation</strong> : null}
                <button
                  type="button"
                  disabled={props.disabled}
                  onClick={() => props.dispatch({ kind: "observe", ...action })}
                >
                  Observe {categoryName(action.category)} at {displayName(action.subjectId)}
                </button>
              </div>
            );
          })
        ) : (
          <Unavailable>{availabilityText(projection.actions.availability.observe)}</Unavailable>
        )}
      </ActionGroup>
      <ActionGroup title="Salvage">
        {projection.actions.salvageableOpportunities.length ? (
          projection.actions.salvageableOpportunities.map((opportunity) => (
            <button
              key={opportunity.opportunityId}
              type="button"
              disabled={props.disabled}
              onClick={() =>
                props.dispatch({ kind: "salvage", opportunityId: opportunity.opportunityId })
              }
            >
              Salvage {humanize(opportunity.family)} at {displayName(opportunity.locationId)}
            </button>
          ))
        ) : (
          <Unavailable>{availabilityText(projection.actions.availability.salvage)}</Unavailable>
        )}
      </ActionGroup>
      <ActionGroup title="Return">
        {projection.actions.canResolveReturn ? (
          <button
            className="primary-button"
            type="button"
            disabled={props.disabled}
            onClick={() => props.dispatch({ kind: "resolve-return" })}
          >
            Resolve safe return
          </button>
        ) : (
          <Unavailable>{availabilityText(projection.actions.availability.return)}</Unavailable>
        )}
      </ActionGroup>
      {projection.actions.failureReason ? (
        <section className="failure-action" aria-labelledby="failure-action-title">
          <h3 id="failure-action-title">Failure resolution</h3>
          <p>
            The Expedition cannot continue safely: {humanize(projection.actions.failureReason)}.
          </p>
          <button
            className="danger-button"
            type="button"
            disabled={props.disabled}
            onClick={() =>
              props.dispatch({ kind: "resolve-failure", reason: projection.actions.failureReason! })
            }
          >
            Resolve {projection.actions.failureReason} failure
          </button>
        </section>
      ) : null}
    </>
  );
}

function ContextualGuidance({
  projection,
}: {
  projection: MissionControlProps["projection"];
}): React.JSX.Element {
  let message =
    "Choose a Commission, then choose its required instruments. Preparation becomes useful after earning Findings.";
  if (projection.phase === "expedition") {
    message =
      projection.activeCommission?.progress.status === "objective-met"
        ? "Objective met: return to Lantern Harbor while the known route remains affordable. Vessel Integrity reaching zero still causes failure."
        : projection.visitedNodeIds.length <= 1
          ? "Inspect the historical Reports beside each route, then choose where to leave Lantern Harbor."
          : "Pursue the Commission, preserve the known Return Reserve, and remember that zero Vessel Integrity causes failure.";
  }
  if (projection.phase === "returned")
    message =
      projection.activeCommission?.offer.family === "verify-report"
        ? "Publish the marked Observation to earn the Verify Report reward."
        : "Publication improves the Atlas but is not required for this Commission reward.";
  if (projection.phase === "failed")
    message =
      "Review what was lost, then choose a new Commission and loadout for the next attempt.";
  return (
    <aside className="contextual-guidance" aria-label="Current guidance">
      <strong>Next step</strong>
      <span>{message}</span>
    </aside>
  );
}

export function EvidenceCategory({
  label,
  evidence,
}: {
  label: string;
  evidence: RouteEvidenceCategory;
}): React.JSX.Element {
  const stateText =
    evidence.state === "unknown"
      ? "Unknown"
      : evidence.state === "conflicting-values"
        ? "⚠ Conflicting Reports"
        : "Reported";
  return (
    <div className={`route-evidence-category ${evidence.state}`}>
      <strong>
        {label}: {stateText}
      </strong>
      {evidence.claims.length ? (
        <details>
          <summary>
            {evidence.claims.length} historical claim{evidence.claims.length === 1 ? "" : "s"}
          </summary>
          <ul>
            {evidence.claims.map((claim) => (
              <li key={claim.reportId}>
                {readingLabel(claim.category, claim.reportedValue)} · age {claim.age} ·{" "}
                {qualityLabel(claim.quality)} · corroboration {claim.independentCorroboration} ·
                revision {claim.observedRevision}
                {claim.potentiallyStale
                  ? " · ⚠ potentially stale"
                  : " · no later known Drift warning"}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function TravelOptionCard({
  option,
  commission,
  disabled,
  travel,
}: {
  option: SafeTravelOption;
  commission: CommissionOffer | null;
  disabled: boolean;
  travel: () => void;
}): React.JSX.Element {
  const commissionTarget =
    commission &&
    (commission.family === "reach-frontier" || commission.family === "recover-salvage") &&
    commission.targetLocationId === option.destinationNodeId;
  return (
    <article
      className="travel-option-card"
      aria-label={`Route decision to ${displayName(option.destinationNodeId)}`}
    >
      <h4>{displayName(option.destinationNodeId)}</h4>
      {commissionTarget ? (
        <strong className="commission-match">
          ◎ Commission target · Advances current Commission
        </strong>
      ) : null}
      <p>{option.destinationVisited ? "Previously visited" : "New destination"}</p>
      <dl className="travel-projection">
        <div>
          <dt>Travel cost</dt>
          <dd>{option.provisionCost} Provision</dd>
        </div>
        <div>
          <dt>Projected Provisions</dt>
          <dd>{option.projectedProvisions}</dd>
        </div>
        <div>
          <dt>Known Return Reserve</dt>
          <dd>{option.projectedReturnReserve ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Projected margin</dt>
          <dd>{option.projectedProvisionMargin ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Warning</dt>
          <dd>{humanize(option.projectedReturnReserveWarning)}</dd>
        </div>
      </dl>
      <div className="route-evidence-grid">
        <EvidenceCategory label="Route status" evidence={option.evidence.route} />
        <EvidenceCategory label="Hazard" evidence={option.evidence.hazard} />
        <EvidenceCategory label="Condition" evidence={option.evidence.condition} />
      </div>
      <button type="button" disabled={disabled} onClick={travel}>
        Travel toward {displayName(option.destinationNodeId)}
      </button>
    </article>
  );
}

function OutcomeSummary({
  summary,
  kind,
}: {
  summary: ExpeditionOutcomeSummary;
  kind: "return" | "failure" | "previous";
}): React.JSX.Element {
  const title =
    kind === "return"
      ? "Return Summary"
      : kind === "failure"
        ? "Failure Summary"
        : "Previous Expedition Summary";
  return (
    <article className={`outcome-summary ${kind}`} aria-label={title}>
      <h3>{title}</h3>
      <p>
        <strong>
          {humanize(summary.commissionResult)} {humanize(summary.family)} Commission.
        </strong>{" "}
        Objective {summary.commissionObjectiveMet ? "met" : "incomplete"};{" "}
        {summary.commissionFindingsGranted} of {summary.commissionFindingsOffered} Commission
        Findings granted.
      </p>
      {summary.failureReason ? (
        <p>
          Failure reason: {humanize(summary.failureReason)}. Previously banked Findings remain{" "}
          {summary.bankedFindingsAfter}.
        </p>
      ) : null}
      <dl className="summary-grid">
        <div>
          <dt>Route traveled</dt>
          <dd>
            {summary.routeLegs.length
              ? summary.routeLegs
                  .map(
                    (leg) =>
                      `${displayName(leg.originNodeId)} → ${displayName(leg.destinationNodeId)}${leg.damageSustained ? " (damage)" : ""}`,
                  )
                  .join(" · ")
              : "No legs"}
          </dd>
        </div>
        <div>
          <dt>Damage sustained</dt>
          <dd>{summary.totalDamageSustained}</dd>
        </div>
        <div>
          <dt>Ending resources</dt>
          <dd>
            {summary.endingResources.provisions} Provisions ·{" "}
            {summary.endingResources.vesselIntegrity} Vessel Integrity
          </dd>
        </div>
        <div>
          <dt>Observations</dt>
          <dd>
            {summary.observationIds.length} made · {summary.retainedObservationIds.length} retained
            · {summary.lostObservationIds.length} lost
          </dd>
        </div>
        <div>
          <dt>Salvage</dt>
          <dd>
            {summary.salvageOutcomes.length} recovered · {summary.findingsRecoveredFromSalvage}{" "}
            Findings
          </dd>
        </div>
        <div>
          <dt>Findings</dt>
          <dd>
            {summary.findingsBankedOnReturn} banked on return · {summary.findingsLostOnFailure} lost
            · {summary.preparationFindingsSpent} spent preparing
          </dd>
        </div>
        <div>
          <dt>Atlas</dt>
          <dd>
            {summary.publishedReportIds.length} Reports published · +
            {summary.atlasContributionAdded} contribution
          </dd>
        </div>
        <div>
          <dt>Trace</dt>
          <dd>{summary.traceId ?? "None"}</dd>
        </div>
      </dl>
      {kind === "return" ? (
        <p>
          Atlas contribution awaits the current publication selection.{" "}
          {summary.publicationRequired && !summary.requiredPublicationOccurred
            ? `${summary.commissionFindingsOffered - summary.commissionFindingsGranted} Verify Findings remain pending.`
            : "Commission publication is optional."}
        </p>
      ) : null}
      {kind === "previous" ? (
        <p>
          Banked Findings now available: {summary.bankedFindingsAfter}. Preparation can change the
          next Expedition within the listed caps.
        </p>
      ) : null}
    </article>
  );
}

function availabilityText(reason: string): string {
  const messages: Record<string, string> = {
    "expedition-not-underway": "Available after the Expedition gets underway.",
    "no-known-route": "No known route is available here.",
    "insufficient-provisions": "Not enough Provisions remain.",
    "no-applicable-observation": "No applicable local subject can be observed.",
    "instrument-not-selected": "The required instrument was not selected.",
    "instrument-depleted": "The required selected instrument has no Charges remaining.",
    "no-salvage-opportunity": "No unsalvaged opportunity is available here.",
    "not-at-waystation": "Return is available only at Lantern Harbor.",
    "return-not-earned": "Depart and return to Lantern Harbor before resolving return.",
    "safe-return-available": "Resolve the available safe return before failure.",
    available: "Available.",
  };
  return messages[reason] ?? "Unavailable under the current safe rules.";
}

function Unavailable({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p className="unavailable-state" aria-disabled="true">
      {children}
    </p>
  );
}
function ActionGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="action-group" aria-label={title}>
      <h3>{title}</h3>
      <div className="button-stack">{children}</div>
    </section>
  );
}

function PublicationControls(props: MissionControlProps): React.JSX.Element {
  const eligible = new Set(props.projection.actions.publicationEligibleObservationIds);
  const observations = props.projection.observations.filter((item) => eligible.has(item.id));
  const toggle = (id: StableId): void => {
    if (props.selectedReports.includes(id))
      props.setSelectedReports(props.selectedReports.filter((item) => item !== id));
    else if (props.selectedReports.length < 3)
      props.setSelectedReports([...props.selectedReports, id]);
  };
  const publish = (event: FormEvent): void => {
    event.preventDefault();
    props.dispatch({ kind: "publish-reports", observationIds: props.selectedReports });
  };
  return (
    <form onSubmit={publish}>
      <p className="eyebrow">Successful return</p>
      <h2 id="control-title">Choose Reports for the Atlas</h2>
      <ActiveCommissionCard projection={props.projection} />
      {props.projection.currentExpeditionSummary ? (
        <OutcomeSummary summary={props.projection.currentExpeditionSummary} kind="return" />
      ) : null}
      <p>Publish zero to three eligible Observations; unpublished evidence stays personal.</p>
      <p className="selection-count" aria-live="polite">
        {props.selectedReports.length} of 3 publication slots selected
      </p>
      <div className="publication-list">
        {observations.map((observation) => {
          const checked = props.selectedReports.includes(observation.id);
          return (
            <label className={`publication-card ${checked ? "selected" : ""}`} key={observation.id}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && props.selectedReports.length >= 3}
                onChange={() => toggle(observation.id)}
              />
              <ObservationDescription observation={observation} />
              {props.projection.activeCommission?.offer.family === "verify-report" &&
              observation.subjectId === props.projection.activeCommission.offer.subjectId &&
              observation.category === props.projection.activeCommission.offer.category ? (
                <strong className="commission-match">✓ Satisfies Verify Report Commission</strong>
              ) : null}
            </label>
          );
        })}
      </div>
      <div className="button-row">
        <button className="primary-button" type="submit" disabled={props.disabled}>
          Publish selected Reports
        </button>
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => props.dispatch({ kind: "publish-reports", observationIds: [] })}
        >
          Publish nothing
        </button>
      </div>
    </form>
  );
}

function CommissionDescription({ offer }: { offer: CommissionOffer }): React.JSX.Element {
  const objective =
    offer.family === "verify-report"
      ? `Verify the ${categoryName(offer.category)} Report at ${displayName(offer.subjectId)}`
      : offer.family === "survey"
        ? `Survey ${categoryName(offer.category)} at ${displayName(offer.subjectId)}`
        : offer.family === "reach-frontier"
          ? `Reach ${displayName(offer.targetLocationId)} and return`
          : `Recover salvage at ${displayName(offer.targetLocationId)} and return`;
  return (
    <span className="commission-description">
      <strong>{humanize(offer.family)}</strong>
      <span>{objective}</span>
      <span>
        Completion: objective plus safe return
        {offer.publicationRequired ? " and matching Report publication" : ""}.
      </span>
      <span>Reward: {offer.findingsReward} Findings</span>
      {"requiredInstrument" in offer ? (
        <span>Required instrument: {humanize(offer.requiredInstrument)}</span>
      ) : null}
      <span>
        {offer.publicationRequired ? "Publication required" : "No publication required for reward"}
      </span>
    </span>
  );
}

function ActiveCommissionCard({
  projection,
}: {
  projection: MissionControlProps["projection"];
}): React.JSX.Element | null {
  const active = projection.activeCommission;
  if (!active) return null;
  const returned = projection.phase === "returned";
  const verifyPendingPublication =
    returned && active.offer.publicationRequired && active.progress.status === "objective-met";
  const completedOnReturn = returned && active.progress.status === "completed";
  const incompleteOnReturn =
    returned &&
    active.progress.status !== "completed" &&
    active.progress.status !== "objective-met";
  return (
    <article className="active-commission-card" aria-label="Active Commission">
      <CommissionDescription offer={active.offer} />
      <strong>Progress: {humanize(active.progress.status)}</strong>
      <span>
        {active.offer.family === "reach-frontier"
          ? `Target visited: ${active.progress.targetVisited ? "yes" : "no"}`
          : active.offer.family === "recover-salvage"
            ? `Target salvage recovered: ${active.progress.targetSalvageRecovered ? "yes" : "no"}`
            : `Matching Observation recorded: ${active.progress.matchingObservationRecorded ? "yes" : "no"}`}
      </span>
      {verifyPendingPublication ? (
        <span>
          Return complete. Matching Observation recorded. Publication required and pending.
        </span>
      ) : completedOnReturn ? (
        <span>
          Safe return completed. Commission completed; reward granted. Publication optional.
        </span>
      ) : incompleteOnReturn ? (
        <span>
          Safe return completed. Commission objective incomplete; no Commission reward granted.
          Publication remains available for the Atlas but cannot retroactively complete this
          objective.
        </span>
      ) : (
        <span>
          Safe return still required
          {active.offer.publicationRequired ? "; matching publication also required" : ""}.
        </span>
      )}
    </article>
  );
}

export function ObservationDescription({
  observation,
}: {
  observation: ObservationRecord;
}): React.JSX.Element {
  return (
    <span className="observation-description">
      <strong>{displayName(observation.subjectId)}</strong>
      <span>
        {categoryName(observation.category)} ·{" "}
        {readingLabel(observation.category, observation.value)}
      </span>
      <span>
        {qualityLabel(observation.quality)} · observed at time {observation.observedAt}
      </span>
      <span>World revision {observation.observedRevision}</span>
    </span>
  );
}
