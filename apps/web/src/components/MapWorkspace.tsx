import type { PlayerSafeProjection } from "@long-map/protocol";
import { displayName, NODE_COORDINATES } from "../presentation";

export function MapWorkspace({
  projection,
}: {
  projection: PlayerSafeProjection;
}): React.JSX.Element {
  const knownNodes = new Set(projection.knownNodeIds);
  const traversable = new Set(projection.actions.traversableRouteIds);
  return (
    <section
      className="map-workspace panel"
      aria-labelledby="map-title"
      data-testid="map-workspace"
    >
      <div className="section-heading map-heading">
        <div>
          <p className="eyebrow">Known waters</p>
          <h2 id="map-title">Atlas chart</h2>
        </div>
        <span className="revision-badge">World revision {projection.revision}</span>
      </div>
      <div className="map-frame">
        <svg
          className="atlas-map"
          viewBox="0 0 900 470"
          role="img"
          aria-labelledby="svg-map-title svg-map-description"
        >
          <title id="svg-map-title">Known archipelago chart</title>
          <desc id="svg-map-description">
            A visual chart of only the locations and routes currently known to this player.
            Equivalent ordinary Travel controls are in the mission action panel beside the map.
          </desc>
          <defs>
            <pattern id="current-lines" width="90" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 24 Q22 8 45 24 T90 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
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
          <span>
            <i className="legend-mark current" /> Current location
          </span>
          <span>
            <i className="legend-mark visited" /> Visited
          </span>
          <span>
            <i className="legend-line" /> Known route
          </span>
          <span>✦ Waystation</span>
        </div>
      </div>
    </section>
  );
}
