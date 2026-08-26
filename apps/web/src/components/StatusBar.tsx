import type { PlayerSafeProjection } from "@long-map/protocol";
import { displayName, humanize } from "../presentation";

export function StatusBar({ projection }: { projection: PlayerSafeProjection }): React.JSX.Element {
  const resources = projection.expeditionResources;
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
          <dt>Provisions</dt>
          <dd>
            {resources
              ? `${resources.provisions} / ${resources.maximumProvisions}`
              : `${projection.waystation.baseProvisions} base`}
          </dd>
        </div>
        <div>
          <dt>Vessel Integrity</dt>
          <dd>
            {resources
              ? `${resources.vesselIntegrity} / ${resources.maximumVesselIntegrity}`
              : `${projection.waystation.baseVesselIntegrity} base`}
          </dd>
        </div>
        <div>
          <dt>Charges</dt>
          <dd>
            {resources
              ? resources.instrumentCharges
                  .map((item) => `${humanize(item.instrument)} ${item.remaining}/${item.maximum}`)
                  .join(" · ")
              : `${projection.waystation.baseChargesPerSelectedInstrument} per selected instrument`}
          </dd>
        </div>
        <div>
          <dt>Findings</dt>
          <dd>
            {projection.waystation.bankedFindings} banked
            {resources ? ` · ${resources.unbankedFindings} unbanked` : ""}
          </dd>
        </div>
        <div>
          <dt>Return Reserve</dt>
          <dd>
            {resources
              ? `${resources.returnReserve ?? "Unknown"} · ${humanize(resources.returnReserveWarning)}`
              : "Available after departure"}
          </dd>
        </div>
        <div>
          <dt>World</dt>
          <dd>
            Revision {projection.revision}
            {projection.driftDue ? " · Drift due" : ""}
          </dd>
        </div>
        <div>
          <dt>Atlas Contribution</dt>
          <dd>{projection.waystation.atlasContribution} Reports</dd>
        </div>
      </dl>
    </header>
  );
}
