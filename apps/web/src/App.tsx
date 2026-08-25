import { useMemo, useState, type FormEvent } from "react";
import type {
  AtlasClaim,
  Instrument,
  ObservationRecord,
  PlayerSafeProjection,
  SafeRouteDescriptor,
  StableId,
} from "@long-map/protocol";
import {
  createLocalAuthority,
  DEFAULT_DEVELOPMENT_SEED,
  type AuthorityLoadResult,
  type AuthorityView,
  type CommandIntent,
  type LocalAuthority,
  type StoragePort,
} from "./authority";
import {
  categoryName,
  displayName,
  humanize,
  INSTRUMENTS,
  NODE_COORDINATES,
  qualityLabel,
  readingLabel,
  routeName,
  sourceLabel,
} from "./presentation";
import "./styles.css";

interface AppProps {
  storage?: StoragePort;
  confirmReset?: (message: string) => boolean;
}

const routeById = (projection: PlayerSafeProjection, id: StableId): SafeRouteDescriptor | undefined =>
  projection.knownRoutes.find((route) => route.id === id);

function RecoveryScreen({
  message,
  recover,
}: {
  message: string;
  recover: () => void;
}): React.JSX.Element {
  return (
    <main className="recovery-shell">
      <section className="panel recovery-panel" aria-labelledby="recovery-title">
        <p className="eyebrow">Local record needs attention</p>
        <h1 id="recovery-title">The saved voyage cannot be loaded safely</h1>
        <p>{message}</p>
        <p>
          The record has been left untouched. Reset only if you want to clear this prototype’s local
          command history and begin a fresh deterministic world.
        </p>
        <button className="danger-button" type="button" onClick={recover}>
          Reset local prototype
        </button>
      </section>
    </main>
  );
}

export function App({
  storage = window.localStorage,
  confirmReset = (message) => window.confirm(message),
}: AppProps): React.JSX.Element {
  const [loadResult, setLoadResult] = useState<AuthorityLoadResult>(() =>
    createLocalAuthority(storage),
  );
  const [selectedInstruments, setSelectedInstruments] = useState<Instrument[]>([
    "sounding-line",
    "weather-glass",
  ]);
  const [selectedReports, setSelectedReports] = useState<StableId[]>([]);
  const [processing, setProcessing] = useState(false);

  const reset = (): void => {
    if (!confirmReset("Clear only The Long Map local prototype history and create a fresh world?"))
      return;
    storage.removeItem("the-long-map.local-prototype.v1");
    setSelectedReports([]);
    setSelectedInstruments(["sounding-line", "weather-glass"]);
    setLoadResult(createLocalAuthority(storage));
  };

  if (!loadResult.ok) return <RecoveryScreen message={loadResult.message} recover={reset} />;

  return (
    <GameShell
      authority={loadResult.authority}
      selectedInstruments={selectedInstruments}
      setSelectedInstruments={setSelectedInstruments}
      selectedReports={selectedReports}
      setSelectedReports={setSelectedReports}
      processing={processing}
      setProcessing={setProcessing}
      reset={reset}
    />
  );
}

interface GameShellProps {
  authority: LocalAuthority;
  selectedInstruments: Instrument[];
  setSelectedInstruments: (next: Instrument[]) => void;
  selectedReports: StableId[];
  setSelectedReports: (next: StableId[]) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

function GameShell(props: GameShellProps): React.JSX.Element {
  const [view, setView] = useState<AuthorityView>(() => props.authority.view());
  const projection = view.projection;
  const dispatch = (intent: CommandIntent): void => {
    if (props.processing) return;
    props.setProcessing(true);
    const next = props.authority.dispatch(intent);
    setView(next);
    if (intent.kind === "publish-reports") props.setSelectedReports([]);
    props.setProcessing(false);
  };

  return (
    <>
      <a className="skip-link" href="#expedition-controls">
        Skip to expedition controls
      </a>
      <div className="sea-layer" aria-hidden="true" />
      <header className="site-header">
        <div>
          <p className="eyebrow">Local browser prototype</p>
          <h1>The Long Map</h1>
          <p className="tagline">A world no one can see alone</p>
        </div>
        <div className="header-note">
          <strong>The Atlas contains Reports, not guaranteed truth.</strong>
          <span>Age, evidence, and independent journeys help you judge each claim.</span>
        </div>
      </header>

      <main className="app-grid">
        <section className="map-panel panel" aria-labelledby="map-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Known waters</p>
              <h2 id="map-title">The Atlas chart</h2>
            </div>
            <span className="revision-badge">World revision {projection.revision}</span>
          </div>
          <AtlasMap projection={projection} dispatch={dispatch} disabled={props.processing} />
          <KnownTopology projection={projection} dispatch={dispatch} disabled={props.processing} />
        </section>

        <section id="expedition-controls" className="control-panel panel" aria-labelledby="control-title">
          <PhaseControls
            projection={projection}
            selectedInstruments={props.selectedInstruments}
            setSelectedInstruments={props.setSelectedInstruments}
            selectedReports={props.selectedReports}
            setSelectedReports={props.setSelectedReports}
            dispatch={dispatch}
            disabled={props.processing}
          />
        </section>

        <AtlasPanel atlas={projection.atlas} logicalTime={projection.logicalTime} />
        <Logbook observations={projection.observations} atlas={projection.atlas} />
        <ActivityPanel view={view} />

        <aside className="about-panel panel" aria-labelledby="about-title">
          <h2 id="about-title">About this local world</h2>
          <p>
            This prototype replays a validated command log through the deterministic game core. It is
            local-only and has no account, server, network world, or production security boundary.
          </p>
          <details>
            <summary>Developer details</summary>
            <p>Provisional deterministic seed: {DEFAULT_DEVELOPMENT_SEED}</p>
            <p>Accepted local commands: {view.acceptedCommandCount}</p>
          </details>
          <button className="text-button danger-text" type="button" onClick={props.reset}>
            Reset local prototype…
          </button>
        </aside>
      </main>
      <div className="status-region" aria-live="polite" aria-atomic="true">
        {view.statusMessage}
      </div>
    </>
  );
}

function AtlasMap({
  projection,
  dispatch,
  disabled,
}: {
  projection: PlayerSafeProjection;
  dispatch: (intent: CommandIntent) => void;
  disabled: boolean;
}): React.JSX.Element {
  const knownNodes = new Set(projection.knownNodeIds);
  const traversable = new Set(projection.actions.traversableRouteIds);
  return (
    <div className="map-frame">
      <svg
        className="atlas-map"
        viewBox="0 0 900 470"
        role="img"
        aria-labelledby="svg-map-title svg-map-description"
      >
        <title id="svg-map-title">Known archipelago chart</title>
        <desc id="svg-map-description">
          A visual chart of only the locations and routes currently known to this player. Equivalent
          route controls follow the chart.
        </desc>
        <defs>
          <pattern id="current-lines" width="90" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 24 Q22 8 45 24 T90 24" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <filter id="ink-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect className="current-field" width="900" height="470" fill="url(#current-lines)" />
        {projection.knownRoutes.map((route) => {
          const a = NODE_COORDINATES[route.a];
          const b = NODE_COORDINATES[route.b];
          if (!a || !b || !knownNodes.has(route.a) || !knownNodes.has(route.b)) return null;
          return (
            <line
              key={route.id}
              className={`map-route ${traversable.has(route.id) ? "map-route-actionable" : ""}`}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
            />
          );
        })}
        {projection.knownNodeIds.map((nodeId) => {
          const point = NODE_COORDINATES[nodeId];
          if (!point) return null;
          const current = projection.locationId === nodeId;
          const visited = projection.visitedNodeIds.includes(nodeId);
          return (
            <g key={nodeId} transform={`translate(${point[0]} ${point[1]})`}>
              <circle
                className={`map-node ${current ? "map-node-current" : ""} ${visited ? "map-node-visited" : ""}`}
                r={nodeId === "harbor" ? 12 : 8}
                filter={current ? "url(#ink-glow)" : undefined}
              />
              <text className="map-label" x="0" y="-17" textAnchor="middle">
                {displayName(nodeId)}
              </text>
              {nodeId === "harbor" ? (
                <text className="map-symbol" x="0" y="4" textAnchor="middle">
                  ✦
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="map-legend" aria-label="Map legend">
        <span><i className="legend-mark current" /> Current location</span>
        <span><i className="legend-mark visited" /> Visited</span>
        <span><i className="legend-line" /> Known route</span>
        <span>✦ Waystation</span>
      </div>
    </div>
  );
}

function KnownTopology({
  projection,
  dispatch,
  disabled,
}: {
  projection: PlayerSafeProjection;
  dispatch: (intent: CommandIntent) => void;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <div className="topology-alternative">
      <h3>Known topology and routes</h3>
      <p>
        Current: <strong>{displayName(projection.locationId)}</strong>
        {projection.previousLocationId ? ` · Previous: ${displayName(projection.previousLocationId)}` : ""}
      </p>
      <ul className="route-list">
        {projection.knownRoutes.map((route) => {
          const canTravel = projection.actions.traversableRouteIds.includes(route.id);
          return (
            <li key={route.id}>
              <span>{routeName(route)}</span>
              {canTravel ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => dispatch({ kind: "travel", routeId: route.id })}
                >
                  Travel toward {displayName(route.a === projection.locationId ? route.b : route.a)}
                </button>
              ) : (
                <span className="route-state">Known, not local</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface PhaseControlProps {
  projection: PlayerSafeProjection;
  selectedInstruments: Instrument[];
  setSelectedInstruments: (next: Instrument[]) => void;
  selectedReports: StableId[];
  setSelectedReports: (next: StableId[]) => void;
  dispatch: (intent: CommandIntent) => void;
  disabled: boolean;
}

function PhaseControls(props: PhaseControlProps): React.JSX.Element {
  const { projection } = props;
  if (projection.phase === "returned") return <PublicationControls {...props} />;
  if (projection.driftDue && projection.actions.canAdvanceDrift)
    return (
      <>
        <p className="eyebrow">Drift boundary</p>
        <h2 id="control-title">The world has shifted</h2>
        <p>
          Drift changes hidden Ground truth without rewriting historical Reports. Older claims may
          become potentially stale after you advance.
        </p>
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

function SetupControls(props: PhaseControlProps): React.JSX.Element {
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
          <strong>Previous Expedition failed.</strong> Unbanked findings were lost; any visible Trace
          remains listed in the Logbook area. Banked value remains {projection.bankedReward}.
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

function ExpeditionControls(props: PhaseControlProps): React.JSX.Element {
  const { projection } = props;
  return (
    <>
      <p className="eyebrow">Expedition underway</p>
      <h2 id="control-title">At {displayName(projection.locationId)}</h2>
      <div className="resource-row" aria-label="Expedition resources">
        <span><strong>{projection.supply}</strong> Supply</span>
        <span><strong>{projection.integrity}</strong> Integrity</span>
        <span><strong>{projection.unbankedReward}</strong> Unbanked</span>
        <span><strong>{projection.bankedReward}</strong> Banked</span>
      </div>
      <p>
        Instruments: {projection.selectedInstruments.map(humanize).join(" · ")}
      </p>
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
          <p>No legal Observation is available with this loadout and supply.</p>
        )}
      </ActionGroup>
      {projection.actions.salvageableOpportunityIds.length ? (
        <ActionGroup title="Salvage">
          {projection.actions.salvageableOpportunityIds.map((opportunityId) => (
            <button
              key={opportunityId}
              type="button"
              disabled={props.disabled}
              onClick={() => props.dispatch({ kind: "salvage", opportunityId })}
            >
              Salvage opportunity at {displayName(opportunityId)}
            </button>
          ))}
        </ActionGroup>
      ) : null}
      {projection.actions.canResolveReturn ? (
        <button
          className="primary-button"
          type="button"
          disabled={props.disabled}
          onClick={() => props.dispatch({ kind: "resolve-return" })}
        >
          Resolve safe return
        </button>
      ) : null}
      {projection.actions.failureReason ? (
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
      ) : null}
      {!projection.actions.canResolveReturn && !projection.actions.failureReason ? (
        <p className="field-hint">Travel controls are available beneath the chart.</p>
      ) : null}
    </>
  );
}

function ActionGroup({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="action-group" aria-label={title}>
      <h3>{title}</h3>
      <div className="button-stack">{children}</div>
    </section>
  );
}

function PublicationControls(props: PhaseControlProps): React.JSX.Element {
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
      <p>
        The Expedition returned with {observations.length} eligible Observation
        {observations.length === 1 ? "" : "s"}. Publish zero to three; unpublished evidence stays in
        the personal Logbook.
      </p>
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

function ObservationDescription({ observation }: { observation: ObservationRecord }): React.JSX.Element {
  return (
    <span className="observation-description">
      <strong>{displayName(observation.subjectId)}</strong>
      <span>{categoryName(observation.category)} · {readingLabel(observation.category, observation.value)}</span>
      <span>{qualityLabel(observation.quality)} · observed at time {observation.observedAt}</span>
      <span>World revision {observation.observedRevision}</span>
    </span>
  );
}

function AtlasPanel({ atlas, logicalTime }: { atlas: AtlasClaim[]; logicalTime: number }): React.JSX.Element {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(
    () => atlas.filter((claim) => filter === "all" || claim.category === filter),
    [atlas, filter],
  );
  return (
    <section className="atlas-panel panel" aria-labelledby="atlas-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Public knowledge</p>
          <h2 id="atlas-title">Atlas Reports</h2>
        </div>
        <label className="filter-label">
          Group
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All categories</option>
            <option value="route">Routes</option>
            <option value="hazard">Hazards</option>
            <option value="condition">Conditions</option>
            <option value="opportunity">Opportunities</option>
          </select>
        </label>
      </div>
      <p className="atlas-explainer">
        Reports are historical claims. Confidence is not certainty; corroboration counts compatible
        evidence from independent Expeditions. Drift can mark older Reports potentially stale without
        rewriting them.
      </p>
      <div className="claim-grid">
        {filtered.map((claim) => (
          <article className={`claim-card ${claim.potentiallyStale ? "stale" : ""}`} key={claim.reportId}>
            <div className="claim-title-row">
              <h3>{displayName(claim.subjectId)}</h3>
              <span className="category-chip">{categoryName(claim.category)}</span>
            </div>
            <p className="claim-reading">{readingLabel(claim.category, claim.value)}</p>
            <dl>
              <div><dt>Age</dt><dd>{claim.age} steps (time {logicalTime})</dd></div>
              <div><dt>Evidence</dt><dd>{qualityLabel(claim.quality)}</dd></div>
              <div><dt>Source</dt><dd>{sourceLabel(claim.sourceClass)}</dd></div>
              <div><dt>Corroboration</dt><dd>{claim.independentCorroboration} independent</dd></div>
              <div><dt>Observed revision</dt><dd>{claim.observedRevision}</dd></div>
            </dl>
            <p className={`stale-indicator ${claim.potentiallyStale ? "is-stale" : ""}`}>
              {claim.potentiallyStale ? "⚠ Potentially stale after Drift" : "✓ No later known Drift warning"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Logbook({ observations, atlas }: { observations: ObservationRecord[]; atlas: AtlasClaim[] }): React.JSX.Element {
  const published = new Set(atlas.filter((claim) => claim.sourceClass === "player").map((claim) => claim.id));
  return (
    <section className="logbook-panel panel" aria-labelledby="logbook-title">
      <p className="eyebrow">Personal evidence</p>
      <h2 id="logbook-title">Logbook</h2>
      {observations.length ? (
        <ul className="logbook-list">
          {observations.map((observation) => (
            <li key={observation.id}>
              <ObservationDescription observation={observation} />
              <span className="publication-state">
                {published.has(observation.id) ? "Published to Atlas" : "Private Observation"} · {humanize(observation.expeditionId)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No personal Observations yet. Depart and use an instrument after your first crossing.</p>
      )}
    </section>
  );
}

function ActivityPanel({ view }: { view: AuthorityView }): React.JSX.Element {
  return (
    <section className="activity-panel panel" aria-labelledby="activity-title">
      <p className="eyebrow">Sanitized local history</p>
      <h2 id="activity-title">Recent activity</h2>
      {view.activity.length ? (
        <ol className="activity-list">
          {view.activity.map((item) => (
            <li className={item.tone} key={item.id}>
              <span>Time {item.logicalTime}</span>
              {item.message}
            </li>
          ))}
        </ol>
      ) : (
        <p>The first accepted command will begin this local history.</p>
      )}
    </section>
  );
}

export default App;
