import type { Instrument, PlayerSafeProjection, StableId } from "@long-map/protocol";
import type { CommandIntent } from "../authority";

export type DispatchIntent = (intent: CommandIntent) => void;

export interface MissionControlProps {
  projection: PlayerSafeProjection;
  selectedInstruments: Instrument[];
  setSelectedInstruments: (next: Instrument[]) => void;
  selectedReports: StableId[];
  setSelectedReports: (next: StableId[]) => void;
  dispatch: DispatchIntent;
  disabled: boolean;
}
