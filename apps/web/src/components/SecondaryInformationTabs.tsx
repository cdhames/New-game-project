import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { AtlasClaim, ObservationRecord, PlayerSafeProjection } from "@long-map/protocol";
import type { AuthorityView } from "../authority";
import {
  categoryName,
  displayName,
  humanize,
  qualityLabel,
  readingLabel,
  routeName,
  sourceLabel,
} from "../presentation";
import { ObservationDescription } from "./MissionActionPanel";

const tabs = ["atlas", "logbook", "activity"] as const;
type TabId = (typeof tabs)[number];

export function SecondaryInformationTabs({
  projection,
  view,
}: {
  projection: PlayerSafeProjection;
  view: AuthorityView;
}): React.JSX.Element {
  const [selected, setSelected] = useState<TabId>("atlas");
  const refs = useRef<Record<TabId, HTMLButtonElement | null>>({
    atlas: null,
    logbook: null,
    activity: null,
  });
  const select = (id: TabId, focus = false): void => {
    setSelected(id);
    if (focus) queueMicrotask(() => refs.current[id]?.focus());
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: TabId): void => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = tabs.indexOf(id);
    const offset = event.key === "ArrowRight" ? 1 : -1;
    select(tabs[(index + offset + tabs.length) % tabs.length]!, true);
  };
  return (
    <section
      className="secondary-tabs panel"
      aria-label="Secondary information"
      data-testid="secondary-tabs"
    >
      <div className="tab-list" role="tablist" aria-label="Atlas, Logbook, and Activity">
        {tabs.map((id) => (
          <button
            key={id}
            ref={(node) => {
              refs.current[id] = node;
            }}
            id={`${id}-tab`}
            type="button"
            role="tab"
            aria-selected={selected === id}
            aria-controls={`${id}-panel`}
            tabIndex={selected === id ? 0 : -1}
            onClick={() => select(id)}
            onKeyDown={(event) => onKeyDown(event, id)}
          >
            {id === "atlas" ? "Atlas" : id === "logbook" ? "Logbook" : "Activity"}
          </button>
        ))}
      </div>
      <div className="tab-panel-scroll">
        <div
          id="atlas-panel"
          role="tabpanel"
          aria-labelledby="atlas-tab"
          hidden={selected !== "atlas"}
          tabIndex={0}
        >
          <AtlasTab
            atlas={projection.atlas}
            logicalTime={projection.logicalTime}
            projection={projection}
          />
        </div>
        <div
          id="logbook-panel"
          role="tabpanel"
          aria-labelledby="logbook-tab"
          hidden={selected !== "logbook"}
          tabIndex={0}
        >
          <LogbookTab
            observations={projection.observations}
            atlas={projection.atlas}
            traces={projection.traces}
          />
        </div>
        <div
          id="activity-panel"
          role="tabpanel"
          aria-labelledby="activity-tab"
          hidden={selected !== "activity"}
          tabIndex={0}
        >
          <ActivityTab view={view} />
        </div>
      </div>
    </section>
  );
}

function AtlasTab({
  atlas,
  logicalTime,
  projection,
}: {
  atlas: AtlasClaim[];
  logicalTime: number;
  projection: PlayerSafeProjection;
}): React.JSX.Element {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(
    () => atlas.filter((claim) => filter === "all" || claim.category === filter),
    [atlas, filter],
  );
  return (
    <div className="tab-content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Public knowledge</p>
          <h2>Atlas Reports</h2>
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
        Reports are historical claims, not guaranteed truth. Confidence is not certainty;
        corroboration counts compatible evidence from independent Expeditions.
      </p>
      <details className="topology-reference">
        <summary>Known topology and route reference</summary>
        <p>
          Current: <strong>{displayName(projection.locationId)}</strong>
          {projection.previousLocationId
            ? ` · Previous: ${displayName(projection.previousLocationId)}`
            : ""}
        </p>
        <ul className="route-list">
          {projection.knownRoutes.map((route) => (
            <li key={route.id}>
              <span>{routeName(route)}</span>
              <span className="route-state">Known route</span>
            </li>
          ))}
        </ul>
      </details>
      <div className="claim-grid">
        {filtered.map((claim) => (
          <article
            className={`claim-card ${claim.potentiallyStale ? "stale" : ""}`}
            key={claim.reportId}
          >
            <div className="claim-title-row">
              <h3>{displayName(claim.subjectId)}</h3>
              <span className="category-chip">{categoryName(claim.category)}</span>
            </div>
            <p className="claim-reading">{readingLabel(claim.category, claim.value)}</p>
            <dl>
              <div>
                <dt>Age</dt>
                <dd>
                  {claim.age} steps (time {logicalTime})
                </dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>{qualityLabel(claim.quality)}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{sourceLabel(claim.sourceClass)}</dd>
              </div>
              <div>
                <dt>Corroboration</dt>
                <dd>{claim.independentCorroboration} independent</dd>
              </div>
              <div>
                <dt>Observed revision</dt>
                <dd>{claim.observedRevision}</dd>
              </div>
            </dl>
            <p className={`stale-indicator ${claim.potentiallyStale ? "is-stale" : ""}`}>
              {claim.potentiallyStale
                ? "⚠ Potentially stale after Drift"
                : "✓ No later known Drift warning"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LogbookTab({
  observations,
  atlas,
  traces,
}: {
  observations: ObservationRecord[];
  atlas: AtlasClaim[];
  traces: PlayerSafeProjection["traces"];
}): React.JSX.Element {
  const published = new Set(
    atlas.filter((claim) => claim.sourceClass === "player").map((claim) => claim.id),
  );
  return (
    <div className="tab-content">
      <p className="eyebrow">Personal evidence</p>
      <h2>Logbook</h2>
      {observations.length ? (
        <ul className="logbook-list">
          {observations.map((observation) => (
            <li key={observation.id}>
              <ObservationDescription observation={observation} />
              <span className="publication-state">
                {published.has(observation.id) ? "Published to Atlas" : "Private Observation"} ·{" "}
                {humanize(observation.expeditionId)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No personal Observations yet. Depart and use an instrument after your first crossing.</p>
      )}
      {traces.length ? (
        <div className="trace-list">
          <h3>Visible Traces</h3>
          {traces.map((trace) => (
            <p key={trace.id}>
              Trace at {displayName(trace.associationId)} · {trace.recoverableFindings} recoverable
              Findings · {trace.observationIds.length} retained Observation references
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActivityTab({ view }: { view: AuthorityView }): React.JSX.Element {
  return (
    <div className="tab-content">
      <p className="eyebrow">Tertiary sanitized history</p>
      <h2>Recent activity</h2>
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
    </div>
  );
}
