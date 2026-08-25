import { useState } from "react";
import type { Instrument, StableId } from "@long-map/protocol";
import {
  createLocalAuthority,
  LOCAL_RECORD_KEY,
  type AuthorityLoadResult,
  type StoragePort,
} from "./authority";
import { GameShell } from "./components/GameShell";
import "./styles.css";

interface AppProps {
  storage?: StoragePort;
  confirmReset?: (message: string) => boolean;
}

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
          The record has been left untouched. Reset only to clear this prototype’s local command
          history.
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
  const [authorityGeneration, setAuthorityGeneration] = useState(0);

  const reset = (): void => {
    if (!confirmReset("Clear only The Long Map local prototype history and create a fresh world?"))
      return;
    storage.removeItem(LOCAL_RECORD_KEY);
    setSelectedReports([]);
    setSelectedInstruments(["sounding-line", "weather-glass"]);
    setLoadResult(createLocalAuthority(storage));
    setAuthorityGeneration((generation) => generation + 1);
  };

  if (!loadResult.ok) return <RecoveryScreen message={loadResult.message} recover={reset} />;
  return (
    <GameShell
      key={authorityGeneration}
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

export default App;
