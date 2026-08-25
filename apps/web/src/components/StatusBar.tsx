import type { PlayerSafeProjection } from "@long-map/protocol";
import { displayName, humanize } from "../presentation";

export function StatusBar({ projection }: { projection: PlayerSafeProjection }): React.JSX.Element {
  return (
    <header className="status-bar" data-testid="status-bar">
      <div className="brand-block">
        <p className="eyebrow">Local browser prototype</p>
        <h1>The Long Map</h1>
        <p className="tagline compact-tagline">A world no one can see alone</p>
        <p className="claims-note">Reports are historical claims, not guaranteed truth.</p>
      </div>
      <dl className="status-metrics" aria-label="Current game status">
        <div>
          <dt>Phase</dt>
          <dd>{humanize(projection.phase)}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{displayName(projection.locationId)}</dd>
        </div>
        <div>
          <dt>Supply</dt>
          <dd>{projection.supply}</dd>
        </div>
        <div>
          <dt>Vessel Integrity</dt>
          <dd>{projection.integrity}</dd>
        </div>
        <div>
          <dt>Reward</dt>
          <dd>
            {projection.bankedReward} banked · {projection.unbankedReward} unbanked
          </dd>
        </div>
        <div>
          <dt>World</dt>
          <dd>
            Revision {projection.revision}
            {projection.driftDue ? " · Drift due" : ""}
          </dd>
        </div>
      </dl>
    </header>
  );
}
