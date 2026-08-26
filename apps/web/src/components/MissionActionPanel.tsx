import { type FormEvent } from "react";
import type { Instrument, ObservationRecord, StableId } from "@long-map/protocol";
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
  const toggle = (instrument: Instrument): void => {
    if (selectedInstruments.includes(instrument))
      props.setSelectedInstruments(selectedInstruments.filter((item) => item !== instrument));
    else if (selectedInstruments.length < 2)
      props.setSelectedInstruments([...selectedInstruments, instrument]);
  };
  return (
    <>
      <p className="eyebrow">Expedition setup</p>
      <h2 id="control-title">
        {projection.phase === "failed" ? "Chart the next attempt" : "Prepare a local Expedition"}
      </h2>
      {projection.phase === "failed" ? (
        <div className="failure-note" role="status">
          <strong>Previous Expedition failed.</strong> Unbanked Findings were lost; any visible
          Trace is in the Logbook. Banked Findings remain {projection.waystation.bankedFindings}.
        </div>
      ) : null}
      <fieldset className="instrument-fieldset">
        <legend>Choose exactly two instruments</legend>
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
      <p className="field-hint">
        Each Expedition starts with 8 Provisions, 4 Vessel Integrity, and 2 Charges per selected
        instrument. Travel spends Provisions; Observations spend Charges. Zero Vessel Integrity
        causes failure. The Waystation restores this base loadout before departure.
      </p>
      <button
        className="primary-button start-button"
        type="button"
        disabled={props.disabled || !exactPair || !projection.actions.canStartExpedition}
        onClick={() =>
          props.dispatch({ kind: "start-expedition", instruments: selectedInstruments })
        }
      >
        Start Expedition
      </button>
      {!exactPair ? <p className="field-hint">Select exactly two instruments to depart.</p> : null}
    </>
  );
}

function ExpeditionControls(props: MissionControlProps): React.JSX.Element {
  const { projection } = props;
  const resources = projection.expeditionResources!;
  const routes = projection.actions.traversableRouteIds
    .map((routeId) => projection.knownRoutes.find((route) => route.id === routeId))
    .filter((route) => route !== undefined);
  return (
    <>
      <p className="eyebrow">Expedition underway</p>
      <h2 id="control-title">At {displayName(projection.locationId)}</h2>
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
          routes.map((route) => {
            const destination = route.a === projection.locationId ? route.b : route.a;
            return (
              <button
                key={route.id}
                type="button"
                disabled={props.disabled}
                onClick={() => props.dispatch({ kind: "travel", routeId: route.id })}
              >
                Travel toward {displayName(destination)}
              </button>
            );
          })
        ) : (
          <Unavailable>{availabilityText(projection.actions.availability.travel)}</Unavailable>
        )}
      </ActionGroup>
      <ActionGroup title="Observe">
        {projection.actions.observations.length ? (
          projection.actions.observations.map((action) => (
            <button
              key={`${action.subjectId}-${action.category}`}
              type="button"
              disabled={props.disabled}
              onClick={() => props.dispatch({ kind: "observe", ...action })}
            >
              Observe {categoryName(action.category)} at {displayName(action.subjectId)}
            </button>
          ))
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
