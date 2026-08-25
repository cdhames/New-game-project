import { useRef, useState } from "react";
import type { Instrument, StableId } from "@long-map/protocol";
import {
  DEFAULT_DEVELOPMENT_SEED,
  type AuthorityView,
  type CommandIntent,
  type LocalAuthority,
} from "../authority";
import { MapWorkspace } from "./MapWorkspace";
import { MissionActionPanel } from "./MissionActionPanel";
import { SecondaryInformationTabs } from "./SecondaryInformationTabs";
import { StatusBar } from "./StatusBar";

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

export function GameShell(props: GameShellProps): React.JSX.Element {
  const [view, setView] = useState<AuthorityView>(() => props.authority.view());
  const processingRef = useRef(false);
  const projection = view.projection;
  const dispatch = (intent: CommandIntent): void => {
    if (props.processing || processingRef.current) return;
    processingRef.current = true;
    props.setProcessing(true);
    const next = props.authority.dispatch(intent);
    setView(next);
    if (intent.kind === "publish-reports") props.setSelectedReports([]);
    queueMicrotask(() => {
      processingRef.current = false;
      props.setProcessing(false);
    });
  };
  return (
    <div className="game-shell">
      <a className="skip-link" href="#expedition-controls">
        Skip to expedition controls
      </a>
      <div className="sea-layer" aria-hidden="true" />
      <StatusBar projection={projection} />
      <main className="game-workspace">
        <MapWorkspace projection={projection} />
        <MissionActionPanel
          projection={projection}
          selectedInstruments={props.selectedInstruments}
          setSelectedInstruments={props.setSelectedInstruments}
          selectedReports={props.selectedReports}
          setSelectedReports={props.setSelectedReports}
          dispatch={dispatch}
          disabled={props.processing}
        />
        <SecondaryInformationTabs projection={projection} view={view} />
      </main>
      <aside className="utility-bar" aria-label="Local prototype utilities">
        <details>
          <summary>About and developer details</summary>
          <p>
            This local-only prototype replays a validated command log through the deterministic game
            core. It has no account, server, network world, or production security boundary.
          </p>
          <p>
            Provisional deterministic seed: {DEFAULT_DEVELOPMENT_SEED} · Accepted local commands:{" "}
            {view.acceptedCommandCount}
          </p>
        </details>
        <button className="text-button danger-text" type="button" onClick={props.reset}>
          Reset local prototype…
        </button>
      </aside>
      <div className="status-region" aria-live="polite" aria-atomic="true">
        {view.statusMessage}
      </div>
    </div>
  );
}
